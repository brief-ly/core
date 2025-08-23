import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { respond } from "@/api/lib/utils/respond";
import ensureUser from "@/api/lib/middlewares/ensureUser";
import ensureAdmin from "@/api/lib/middlewares/ensureAdmin";
import { db } from "@/api/lib/data/db";
import { Agent } from "@/agent";
import { contracts, evmClient } from "@/api/lib/evm";

const lawyers = new Hono()
  .post(
    "/request",
    ensureUser,
    zValidator(
      "json",
      z.object({
        name: z.string().min(1, "Name is required"),
        photoUrl: z.string().url("Valid photo URL is required"),
        bio: z.string().min(10, "Bio must be at least 10 characters"),
        expertise: z.string().min(1, "Expertise is required"),
        jurisdictions: z
          .array(z.string())
          .min(1, "At least one jurisdiction is required"),
        consultationFee: z
          .number()
          .min(0, "Consultation fee must be non-negative"),
        verificationDocuments: z
          .array(z.string().url("Valid document URL is required"))
          .optional(),
      })
    ),
    async (ctx) => {
      
      try {
        const user = ctx.get("user");
        const {
          name,
          photoUrl,
          bio,
          expertise,
          jurisdictions,
          consultationFee,
          verificationDocuments,
        } = ctx.req.valid("json");

        const existingLawyer = db
          .query("SELECT * FROM lawyer_accounts WHERE account = ? LIMIT 1")
          .get(user.id);

        if (existingLawyer) {
          return respond.err(
            ctx,
            "Lawyer application already exists for this account",
            409
          );
        }

        const currentTime = new Date().toISOString();
        db.transaction(() => {
          db.query(
            `
            INSERT INTO lawyer_accounts (account, name, photo_url, bio, expertise, consultation_fee, verified_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `
          ).run(user.id, name, photoUrl, bio, expertise, consultationFee, currentTime);

          for (const jurisdiction of jurisdictions) {
            db.query(
              `
              INSERT OR IGNORE INTO lawyer_jurisdictions (account, jurisdiction)
              VALUES (?, ?)
            `
            ).run(user.id, jurisdiction);
          }

          // Save verification documents if provided
          if (verificationDocuments && verificationDocuments.length > 0) {
            for (const documentUrl of verificationDocuments) {
              const ipfsHash = documentUrl.split('/').pop() || '';
              db.query(
                `
                 INSERT INTO lawyer_verification_documents (lawyer_account, document_url, document_type, file_name, ipfs_hash)
                 VALUES (?, ?, ?, ?, ?)
               `
              ).run(user.id, documentUrl, 'verification', 'verification_document', ipfsHash);
            }
          }
        })();

        return respond.ok(
          ctx,
          {
            accountId: user.id,
            name,
            bio,
            expertise,
            jurisdictions,
            consultationFee,
            verified: false,
            submittedAt: new Date().toISOString(),
          },
          "Lawyer application submitted successfully. Your application is pending verification.",
          201
        );
      } catch (error) {
        console.log(error);
        return respond.err(ctx, "Failed to submit lawyer application", 500);
      }
    }
  )
  .get("/request/status", ensureUser, async (ctx) => {
    try {
      const user = ctx.get("user");

      const lawyerApplication = db
        .query(
          `
            SELECT 
              la.*,
              GROUP_CONCAT(DISTINCT lj.jurisdiction) as jurisdictions,
              GROUP_CONCAT(DISTINCT ll.label) as labels
            FROM lawyer_accounts la
            LEFT JOIN lawyer_jurisdictions lj ON la.account = lj.account
            LEFT JOIN lawyer_labels ll ON la.account = ll.account
            WHERE la.account = ?
            GROUP BY la.account
          `
        )
        .get(user.id) as any;

      if (!lawyerApplication) {
        return respond.err(ctx, "No lawyer application found", 404);
      }

      const jurisdictions = lawyerApplication.jurisdictions
        ? lawyerApplication.jurisdictions.split(",")
        : [];

      const labels = lawyerApplication.labels
        ? lawyerApplication.labels.split(",")
        : [];

      return respond.ok(
        ctx,
        {
          accountId: lawyerApplication.account,
          name: lawyerApplication.name,
          photoUrl: lawyerApplication.photo_url,
          bio: lawyerApplication.bio,
          expertise: lawyerApplication.expertise,
          jurisdictions,
          labels,
          consultationFee: lawyerApplication.consultation_fee,
          nftTokenId: lawyerApplication.nft_token_id,
          verified: !!lawyerApplication.verified_at,
          submittedAt: lawyerApplication.created_at,
          verifiedAt: lawyerApplication.verified_at,
        },
        "Application status retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Error fetching lawyer application status:", error);
      return respond.err(ctx, "Failed to fetch application status", 500);
    }
  })
  .post(
    "/approve",
    ensureAdmin,
    zValidator(
      "json",
      z.object({
        accountId: z.string().min(1, "Account ID is required"),
      })
    ),
    async (ctx) => {
      try {
        const { accountId } = ctx.req.valid("json");

        const existingLawyer = db
          .query(
            `
            SELECT 
              la.*,
              GROUP_CONCAT(lj.jurisdiction) as jurisdictions
            FROM lawyer_accounts la
            LEFT JOIN lawyer_jurisdictions lj ON la.account = lj.account
            WHERE la.account = ?
            GROUP BY la.account
            LIMIT 1
          `
          )
          .get(accountId) as any;

        if (!existingLawyer) {
          return respond.err(ctx, "Lawyer application not found", 404);
        }

        if (existingLawyer.verified_at) {
          return respond.err(ctx, "Lawyer application already approved", 409);
        }

        const currentTime = new Date().toISOString();

        const jurisdictions = existingLawyer.jurisdictions
          ? existingLawyer.jurisdictions.split(",")
          : [];

        const agent = new Agent({
          preamble: "You are a legal categorization expert.",
          model: "gemini-2.0-flash",
        });

        const labels = await agent.extractLawyerLabels({
          name: existingLawyer.name,
          bio: existingLawyer.bio,
          expertise: existingLawyer.expertise,
          jurisdictions,
          consultationFee: existingLawyer.consultation_fee || 0,
        });

        const lawyerAccount = db
          .query("SELECT wallet_address FROM account WHERE id = ? LIMIT 1")
          .get(accountId) as any;

        if (!lawyerAccount) {
          return respond.err(ctx, "Lawyer account not found", 404);
        }

        const lawyerIdentityContract = contracts.BrieflyLawyerIdentity();

        const mintTxHash = await lawyerIdentityContract.write.safeMint([
          lawyerAccount.wallet_address,
        ]);

        const mintReceipt = await evmClient.waitForTransactionReceipt({
          hash: mintTxHash,
        });

        const transferEvent = mintReceipt.logs.find(
          (log) =>
            log.topics[0] ===
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        );

        let nftTokenId = null;
        if (transferEvent && transferEvent.topics[3]) {
          nftTokenId = parseInt(transferEvent.topics[3], 16);
        }

        db.transaction(() => {
          db.query(
            "UPDATE lawyer_accounts SET verified_at = ?, nft_token_id = ? WHERE account = ?"
          ).run(currentTime, nftTokenId, accountId);

          db.query("DELETE FROM lawyer_labels WHERE account = ?").run(
            accountId
          );

          for (const label of labels) {
            db.query(
              "INSERT INTO lawyer_labels (account, label) VALUES (?, ?)"
            ).run(accountId, label);
          }
        })();

        return respond.ok(
          ctx,
          {
            accountId,
            approvedAt: currentTime,
            generatedLabels: labels,
            nftTokenId,
            mintTxHash,
          },
          "Lawyer application approved successfully with AI-generated labels and NFT minted",
          200
        );
      } catch (error) {
        console.error("Error approving lawyer application:", error);
        return respond.err(ctx, "Failed to approve lawyer application", 500);
      }
    }
  )
  .get("/admin/pending", ensureAdmin, async (ctx) => {
    try {
      const pendingApplications = db
        .query(
          `
            SELECT 
              la.*,
              GROUP_CONCAT(lj.jurisdiction) as jurisdictions
            FROM lawyer_accounts la
            LEFT JOIN lawyer_jurisdictions lj ON la.account = lj.account
            WHERE la.verified_at IS NULL
            GROUP BY la.account
            ORDER BY la.created_at ASC
          `
        )
        .all() as any[];

      const formattedApplications = pendingApplications.map((app) => ({
        accountId: app.account,
        name: app.name,
        photoUrl: app.photo_url,
        bio: app.bio,
        expertise: app.expertise,
        jurisdictions: app.jurisdictions ? app.jurisdictions.split(",") : [],
        consultationFee: app.consultation_fee,
        submittedAt: app.created_at,
      }));

      return respond.ok(
        ctx,
        {
          applications: formattedApplications,
          total: formattedApplications.length,
        },
        "Pending lawyer applications retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Error fetching pending lawyer applications:", error);
      return respond.err(ctx, "Failed to fetch pending applications", 500);
    }
  })
  .get("/", async (ctx) => {
    try {
      const verifiedLawyers = db
        .query(
          `
            SELECT 
              la.*,
              GROUP_CONCAT(DISTINCT lj.jurisdiction) as jurisdictions,
              GROUP_CONCAT(DISTINCT ll.label) as labels
            FROM lawyer_accounts la
            LEFT JOIN lawyer_jurisdictions lj ON la.account = lj.account
            LEFT JOIN lawyer_labels ll ON la.account = ll.account
            WHERE la.verified_at IS NOT NULL
            GROUP BY la.account
            ORDER BY la.verified_at DESC
          `
        )
        .all() as any[];

      const formattedLawyers = verifiedLawyers.map((lawyer) => ({
        accountId: lawyer.account,
        name: lawyer.name,
        photoUrl: lawyer.photo_url,
        bio: lawyer.bio,
        expertise: lawyer.expertise,
        jurisdictions: lawyer.jurisdictions
          ? lawyer.jurisdictions.split(",")
          : [],
        labels: lawyer.labels ? lawyer.labels.split(",") : [],
        consultationFee: lawyer.consultation_fee,
        nftTokenId: lawyer.nft_token_id,
        verifiedAt: lawyer.verified_at,
      }));

      return respond.ok(
        ctx,
        {
          lawyers: formattedLawyers,
          total: formattedLawyers.length,
        },
        "Verified lawyers retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Error fetching verified lawyers:", error);
      return respond.err(ctx, "Failed to fetch verified lawyers", 500);
    }
  })
  .get("/:walletAddress", async (ctx) => {
    try {
      const walletAddress = ctx.req.param("walletAddress");

      const lawyerProfile = db
        .query(
          `
            SELECT 
              la.*,
              a.wallet_address,
              GROUP_CONCAT(DISTINCT lj.jurisdiction) as jurisdictions,
              GROUP_CONCAT(DISTINCT ll.label) as labels
            FROM lawyer_accounts la
            JOIN account a ON la.account = a.id
            LEFT JOIN lawyer_jurisdictions lj ON la.account = lj.account
            LEFT JOIN lawyer_labels ll ON la.account = ll.account
            WHERE a.wallet_address = ? AND la.verified_at IS NOT NULL
            GROUP BY la.account
            LIMIT 1
          `
        )
        .get(walletAddress) as any;

      if (!lawyerProfile) {
        return respond.err(ctx, "Lawyer profile not found", 404);
      }

      const jurisdictions = lawyerProfile.jurisdictions
        ? lawyerProfile.jurisdictions.split(",")
        : [];

      const labels = lawyerProfile.labels
        ? lawyerProfile.labels.split(",")
        : [];

      return respond.ok(
        ctx,
        {
          accountId: lawyerProfile.account,
          walletAddress: lawyerProfile.wallet_address,
          name: lawyerProfile.name,
          photoUrl: lawyerProfile.photo_url,
          bio: lawyerProfile.bio,
          expertise: lawyerProfile.expertise,
          jurisdictions,
          labels,
          consultationFee: lawyerProfile.consultation_fee,
          nftTokenId: lawyerProfile.nft_token_id,
          verifiedAt: lawyerProfile.verified_at,
          createdAt: lawyerProfile.created_at,
        },
        "Lawyer profile retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Error fetching lawyer profile:", error);
      return respond.err(ctx, "Failed to fetch lawyer profile", 500);
    }
  })
  .patch(
    "/profile",
    ensureUser,
    zValidator(
      "json",
      z.object({
        photoUrl: z.string().url("Valid photo URL is required").optional(),
        bio: z
          .string()
          .min(10, "Bio must be at least 10 characters")
          .optional(),
        expertise: z.string().min(1, "Expertise is required").optional(),
        jurisdictions: z
          .array(z.string())
          .min(1, "At least one jurisdiction is required")
          .optional(),
        consultationFee: z
          .number()
          .min(0, "Consultation fee must be non-negative")
          .optional(),
      })
    ),
    async (ctx) => {
      try {
        const user = ctx.get("user");
        const updateData = ctx.req.valid("json");

        const existingLawyer = db
          .query(
            `
            SELECT 
              la.*,
              GROUP_CONCAT(DISTINCT lj.jurisdiction) as jurisdictions,
              GROUP_CONCAT(DISTINCT ll.label) as labels
            FROM lawyer_accounts la
            LEFT JOIN lawyer_jurisdictions lj ON la.account = lj.account
            LEFT JOIN lawyer_labels ll ON la.account = ll.account
            WHERE la.account = ? AND la.verified_at IS NOT NULL
            GROUP BY la.account
            LIMIT 1
          `
          )
          .get(user.id) as any;

        if (!existingLawyer) {
          return respond.err(ctx, "Verified lawyer account not found", 404);
        }

        const currentJurisdictions = existingLawyer.jurisdictions
          ? existingLawyer.jurisdictions.split(",")
          : [];

        const shouldRegenerateLabels =
          updateData.bio !== undefined ||
          updateData.expertise !== undefined ||
          updateData.jurisdictions !== undefined;

        const finalBio = updateData.bio ?? existingLawyer.bio;
        const finalExpertise = updateData.expertise ?? existingLawyer.expertise;
        const finalJurisdictions =
          updateData.jurisdictions ?? currentJurisdictions;
        const finalConsultationFee =
          updateData.consultationFee ?? existingLawyer.consultation_fee;
        const finalPhotoUrl = updateData.photoUrl ?? existingLawyer.photo_url;

        let newLabels = existingLawyer.labels
          ? existingLawyer.labels.split(",")
          : [];

        if (shouldRegenerateLabels) {
          const agent = new Agent({
            preamble: "You are a legal categorization expert.",
            model: "gemini-2.0-flash",
          });

          newLabels = await agent.extractLawyerLabels({
            name: existingLawyer.name,
            bio: finalBio,
            expertise: finalExpertise,
            jurisdictions: finalJurisdictions,
            consultationFee: finalConsultationFee,
          });
        }

        db.transaction(() => {
          const updates = [];
          const values = [];

          if (updateData.photoUrl !== undefined) {
            updates.push("photo_url = ?");
            values.push(updateData.photoUrl);
          }
          if (updateData.bio !== undefined) {
            updates.push("bio = ?");
            values.push(updateData.bio);
          }
          if (updateData.expertise !== undefined) {
            updates.push("expertise = ?");
            values.push(updateData.expertise);
          }
          if (updateData.consultationFee !== undefined) {
            updates.push("consultation_fee = ?");
            values.push(updateData.consultationFee);
          }

          if (updates.length > 0) {
            values.push(user.id);
            db.query(
              `UPDATE lawyer_accounts SET ${updates.join(
                ", "
              )} WHERE account = ?`
            ).run(...values);
          }

          if (updateData.jurisdictions !== undefined) {
            db.query("DELETE FROM lawyer_jurisdictions WHERE account = ?").run(
              user.id
            );
            for (const jurisdiction of updateData.jurisdictions) {
              db.query(
                "INSERT INTO lawyer_jurisdictions (account, jurisdiction) VALUES (?, ?)"
              ).run(user.id, jurisdiction);
            }
          }

          if (shouldRegenerateLabels) {
            db.query("DELETE FROM lawyer_labels WHERE account = ?").run(
              user.id
            );
            for (const label of newLabels) {
              db.query(
                "INSERT INTO lawyer_labels (account, label) VALUES (?, ?)"
              ).run(user.id, label);
            }
          }
        })();

        return respond.ok(
          ctx,
          {
            accountId: user.id,
            name: existingLawyer.name,
            photoUrl: finalPhotoUrl,
            bio: finalBio,
            expertise: finalExpertise,
            jurisdictions: finalJurisdictions,
            labels: newLabels,
            consultationFee: finalConsultationFee,
            nftTokenId: existingLawyer.nft_token_id,
            verifiedAt: existingLawyer.verified_at,
            labelsRegenerated: shouldRegenerateLabels,
          },
          shouldRegenerateLabels
            ? "Profile updated successfully with regenerated labels"
            : "Profile updated successfully",
          200
        );
      } catch (error) {
        console.error("Error updating lawyer profile:", error);
        return respond.err(ctx, "Failed to update lawyer profile", 500);
      }
    }
  )
  .post(
    "/search",
    ensureUser,
    zValidator(
      "json",
      z.object({
        currentSituation: z
          .string()
          .min(10, "Current situation must be at least 10 characters"),
        futurePlans: z
          .string()
          .min(10, "Future plans must be at least 10 characters")
          .default("Future plans are according to current situation"),
      })
    ),
    async (ctx) => {
      try {
        const { currentSituation, futurePlans } = ctx.req.valid("json");

        const verifiedLawyers = db
          .query(
            `
            SELECT 
              la.*,
              GROUP_CONCAT(DISTINCT lj.jurisdiction) as jurisdictions,
              GROUP_CONCAT(DISTINCT ll.label) as labels
            FROM lawyer_accounts la
            LEFT JOIN lawyer_jurisdictions lj ON la.account = lj.account
            LEFT JOIN lawyer_labels ll ON la.account = ll.account
            WHERE la.verified_at IS NOT NULL
            GROUP BY la.account
            ORDER BY la.verified_at DESC
          `
          )
          .all() as any[];

        if (verifiedLawyers.length === 0) {
          return respond.ok(
            ctx,
            {
              groups: [],
              totalLawyers: 0,
            },
            "No verified lawyers found",
            200
          );
        }

        const formattedLawyers = verifiedLawyers.map((lawyer) => ({
          accountId: lawyer.account,
          name: lawyer.name,
          photoUrl: lawyer.photo_url,
          bio: lawyer.bio,
          expertise: lawyer.expertise,
          jurisdictions: lawyer.jurisdictions
            ? lawyer.jurisdictions.split(",")
            : [],
          labels: lawyer.labels ? lawyer.labels.split(",") : [],
          consultationFee: lawyer.consultation_fee,
          nftTokenId: lawyer.nft_token_id,
          verifiedAt: lawyer.verified_at,
        }));

        const agent = new Agent({
          preamble: `You are an expert legal matching system. Your task is to analyze a client's current legal situation and future plans, then group lawyers into optimal teams of 1-5 lawyers that can best address their needs.

          Consider:
          - Lawyers' expertise areas and specializations
          - Jurisdictions they practice in
          - Labels that indicate their practice areas
          - How well they match the client's current and future needs
          - Complementary skills within each group

          Create multiple groups where each group represents a different approach or combination of lawyers that could help the client. Some groups might focus on immediate needs, others on long-term planning, and some might offer comprehensive coverage.

          Return groups ordered by relevance, with the most suitable combinations first.`,
          model: "gemini-2.0-flash",
        });

        agent.setResponseJsonSchema({
          type: "object",
          properties: {
            groups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  groupName: {
                    type: "string",
                    description: "A descriptive name for this group of lawyers",
                  },
                  reasoning: {
                    type: "string",
                    description:
                      "Why this group was formed and how they address the client's needs",
                  },
                  lawyers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        accountId: { type: "string" },
                        relevanceScore: {
                          type: "number",
                          minimum: 0,
                          maximum: 10,
                          description:
                            "How relevant this lawyer is to the client's needs (0-10)",
                        },
                        roleInGroup: {
                          type: "string",
                          description:
                            "This lawyer's specific role or contribution to addressing the client's needs",
                        },
                      },
                      required: ["accountId", "relevanceScore", "roleInGroup"],
                    },
                    minItems: 1,
                    maxItems: 5,
                  },
                },
                required: ["groupName", "reasoning", "lawyers"],
              },
            },
          },
          required: ["groups"],
        });

        const lawyersData = formattedLawyers
          .map((lawyer) =>
            `
Account ID: ${lawyer.accountId}
Name: ${lawyer.name}
Bio: ${lawyer.bio}
Expertise: ${lawyer.expertise}
Jurisdictions: ${lawyer.jurisdictions.join(", ")}
Labels: ${lawyer.labels.join(", ")}
Consultation Fee: $${lawyer.consultationFee}
        `.trim()
          )
          .join("\n\n---\n\n");

        const searchPrompt = `
Client's Current Situation:
${currentSituation}

Client's Future Plans:
${futurePlans}

Available Lawyers:
${lawyersData}

Please create optimal groups of lawyers (1-5 per group) that can best address this client's current situation and future legal needs. Focus on creating practical, effective combinations.
        `.trim();

        const result = await agent.prompt(searchPrompt);

        const enrichedGroups =
          result.groups?.map((group: any) => {
            const groupLawyers = group.lawyers?.map((lawyer: any) => {
              const fullLawyerData = formattedLawyers.find(
                (l) => l.accountId === lawyer.accountId
              );
              return {
                ...lawyer,
                ...fullLawyerData,
              };
            });

            const groupId = db
              .query(
                `
              INSERT INTO lawyer_groups (group_name, reasoning)
              VALUES (?, ?)
              RETURNING id
            `
              )
              .get(group.groupName, group.reasoning) as { id: number };

            for (const lawyer of group.lawyers || []) {
              db.query(
                `
                INSERT INTO lawyer_group_members (group_id, lawyer_account, relevance_score, role_in_group)
                VALUES (?, ?, ?, ?)
              `
              ).run(
                groupId.id,
                lawyer.accountId,
                lawyer.relevanceScore,
                lawyer.roleInGroup
              );
            }

            return {
              ...group,
              groupId: groupId.id,
              lawyers: groupLawyers,
            };
          }) || [];

        return respond.ok(
          ctx,
          {
            groups: enrichedGroups,
            totalLawyers: formattedLawyers.length,
            query: {
              currentSituation,
              futurePlans,
            },
          },
          "Lawyer search completed successfully",
          200
        );
      } catch (error) {
        console.error("Error searching lawyers:", error);
        return respond.err(ctx, "Failed to search lawyers", 500);
      }
    }
  );

export default lawyers;
export type LawyersType = typeof lawyers;
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { respond } from "@/api/lib/utils/respond";
import ensureUser from "@/api/lib/middlewares/ensureUser";
import { db } from "@/api/lib/data/db";
import {
  REQUEST_CONSTANTS,
  REQUEST_STATUS,
  type RequestStatus,
} from "@/api/lib/constants";
import { contracts, evmClient } from "@/api/lib/evm";
import { decryptFile } from "@/api/lib/utils/encryption";
import { getFromIPFS } from "@/api/lib/utils/ipfs";
import * as viem from "viem";
import { groupChatWS } from "@/api/lib/websocket/groupChat";

const groups = new Hono()
  .get("/:groupId", ensureUser, async (ctx) => {
    try {
      const groupId = parseInt(ctx.req.param("groupId"));

      if (isNaN(groupId)) {
        return respond.err(ctx, "Invalid group ID", 400);
      }

      const group = db
        .query(
          `
          SELECT lg.*, 
                 GROUP_CONCAT(
                   JSON_OBJECT(
                     'accountId', lgm.lawyer_account,
                     'name', la.name,
                     'photoUrl', la.photo_url,
                     'bio', la.bio,
                     'expertise', la.expertise,
                     'consultationFee', la.consultation_fee,
                     'relevanceScore', lgm.relevance_score,
                     'roleInGroup', lgm.role_in_group
                   )
                 ) as lawyers
          FROM lawyer_groups lg
          LEFT JOIN lawyer_group_members lgm ON lg.id = lgm.group_id
          LEFT JOIN lawyer_accounts la ON lgm.lawyer_account = la.account
          WHERE lg.id = ?
          GROUP BY lg.id
        `
        )
        .get(groupId) as any;

      if (!group) {
        return respond.err(ctx, "Group not found", 404);
      }

      const lawyers = group.lawyers ? JSON.parse(`[${group.lawyers}]`) : [];

      return respond.ok(
        ctx,
        {
          groupId: group.id,
          groupName: group.group_name,
          reasoning: group.reasoning,
          lawyers,
          createdAt: group.created_at,
        },
        "Group details retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Error fetching group details:", error);
      return respond.err(ctx, "Failed to fetch group details", 500);
    }
  })
  .post(
    "/request",
    ensureUser,
    zValidator(
      "json",
      z.object({
        groupId: z.number().min(1, "Group ID is required"),
        currentSituation: z
          .string()
          .min(10, "Current situation must be at least 10 characters"),
        futurePlans: z
          .string()
          .min(10, "Future plans must be at least 10 characters"),
      })
    ),
    async (ctx) => {
      try {
        const user = ctx.get("user");
        const { groupId, currentSituation, futurePlans } =
          ctx.req.valid("json");

        const group = db
          .query(
            `
          SELECT lg.*, 
                 GROUP_CONCAT(
                   JSON_OBJECT(
                     'accountId', lgm.lawyer_account,
                     'relevanceScore', lgm.relevance_score,
                     'roleInGroup', lgm.role_in_group
                   )
                 ) as lawyers
          FROM lawyer_groups lg
          LEFT JOIN lawyer_group_members lgm ON lg.id = lgm.group_id
          WHERE lg.id = ?
          GROUP BY lg.id
        `
          )
          .get(groupId) as any;

        if (!group) {
          return respond.err(ctx, "Group not found", 404);
        }

        const existingRequest = db
          .query(
            `
          SELECT id FROM group_requests 
          WHERE requester_account = ? AND group_id = ? AND status = ?
        `
          )
          .get(user.id, groupId, REQUEST_STATUS.PENDING);

        if (existingRequest) {
          return respond.err(
            ctx,
            "You already have a pending request for this group",
            409
          );
        }

        const expiresAt = new Date(
          Date.now() + REQUEST_CONSTANTS.TIMEOUT_MS
        ).toISOString();

        const requestResult = db
          .query(
            `
          INSERT INTO group_requests (requester_account, group_id, current_situation, future_plans, expires_at)
          VALUES (?, ?, ?, ?, ?)
          RETURNING id
        `
          )
          .get(user.id, groupId, currentSituation, futurePlans, expiresAt) as {
          id: number;
        };

        return respond.ok(
          ctx,
          {
            requestId: requestResult.id,
            groupId,
            status: REQUEST_STATUS.PENDING,
            expiresAt,
            currentSituation,
            futurePlans,
          },
          "Request sent to lawyer group successfully",
          201
        );
      } catch (error) {
        console.error("Error creating group request:", error);
        return respond.err(ctx, "Failed to create group request", 500);
      }
    }
  )
  .get("/requests/sent", ensureUser, async (ctx) => {
    try {
      const user = ctx.get("user");

      const requests = db
        .query(
          `
          SELECT gr.*, lg.group_name, lg.reasoning,
                 GROUP_CONCAT(
                   JSON_OBJECT(
                     'accountId', lgm.lawyer_account,
                     'name', la.name,
                     'photoUrl', la.photo_url,
                     'relevanceScore', lgm.relevance_score,
                     'roleInGroup', lgm.role_in_group
                   )
                 ) as group_lawyers
          FROM group_requests gr
          JOIN lawyer_groups lg ON gr.group_id = lg.id
          LEFT JOIN lawyer_group_members lgm ON lg.id = lgm.group_id
          LEFT JOIN lawyer_accounts la ON lgm.lawyer_account = la.account
          WHERE gr.requester_account = ?
          GROUP BY gr.id
          ORDER BY gr.created_at DESC
        `
        )
        .all(user.id) as any[];

      const now = new Date().toISOString();

      const expiredRequestIds = requests
        .filter(
          (req) => req.status === REQUEST_STATUS.PENDING && req.expires_at < now
        )
        .map((req) => req.id);

      if (expiredRequestIds.length > 0) {
        db.query(
          `
            UPDATE group_requests 
            SET status = ?, completed_at = CURRENT_TIMESTAMP 
            WHERE id IN (${expiredRequestIds.map(() => "?").join(",")})
          `
        ).run(REQUEST_STATUS.EXPIRED, ...expiredRequestIds);
      }

      const formattedRequests = requests.map((request) => ({
        requestId: request.id,
        groupId: request.group_id,
        groupName: request.group_name,
        groupReasoning: request.reasoning,
        currentSituation: request.current_situation,
        futurePlans: request.future_plans,
        status: expiredRequestIds.includes(request.id)
          ? REQUEST_STATUS.EXPIRED
          : request.status,
        lawyers: request.group_lawyers
          ? JSON.parse(`[${request.group_lawyers}]`)
          : [],
        createdAt: request.created_at,
        expiresAt: request.expires_at,
        completedAt: request.completed_at,
      }));

      return respond.ok(
        ctx,
        {
          requests: formattedRequests,
          total: formattedRequests.length,
        },
        "Sent requests retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Error fetching sent requests:", error);
      return respond.err(ctx, "Failed to fetch sent requests", 500);
    }
  })
  .get("/requests/pending", ensureUser, async (ctx) => {
    try {
      const user = ctx.get("user");

      const isLawyer = db
        .query(
          `
          SELECT account FROM lawyer_accounts WHERE account = ? AND verified_at IS NOT NULL
        `
        )
        .get(user.id);

      if (!isLawyer) {
        return respond.err(
          ctx,
          "Access denied: Only verified lawyers can view pending requests",
          403
        );
      }

      const now = new Date().toISOString();

      const expiredRequests = db
        .query(
          `
          SELECT gr.id
          FROM group_requests gr
          JOIN lawyer_group_members lgm ON gr.group_id = lgm.group_id
          WHERE lgm.lawyer_account = ? 
            AND gr.status = ? 
            AND gr.expires_at < ?
        `
        )
        .all(user.id, REQUEST_STATUS.PENDING, now) as { id: number }[];

      if (expiredRequests.length > 0) {
        const expiredIds = expiredRequests.map((r) => r.id);
        db.query(
          `
            UPDATE group_requests 
            SET status = ?, completed_at = CURRENT_TIMESTAMP 
            WHERE id IN (${expiredIds.map(() => "?").join(",")})
          `
        ).run(REQUEST_STATUS.EXPIRED, ...expiredIds);
      }

      const pendingRequests = db
        .query(
          `
          SELECT gr.*, lg.group_name, lg.reasoning,
                 a.wallet_address as requester_wallet,
                 lgm.relevance_score, lgm.role_in_group,
                 GROUP_CONCAT(
                   CASE WHEN grr.lawyer_account IS NOT NULL THEN
                     JSON_OBJECT(
                       'lawyerAccount', grr.lawyer_account,
                       'response', grr.response,
                       'respondedAt', grr.responded_at
                     )
                   END
                 ) as responses
          FROM group_requests gr
          JOIN lawyer_groups lg ON gr.group_id = lg.id
          JOIN lawyer_group_members lgm ON lg.id = lgm.group_id AND lgm.lawyer_account = ?
          JOIN account a ON gr.requester_account = a.id
          LEFT JOIN group_request_responses grr ON gr.id = grr.request_id
          WHERE gr.status = ? AND gr.expires_at > ?
          GROUP BY gr.id
          ORDER BY gr.created_at ASC
        `
        )
        .all(user.id, REQUEST_STATUS.PENDING, now) as any[];

      const formattedRequests = pendingRequests.map((request) => ({
        requestId: request.id,
        groupId: request.group_id,
        groupName: request.group_name,
        groupReasoning: request.reasoning,
        requesterWallet: request.requester_wallet,
        currentSituation: request.current_situation,
        futurePlans: request.future_plans,
        myRole: request.role_in_group,
        myRelevanceScore: request.relevance_score,
        responses: request.responses
          ? JSON.parse(`[${request.responses}]`).filter(Boolean)
          : [],
        createdAt: request.created_at,
        expiresAt: request.expires_at,
      }));

      return respond.ok(
        ctx,
        {
          requests: formattedRequests,
          total: formattedRequests.length,
        },
        "Pending requests retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      return respond.err(ctx, "Failed to fetch pending requests", 500);
    }
  })
  .post(
    "/requests/:requestId/respond",
    ensureUser,
    zValidator(
      "json",
      z.object({
        response: z.enum(["accepted", "rejected"], {
          required_error: "Response must be either 'accepted' or 'rejected'",
        }),
      })
    ),
    async (ctx) => {
      try {
        const user = ctx.get("user");
        const requestId = parseInt(ctx.req.param("requestId"));
        const { response } = ctx.req.valid("json");

        if (isNaN(requestId)) {
          return respond.err(ctx, "Invalid request ID", 400);
        }

        const isLawyer = db
          .query(
            `
          SELECT account FROM lawyer_accounts WHERE account = ? AND verified_at IS NOT NULL
        `
          )
          .get(user.id);

        if (!isLawyer) {
          return respond.err(
            ctx,
            "Access denied: Only verified lawyers can respond to requests",
            403
          );
        }

        const request = db
          .query(
            `
          SELECT gr.*, lgm.lawyer_account
          FROM group_requests gr
          JOIN lawyer_group_members lgm ON gr.group_id = lgm.group_id
          WHERE gr.id = ? AND lgm.lawyer_account = ? AND gr.status = ?
        `
          )
          .get(requestId, user.id, REQUEST_STATUS.PENDING) as any;

        if (!request) {
          return respond.err(
            ctx,
            "Request not found or you're not part of this group",
            404
          );
        }

        if (new Date(request.expires_at) < new Date()) {
          db.query(
            `
            UPDATE group_requests 
            SET status = ?, completed_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `
          ).run(REQUEST_STATUS.EXPIRED, requestId);

          return respond.err(ctx, "Request has expired", 409);
        }

        const existingResponse = db
          .query(
            `
          SELECT id FROM group_request_responses 
          WHERE request_id = ? AND lawyer_account = ?
        `
          )
          .get(requestId, user.id);

        if (existingResponse) {
          return respond.err(
            ctx,
            "You have already responded to this request",
            409
          );
        }

        let finalStatus: RequestStatus = REQUEST_STATUS.PENDING;

        db.transaction(() => {
          db.query(
            `
            INSERT INTO group_request_responses (request_id, lawyer_account, response)
            VALUES (?, ?, ?)
          `
          ).run(requestId, user.id, response);

          if (response === "rejected") {
            finalStatus = REQUEST_STATUS.REJECTED;
            db.query(
              `
              UPDATE group_requests 
              SET status = ?, completed_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `
            ).run(REQUEST_STATUS.REJECTED, requestId);
          } else {
            const allLawyers = db
              .query(
                `
              SELECT lgm.lawyer_account
              FROM lawyer_group_members lgm
              JOIN group_requests gr ON lgm.group_id = gr.group_id
              WHERE gr.id = ?
            `
              )
              .all(requestId) as { lawyer_account: number }[];

            const responses = db
              .query(
                `
              SELECT lawyer_account, response
              FROM group_request_responses
              WHERE request_id = ?
            `
              )
              .all(requestId) as { lawyer_account: number; response: string }[];

            const acceptedLawyers = responses
              .filter((r) => r.response === "accepted")
              .map((r) => r.lawyer_account);
            const allLawyerIds = allLawyers.map((l) => l.lawyer_account);

            if (acceptedLawyers.length === allLawyerIds.length) {
              finalStatus = REQUEST_STATUS.ACCEPTED;
              db.query(
                `
                UPDATE group_requests 
                SET status = ?, completed_at = CURRENT_TIMESTAMP 
                WHERE id = ?
              `
              ).run(REQUEST_STATUS.ACCEPTED, requestId);
            }
          }
        })();

        return respond.ok(
          ctx,
          {
            requestId,
            response,
            requestStatus: finalStatus,
            respondedAt: new Date().toISOString(),
          },
          `Request ${response} successfully`,
          200
        );
      } catch (error) {
        console.error("Error responding to request:", error);
        return respond.err(ctx, "Failed to respond to request", 500);
      }
    }
  )
  .post(
    "/:groupId/documents",
    ensureUser,
    zValidator(
      "json",
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        paymentRequired: z.number().min(0, "Payment must be non-negative"),
        documentHash: z.string().min(1, "Document hash is required"),
        ipfsHash: z.string().min(1, "IPFS hash is required"),
        encryptionKey: z.string().min(1, "Encryption key is required"),
        iv: z.string().min(1, "IV is required"),
        tag: z.string().min(1, "Auth tag is required"),
      })
    ),
    async (ctx) => {
      try {
        const user = ctx.get("user");
        const groupId = parseInt(ctx.req.param("groupId"));
        const {
          title,
          description,
          paymentRequired,
          documentHash,
          ipfsHash,
          encryptionKey,
          iv,
          tag,
        } = ctx.req.valid("json");

        if (isNaN(groupId)) {
          return respond.err(ctx, "Invalid group ID", 400);
        }

        const isLawyerInGroup = db
          .query(
            `
            SELECT lgm.lawyer_account 
            FROM lawyer_group_members lgm
            JOIN lawyer_accounts la ON lgm.lawyer_account = la.account
            WHERE lgm.group_id = ? AND lgm.lawyer_account = ? AND la.verified_at IS NOT NULL
          `
          )
          .get(groupId, user.id);

        if (!isLawyerInGroup) {
          return respond.err(
            ctx,
            "Only verified lawyers in this group can add documents",
            403
          );
        }

        let group = db
          .query(
            "SELECT escrow_contract_address FROM lawyer_groups WHERE id = ?"
          )
          .get(groupId) as any;

        let escrowAddress = group?.escrow_contract_address;
        if (!escrowAddress) {
          const orchestrator = contracts.BrieflyOrchestrator();
          const deployTx = await orchestrator.write.deployEscrowForGroup([
            BigInt(groupId),
          ]);

          const receipt = await evmClient.waitForTransactionReceipt({
            hash: deployTx,
          });

          const deployEvent = receipt.logs.find(
            (log) =>
              log.topics[0] ===
              viem.keccak256(viem.toBytes("EscrowDeployed(uint256,address)"))
          );

          if (deployEvent && deployEvent.data) {
            escrowAddress = `0x${deployEvent.data.slice(26)}`;

            db.query(
              "UPDATE lawyer_groups SET escrow_contract_address = ? WHERE id = ?"
            ).run(escrowAddress, groupId);
          } else {
            return respond.err(ctx, "Failed to deploy escrow contract", 500);
          }
        }

        const escrowContract = contracts.BrieflyEscrow(
          escrowAddress as `0x${string}`
        );

        const addDocTx = await escrowContract.write.addDocument([
          documentHash,
          BigInt(paymentRequired * 1e18),
          user.wallet_address,
          BigInt(groupId),
        ]);

        const addDocReceipt = await evmClient.waitForTransactionReceipt({
          hash: addDocTx,
        });

        let contractDocumentId = 1;
        for (const log of addDocReceipt.logs) {
          try {
            const decoded = viem.decodeEventLog({
              abi: contracts.BrieflyEscrow(
                "0x0000000000000000000000000000000000000000"
              ).abi,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === "DocumentAdded") {
              contractDocumentId = Number(decoded.args.documentId);
              break;
            }
          } catch {
            // Ignore logs that don't match our ABI
          }
        }

        const documentResult = db
          .query(
            `
          INSERT INTO group_documents (
            group_id, lawyer_account, contract_document_id, title, description,
            document_hash, ipfs_hash, encryption_key, payment_required, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id
        `
          )
          .get(
            groupId,
            user.id,
            contractDocumentId,
            title,
            description || null,
            documentHash,
            `${ipfsHash}:${iv}:${tag}`,
            encryptionKey,
            paymentRequired,
            "locked"
          ) as { id: number };

        db.query(
          `
          INSERT INTO group_messages (group_id, sender_account, message_type, message_content, document_id)
          VALUES (?, ?, 'system', ?, ?)
        `
        ).run(
          groupId,
          user.id,
          `📄 New document added: "${title}"${
            description ? ` - ${description}` : ""
          }`,
          documentResult.id
        );

        groupChatWS.notifyGroup(groupId, {
          type: "document_added",
          documentId: documentResult.id,
          title,
          description,
        });

        return respond.ok(
          ctx,
          {
            documentId: documentResult.id,
            contractDocumentId,
            title,
            description,
            paymentRequired,
            status: "locked",
            ipfsHash,
          },
          "Document added successfully",
          201
        );
      } catch (error) {
        console.error("Error adding document:", error);
        return respond.err(ctx, "Failed to add document", 500);
      }
    }
  )
  .get("/:groupId/documents", ensureUser, async (ctx) => {
    try {
      const user = ctx.get("user");
      const groupId = parseInt(ctx.req.param("groupId"));

      if (isNaN(groupId)) {
        return respond.err(ctx, "Invalid group ID", 400);
      }

      const isParticipant = db
        .query(
          `
          SELECT 1 FROM (
            SELECT lgm.lawyer_account as account FROM lawyer_group_members lgm WHERE lgm.group_id = ?
            UNION
            SELECT gr.requester_account as account FROM group_requests gr 
            WHERE gr.group_id = ? AND gr.status = 'accepted'
          ) participants WHERE account = ?
        `
        )
        .get(groupId, groupId, user.id);

      if (!isParticipant) {
        return respond.err(
          ctx,
          "Access denied: Not a participant in this group",
          403
        );
      }

      const documents = db
        .query(
          `
          SELECT 
            gd.*,
            la.name as lawyer_name,
            la.photo_url as lawyer_photo
          FROM group_documents gd
          JOIN lawyer_accounts la ON gd.lawyer_account = la.account
          WHERE gd.group_id = ?
          ORDER BY gd.created_at DESC
        `
        )
        .all(groupId) as any[];

      const documentsWithStatus = await Promise.all(
        documents.map(async (doc) => {
          try {
            const escrowAddress = db
              .query(
                "SELECT escrow_contract_address FROM lawyer_groups WHERE id = ?"
              )
              .get(groupId) as any;

            if (!escrowAddress?.escrow_contract_address) {
              return {
                ...doc,
                status: "locked",
                canAccess: false,
              };
            }

            const escrowContract = contracts.BrieflyEscrow(
              escrowAddress.escrow_contract_address as `0x${string}`
            );

            const isUnlocked = await escrowContract.read.isDocumentUnlocked([
              BigInt(doc.contract_document_id),
            ]);

            const status = isUnlocked ? "unlocked" : "locked";

            if (status === "unlocked" && doc.status === "locked") {
              db.query(
                "UPDATE group_documents SET status = 'unlocked', unlocked_at = CURRENT_TIMESTAMP WHERE id = ?"
              ).run(doc.id);
            }

            return {
              id: doc.id,
              title: doc.title,
              description: doc.description,
              paymentRequired: doc.payment_required,
              status,
              canAccess: isUnlocked,
              createdAt: doc.created_at,
              lawyer: {
                name: doc.lawyer_name,
                photoUrl: doc.lawyer_photo,
              },
            };
          } catch (error) {
            console.error("Error checking document status:", error);
            return {
              ...doc,
              status: "locked",
              canAccess: false,
            };
          }
        })
      );

      return respond.ok(
        ctx,
        { documents: documentsWithStatus },
        "Documents retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Error fetching documents:", error);
      return respond.err(ctx, "Failed to fetch documents", 500);
    }
  })
  .post("/:groupId/documents/:documentId/pay", ensureUser, async (ctx) => {
    try {
      const user = ctx.get("user");
      const groupId = parseInt(ctx.req.param("groupId"));
      const documentId = parseInt(ctx.req.param("documentId"));

      if (isNaN(groupId) || isNaN(documentId)) {
        return respond.err(ctx, "Invalid group or document ID", 400);
      }

      const document = db
        .query(
          `
          SELECT gd.*, lg.escrow_contract_address
          FROM group_documents gd
          JOIN lawyer_groups lg ON gd.group_id = lg.id
          WHERE gd.id = ? AND gd.group_id = ?
        `
        )
        .get(documentId, groupId) as any;

      if (!document) {
        return respond.err(ctx, "Document not found", 404);
      }

      if (!document.escrow_contract_address) {
        return respond.err(ctx, "Escrow contract not deployed", 400);
      }

      const escrowContract = contracts.BrieflyEscrow(
        document.escrow_contract_address as `0x${string}`
      );

      const paymentTx = await escrowContract.write.makePayment([
        BigInt(document.contract_document_id),
      ]);

      await evmClient.waitForTransactionReceipt({ hash: paymentTx });

      db.query(
        "UPDATE group_documents SET status = 'unlocked', unlocked_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(documentId);

      return respond.ok(
        ctx,
        {
          documentId,
          status: "unlocked",
          transactionHash: paymentTx,
        },
        "Payment successful, document unlocked",
        200
      );
    } catch (error) {
      console.error("Error processing payment:", error);
      return respond.err(ctx, "Payment failed", 500);
    }
  })
  .get("/:groupId/documents/:documentId/download", ensureUser, async (ctx) => {
    try {
      const user = ctx.get("user");
      const groupId = parseInt(ctx.req.param("groupId"));
      const documentId = parseInt(ctx.req.param("documentId"));

      if (isNaN(groupId) || isNaN(documentId)) {
        return respond.err(ctx, "Invalid group or document ID", 400);
      }

      const document = db
        .query(
          `
          SELECT gd.*, lg.escrow_contract_address
          FROM group_documents gd
          JOIN lawyer_groups lg ON gd.group_id = lg.id
          WHERE gd.id = ? AND gd.group_id = ?
        `
        )
        .get(documentId, groupId) as any;

      if (!document) {
        return respond.err(ctx, "Document not found", 404);
      }

      const isParticipant = db
        .query(
          `
          SELECT 1 FROM (
            SELECT lgm.lawyer_account as account FROM lawyer_group_members lgm WHERE lgm.group_id = ?
            UNION
            SELECT gr.requester_account as account FROM group_requests gr 
            WHERE gr.group_id = ? AND gr.status = 'accepted'
          ) participants WHERE account = ?
        `
        )
        .get(groupId, groupId, user.id);

      if (!isParticipant) {
        return respond.err(
          ctx,
          "Access denied: Not a participant in this group",
          403
        );
      }

      if (document.status === "locked") {
        return respond.err(
          ctx,
          "Document is locked. Payment required to access.",
          402
        );
      }

      try {
        const [ipfsHash, iv, tag] = document.ipfs_hash.split(":");
        const encryptedData = await getFromIPFS(ipfsHash);
        const decryptedData = decryptFile(
          encryptedData,
          document.encryption_key,
          iv,
          tag
        );

        db.query(
          "INSERT INTO document_access_logs (document_id, account_id, access_type) VALUES (?, ?, ?)"
        ).run(documentId, user.id, "download");

        const response = new Response(new Uint8Array(decryptedData), {
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${document.title}"`,
          },
        });

        return response;
      } catch (error) {
        console.error("Error decrypting/downloading file:", error);
        return respond.err(ctx, "Failed to download document", 500);
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      return respond.err(ctx, "Failed to download document", 500);
    }
  })
  .post(
    "/:groupId/messages",
    ensureUser,
    zValidator(
      "json",
      z.object({
        messageContent: z.string().min(1, "Message content is required"),
        messageType: z.enum(["text", "document", "system"]).default("text"),
        documentId: z.number().optional(),
      })
    ),
    async (ctx) => {
      try {
        const user = ctx.get("user");
        const groupId = parseInt(ctx.req.param("groupId"));
        const { messageContent, messageType, documentId } =
          ctx.req.valid("json");

        if (isNaN(groupId)) {
          return respond.err(ctx, "Invalid group ID", 400);
        }

        const isParticipant = db
          .query(
            `
            SELECT 1 FROM (
              SELECT lgm.lawyer_account as account FROM lawyer_group_members lgm WHERE lgm.group_id = ?
              UNION
              SELECT gr.requester_account as account FROM group_requests gr 
              WHERE gr.group_id = ? AND gr.status = 'accepted'
            ) participants WHERE account = ?
          `
          )
          .get(groupId, groupId, user.id);

        if (!isParticipant) {
          return respond.err(
            ctx,
            "Not authorized to send messages in this group",
            403
          );
        }

        if (messageType === "document" && !documentId) {
          return respond.err(
            ctx,
            "Document ID is required for document messages",
            400
          );
        }

        if (messageType === "document" && documentId) {
          const document = db
            .query(
              "SELECT id FROM group_documents WHERE id = ? AND group_id = ?"
            )
            .get(documentId, groupId);

          if (!document) {
            return respond.err(ctx, "Document not found in this group", 404);
          }
        }

        const messageResult = db
          .query(
            `
            INSERT INTO group_messages (group_id, sender_account, message_type, message_content, document_id)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, created_at
          `
          )
          .get(
            groupId,
            user.id,
            messageType,
            messageContent,
            documentId || null
          ) as {
          id: number;
          created_at: string;
        };

        const senderInfo = db
          .query(
            `
            SELECT 
              CASE 
                WHEN la.account IS NOT NULL THEN la.name
                ELSE a.wallet_address
              END as sender_name,
              la.photo_url as sender_photo
            FROM account a
            LEFT JOIN lawyer_accounts la ON a.id = la.account
            WHERE a.id = ?
          `
          )
          .get(user.id) as any;

        const messageData = {
          messageId: messageResult.id,
          groupId,
          messageType,
          messageContent,
          documentId: documentId || null,
          sender: {
            accountId: user.id,
            name: senderInfo?.sender_name || "Unknown",
            photoUrl: senderInfo?.sender_photo || null,
          },
          createdAt: messageResult.created_at,
        };

        groupChatWS.notifyGroup(groupId, {
          type: "new_message",
          message: messageData,
        });

        return respond.ok(ctx, messageData, "Message sent successfully", 201);
      } catch (error) {
        console.error("Error sending message:", error);
        return respond.err(ctx, "Failed to send message", 500);
      }
    }
  )
  .get("/:groupId/messages", ensureUser, async (ctx) => {
    try {
      const user = ctx.get("user");
      const groupId = parseInt(ctx.req.param("groupId"));
      const page = parseInt(ctx.req.query("page") || "1");
      const limit = parseInt(ctx.req.query("limit") || "50");
      const offset = (page - 1) * limit;

      if (isNaN(groupId)) {
        return respond.err(ctx, "Invalid group ID", 400);
      }

      const isParticipant = db
        .query(
          `
          SELECT 1 FROM (
            SELECT lgm.lawyer_account as account FROM lawyer_group_members lgm WHERE lgm.group_id = ?
            UNION
            SELECT gr.requester_account as account FROM group_requests gr 
            WHERE gr.group_id = ? AND gr.status = 'accepted'
          ) participants WHERE account = ?
        `
        )
        .get(groupId, groupId, user.id);

      if (!isParticipant) {
        return respond.err(
          ctx,
          "Not authorized to view messages in this group",
          403
        );
      }

      const messages = db
        .query(
          `
          SELECT 
            gm.*,
            CASE 
              WHEN la.account IS NOT NULL THEN la.name
              ELSE a.wallet_address
            END as sender_name,
            la.photo_url as sender_photo,
            gd.title as document_title,
            gd.description as document_description,
            gd.status as document_status,
            gd.payment_required as document_payment_required
          FROM group_messages gm
          JOIN account a ON gm.sender_account = a.id
          LEFT JOIN lawyer_accounts la ON a.id = la.account
          LEFT JOIN group_documents gd ON gm.document_id = gd.id
          WHERE gm.group_id = ?
          ORDER BY gm.created_at DESC
          LIMIT ? OFFSET ?
        `
        )
        .all(groupId, limit, offset) as any[];

      const totalMessages = db
        .query(
          "SELECT COUNT(*) as count FROM group_messages WHERE group_id = ?"
        )
        .get(groupId) as { count: number };

      const allDocuments = db
        .query(
          `
          SELECT 
            gd.*,
            la.name as lawyer_name,
            la.photo_url as lawyer_photo
          FROM group_documents gd
          JOIN lawyer_accounts la ON gd.lawyer_account = la.account
          WHERE gd.group_id = ?
          ORDER BY gd.created_at DESC
        `
        )
        .all(groupId) as any[];

      const documentsWithStatus = await Promise.all(
        allDocuments.map(async (doc) => {
          try {
            const escrowAddress = db
              .query(
                "SELECT escrow_contract_address FROM lawyer_groups WHERE id = ?"
              )
              .get(groupId) as { escrow_contract_address: string } | null;

            if (!escrowAddress?.escrow_contract_address) {
              return {
                id: doc.id,
                title: doc.title,
                description: doc.description,
                paymentRequired: doc.payment_required,
                status: "locked",
                canAccess: false,
                createdAt: doc.created_at,
                lawyer: {
                  name: doc.lawyer_name,
                  photoUrl: doc.lawyer_photo,
                },
              };
            }

            const escrowContract = contracts.BrieflyEscrow(
              escrowAddress.escrow_contract_address as `0x${string}`
            );

            const isUnlocked = await escrowContract.read.isDocumentUnlocked([
              BigInt(doc.contract_document_id),
            ]);

            const status = isUnlocked ? "unlocked" : "locked";

            if (status === "unlocked" && doc.status === "locked") {
              db.query(
                "UPDATE group_documents SET status = 'unlocked', unlocked_at = CURRENT_TIMESTAMP WHERE id = ?"
              ).run(doc.id);
            }

            return {
              id: doc.id,
              title: doc.title,
              description: doc.description,
              paymentRequired: doc.payment_required,
              status,
              canAccess: isUnlocked,
              createdAt: doc.created_at,
              lawyer: {
                name: doc.lawyer_name,
                photoUrl: doc.lawyer_photo,
              },
            };
          } catch (error) {
            console.error("Error checking document status:", error);
            return {
              id: doc.id,
              title: doc.title,
              description: doc.description,
              paymentRequired: doc.payment_required,
              status: "locked",
              canAccess: false,
              createdAt: doc.created_at,
              lawyer: {
                name: doc.lawyer_name,
                photoUrl: doc.lawyer_photo,
              },
            };
          }
        })
      );

      const formattedMessages = messages.map((message) => ({
        id: message.id,
        messageType: message.message_type,
        messageContent: message.message_content,
        sender: {
          accountId: message.sender_account,
          name: message.sender_name,
          photoUrl: message.sender_photo,
        },
        document: message.document_id
          ? {
              id: message.document_id,
              title: message.document_title,
              description: message.document_description,
              status: message.document_status,
              paymentRequired: message.document_payment_required,
            }
          : null,
        createdAt: message.created_at,
        updatedAt: message.updated_at,
      }));

      return respond.ok(
        ctx,
        {
          messages: formattedMessages,
          documents: documentsWithStatus,
          pagination: {
            page,
            limit,
            total: totalMessages.count,
            totalPages: Math.ceil(totalMessages.count / limit),
          },
        },
        "Messages retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
      return respond.err(ctx, "Failed to fetch messages", 500);
    }
  });

export default groups;
export type GroupsType = typeof groups;

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { respond } from "@/api/lib/utils/respond";
import { type Address } from "viem";
import ensureUser from "@/api/lib/middlewares/ensureUser";
import ensureAdmin from "@/api/lib/middlewares/ensureAdmin";
import { db } from "@/api/lib/data/db";
import { env } from "@/env";

export default new Hono()
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

        db.transaction(() => {
          db.query(
            `
            INSERT INTO lawyer_accounts (account, name, photo_url, bio, expertise, consultation_fee)
            VALUES (?, ?, ?, ?, ?, ?)
          `
          ).run(user.id, name, photoUrl, bio, expertise, consultationFee);

          for (const jurisdiction of jurisdictions) {
            db.query(
              `
              INSERT INTO lawyer_jurisdictions (account, jurisdiction)
              VALUES (?, ?)
            `
            ).run(user.id, jurisdiction);
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
        console.error("Error submitting lawyer application:", error);
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
              GROUP_CONCAT(lj.jurisdiction) as jurisdictions
            FROM lawyer_accounts la
            LEFT JOIN lawyer_jurisdictions lj ON la.account = lj.account
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

      return respond.ok(
        ctx,
        {
          accountId: lawyerApplication.account,
          name: lawyerApplication.name,
          photoUrl: lawyerApplication.photo_url,
          bio: lawyerApplication.bio,
          expertise: lawyerApplication.expertise,
          jurisdictions,
          consultationFee: lawyerApplication.consultation_fee,
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
          .query("SELECT * FROM lawyer_accounts WHERE account = ? LIMIT 1")
          .get(accountId) as any;

        if (!existingLawyer) {
          return respond.err(ctx, "Lawyer application not found", 404);
        }

        if (existingLawyer.verified_at) {
          return respond.err(ctx, "Lawyer application already approved", 409);
        }

        const currentTime = new Date().toISOString();
        db.query(
          "UPDATE lawyer_accounts SET verified_at = ? WHERE account = ?"
        ).run(currentTime, accountId);

        return respond.ok(
          ctx,
          {
            accountId,
            approvedAt: currentTime,
          },
          "Lawyer application approved successfully",
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
  });

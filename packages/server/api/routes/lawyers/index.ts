import { Hono } from "hono";
import { isValid, z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { respond } from "@/api/lib/utils/respond";
import { verifyMessage, type Address } from "viem";
import { zEvmAddress, zHash } from "@/api/lib/utils/zod";
import jwt from "jsonwebtoken";
import { env } from "@/env";
import ensureUser from "@/api/lib/middlewares/ensureUser";
import { db } from "@/api/lib/data/db";

const NonceRegistry: Record<Address, string> = {};

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
  });

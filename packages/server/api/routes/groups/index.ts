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

export default new Hono()
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
  );

import { createMiddleware } from "hono/factory";
import { env } from "@/env";
import { respond } from "../utils/respond";

const ensureAdmin = createMiddleware(async (ctx, next) => {
  const adminSecret = ctx.req.header("x-admin-secret");

  if (!adminSecret) {
    return respond.err(ctx, "Missing admin secret header", 401);
  }

  if (adminSecret !== env.ADMIN_SECRET) {
    return respond.err(ctx, "Unauthorized: Invalid admin secret", 401);
  }

  await next();
});

export default ensureAdmin;

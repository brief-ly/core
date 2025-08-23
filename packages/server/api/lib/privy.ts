import { env } from "@/env";
import { PrivyClient } from "@privy-io/server-auth";
import type { Context } from "hono";

export const privyClient = new PrivyClient(
  env.BUN_PUBLIC_PRIVY_APP_ID,
  env.PRIVY_APP_SECRET
);

export async function getPrivyUserFromContext(ctx: Context) {
  const accessToken = ctx.req.header("Authorization")?.replace("Bearer ", "");
  if (!accessToken) return null;
  try {
    const { userId } = await privyClient.verifyAuthToken(accessToken);
    return await privyClient.getUserById(userId);
  } catch (_) {
    return null;
  }
}

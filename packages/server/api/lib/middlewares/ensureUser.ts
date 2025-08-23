import { createMiddleware } from "hono/factory";
import type { Address } from "viem";
import { isAddress } from "viem";
import { getPrivyUserFromContext } from "../privy";
import { db } from "../data/db";
import z from "zod";
import { id } from "zod/v4/locales";
import { zEvmAddress } from "../utils/zod";

const ensureUser = createMiddleware<{
  Variables: {
    user: { id: number; wallet_address: Address };
  };
}>(async (ctx, next) => {
  const privyUser = await getPrivyUserFromContext(ctx);
  if (!privyUser) return ctx.text("Unauthorized", 401);

  const address = privyUser.wallet?.address;

  if (!address) return ctx.text("Missing embedded wallet", 401);
  if (!isAddress(address)) {
    return ctx.text("Invalid EVM wallet retrieved from Privy", 401);
  }

  let user = db
    .query("SELECT * FROM account WHERE wallet_address = ? LIMIT 1")
    .get(address);
  if (!user) {
    const result = db
      .query("INSERT INTO account (wallet_address) VALUES (?) RETURNING *")
      .get(address);

    user = result;
  }

  ctx.set(
    "user",
    z
      .object({
        id: z.number(),
        wallet_address: zEvmAddress(),
      })
      .parse(user)
  );

  await next();
});

export default ensureUser;

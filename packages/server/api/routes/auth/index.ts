import { Hono } from "hono";
import { isValid, z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { respond } from "@/api/lib/utils/respond";
import { verifyMessage, type Address } from "viem";
import { zEvmAddress, zHash } from "@/api/lib/utils/zod";
import jwt from "jsonwebtoken";
import { env } from "@/env";

const NonceRegistry: Record<Address, string> = {};

const example = new Hono()
  .get(
    "/nonce",
    zValidator(
      "query",
      z.object({
        address: zEvmAddress(),
      })
    ),
    async (ctx) => {
      const { address } = ctx.req.valid("query");

      const nonce = `Sign this message to verify ownership of your wallet:\nNonce: ${crypto
        .getRandomValues(new Uint8Array(16))
        .join("")}`;

      NonceRegistry[address] = nonce;

      return respond.ok(
        ctx,
        {
          nonce,
        },
        "Successfully fetched data",
        200
      );
    }
  )
  .post(
    "/login",
    zValidator(
      "json",
      z.object({
        address: zEvmAddress(),
        signature: zHash(),
      })
    ),
    async (ctx) => {
      const { address, signature } = ctx.req.valid("json");

      const nonce = NonceRegistry[address];
      if (!nonce) {
        return respond.err(ctx, "Request a nonce", 400);
      }

      const isValid = verifyMessage({
        address,
        message: nonce,
        signature,
      });

      if (!isValid) {
        return respond.err(ctx, "Invalid signature", 401);
      }

      const token = jwt.sign({ address }, env.JWT_SECRET, { expiresIn: "1h" });

      return respond.ok(
        ctx,
        {
          token,
        },
        "Login successful",
        200
      );
    }
  );

export default example;
export type ExampleType = typeof example;

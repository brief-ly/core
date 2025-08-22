import { isAddress, isHash } from "viem";
import { z } from "zod";
import type { Address, Hash } from "viem";

export const zJsonString = () =>
  z
    .string()
    .refine((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch (_) {
        return false;
      }
    })
    .transform((value) => JSON.parse(value));

export const zNumberString = () =>
  z
    .string()
    .refine((value) => {
      try {
        Number(value);
        return true;
      } catch (_) {
        return false;
      }
    })
    .transform((value) => Number(value));

export const zBooleanString = () =>
  z.enum(["true", "false"]).transform((value) => value === "true");

export const zDateString = () =>
  z.string().refine((value) => {
    try {
      new Date(value);
      return true;
    } catch (_) {
      return false;
    }
  });

export const zEvmAddress = () =>
  z
    .string()
    .refine((value) => isAddress(value))
    .transform((value) => value as Address);

export const zHash = () =>
  z
    .string()
    .refine((value) => isHash(value))
    .transform((value) => value as Hash);

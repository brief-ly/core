import * as viem from "viem";
import { hardhat, seiTestnet } from "viem/chains";
import { env, isProd } from "../../env";
import { privateKeyToAccount } from "viem/accounts";
import definitions from "../../../definitions";

if (!viem.isHex(env.PVT_KEY)) {
  throw new Error("Invalid private key");
}

export const primaryChain = isProd ? seiTestnet : hardhat;

export const evmClient = viem
  .createWalletClient({
    chain: primaryChain,
    account: privateKeyToAccount(env.PVT_KEY),
    transport: viem.http(primaryChain.rpcUrls.default.http[0]),
  })
  .extend(viem.publicActions);

export type EvmClient = typeof evmClient;

export const contracts = {
  BrieflyOrchestrator() {
    return viem.getContract({
      client: evmClient,
      ...definitions.BrieflyOrchestrator,
    });
  },

  BrieflyEscrow(address: `0x${string}`) {
    return viem.getContract({
      client: evmClient,
      abi: definitions.BrieflyEscrow.abi,
      address,
    });
  },

  BrieflyLawyerIdentity() {
    return viem.getContract({
      client: evmClient,
      ...definitions.BrieflyLawyerIdentity,
    });
  },

  TestBUSD() {
    return viem.getContract({
      client: evmClient,
      ...definitions.TestBUSD,
    });
  },
};

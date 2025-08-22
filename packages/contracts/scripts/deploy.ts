import * as viem from "viem";
import { hardhat, bscTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import BrieflyOrchestrator from "../artifacts/src/BrieflyOrchestrator.sol/BrieflyOrchestrator.json";
import BrieflyLawyerIdentity from "../artifacts/src/BrieflyLawyerIdentity.sol/BrieflyLawyerIdentity.json";
import TestBUSD from "../artifacts/src/TestBUSD.sol/TestBUSD.json";

const networkArg = Bun.argv[2];
const isBscTestnet = networkArg === "bsc-testnet";

const privateKey = Bun.env.PRIVATE_KEY_1;
if (!privateKey || !viem.isHex(privateKey)) {
  throw new Error("PRIVATE_KEY_1 is invalid");
}

const getChain = () => {
  if (isBscTestnet) return bscTestnet;
  return hardhat;
};

const getAccount = () => {
  if (isBscTestnet) return privateKeyToAccount(privateKey);

  return privateKeyToAccount(
    "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e"
  );
};

const client = viem
  .createWalletClient({
    chain: getChain(),
    account: getAccount(),
    transport: viem.http(getChain().rpcUrls.default.http[0]),
  })
  .extend(viem.publicActions);

const definitions: {
  BrieflyOrchestrator?: {
    abi: any;
    address?: viem.Address;
  };
  BrieflyLawyerIdentity?: {
    abi: any;
    address?: viem.Address;
  };
  TestBUSD?: {
    abi: any;
    address?: viem.Address;
  };
} = {};

async function main() {
  console.log(`Deploying to ${getChain().name}...`);
  console.log(`Deployer address: ${client.account.address}`);

  if (!viem.isHex(TestBUSD.bytecode))
    throw new Error("TestBUSD bytecode is missing or invalid");

  if (!viem.isHex(BrieflyOrchestrator.bytecode))
    throw new Error("BrieflyOrchestrator bytecode is missing or invalid");

  console.log("Deploying TestBUSD...");
  const busdHash = await client.deployContract({
    abi: TestBUSD.abi,
    bytecode: TestBUSD.bytecode,
    args: [],
  });

  const busdReceipt = await client.waitForTransactionReceipt({
    hash: busdHash,
  });

  if (!busdReceipt.contractAddress)
    throw new Error("TestBUSD deployment failed");

  console.log(`TestBUSD deployed at: ${busdReceipt.contractAddress}`);

  console.log("Deploying BrieflyOrchestrator...");
  const orchestratorHash = await client.deployContract({
    abi: BrieflyOrchestrator.abi,
    bytecode: BrieflyOrchestrator.bytecode,
    args: [busdReceipt.contractAddress],
  });

  const orchestratorReceipt = await client.waitForTransactionReceipt({
    hash: orchestratorHash,
  });

  if (!orchestratorReceipt.contractAddress)
    throw new Error("BrieflyOrchestrator deployment failed");

  console.log(
    `BrieflyOrchestrator deployed at: ${orchestratorReceipt.contractAddress}`
  );

  const lawyerIdentityAddress = await client.readContract({
    address: orchestratorReceipt.contractAddress,
    abi: BrieflyOrchestrator.abi,
    functionName: "lawyerIdentity",
  });

  console.log(`BrieflyLawyerIdentity deployed at: ${lawyerIdentityAddress}`);

  definitions["BrieflyOrchestrator"] = {
    abi: BrieflyOrchestrator.abi,
    address: orchestratorReceipt.contractAddress,
  };

  definitions["BrieflyLawyerIdentity"] = {
    abi: BrieflyLawyerIdentity.abi,
    address: lawyerIdentityAddress as viem.Address,
  };

  definitions["TestBUSD"] = {
    abi: TestBUSD.abi,
    address: busdReceipt.contractAddress,
  };

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log(`TestBUSD: ${busdReceipt.contractAddress}`);
  console.log(`BrieflyOrchestrator: ${orchestratorReceipt.contractAddress}`);
  console.log(`BrieflyLawyerIdentity: ${lawyerIdentityAddress}`);
  console.log(`Server address: ${client.account.address}`);
}
main()
  .then(async () => {
    await Bun.write(
      Bun.file("../definitions.json"),
      JSON.stringify(definitions, null, 2)
    );

    await Bun.write(
      Bun.file("../definitions.ts"),
      "const definitions = " +
        JSON.stringify(definitions, null, 2) +
        " as const;\nexport default definitions;\n"
    );

    console.log("\nDeployment successful! Contract definitions written to:");
    console.log("- definitions.json");
    console.log("- definitions.ts");
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

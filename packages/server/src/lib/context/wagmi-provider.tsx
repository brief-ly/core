import { http } from "wagmi";
import { hardhat, mainnet } from "viem/chains";

import {
  createConfig,
  WagmiProvider as WagmiProviderBase,
} from "@privy-io/wagmi";

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

const isProd = process.env.NODE_ENV === "production";

export const config = createConfig({
  chains: isProd ? [mainnet] : [mainnet, hardhat],
  transports: {
    [mainnet.id]: http(),
    [hardhat.id]: http(),
  },
});

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return <WagmiProviderBase config={config}>{children}</WagmiProviderBase>;
}

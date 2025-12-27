// web/src/hooks/useChainConfig.ts
import React from "react";
import { WSOL, USDC } from "../lib/solana";

type ChainCfg = {
  chain: string;
  network: string;
  rpc: boolean;
  quotes: string[];
  wsol: string;
  usdc: string;
  defaultSlippageBps: number;
  defaultPriorityMicroLamports: number;
};

const fallback: ChainCfg = {
  chain: "solana",
  network: "mainnet-beta",
  rpc: true,
  quotes: [WSOL],
  wsol: WSOL,
  usdc: USDC,
  defaultSlippageBps: 300,
  defaultPriorityMicroLamports: 0,
};

export default function useChainConfig(baseUrl = "") {
  const [cfg, setCfg] = React.useState<ChainCfg>(fallback);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${baseUrl}/config/chain`);
        if (r.ok) {
          const j = await r.json();
          if (alive) setCfg(j);
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, [baseUrl]);
  return cfg;
}

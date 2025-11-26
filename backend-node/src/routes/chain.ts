// backend-node/src/routes/chain.ts
import type { Express, Request, Response } from "express";
import { Connection } from "@solana/web3.js";
import { CHAIN, NETWORK, RPC_HTTP, WSOL, USDC, DEFAULT_SLIPPAGE_BPS, DEFAULT_PRIORITY_FEE, baseQuotes } from "../lib/solana";

export function registerChainRoutes(app: Express) {
  app.get("/config/chain", (_req: Request, res: Response) => {
    res.json({
      chain: CHAIN,
      network: NETWORK,
      rpc: Boolean(RPC_HTTP),
      quotes: baseQuotes(),
      wsol: WSOL,
      usdc: USDC,
      defaultSlippageBps: DEFAULT_SLIPPAGE_BPS,
      defaultPriorityMicroLamports: DEFAULT_PRIORITY_FEE,
    });
  });

  app.get("/healthz/solana", async (_req: Request, res: Response) => {
    if (!RPC_HTTP) return res.status(503).json({ ok: false, rpc: false, error: "RPC not configured" });
    try {
      const conn = new Connection(RPC_HTTP, "processed");
      const ver = await conn.getVersion();
      const block = await conn.getLatestBlockhash("processed");
      res.json({ ok: true, version: ver, blockhash: block.blockhash, lastValidBlockHeight: block.lastValidBlockHeight });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || "RPC error" });
    }
  });
}

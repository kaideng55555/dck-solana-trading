// backend-node/src/routes/fees.ts
import type { Express, Request, Response } from "express";
import { Connection } from "@solana/web3.js";

type Suggest = {
  safe: number;
  normal: number;
  fast: number;
  percentiles: Record<string, number>;
  sampleSize: number;
};

function percentile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const idx = Math.floor((p / 100) * (arr.length - 1));
  const sorted = arr.slice().sort((a,b)=>a-b);
  return sorted[idx];
}

export function registerFeeSuggestRoutes(app: Express) {
  const RPC = process.env.RPC_HTTP || process.env.QUICKNODE_RPC || "";

  app.get("/fees/suggest", async (_req: Request, res: Response) => {
    if (!RPC) return res.status(503).json({ ok: false, error: "RPC not configured" });
    try {
      const conn = new Connection(RPC, "confirmed");
      // Prefer native method if available
      let fees: any[] = [];
      try {
        // @ts-ignore: private rpcRequest
        const r = await (conn as any).rpcRequest("getRecentPrioritizationFees", []);
        fees = r?.result || [];
      } catch (e) {
        // fallback: zero
        fees = [];
      }
      const micros = Array.isArray(fees) ? fees.map((f: any) => Number(f?.prioritizationFee || 0)).filter((n: number)=>Number.isFinite(n) && n>=0) : [];
      const p = {
        p10: percentile(micros, 10),
        p25: percentile(micros, 25),
        p50: percentile(micros, 50),
        p75: percentile(micros, 75),
        p90: percentile(micros, 90),
      };
      const suggest: Suggest = {
        safe: p.p25 || Number(process.env.FEE_SAFE || 10_000),
        normal: p.p50 || Number(process.env.FEE_NORMAL || 30_000),
        fast: p.p75 || Number(process.env.FEE_FAST || 80_000),
        percentiles: p as any,
        sampleSize: micros.length
      };
      res.json({ ok: true, suggest });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || "fee suggest failed" });
    }
  });
}

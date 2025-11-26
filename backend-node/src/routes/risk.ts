// backend-node/src/routes/risk.ts
import type { Express, Request, Response } from "express";
import { Connection } from "@solana/web3.js";
import { analyzeMintSafety, RiskHints } from "../lib/analyzers";

export function registerRiskRoutes(app: Express) {
  const RPC = process.env.RPC_HTTP || process.env.QUICKNODE_RPC || "";

  function parseHints(q: any): RiskHints {
    const h: RiskHints = {};
    if (q.lpLockedPct != null) h.lpLockedPct = Number(q.lpLockedPct);
    if (q.swappable != null) h.swappable = String(q.swappable).toLowerCase() === "true";
    if (q.ageHours != null) h.ageHours = Number(q.ageHours);
    if (q.bondingPercent != null) h.bondingPercent = Number(q.bondingPercent);
    return h;
  }

  app.get("/risk/:mint", async (req: Request, res: Response) => {
    try {
      const { mint } = req.params;
      if (!mint) return res.status(400).json({ error: "mint required" });
      if (!RPC) return res.status(503).json({ error: "RPC not configured" });
      const conn = new Connection(RPC, "confirmed");
      const hints = parseHints(req.query);
      const out = await analyzeMintSafety(conn, mint, hints);
      res.json(out);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "risk failed" });
    }
  });

  app.post("/risk/batch", async (req: Request, res: Response) => {
    try {
      const { mints = [], hints = {} } = (req.body || {}) as { mints: string[]; hints?: Record<string, RiskHints> };
      if (!Array.isArray(mints) || mints.length === 0) return res.status(400).json({ error: "mints[] required" });
      if (!RPC) return res.status(503).json({ error: "RPC not configured" });
      const conn = new Connection(RPC, "confirmed");
      const results = await Promise.all(mints.slice(0, 50).map((m) => analyzeMintSafety(conn, m, hints[m] || {})));
      res.json({ items: results });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "risk batch failed" });
    }
  });
}

// backend-node/src/middleware/xmeRiskGate.ts
import type { Request, Response, NextFunction } from "express";
import { computeRisk } from "../lib/xme/risk";
import { getRuntimeConfig } from "../lib/runtimeConfig";

const CRITICAL_REASONS = [
  "Denylisted token",
  "Mint authority present (can mint more)",
];

export async function xmeRiskGate(req: Request, res: Response, next: NextFunction){
  try{
    // Admin bypass
    if (process.env.ADMIN_TOKEN && req.header("x-admin-token") === process.env.ADMIN_TOKEN) {
      return next();
    }

    const mint = String(req.body?.mint || req.query?.mint || "").trim();
    if (!mint) return res.status(400).json({ ok:false, error:"mint required" });

    const risk = await computeRisk(mint);
    const cfg = getRuntimeConfig();
    const minScore = Number(cfg.MIN_RISK_SCORE || "40");

    const hasCritical = (risk.reasons || []).some(r => CRITICAL_REASONS.some(c => r.startsWith(c)));
    if (hasCritical) {
      return res.status(400).json({ ok:false, error:"blocked by critical risk", risk });
    }
    if (risk.score < minScore){
      return res.status(400).json({ ok:false, error:`risk score too low (< ${minScore})`, risk });
    }
    (req as any).__xmeRisk = risk;
    next();
  }catch(e:any){
    res.status(500).json({ ok:false, error: e?.message || "xmeRiskGate failed" });
  }
}

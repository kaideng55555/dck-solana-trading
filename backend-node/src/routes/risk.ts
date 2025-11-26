// backend-node/src/routes/risk.ts
import type { Express, Request, Response } from "express";

type RiskResult = {
  mint: string;
  score: number;  // 0-100
  flags: string[];
};

/**
 * Placeholder scoring based on mint string length (deterministic)
 */
function analyzeMint(mint: string): RiskResult {
  const len = mint.length;
  const hash = mint.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  // Score: 0-100 based on hash
  const score = Math.min(100, Math.max(0, (hash % 100)));
  
  const flags: string[] = [];
  if (score < 30) flags.push('high-risk');
  if (score >= 30 && score < 70) flags.push('medium-risk');
  if (score >= 70) flags.push('low-risk');
  if (len < 32) flags.push('invalid-length');
  if (len > 44) flags.push('invalid-length');
  
  return { mint, score, flags };
}

export function registerRiskRoutes(app: Express) {
  app.get("/risk/:mint", (req: Request, res: Response) => {
    try {
      const { mint } = req.params;
      if (!mint) return res.status(400).json({ error: "mint required" });
      
      const result = analyzeMint(mint);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "risk failed" });
    }
  });

  app.post("/risk/batch", (req: Request, res: Response) => {
    try {
      const { mints = [] } = (req.body || {}) as { mints: string[] };
      if (!Array.isArray(mints) || mints.length === 0) {
        return res.status(400).json({ error: "mints[] required" });
      }
      
      const results = mints.slice(0, 50).map(m => analyzeMint(m));
      res.json({ items: results });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "risk batch failed" });
    }
  });
}

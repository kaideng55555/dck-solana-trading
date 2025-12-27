// backend-node/src/routes/social.ts
import type { Express, Request, Response } from "express";

type Trend = {
  symbol?: string;
  mint?: string;
  mentions?: number;
  change24h?: number;
  sentiment?: "Positive" | "Neutral" | "Negative" | string;
  score?: number;
  series?: number[];
};

const SAMPLE: Trend[] = [
  { symbol: "DCK", mint: "DCK111...", mentions: 1240, change24h: 220, sentiment: "Positive", score: 91, series: [2,3,4,6,10,12,9,15] },
  { symbol: "GLTCH", mint: "GLTCH1...", mentions: 880, change24h: -40, sentiment: "Neutral", score: 67, series: [9,7,6,8,7,6,7,7] },
  { symbol: "KATO", mint: "KATO11...", mentions: 540, change24h: 120, sentiment: "Positive", score: 74, series: [1,2,4,3,5,7,9,11] },
];

export function registerSocialRoutes(app: Express) {
  app.get("/social/trends", async (req: Request, res: Response) => {
    const window = String(req.query.window || "24h");
    res.json({ window, items: SAMPLE });
  });
}

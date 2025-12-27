// backend-node/src/routes/risk.ts
import type { Express, Request, Response } from "express";
import { computeRisk } from "../lib/xme/risk";

function adminAuth(req: Request, res: Response, next: Function){
  const token = req.header("x-admin-token") || "";
  if (!process.env.ADMIN_TOKEN) return res.status(500).json({ ok:false, error:"ADMIN_TOKEN not configured" });
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ ok:false, error:"unauthorized" });
  next();
}

export function registerRiskRoutes(app: Express){
  // Single
  app.get("/risk/:mint", async (req: Request, res: Response) => {
    try {
      const mint = String(req.params.mint).trim();
      const result = await computeRisk(mint);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok:false, error: e?.message || "risk failed" });
    }
  });

  // Batch
  app.post("/risk/batch", async (req: Request, res: Response) => {
    try {
      const mints: string[] = Array.isArray(req.body?.mints) ? req.body.mints : [];
      const limited = mints.slice(0, 50);
      const results = await Promise.all(limited.map(m => computeRisk(String(m))));
      res.json({ ok:true, results });
    } catch (e: any) {
      res.status(500).json({ ok:false, error: e?.message || "risk batch failed" });
    }
  });

  // Denylist get/add/remove
  app.get("/risk/denylist", adminAuth, async (req: Request, res: Response) => {
    const fs = await import("fs"); const path = await import("path");
    const file = path.resolve(process.cwd(), "data", "denylist.json");
    let arr: string[] = [];
    if (fs.existsSync(file)) arr = JSON.parse(fs.readFileSync(file, "utf-8"));
    res.json({ ok:true, denylist: arr });
  });

  app.post("/risk/denylist/add", adminAuth, async (req: Request, res: Response) => {
    const fs = await import("fs"); const path = await import("path");
    const file = path.resolve(process.cwd(), "data", "denylist.json");
    let arr: string[] = [];
    if (fs.existsSync(file)) arr = JSON.parse(fs.readFileSync(file, "utf-8"));
    const mint = String(req.body?.mint || "").trim();
    if (!mint) return res.status(400).json({ ok:false, error:"mint required" });
    if (!arr.includes(mint)) arr.push(mint);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(arr, null, 2), "utf-8");
    res.json({ ok:true, denylist: arr });
  });

  app.post("/risk/denylist/remove", adminAuth, async (req: Request, res: Response) => {
    const fs = await import("fs"); const path = await import("path");
    const file = path.resolve(process.cwd(), "data", "denylist.json");
    let arr: string[] = [];
    if (fs.existsSync(file)) arr = JSON.parse(fs.readFileSync(file, "utf-8"));
    const mint = String(req.body?.mint || "").trim();
    if (!mint) return res.status(400).json({ ok:false, error:"mint required" });
    arr = arr.filter(m => m !== mint);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(arr, null, 2), "utf-8");
    res.json({ ok:true, denylist: arr });
  });
}

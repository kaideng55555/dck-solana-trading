// backend-node/src/routes/presets.ts
import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";

type Preset = {
  id: string;
  name?: string;
  filters: any;
  createdAt: number;
  createdBy?: string;
};

const FILE = process.env.PRESETS_FILE || path.join(process.cwd(), "presets.json");
let STORE: Record<string, Preset> = {};
try {
  if (fs.existsSync(FILE)) {
    const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (j && typeof j === "object") STORE = j;
  }
} catch {}

function save() {
  try { fs.writeFileSync(FILE, JSON.stringify(STORE, null, 2), "utf8"); } catch {}
}
function genId() {
  const s = Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-6);
  return s.toLowerCase();
}

export function registerPresetsRoutes(app: Express) {
  // Create
  app.post("/presets", (req: Request, res: Response) => {
    try {
      const { name, filters, id, createdBy } = req.body || {};
      if (!filters || typeof filters !== "object") return res.status(400).json({ error: "filters object required" });
      const pid = (id && String(id)) || genId();
      const preset: Preset = { id: pid, name, filters, createdBy, createdAt: Date.now() };
      STORE[pid] = preset; save();
      res.json({ ok: true, id: pid, preset });
    } catch (e: any) { res.status(500).json({ error: e?.message || "failed to create preset" }); }
  });

  // Read one
  app.get("/presets/:id", (req: Request, res: Response) => {
    const id = String(req.params.id || "");
    const p = STORE[id];
    if (!p) return res.status(404).json({ error: "not found" });
    res.json(p);
  });

  // List
  app.get("/presets", (_req: Request, res: Response) => {
    res.json({ items: Object.values(STORE).sort((a,b)=>b.createdAt-a.createdAt).slice(0,200) });
  });

  // Delete
  app.delete("/presets/:id", (req: Request, res: Response) => {
    const id = String(req.params.id || "");
    if (STORE[id]) { delete STORE[id]; save(); }
    res.json({ ok: true });
  });

  // Dev seeding (optional)
  app.post("/dev/pushPreset", (req: Request, res: Response) => {
    const { name = "preset", filters = {}, id } = req.body || {};
    const pid = (id && String(id)) || genId();
    STORE[pid] = { id: pid, name, filters, createdAt: Date.now(), createdBy: "dev" };
    save();
    res.json({ ok: true, id: pid });
  });
}

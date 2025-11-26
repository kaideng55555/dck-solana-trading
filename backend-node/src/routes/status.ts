// backend-node/src/routes/status.ts
import type { Express, Request, Response, NextFunction } from "express";
import { Connection } from "@solana/web3.js";

// Simple in-memory metrics
const counters: Record<string, number> = {
  http_requests_total: 0,
  http_errors_total: 0,
  ready_checks_total: 0
};

export function registerStatusRoutes(app: Express) {
  // request counter middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    counters.http_requests_total++;
    next();
  });

  const RPC = process.env.RPC_HTTP || process.env.QUICKNODE_RPC || "";

  app.get("/healthz", (_req, res) => {
    res.json({ 
      ok: true, 
      time: new Date().toISOString(), 
      pid: process.pid 
    });
  });

  app.get("/readyz", async (_req, res) => {
    counters.ready_checks_total++;
    const uptime = process.uptime();
    if (uptime < 10) {
      return res.status(503).json({ ready: false, uptime });
    }
    if (!RPC) return res.status(503).json({ ready: false, error: "RPC not configured" });
    const t0 = Date.now();
    try {
      const conn = new Connection(RPC, "confirmed");
      const [epoch, version] = await Promise.all([conn.getEpochInfo(), conn.getVersion()]);
      const ms = Date.now() - t0;
      res.json({
        ready: true,
        rpc: RPC.slice(0, 30) + (RPC.length > 30 ? "…" : ""),
        cluster: (version as any)?.solanaCore || "unknown",
        slot: epoch.absoluteSlot,
        pingMs: ms,
        uptime
      });
    } catch (e: any) {
      counters.http_errors_total++;
      res.status(500).json({ ready: false, error: e?.message || "rpc failed" });
    }
  });

  app.get("/metrics", (_req, res) => {
    res.type("text/plain; version=0.0.4");
    const lines = Object.entries(counters).map(([k, v]) => `${k} ${v}`);
    res.send(lines.join("\n") + "\n");
  });
}

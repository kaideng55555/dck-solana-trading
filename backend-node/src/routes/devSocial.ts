// backend-node/src/routes/devSocial.ts
import type { Express, Request, Response, NextFunction } from "express";
import { setSseHeaders, writeEvent } from '../lib/sse';

type Trend = {
  symbol?: string;
  mint?: string;
  mentions?: number;
  change24h?: number;
  sentiment?: "Positive" | "Neutral" | "Negative" | string;
  score?: number;
  series?: number[];
};

// in-memory store
const store: Map<string, Trend> = new Map();

// SSE clients
type Client = { res: Response; symbols: Set<string> };
const clients: Set<Client> = new Set();

function requireDev(req: Request, res: Response, next: NextFunction) {
  if (process.env.DEV_STREAM === "true") return next();
  return res.status(403).json({ error: "DEV_STREAM is not enabled" });
}

function publish(t: Trend) {
  const key = (t.mint || t.symbol || "").toLowerCase();
  for (const c of clients) {
    if (c.symbols.size && !c.symbols.has(key)) continue;
    try { c.res.write(`data: ${JSON.stringify(t)}\n\n`); } catch {}
  }
}

/** Register DEV social routes */
export function registerDevSocialRoutes(app: Express) {
  // Push/update a trend (POST)
  app.post("/dev/pushSocial", requireDev, (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as Trend;
      const key = String(body.mint || body.symbol || "").toLowerCase();
      if (!key) return res.status(400).json({ error: "mint or symbol required" });
      const prev = store.get(key) || {};
      const next: Trend = {
        symbol: body.symbol ?? prev.symbol,
        mint: body.mint ?? prev.mint,
        mentions: Number(body.mentions ?? prev.mentions ?? 0),
        change24h: body.change24h != null ? Number(body.change24h) : (prev.change24h ?? 0),
        sentiment: body.sentiment ?? prev.sentiment ?? "Neutral",
        score: body.score != null ? Number(body.score) : (prev.score ?? 0),
        series: Array.isArray(body.series) ? body.series : (prev.series ?? []),
      };
      store.set(key, next);
      publish(next);
      res.json({ ok: true, item: next });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "failed to push social" });
    }
  });

  // GET version for quick testing: /dev/pushSocial?symbol=XXX&mentions=123&sentiment=Positive
  app.get("/dev/pushSocial", requireDev, (req: Request, res: Response) => {
    try {
      const q = req.query as any;
      const key = String(q.mint || q.symbol || "").toLowerCase();
      if (!key) return res.status(400).json({ error: "mint or symbol required" });
      const prev = store.get(key) || {};
      const next: Trend = {
        symbol: (q.symbol ?? prev.symbol) as string,
        mint: (q.mint ?? prev.mint) as string,
        mentions: Number(q.mentions ?? prev.mentions ?? 0),
        change24h: q.change24h != null ? Number(q.change24h) : (prev.change24h ?? 0),
        sentiment: (q.sentiment ?? prev.sentiment ?? "Neutral") as any,
        score: q.score != null ? Number(q.score) : (prev.score ?? 0),
        series: prev.series ?? [],
      };
      store.set(key, next);
      publish(next);
      res.json({ ok: true, item: next });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "failed to push social" });
    }
  });

  // Reset store
  app.post("/dev/resetSocial", requireDev, (_req: Request, res: Response) => {
    store.clear();
    res.json({ ok: true });
  });

  // SSE stream of updates
  app.get("/stream/social-dev", (req: Request, res: Response) => {
    const symbols = String(req.query.symbols || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const filters = new Set(symbols);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write(": ping\n\n");
    const client: Client = { res, symbols: filters };
    clients.add(client);
    req.on("close", () => { clients.delete(client); });
  });

  // Social stream - sends synthetic events every 2s
  app.get("/social/stream", (req: Request, res: Response) => {
    setSseHeaders(res);

    const symbols = ['DOGE', 'PEPE', 'BONK', 'WIF', 'POPCAT'];
    const sentiments = ['Positive', 'Neutral', 'Negative'];
    
    let eventId = 0;
    const interval = setInterval(() => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const mentions = Math.floor(Math.random() * 1000) + 100;
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      
      const event = { symbol, mentions, sentiment };
      try {
        writeEvent(res, ++eventId, event);
      } catch {
        clearInterval(interval);
      }
    }, 2000);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // DEV trends endpoint that reads the in-memory store
  app.get("/social/trends/dev", (_req: Request, res: Response) => {
    const items = Array.from(store.values());
    res.json({ window: "dev", items });
  });
}

// backend-node/src/routes/wallet.ts
import type { Express, Request, Response } from "express";

type WalletEvent = {
  action: string;
  amountUi?: number;
  symbol?: string;
  contract?: string;
  valueUsd?: number;
  ts?: number;
  signature?: string;
  wallet?: string;
};

const clients = new Set<Response>();
const watchlist = new Set<string>();

export function getWalletWatchlist() { return watchlist; }
export function publishWalletEvent(ev: WalletEvent) {
  const line = `data: ${JSON.stringify(ev)}\n\n`;
  for (const res of clients) { try { res.write(line); } catch {} }
}

export function registerWalletRoutes(app: Express) {
  app.get("/stream/wallet", (req: Request, res: Response) => {
    const owner = String(req.query.owner || "").trim();
    if (!owner) return res.status(400).end("owner required");
    watchlist.add(owner);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write(": ping\n\n");
    clients.add(res);
    req.on("close", () => { clients.delete(res); });
  });
}

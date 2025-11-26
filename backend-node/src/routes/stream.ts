import type { Express, Request, Response } from 'express';
type TradeEvent = { contract: string; side: 'buy'|'sell'; amountUi: number; priceUi: number; ts: number; wallet?: string };
type Client = { res: Response; filter: Set<string> | null };
const clients: Set<Client> = new Set();
function send(res: Response, data: any) { res.write(`data: ${JSON.stringify(data)}\n\n`); }
export function publishTrade(ev: TradeEvent) {
  for (const c of clients) { if (c.filter && !c.filter.has(ev.contract)) continue; try { send(c.res, ev); } catch {} }
}
export function getContractsWatchlist(): string[] {
  // Return all unique contracts being watched
  const contracts = new Set<string>();
  for (const c of clients) {
    if (c.filter) {
      for (const contract of c.filter) contracts.add(contract);
    }
  }
  return Array.from(contracts);
}
export function registerStreamRoutes(app: Express) {
  app.get('/stream/trades', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream'); res.setHeader('Cache-Control', 'no-cache'); res.setHeader('Connection', 'keep-alive'); (res as any).flushHeaders?.();
    const filterParam = (req.query.contracts as string | undefined)?.trim();
    const filter = filterParam ? new Set(filterParam.split(',').map(s => s.trim()).filter(Boolean)) : null;
    const c: Client = { res, filter }; clients.add(c);
    const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 15000);
    req.on('close', () => { clearInterval(hb); clients.delete(c); });
  });
  app.post('/dev/pushTrade', (req: Request, res: Response) => {
    if (process.env.DEV_STREAM !== 'true') return res.status(403).json({ error: 'disabled' });
    const ev = { ...req.body, ts: Date.now() }; publishTrade(ev as any); res.json({ ok: true });
  });
}

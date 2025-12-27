import type { Express, Request, Response } from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import { analyzeMintCore, getTopHolders, computeSafetyFromHolders } from '../lib/analyzers';
async function fetchJupPrice(mint: string): Promise<{ price?: number }>{ 
  try {
    const ctl = new AbortController(); const id = setTimeout(()=>ctl.abort(), 3500);
    const res = await fetch(`https://price.jup.ag/v6/price?ids=${encodeURIComponent(mint)}`, { signal: ctl.signal });
    clearTimeout(id); if (!res.ok) return {}; const j = await res.json(); const price = j?.data?.[mint]?.price; return { price: typeof price === 'number' ? price : undefined };
  } catch { return {}; }
}
export function registerTokenRoutes(app: Express) {
  const RPC_HTTP = process.env.RPC_HTTP || process.env.QUICKNODE_RPC;
  app.get('/api/token/:mint', async (req: Request, res: Response) => {
    try {
      const { mint } = req.params; if (!mint) return res.status(400).json({ error: 'mint required' });
      if (!RPC_HTTP) return res.status(503).json({ error: 'RPC not configured' });
      const conn = new Connection(RPC_HTTP, 'confirmed'); const mintKey = new PublicKey(mint);
      const core = await analyzeMintCore(conn, mintKey);
      const holders = await getTopHolders(conn, mintKey, Math.min(10, Number(req.query.top || 10) || 10));
      const safety = computeSafetyFromHolders(core, holders);
      const { price } = await fetchJupPrice(mint);
      const marketCap = (price && core?.supplyUi) ? price * core.supplyUi : undefined;
      const resp = {
        name: core?.symbol || mint.slice(0,6),
        symbol: core?.symbol || 'TKN',
        price: price ?? null,
        marketCap: marketCap ?? null,
        bondingPercent: null,
        holders: core?.holdersApprox ?? undefined,
        holdersTop10: holders.map(h => ({ wallet: h.owner, pct: Number((h.uiAmount / (core?.supplyUi || 1)) * 100).toFixed(2) })),
        safety,
      };
      res.json(resp);
    } catch (e:any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });
}

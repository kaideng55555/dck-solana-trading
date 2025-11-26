import type { Express } from 'express';
import { Connection } from '@solana/web3.js';
export function registerHealthRoutes(app: Express) {
  const RPC_HTTP = process.env.RPC_HTTP || process.env.QUICKNODE_RPC;
  app.get('/healthz', (_req, res) => res.json({ ok: true, uptime: process.uptime(), rpc: Boolean(RPC_HTTP) }));
  app.get('/readyz', async (_req, res) => {
    try {
      if (!RPC_HTTP) return res.json({ ok: true, rpc: false });
      const conn = new Connection(RPC_HTTP, 'processed');
      const slot = await conn.getSlot('processed');
      res.json({ ok: true, rpc: true, slot });
    } catch (e:any) { res.status(200).json({ ok: false, error: e?.message || 'RPC probe failed' }); }
  });
}

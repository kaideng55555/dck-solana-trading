import type { Express } from 'express';
import { Connection } from '@solana/web3.js';
export function registerFeeRoutes(app: Express) {
  const RPC_HTTP = process.env.RPC_HTTP || process.env.QUICKNODE_RPC;
  const conn = RPC_HTTP ? new Connection(RPC_HTTP, 'confirmed') : null;
  app.get('/fees/suggest', async (_req, res) => {
    try {
      if (!conn) return res.json({ priorityFeeMicros: 10_000, tipLamports: 50_000, pressure: 1, note: 'No RPC configured' });
      const slotStart = await conn.getSlot('processed');
      const N = 20; const times: (number|null)[] = [];
      for (let i=0;i<N;i++) { try { times.push(await conn.getBlockTime(slotStart - i)); } catch { times.push(null); } }
      const series = times.filter((t): t is number => t !== null);
      const deltas = series.slice(1).map((t,i)=>Math.abs(t - series[i]));
      const avg = deltas.length ? deltas.reduce((a,b)=>a+b,0)/deltas.length : 0.4;
      const pressure = Math.min(3, Math.max(0.5, avg / 0.4));
      const priorityFeeMicros = Math.floor(10_000 * pressure);
      const tipLamports = Math.floor(50_000 * pressure);
      res.json({ priorityFeeMicros, tipLamports, pressure });
    } catch (e:any) { res.json({ priorityFeeMicros: 10_000, tipLamports: 50_000, pressure: 1, error: e?.message }); }
  });
}

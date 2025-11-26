import type { Express } from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import { buildSwapTxBase64 } from '../lib/raydiumV2Wrapper';
type Body = { owner: string; inputMint: string; outputMint: string; amountInAtomic: string; slippageBps: number; priorityFeeMicros?: number; }
export function registerSnipeRoutes(app: Express) {
  const RPC_HTTP = process.env.RPC_HTTP || process.env.QUICKNODE_RPC;
  app.post('/snipe/intent', async (req, res) => {
    try {
      const b = req.body as Body;
      if (!b?.owner || !b?.inputMint || !b?.outputMint || !b?.amountInAtomic || b.slippageBps == null) return res.status(400).json({ error: 'owner,inputMint,outputMint,amountInAtomic,slippageBps required' });
      const conn = new Connection(RPC_HTTP!, 'confirmed');
      const owner = new PublicKey(b.owner);
      const { tx, routeSummary } = await buildSwapTxBase64(conn, owner, b.inputMint, b.outputMint, b.amountInAtomic, Number(b.slippageBps), b.priorityFeeMicros ? Number(b.priorityFeeMicros) : undefined);
      res.json({ tx, routeSummary });
    } catch (e:any) { res.status(500).json({ error: e?.message || 'failed to build tx' }); }
  });
}

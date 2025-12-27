import type { Express } from 'express';
import { VersionedTransaction } from '@solana/web3.js';
export function registerJitoRoutes(app: Express) {
  const JITO_RELAY = process.env.JITO_RELAY || 'https://mainnet.block-engine.jito.wtf';
  let client: any = null;
  app.post('/jito/bundle', async (req, res) => {
    try {
      const { txsB64, tipLamports } = req.body || {};
      if (!Array.isArray(txsB64) || txsB64.length === 0) return res.status(400).json({ error: 'txsB64 required' });
      if (!JITO_RELAY) return res.status(503).json({ error: 'Jito relay not configured' });
      if (!client) {
        const jito = await import('@jito-foundation/jito-ts') as any;
        const { SearcherClient } = jito;
        const kpB64 = process.env.JITO_KEYPAIR_B64;
        const kp = kpB64 ? Buffer.from(kpB64, 'base64') : undefined;
        client = new SearcherClient(JITO_RELAY, kp);
      }
      const txs = txsB64.map((b64: string) => VersionedTransaction.deserialize(Buffer.from(b64, 'base64')));
      const j = await import('@jito-foundation/jito-ts') as any;
      const { Bundle } = j;
      const bundle = new Bundle(txs, Number(tipLamports || 0));
      const result = await client.sendBundle(bundle);
      res.json({ ok: true, bundleId: result?.bundleId || null });
    } catch (e:any) { res.status(500).json({ error: e?.message || 'bundle failed' }); }
  });
}

import type { Express } from 'express';

/**
 * Snipe routes - Quick token sniping (simplified dev mode)
 */
export function registerSnipeRoutes(app: Express) {
  app.post('/snipe/intent', async (req, res) => {
    try {
      const { mint, lamports } = req.body;

      if (!mint) {
        return res.status(400).json({ error: 'Missing mint address' });
      }

      // Dev mode: return synthetic success
      res.json({
        ok: true,
        txId: 'DEV_MODE',
        mint,
        lamports: lamports || 500000,
        timestamp: Date.now(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Snipe failed' });
    }
  });
}

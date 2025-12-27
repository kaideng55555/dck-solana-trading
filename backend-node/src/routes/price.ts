// backend-node/src/routes/price.ts
import type { Express, Request, Response } from 'express';
import { getPrice, getSeries } from '../lib/priceCache';

export function registerPriceRoutes(app: Express) {
  app.get('/api/price/:mint', (req: Request, res: Response) => {
    const { mint } = req.params;
    const p = getPrice(mint);
    res.json(p);
  });

  app.get('/api/price/:mint/series', (req: Request, res: Response) => {
    const { mint } = req.params;
    res.json({ series: getSeries(mint) });
  });
}

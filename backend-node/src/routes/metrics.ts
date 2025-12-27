import type { Express, Request, Response } from 'express';
import client from 'prom-client';
client.collectDefaultMetrics();
const TOKEN = process.env.METRICS_TOKEN || '';
export function registerMetricsRoutes(app: Express) {
  app.get('/metrics', async (req: Request, res: Response) => {
    try {
      if (TOKEN) {
        const auth = (req.headers['authorization'] || '').toString();
        if (!auth.startsWith('Bearer ') || auth.slice(7) !== TOKEN) return res.status(401).send('unauthorized');
      }
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (e:any) { res.status(500).send(e?.message || 'metrics error'); }
  });
}

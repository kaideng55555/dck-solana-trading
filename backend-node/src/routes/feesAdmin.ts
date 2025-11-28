import type { Express, Request, Response, NextFunction } from 'express';
import { setRecordFeeFunc } from '../lib/feesStore.js';

// In-memory fee events store (replace with database in production)
interface FeeEvent {
  ts: number;
  source: string;
  amountLamports: number;
  tx?: string;
  note?: string;
}

const feeEvents: FeeEvent[] = [];

/**
 * Admin middleware - check x-admin-token header
 */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'];
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken || adminToken === 'change-me-super-secret') {
    return res.status(500).json({ error: 'Admin token not configured' });
  }

  if (token !== adminToken) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  next();
}

/**
 * Record a fee event (can be called internally or via API)
 */
export function recordFee(event: FeeEvent): void {
  feeEvents.push({
    ...event,
    ts: event.ts || Date.now(),
  });
  
  // Keep only last 10,000 events in memory
  if (feeEvents.length > 10000) {
    feeEvents.shift();
  }
}

/**
 * Admin fees routes - protected endpoints for fee management
 */
export function registerAdminFeesRoutes(app: Express) {
  // Set up the fee recording function for use across the app
  setRecordFeeFunc(recordFee);

  /**
   * POST /admin/fees/record - Record a new fee event
   */
  app.post('/admin/fees/record', requireAdmin, (req: Request, res: Response) => {
    const { source, amountLamports, tx, note } = req.body;

    if (!source || typeof amountLamports !== 'number') {
      return res.status(400).json({ error: 'Missing required fields: source, amountLamports' });
    }

    const event: FeeEvent = {
      ts: Date.now(),
      source,
      amountLamports,
      tx,
      note,
    };

    recordFee(event);

    res.json({ ok: true, event });
  });

  /**
   * GET /admin/fees/events - Get fee events with optional filtering
   */
  app.get('/admin/fees/events', requireAdmin, (req: Request, res: Response) => {
    const { start, end, source, limit } = req.query;
    
    let filtered = [...feeEvents];

    // Filter by time range
    if (start) {
      const startTs = Number(start);
      filtered = filtered.filter(e => e.ts >= startTs);
    }
    if (end) {
      const endTs = Number(end);
      filtered = filtered.filter(e => e.ts <= endTs);
    }

    // Filter by source
    if (source) {
      filtered = filtered.filter(e => e.source === source);
    }

    // Limit results
    const maxLimit = Number(limit) || 1000;
    filtered = filtered.slice(-maxLimit);

    res.json({
      events: filtered,
      total: filtered.length,
    });
  });

  /**
   * GET /admin/fees/stats - Get aggregated fee statistics
   */
  app.get('/admin/fees/stats', requireAdmin, (req: Request, res: Response) => {
    const { period } = req.query;
    const periodMs = period === '24h' ? 24 * 60 * 60 * 1000 : 
                     period === '7d' ? 7 * 24 * 60 * 60 * 1000 : 
                     period === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                     24 * 60 * 60 * 1000; // default 24h

    const cutoff = Date.now() - periodMs;
    const recentEvents = feeEvents.filter(e => e.ts >= cutoff);

    // Aggregate by source
    const bySource: Record<string, { count: number; totalLamports: number }> = {};
    let totalLamports = 0;

    recentEvents.forEach(event => {
      if (!bySource[event.source]) {
        bySource[event.source] = { count: 0, totalLamports: 0 };
      }
      bySource[event.source].count++;
      bySource[event.source].totalLamports += event.amountLamports;
      totalLamports += event.amountLamports;
    });

    // Convert to SOL for readability
    const totalSol = totalLamports / 1e9;
    const bySourceSol: Record<string, { count: number; totalSol: number }> = {};
    Object.keys(bySource).forEach(source => {
      bySourceSol[source] = {
        count: bySource[source].count,
        totalSol: bySource[source].totalLamports / 1e9,
      };
    });

    res.json({
      period: period || '24h',
      totalEvents: recentEvents.length,
      totalLamports,
      totalSol,
      bySource: bySourceSol,
    });
  });

  /**
   * DELETE /admin/fees/events - Clear all fee events
   */
  app.delete('/admin/fees/events', requireAdmin, (req: Request, res: Response) => {
    const count = feeEvents.length;
    feeEvents.length = 0;
    res.json({ ok: true, cleared: count });
  });
}

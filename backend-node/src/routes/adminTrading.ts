import type { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

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
 * Parse ALLOWED_WALLETS from env
 */
function parseWallets(v?: string): string[] {
  return (v || '').split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Admin trading control routes
 */
export function registerAdminTradingRoutes(app: Express) {
  /**
   * GET /admin/trading/config - Get current trading configuration
   */
  app.get('/admin/trading/config', requireAdmin, (req: Request, res: Response) => {
    const config = {
      tradingPublic: process.env.TRADING_PUBLIC === '1',
      allowedWallets: parseWallets(process.env.ALLOWED_WALLETS),
      minLiqUsd: Number(process.env.MIN_LIQ_USD || 3000),
      minTokenAgeMinutes: Number(process.env.MIN_TOKEN_AGE_MINUTES || 20),
      maxTaxPct: Number(process.env.MAX_TAX_PCT || 10),
    };
    res.json(config);
  });

  /**
   * POST /admin/trading/toggle - Toggle trading public/private
   * Body: { public: boolean }
   */
  app.post('/admin/trading/toggle', requireAdmin, (req: Request, res: Response) => {
    const { public: isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid "public" field' });
    }

    // Update in-memory env var (restart required for persistence)
    process.env.TRADING_PUBLIC = isPublic ? '1' : '0';

    res.json({
      ok: true,
      tradingPublic: isPublic,
      message: isPublic ? 'Trading opened to public' : 'Trading restricted to allowlist',
      note: 'Restart server or update .env for persistence'
    });
  });

  /**
   * POST /admin/trading/wallets/add - Add wallet to allowlist
   * Body: { wallet: string }
   */
  app.post('/admin/trading/wallets/add', requireAdmin, (req: Request, res: Response) => {
    const { wallet } = req.body;

    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid wallet address' });
    }

    const wallets = parseWallets(process.env.ALLOWED_WALLETS);
    
    if (wallets.includes(wallet)) {
      return res.status(400).json({ error: 'Wallet already in allowlist' });
    }

    wallets.push(wallet);
    process.env.ALLOWED_WALLETS = wallets.join(',');

    res.json({
      ok: true,
      wallet,
      allowedWallets: wallets,
      note: 'Restart server or update .env for persistence'
    });
  });

  /**
   * POST /admin/trading/wallets/remove - Remove wallet from allowlist
   * Body: { wallet: string }
   */
  app.post('/admin/trading/wallets/remove', requireAdmin, (req: Request, res: Response) => {
    const { wallet } = req.body;

    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid wallet address' });
    }

    const wallets = parseWallets(process.env.ALLOWED_WALLETS);
    const filtered = wallets.filter(w => w !== wallet);

    if (filtered.length === wallets.length) {
      return res.status(404).json({ error: 'Wallet not found in allowlist' });
    }

    process.env.ALLOWED_WALLETS = filtered.join(',');

    res.json({
      ok: true,
      wallet,
      allowedWallets: filtered,
      note: 'Restart server or update .env for persistence'
    });
  });

  /**
   * POST /admin/trading/limits - Update trading limits
   * Body: { minLiqUsd?, minTokenAgeMinutes?, maxTaxPct? }
   */
  app.post('/admin/trading/limits', requireAdmin, (req: Request, res: Response) => {
    const { minLiqUsd, minTokenAgeMinutes, maxTaxPct } = req.body;

    if (minLiqUsd !== undefined) {
      process.env.MIN_LIQ_USD = String(minLiqUsd);
    }
    if (minTokenAgeMinutes !== undefined) {
      process.env.MIN_TOKEN_AGE_MINUTES = String(minTokenAgeMinutes);
    }
    if (maxTaxPct !== undefined) {
      process.env.MAX_TAX_PCT = String(maxTaxPct);
    }

    res.json({
      ok: true,
      limits: {
        minLiqUsd: Number(process.env.MIN_LIQ_USD),
        minTokenAgeMinutes: Number(process.env.MIN_TOKEN_AGE_MINUTES),
        maxTaxPct: Number(process.env.MAX_TAX_PCT),
      },
      note: 'Restart server or update .env for persistence'
    });
  });
}

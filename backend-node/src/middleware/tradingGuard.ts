import type { Request, Response, NextFunction } from 'express';
import { getRuntimeConfig } from '../lib/runtimeConfig.js';

/**
 * Trading guard middleware - restricts access to trading endpoints
 * 
 * Access is granted if any of the following are true:
 * 1. Valid x-admin-token header matches ADMIN_TOKEN env var
 * 2. TRADING_PUBLIC=1 in runtime config (open to everyone)
 * 3. x-wallet header is in ALLOWED_WALLETS runtime config
 * 
 * Otherwise returns 403 Forbidden
 */
export function tradingGuard(req: Request, res: Response, next: NextFunction) {
  // 1. Allow admin override
  const adminToken = req.header('x-admin-token');
  if (adminToken && adminToken === process.env.ADMIN_TOKEN) {
    return next();
  }

  const config = getRuntimeConfig();

  // 2. Check if trading is public
  if (config.TRADING_PUBLIC) {
    return next();
  }

  // 3. Check wallet allowlist
  const allowedWallets = new Set(config.ALLOWED_WALLETS);
  const wallet = (req.header('x-wallet') || '').trim();
  
  if (!wallet || !allowedWallets.has(wallet)) {
    return res.status(403).json({ 
      ok: false, 
      error: 'Closed beta: wallet not allowlisted' 
    });
  }

  next();
}

/**
 * Risk guard middleware - validates trading safety limits
 * 
 * Checks token meets minimum requirements:
 * - Liquidity >= MIN_LIQ_USD
 * - Age >= MIN_TOKEN_AGE_MINUTES
 * - Tax <= MAX_TAX_PCT
 * 
 * Note: Currently a placeholder - implement full risk checks as needed
 */
export function riskGuard(req: Request, res: Response, next: NextFunction) {
  const config = getRuntimeConfig();
  
  // TODO: Implement actual risk checks against token data
  // For now, just log the safety limits and pass through
  console.log('🛡️ Risk guard limits:', {
    MIN_LIQ_USD: config.MIN_LIQ_USD,
    MIN_TOKEN_AGE_MINUTES: config.MIN_TOKEN_AGE_MINUTES,
    MAX_TAX_PCT: config.MAX_TAX_PCT
  });
  
  next();
}

import type { Express, RequestHandler } from 'express';
import { computeRisk } from '../lib/xme/risk.js';
import { getRuntimeConfig } from '../lib/runtimeConfig.js';

/**
 * Snipe routes - Quick token sniping and selling (simplified dev mode)
 * Protected by tradingGuard middleware
 */
export function registerSnipeRoutes(app: Express, guards?: RequestHandler[]) {
  const middleware = guards ? guards : [];

  /**
   * POST /snipe/intent - Buy token
   * Headers:
   *   x-wallet: base58 wallet pubkey (required if not in allowlist)
   *   x-admin-token: admin override (optional)
   * 
   * Body:
   *   mint: string - Token mint address
   *   lamports: number - Amount to spend in lamports
   *   skipRisk?: boolean - Skip risk check (admin only)
   */
  app.post('/snipe/intent', ...middleware, async (req, res) => {
    try {
      const { mint, lamports, skipRisk } = req.body;

      if (!mint) {
        return res.status(400).json({ error: 'Missing mint address' });
      }

      // Check if admin is skipping risk check
      const isAdmin = req.header('x-admin-token') === process.env.ADMIN_TOKEN;
      const shouldCheckRisk = !skipRisk || !isAdmin;

      // Perform risk check
      if (shouldCheckRisk) {
        console.log('🛡️ Running risk check for', mint.slice(0, 8) + '...');
        
        const riskResult = await computeRisk(mint);
        
        if (!riskResult.ok) {
          return res.status(500).json({
            ok: false,
            error: 'Risk check failed',
            details: riskResult.error,
          });
        }

        const { score, label, reasons, factors } = riskResult;
        const config = getRuntimeConfig();

        // Reject if score is below minimum threshold
        if (score < config.MIN_RISK_SCORE) {
          return res.status(403).json({
            ok: false,
            error: `Token risk too high (score: ${score}, minimum: ${config.MIN_RISK_SCORE})`,
            risk: {
              score,
              label,
              reasons,
            },
          });
        }

        // Reject if critical issues exist
        const criticalReasons = reasons.filter((r: string) => 
          r.includes('Denylist') || 
          r.includes('Mint authority') ||
          r.includes('Liquidity below minimum')
        );

        if (criticalReasons.length > 0) {
          return res.status(403).json({
            ok: false,
            error: 'Critical risk factors detected',
            risk: {
              score,
              label,
              reasons: criticalReasons,
            },
          });
        }

        // Warn if liquidity is below admin minimum
        if (factors.liquidityUsd < config.MIN_LIQ_USD) {
          console.warn(`⚠️ Liquidity below minimum: $${factors.liquidityUsd} < $${config.MIN_LIQ_USD}`);
        }

        console.log(`✅ Risk check passed: ${label} (${score}/100)`);
      }

      // Dev mode: return synthetic success
      res.json({
        ok: true,
        txId: 'DEV_MODE_BUY',
        mint,
        lamports: lamports || 500000,
        timestamp: Date.now(),
      });
    } catch (e: any) {
      console.error('❌ Snipe intent error:', e);
      res.status(500).json({ error: e?.message || 'Snipe failed' });
    }
  });

  /**
   * POST /sell/intent - Sell token
   * Headers:
   *   x-wallet: base58 wallet pubkey (required if not in allowlist)
   *   x-admin-token: admin override (optional)
   */
  app.post('/sell/intent', ...middleware, async (req, res) => {
    try {
      const { mint, amount } = req.body;

      if (!mint) {
        return res.status(400).json({ error: 'Missing mint address' });
      }

      // Dev mode: return synthetic success
      res.json({
        ok: true,
        txId: 'DEV_MODE_SELL',
        mint,
        amount: amount || 'all',
        timestamp: Date.now(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Sell failed' });
    }
  });
}

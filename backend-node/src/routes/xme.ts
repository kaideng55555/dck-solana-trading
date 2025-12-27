import type { Express, Request, Response } from 'express';
import { fetchNormalizedTokens, type NormalizedToken } from '../lib/xme/dexScreener.js';
import { getSwapQuoteAndTransaction } from '../lib/xme/jupiter.js';

// Cache for tokens
let cachedTokens: NormalizedToken[] = [];
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

// Track known tokens for new pairs stream
let knownMints = new Set<string>();

/**
 * Register XME (Expanded Mind Engine) routes
 */
export function registerXmeRoutes(app: Express) {
  /**
   * GET /xme/tokens?limit=100
   * 
   * Returns all SOL pairs from DexScreener, de-duplicated and normalized
   * 
   * Query params:
   * - limit: Max number of tokens to return (default: 100)
   * - minLiquidity: Minimum liquidity in USD (default: 0)
   * - sortBy: Sort field (liquidity, volume24h, marketCap, createdAt) (default: liquidity)
   * - sortOrder: asc or desc (default: desc)
   */
  app.get('/xme/tokens', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit || 100), 1000);
      const minLiquidity = Number(req.query.minLiquidity || 0);
      const sortBy = (req.query.sortBy as string) || 'liquidity';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      // Use cache if fresh
      const now = Date.now();
      if (cachedTokens.length > 0 && now - lastFetch < CACHE_TTL) {
        const filtered = filterAndSortTokens(cachedTokens, minLiquidity, sortBy, sortOrder, limit);
        return res.json({
          ok: true,
          tokens: filtered,
          total: cachedTokens.length,
          cached: true,
          age: Math.floor((now - lastFetch) / 1000),
        });
      }

      // Fetch fresh data
      console.log('🔄 Fetching fresh tokens from DexScreener...');
      const tokens = await fetchNormalizedTokens();
      
      cachedTokens = tokens;
      lastFetch = now;

      // Update known mints for new pairs stream
      knownMints = new Set(tokens.map(t => t.mint));

      const filtered = filterAndSortTokens(tokens, minLiquidity, sortBy, sortOrder, limit);

      res.json({
        ok: true,
        tokens: filtered,
        total: tokens.length,
        cached: false,
      });
    } catch (error: any) {
      console.error('❌ /xme/tokens error:', error);
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to fetch tokens',
      });
    }
  });

  /**
   * GET /xme/stream/newpairs
   * 
   * SSE stream of newly appearing tokens (polled and diffed)
   * 
   * Sends events when new mints are discovered that weren't in the previous fetch
   */
  app.get('/xme/stream/newpairs', async (req: Request, res: Response) => {
    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log('📡 New pairs stream client connected');

    // Send initial ping
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    // Poll for new pairs every 30 seconds
    const interval = setInterval(async () => {
      try {
        const tokens = await fetchNormalizedTokens();
        const newTokens = tokens.filter(t => !knownMints.has(t.mint));

        if (newTokens.length > 0) {
          console.log(`🆕 Found ${newTokens.length} new pairs`);
          
          // Update known mints
          newTokens.forEach(t => knownMints.add(t.mint));

          // Send new tokens to client
          res.write(`data: ${JSON.stringify({ 
            type: 'newpairs', 
            tokens: newTokens,
            timestamp: Date.now() 
          })}\n\n`);
        } else {
          // Send heartbeat
          res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
        }
      } catch (error: any) {
        console.error('❌ New pairs stream error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      }
    }, 30000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(interval);
      console.log('📡 New pairs stream client disconnected');
    });
  });

  /**
   * POST /xme/trade/quote
   * 
   * Get Jupiter quote + swap transaction for client signing
   * 
   * Body: {
   *   inputMint: string,      // Token to sell (use SOL mint for buying with SOL)
   *   outputMint: string,     // Token to buy (use SOL mint for selling to SOL)
   *   amount: number,         // Amount in smallest unit (lamports for SOL)
   *   slippageBps?: number,   // Slippage in basis points (default: 50 = 0.5%)
   *   userPublicKey: string   // User's wallet public key
   * }
   * 
   * Response: {
   *   ok: true,
   *   quote: JupiterQuote,
   *   swapTransaction: string  // Base64 encoded transaction for client signing
   * }
   */
  app.post('/xme/trade/quote', async (req: Request, res: Response) => {
    try {
      const { inputMint, outputMint, amount, slippageBps, userPublicKey } = req.body;

      // Validate inputs
      if (!inputMint || !outputMint || !amount || !userPublicKey) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required fields: inputMint, outputMint, amount, userPublicKey',
        });
      }

      console.log('💱 Getting swap quote:', {
        inputMint: inputMint.slice(0, 8) + '...',
        outputMint: outputMint.slice(0, 8) + '...',
        amount,
        user: userPublicKey.slice(0, 8) + '...',
      });

      const result = await getSwapQuoteAndTransaction({
        inputMint,
        outputMint,
        amount,
        slippageBps: slippageBps || 50,
        userPublicKey,
      });

      if (!result) {
        return res.status(500).json({
          ok: false,
          error: 'Failed to get quote from Jupiter',
        });
      }

      res.json({
        ok: true,
        quote: result.quote,
        swapTransaction: result.swapTransaction,
      });
    } catch (error: any) {
      console.error('❌ /xme/trade/quote error:', error);
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get trade quote',
      });
    }
  });

  console.log('✅ XME routes registered');
}

/**
 * Helper: Filter and sort tokens
 */
function filterAndSortTokens(
  tokens: NormalizedToken[],
  minLiquidity: number,
  sortBy: string,
  sortOrder: string,
  limit: number
): NormalizedToken[] {
  // Filter by minimum liquidity
  let filtered = tokens.filter(t => t.liquidity >= minLiquidity);

  // Sort
  const sortField = sortBy as keyof NormalizedToken;
  filtered.sort((a, b) => {
    const aVal = a[sortField] as number;
    const bVal = b[sortField] as number;
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Limit
  return filtered.slice(0, limit);
}

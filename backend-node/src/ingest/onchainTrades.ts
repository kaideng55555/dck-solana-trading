// backend-node/src/ingest/onchainTrades.ts
import { Connection } from '@solana/web3.js';
import { getContractsWatchlist, publishTrade } from '../routes/stream';
import { setPrice } from '../lib/priceCache';

const WSOL = 'So11111111111111111111111111111111111111112';
// Default stable mints (can override with STABLE_MINTS env, comma-separated)
const DEFAULT_STABLES = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT
];
function stableList(): string[] {
  const env = (process.env.STABLE_MINTS || '').split(',').map(s => s.trim()).filter(Boolean);
  return env.length ? env : DEFAULT_STABLES;
}

type BalanceDelta = { mint: string; amountUi: number };

function computeTokenDeltas(pre: any[], post: any[]): BalanceDelta[] {
  const map: Record<string, number> = {};
  for (const b of pre || []) {
    const mint = b.mint as string; const amt = Number(b.uiTokenAmount?.uiAmount || 0);
    map[mint] = (map[mint] || 0) - amt;
  }
  for (const b of post || []) {
    const mint = b.mint as string; const amt = Number(b.uiTokenAmount?.uiAmount || 0);
    map[mint] = (map[mint] || 0) + amt;
  }
  return Object.entries(map).map(([mint, amountUi]) => ({ mint, amountUi }));
}

export async function startOnchainTradeIngest(conn: Connection) {
  if (process.env.TRADE_INGEST !== 'on') return;
  console.log('[ingest] on-chain trade ingest enabled');
  const stables = new Set(stableList());

  conn.onLogs('all', async (ln) => {
    try {
      const wl = getContractsWatchlist(); if (wl.size === 0) return;
      const sig = ln.signature;
      const tx = await conn.getTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' as any });
      if (!tx) return;

      const pre = (tx.meta as any)?.preTokenBalances || [];
      const post = (tx.meta as any)?.postTokenBalances || [];
      const deltas = computeTokenDeltas(pre, post);
      if (!deltas.length) return;

      const mintSet = new Set(deltas.map(d => d.mint));
      const interested = [...wl].filter(m => mintSet.has(m));
      if (!interested.length) return;

      // detect reference quote: stable or WSOL
      let quoteMint: string | null = null;
      for (const d of deltas) { if (stables.has(d.mint)) { quoteMint = d.mint; break; } }
      if (!quoteMint && mintSet.has(WSOL)) quoteMint = WSOL;

      // If no quote detected, still emit amount-only events with price 0
      for (const m of interested) {
        const d = deltas.find(x => x.mint === m); if (!d) continue;
        const amountUi = Math.abs(d.amountUi); if (amountUi <= 0) continue;

        let priceUi = 0;
        let side: 'buy'|'sell' = 'buy';
        if (quoteMint) {
          const q = deltas.find(x => x.mint === quoteMint)?.amountUi || 0;
          if (q !== 0) {
            const quoteAbs = Math.abs(q);
            priceUi = quoteAbs / amountUi;
            // side heuristic: if quote decreased, user paid quote to acquire token
            side = (q < 0) ? 'buy' : 'sell';
          }
        }

        publishTrade({ contract: m, side, amountUi, priceUi, ts: Date.now() });
        if (priceUi > 0) setPrice(m, priceUi);
      }
    } catch {}
  });
}

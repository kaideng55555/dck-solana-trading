// backend-node/src/ingest/onchainWallet.ts
import { Connection } from "@solana/web3.js";
import { getWalletWatchlist, publishWalletEvent } from "../routes/wallet";

const WSOL = "So11111111111111111111111111111111111111112";
const DEFAULT_STABLES = [
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
];
function stableList(): string[] {
  const env = (process.env.STABLE_MINTS || "").split(",").map(s => s.trim()).filter(Boolean);
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

export async function startOnchainWalletIngest(conn: Connection) {
  if (process.env.WALLET_INGEST !== "on") return;
  console.log("[ingest] wallet activity ingest enabled");
  const stables = new Set(stableList());

  conn.onLogs("all", async (ln) => {
    try {
      const wl = getWalletWatchlist(); if (wl.size === 0) return;
      const sig = ln.signature;
      const tx = await conn.getTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" as any });
      if (!tx) return;

      const signers: string[] = tx.transaction.message.staticAccountKeys.slice(0, (tx.transaction.message as any).header.numRequiredSignatures).map(k => k.toBase58());
      const inWatch = signers.find(s => wl.has(s));
      if (!inWatch) return;

      const pre = (tx.meta as any)?.preTokenBalances || [];
      const post = (tx.meta as any)?.postTokenBalances || [];
      const deltas = computeTokenDeltas(pre, post);
      if (!deltas.length) return;

      const mintSet = new Set(deltas.map(d => d.mint));
      let quoteMint: string | null = null;
      for (const d of deltas) { if (stables.has(d.mint)) { quoteMint = d.mint; break; } }
      if (!quoteMint && mintSet.has(WSOL)) quoteMint = WSOL;
      const qDelta = quoteMint ? (deltas.find(x => x.mint === quoteMint)?.amountUi || 0) : 0;

      for (const d of deltas) {
        if (quoteMint && d.mint === quoteMint) continue;
        const amountUi = Math.abs(d.amountUi);
        if (amountUi <= 0) continue;
        const valueUsd = (quoteMint && qDelta !== 0) ? Math.abs(qDelta) : 0;
        const side = d.amountUi > 0 ? "BUY" : "SELL";
        publishWalletEvent({
          action: side,
          amountUi,
          symbol: undefined,
          contract: d.mint,
          valueUsd,
          ts: Date.now(),
          signature: sig,
          wallet: inWatch
        });
      }
    } catch {}
  });
}

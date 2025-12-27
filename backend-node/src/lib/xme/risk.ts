// backend-node/src/lib/xme/risk.ts
import fetch from "node-fetch";
import { Connection, PublicKey } from "@solana/web3.js";

export type RiskResult = {
  ok: boolean;
  mint: string;
  score: number;                // 0..100 higher = safer
  label: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  factors: Record<string, any>;
  info: {
    decimals?: number;
    supply?: number;
    mintAuthority?: string | null;
    freezeAuthority?: string | null;
    holdersApprox?: number;
    liquidityUsd?: number;
    marketCap?: number;
    ageMinutes?: number;
    bestPair?: string | null;
    buyratio5m?: number | null;
  };
};

// Simple TTL cache
type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<RiskResult>>();
const TTL_MS = Number(process.env.XME_RISK_TTL_MS || 20_000);

function getConn(): Connection {
  const url = process.env.QUICKNODE_RPC || process.env.RPC_HTTP || "https://api.mainnet-beta.solana.com";
  return new Connection(url, "confirmed");
}

async function getMintParsed(mint: string){
  const conn = getConn();
  const pubkey = new PublicKey(mint);
  const acc = await conn.getParsedAccountInfo(pubkey, "confirmed");
  const parsed: any = (acc.value as any)?.data?.parsed?.info || null;
  if (!parsed) return null;
  return {
    decimals: parsed.decimals,
    supply: Number(parsed.supply || 0),
    mintAuthority: parsed.mintAuthority || null,
    freezeAuthority: parsed.freezeAuthority || null,
  };
}

async function getHoldersApprox(mint: string){
  const conn = getConn();
  const pubkey = new PublicKey(mint);
  const resp = await conn.getTokenLargestAccounts(pubkey, "confirmed");
  // Count accounts with > 0 balance, capped to 10k for sanity
  const cnt = (resp.value || []).filter(v => (v.uiAmount || 0) > 0).length;
  return cnt;
}

async function fetchDexForToken(mint: string){
  const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("dexscreener token http "+r.status);
  const j = await r.json();
  const pairs = (j.pairs || []) as any[];
  if (!pairs.length) return null;
  // pick best by liquidity USD
  let best = pairs[0];
  for (const p of pairs){
    const liq = Number(p?.liquidity?.usd || 0);
    const bestL = Number(best?.liquidity?.usd || 0);
    if (liq > bestL) best = p;
  }
  const now = Date.now();
  const createdAt = Number(best?.pairCreatedAt || best?.createdAt || 0);
  // compute buys/sells last 5m if available
  let buys5m = Number(best?.txns?.m5?.buys || 0);
  let sells5m = Number(best?.txns?.m5?.sells || 0);
  let buyratio5m = null as number | null;
  if ((buys5m + sells5m) > 0) buyratio5m = buys5m / (buys5m + sells5m);

  return {
    liquidityUsd: Number(best?.liquidity?.usd || 0),
    marketCap: Number(best?.fdv || best?.marketCap || 0),
    ageMinutes: createdAt ? Math.max(0, Math.round((now - createdAt) / 60000)) : undefined,
    bestPair: String(best?.pairAddress || ""),
    buyratio5m,
  };
}

function clamp(n: number, lo=0, hi=100){ return Math.max(lo, Math.min(hi, n)); }
function label(score: number): "LOW"|"MEDIUM"|"HIGH" {
  if (score >= 70) return "LOW";
  if (score >= 40) return "MEDIUM";
  return "HIGH";
}

function applyDeductions(base: number, reasons: string[], amount: number, reason: string){
  if (amount <= 0) return base;
  reasons.push(reason+` (-${amount})`);
  return base - amount;
}

export async function computeRisk(mint: string): Promise<RiskResult> {
  const key = `risk:${mint}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value;

  const reasons: string[] = [];
  let score = 100;
  const fx: Record<string, any> = {};

  // denylist
  let deny = false;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const file = path.resolve(process.cwd(), "data", "denylist.json");
    if (fs.existsSync(file)) {
      const arr = JSON.parse(fs.readFileSync(file,"utf-8"));
      if (Array.isArray(arr) && arr.includes(mint)) {
        deny = true;
      }
    }
  } catch {}

  // On-chain mint info
  let parsed = null as any;
  try { parsed = await getMintParsed(mint); } catch {}
  if (parsed){
    fx.decimals = parsed.decimals;
    fx.supply = parsed.supply;
    fx.mintAuthority = parsed.mintAuthority || null;
    fx.freezeAuthority = parsed.freezeAuthority || null;
    if (parsed.mintAuthority) score = applyDeductions(score, reasons, 25, "Mint authority present (can mint more)");
    if (parsed.freezeAuthority) score = applyDeductions(score, reasons, 15, "Freeze authority present");
  } else {
    score = applyDeductions(score, reasons, 5, "Mint parsed info unavailable");
  }

  // Holders approx
  try {
    const holders = await getHoldersApprox(mint);
    fx.holdersApprox = holders;
    if (holders < 50) score = applyDeductions(score, reasons, 10, "Very few holders");
    else if (holders < 200) score = applyDeductions(score, reasons, 5, "Low holder count");
  } catch {
    score = applyDeductions(score, reasons, 3, "Holders info unavailable");
  }

  // Dex info
  try {
    const dex = await fetchDexForToken(mint);
    if (dex){
      fx.liquidityUsd = dex.liquidityUsd;
      fx.marketCap = dex.marketCap;
      fx.ageMinutes = dex.ageMinutes;
      fx.bestPair = dex.bestPair;
      fx.buyratio5m = dex.buyratio5m;
      // Liquidity thresholds
      const minLiq = Number(process.env.MIN_LIQ_USD || "0");
      if (dex.liquidityUsd < 1000) score = applyDeductions(score, reasons, 40, "Very low liquidity (<$1k)");
      else if (dex.liquidityUsd < 3000) score = applyDeductions(score, reasons, 25, "Low liquidity (<$3k)");
      else if (dex.liquidityUsd < 10000) score = applyDeductions(score, reasons, 10, "Moderate liquidity (<$10k)");
      if (minLiq && dex.liquidityUsd < minLiq) score = applyDeductions(score, reasons, 10, `Below admin min liquidity (<$${minLiq})`);
      // Age thresholds
      if (typeof dex.ageMinutes === "number"){
        if (dex.ageMinutes < 10) score = applyDeductions(score, reasons, 30, "Very new token (<10m)");
        else if (dex.ageMinutes < 60) score = applyDeductions(score, reasons, 15, "New token (<60m)");
        const minAge = Number(process.env.MIN_TOKEN_AGE_MINUTES || "0");
        if (minAge && dex.ageMinutes < minAge) score = applyDeductions(score, reasons, 10, `Below admin min age (<${minAge}m)`);
      }
      // Honeypot suspicion (no sells, many buys in 5m)
      if (typeof dex.buyratio5m === "number"){
        if (dex.buyratio5m >= 0.95) score = applyDeductions(score, reasons, 20, "Buy pressure extremely high; sells near zero (honeypot risk)");
      }
    } else {
      score = applyDeductions(score, reasons, 5, "No DEX data available");
    }
  } catch {
    score = applyDeductions(score, reasons, 5, "DEX lookup failed");
  }

  if (deny){
    reasons.push("Denylisted token");
    score = 0;
  }

  score = clamp(score, 0, 100);
  const res: RiskResult = {
    ok: true,
    mint,
    score,
    label: label(score),
    reasons,
    factors: fx,
    info: {
      decimals: fx.decimals,
      supply: fx.supply,
      mintAuthority: fx.mintAuthority,
      freezeAuthority: fx.freezeAuthority,
      holdersApprox: fx.holdersApprox,
      liquidityUsd: fx.liquidityUsd,
      marketCap: fx.marketCap,
      ageMinutes: fx.ageMinutes,
      bestPair: fx.bestPair || null,
      buyratio5m: fx.buyratio5m ?? null,
    }
  };

  cache.set(key, { value: res, expires: now + TTL_MS });
  return res;
}

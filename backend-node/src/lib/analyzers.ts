// backend-node/src/lib/analyzers.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";

export type RiskHints = {
  lpLockedPct?: number;
  swappable?: boolean;
  ageHours?: number;
  bondingPercent?: number;
};

export type OnchainFacts = {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  supplyUi: number;
  decimals: number;
  top10SharePct: number | null; // 0..100 (null if unknown)
};

export type SafetyBreakdown = {
  base: number;
  ownership: number;
  holders: number;
  liquidity: number;
  bonding: number;
  age: number;
  clamp: number;
};

export type SafetyResult = {
  mint: string;
  facts: OnchainFacts;
  hints: RiskHints;
  safetyScore: number;      // 0..100 (higher = safer)
  riskLevel: "high" | "medium" | "low";
  breakdown: SafetyBreakdown;
};

export async function fetchOnchainFacts(conn: Connection, mintStr: string): Promise<OnchainFacts> {
  const mint = new PublicKey(mintStr);
  const m = await getMint(conn, mint);
  const decimals = Number(m.decimals);
  const supply = Number(m.supply) / Math.pow(10, decimals);
  // If supply is zero, top holders are meaningless
  let top10SharePct: number | null = null;
  try {
    const largest = await conn.getTokenLargestAccounts(mint);
    if (largest && largest.value?.length && supply > 0) {
      const top = largest.value.slice(0, 10).reduce((acc, item) => acc + Number(item.uiAmount || 0), 0);
      top10SharePct = Math.max(0, Math.min(100, (top / supply) * 100));
    }
  } catch {}
  return {
    mintAuthority: m.mintAuthority ? m.mintAuthority.toBase58() : null,
    freezeAuthority: m.freezeAuthority ? m.freezeAuthority.toBase58() : null,
    supplyUi: supply,
    decimals,
    top10SharePct,
  };
}

export function computeSafetyScore(facts: OnchainFacts, hints: RiskHints = {}): { score: number; breakdown: SafetyBreakdown; level: "high"|"medium"|"low" } {
  // Start from a neutral baseline
  let score = 50;
  const breakdown: SafetyBreakdown = { base: 50, ownership: 0, holders: 0, liquidity: 0, bonding: 0, age: 0, clamp: 0 };

  // Ownership controls (max +40)
  const mintRenounced = facts.mintAuthority === null;
  const freezeRenounced = facts.freezeAuthority === null;
  if (mintRenounced) { score += 25; breakdown.ownership += 25; } else { score -= 10; breakdown.ownership -= 10; }
  if (freezeRenounced) { score += 15; breakdown.ownership += 15; } else { score -= 5; breakdown.ownership -= 5; }

  // Holder concentration (max +20, min -20)
  const h10 = facts.top10SharePct;
  if (h10 != null) {
    if (h10 <= 20) { score += 20; breakdown.holders += 20; }
    else if (h10 <= 40) { score += 10; breakdown.holders += 10; }
    else if (h10 <= 60) { /* neutral */ }
    else if (h10 <= 80) { score -= 10; breakdown.holders -= 10; }
    else { score -= 20; breakdown.holders -= 20; }
  }

  // Liquidity / swappability / LP locks (max +10, min -20)
  if (hints.swappable === true) { score += 10; breakdown.liquidity += 10; }
  if (hints.swappable === false) { score -= 20; breakdown.liquidity -= 20; }
  if (typeof hints.lpLockedPct === "number") {
    if (hints.lpLockedPct >= 80) { score += 10; breakdown.liquidity += 10; }
    else if (hints.lpLockedPct >= 50) { score += 5; breakdown.liquidity += 5; }
    else if (hints.lpLockedPct < 20) { score -= 15; breakdown.liquidity -= 15; }
  }

  // Bonding (small boost as it reduces rug probability mid-curve)
  if (typeof hints.bondingPercent === "number") {
    if (hints.bondingPercent >= 70) { score += 5; breakdown.bonding += 5; }
  }

  // Age (younger = riskier)
  if (typeof hints.ageHours === "number") {
    if (hints.ageHours < 6) { score -= 10; breakdown.age -= 10; }
    else if (hints.ageHours < 24) { score -= 5; breakdown.age -= 5; }
  }

  // Clamp between 0 and 100
  if (score > 100) { breakdown.clamp -= (score - 100); score = 100; }
  if (score < 0) { breakdown.clamp += (0 - score); score = 0; }

  const level = score >= 75 ? "low" : score >= 45 ? "medium" : "high";
  return { score, breakdown, level };
}

export async function analyzeMintSafety(conn: Connection, mint: string, hints: RiskHints = {}): Promise<SafetyResult> {
  const facts = await fetchOnchainFacts(conn, mint);
  const { score, breakdown, level } = computeSafetyScore(facts, hints);
  return {
    mint,
    facts,
    hints,
    safetyScore: score,
    riskLevel: level,
    breakdown
  };
}

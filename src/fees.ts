// frontend/src/fees.ts
// Fractions (e.g., 0.00300 = 0.300%). All numbers are in decimal, not %.

export type FeeTier = {
  max: number;           // inclusive upper bound of SOL market cap
  creator: number;       // fraction of trade
  protocol: number;      // fraction of trade
  lp: number;            // fraction of trade
  total: number;         // creator + protocol + lp
  range: string;         // label for UI
};

// 1) Bonding-curve (pre-pool): fixed 1.25% = Creator 0.300%, Protocol 0.950%, LP 0.000%.
export const BONDING_CURVE_FEES = {
  creator: 0.00300,
  protocol: 0.00950,
  lp: 0.00000,
  total: 0.01250,
};

// 2) Canonical-style tiers by SOL market cap = (token price in SOL) × 1,000,000,000
// NOTE: First tier has LP 0.020%; all other tiers use LP 0.200% with Protocol 0.050%,
// and Creator steps down by cap. Final "open" tier stabilizes at 0.300% total.
export const CANONICAL_FEE_TIERS: FeeTier[] = [
  { max: 420,    creator: 0.00300, protocol: 0.00930, lp: 0.00020, total: 0.01250, range: "0–420 SOL" },

  { max: 1470,   creator: 0.00950, protocol: 0.00050, lp: 0.00200, total: 0.01200, range: "420–1470 SOL" },
  { max: 2460,   creator: 0.00900, protocol: 0.00050, lp: 0.00200, total: 0.01150, range: "1470–2460 SOL" },
  { max: 3440,   creator: 0.00850, protocol: 0.00050, lp: 0.00200, total: 0.01100, range: "2460–3440 SOL" },
  { max: 4420,   creator: 0.00800, protocol: 0.00050, lp: 0.00200, total: 0.01050, range: "3440–4420 SOL" },
  { max: 9820,   creator: 0.00750, protocol: 0.00050, lp: 0.00200, total: 0.01000, range: "4420–9820 SOL" },
  { max: 14740,  creator: 0.00700, protocol: 0.00050, lp: 0.00200, total: 0.00950, range: "9820–14740 SOL" },
  { max: 19650,  creator: 0.00650, protocol: 0.00050, lp: 0.00200, total: 0.00900, range: "14740–19650 SOL" },
  { max: 24560,  creator: 0.00600, protocol: 0.00050, lp: 0.00200, total: 0.00850, range: "19650–24560 SOL" },
  { max: 29470,  creator: 0.00550, protocol: 0.00050, lp: 0.00200, total: 0.00800, range: "24560–29470 SOL" },
  { max: 34380,  creator: 0.00500, protocol: 0.00050, lp: 0.00200, total: 0.00750, range: "29470–34380 SOL" },
  { max: 39300,  creator: 0.00450, protocol: 0.00050, lp: 0.00200, total: 0.00700, range: "34380–39300 SOL" },
  { max: 44210,  creator: 0.00400, protocol: 0.00050, lp: 0.00200, total: 0.00650, range: "39300–44210 SOL" },
  { max: 49120,  creator: 0.00350, protocol: 0.00050, lp: 0.00200, total: 0.00600, range: "44210–49120 SOL" },
  { max: 54030,  creator: 0.00300, protocol: 0.00050, lp: 0.00200, total: 0.00550, range: "49120–54030 SOL" },
  { max: 58940,  creator: 0.00275, protocol: 0.00050, lp: 0.00200, total: 0.00525, range: "54030–58940 SOL" },
  { max: 63860,  creator: 0.00250, protocol: 0.00050, lp: 0.00200, total: 0.00500, range: "58940–63860 SOL" },
  { max: 68770,  creator: 0.00225, protocol: 0.00050, lp: 0.00200, total: 0.00475, range: "63860–68770 SOL" },
  { max: 73681,  creator: 0.00200, protocol: 0.00050, lp: 0.00200, total: 0.00450, range: "68770–73681 SOL" },
  { max: 78590,  creator: 0.00175, protocol: 0.00050, lp: 0.00200, total: 0.00425, range: "73681–78590 SOL" },
  { max: 83500,  creator: 0.00150, protocol: 0.00050, lp: 0.00200, total: 0.00400, range: "78590–83500 SOL" },
  { max: 88400,  creator: 0.00125, protocol: 0.00050, lp: 0.00200, total: 0.00375, range: "83500–88400 SOL" },
  { max: 93330,  creator: 0.00100, protocol: 0.00050, lp: 0.00200, total: 0.00350, range: "88400–93330 SOL" },
  { max: 98240,  creator: 0.00075, protocol: 0.00050, lp: 0.00200, total: 0.00325, range: "93330–98240 SOL" },

  // Final tier (≥ 98,240 SOL): stabilize at 0.300% total to stay competitive.
  { max: Number.POSITIVE_INFINITY, creator: 0.00050, protocol: 0.00050, lp: 0.00200, total: 0.00300, range: "≥ 98240 SOL" },
];

export function selectFeeTier(marketCapSol: number): FeeTier {
  for (const t of CANONICAL_FEE_TIERS) {
    if (marketCapSol <= t.max) return t;
  }
  return CANONICAL_FEE_TIERS[CANONICAL_FEE_TIERS.length - 1];
}

// Helper: compute SOL market cap from price in SOL (supply fixed at 1B)
export function marketCapSolFromPriceSol(priceSol: number): number {
  return priceSol * 1_000_000_000;
}

export function percent(n: number, digits = 3): string {
  return `${(n * 100).toFixed(digits)}%`;
}

// Fee breakdown calculation
export function calculateFeeBreakdown(amountTokens: number, priceSol: number, phase: 'bonding' | 'canonical') {
  const tradeValueSol = amountTokens * priceSol;
  
  if (phase === 'bonding') {
    return {
      creator: tradeValueSol * BONDING_CURVE_FEES.creator,
      protocol: tradeValueSol * BONDING_CURVE_FEES.protocol,
      lp: tradeValueSol * BONDING_CURVE_FEES.lp,
      total: tradeValueSol * BONDING_CURVE_FEES.total,
      totalPct: BONDING_CURVE_FEES.total,
      tier: 'Bonding Curve',
    };
  } else {
    const mcapSol = marketCapSolFromPriceSol(priceSol);
    const tier = selectFeeTier(mcapSol);
    
    return {
      creator: tradeValueSol * tier.creator,
      protocol: tradeValueSol * tier.protocol,
      lp: tradeValueSol * tier.lp,
      total: tradeValueSol * tier.total,
      totalPct: tier.total,
      tier: tier.range,
    };
  }
}

// Treasury wallet addresses
export const TREASURY_WALLETS = {
  protocol: process.env.VITE_PROTOCOL_TREASURY || 'PROTOCOL_TREASURY_ADDRESS_HERE',
  creator: process.env.VITE_CREATOR_TREASURY || 'CREATOR_TREASURY_ADDRESS_HERE',
  lp: process.env.VITE_LP_TREASURY || 'LP_TREASURY_ADDRESS_HERE',
} as const;
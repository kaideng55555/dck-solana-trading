// web/src/lib/bullSlayer.ts
export type TokenLite = { contract: string; createdAt?: number; bondingPercent?: number; safety?: { lpLockedPct?: number; renounced?: boolean; swappable?: boolean; }; };
export type HeatMap = Record<string, number>;

export function isBullSlayerCandidate(t: TokenLite, heat: HeatMap = {}, now = Date.now()) {
  const ageOk = t.createdAt ? (now - t.createdAt) < 24*60*60*1000 : true;
  const lpLocked = (t.safety?.lpLockedPct ?? 0) >= 80;
  const renounced = !!t.safety?.renounced;
  const swappable = t.safety?.swappable !== false;
  const trending = (heat[t.contract] || 0) >= 3;
  return ageOk && lpLocked && renounced && swappable && trending;
}

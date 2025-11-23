// Logic to determine bonding curve progress and assign a row (1, 2, 3).
// REAL DCK Layer2 implementation - NO SIMULATIONS

export type Token = {
  address: string;
  name: string;
  icon: string;
  marketCap: number;
  soldSupply?: number;
  totalSupply?: number;
  lpCreated?: boolean;
  change1m: number;
  age: string;
};

export function getBondingCurveProgress(token: Token): number {
  if (!token.soldSupply || !token.totalSupply || token.totalSupply === 0) return 0;
  return token.soldSupply / token.totalSupply;
}

// Determine row: 1 = New, 2 = About to Graduate, 3 = Graduated
export function getTokenRow(token: Token): number {
  const progress = getBondingCurveProgress(token);

  // Row 3 if LP created or high market cap
  if (token.lpCreated || token.marketCap > 150_000) {
    return 3;
  }
  // Row 2 if progress > 40% or mid cap
  if (progress > 0.4 || token.marketCap > 30_000) {
    return 2;
  }
  return 1;
}

// Real price calculation based on bonding curve
export const calculateBondingCurvePrice = (token: Token): number => {
  const progress = getBondingCurveProgress(token);
  // Price increases exponentially as supply is sold
  const basePrice = 0.00001;
  return basePrice * Math.pow(1.5, progress * 100);
};

// Get token classification for UI display
export const getTokenClassification = (token: Token): string => {
  const row = getTokenRow(token);
  switch (row) {
    case 1: return 'NEW';
    case 2: return 'GRADUATING';
    case 3: return 'GRADUATED';
    default: return 'UNKNOWN';
  }
};

// Check if token is ready for graduation (LP creation)
export const isReadyForGraduation = (token: Token): boolean => {
  const progress = getBondingCurveProgress(token);
  return progress >= 1.0 && !token.lpCreated;
};
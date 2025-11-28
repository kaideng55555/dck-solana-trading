import fetch from 'node-fetch';

const DEXSCREENER_API = process.env.DEXSCREENER_PAIRS_URL || 'https://api.dexscreener.com/latest/dex/pairs/solana';

export interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative?: string;
  priceUsd?: string;
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  volume?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  priceChange?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  txns?: {
    h24?: {
      buys?: number;
      sells?: number;
    };
    h6?: {
      buys?: number;
      sells?: number;
    };
    h1?: {
      buys?: number;
      sells?: number;
    };
    m5?: {
      buys?: number;
      sells?: number;
    };
  };
}

export interface NormalizedToken {
  mint: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceNative: number;
  liquidity: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  pairAddress: string;
  dexId: string;
  createdAt: number;
  buys24h: number;
  sells24h: number;
}

/**
 * Fetch all SOL pairs from DexScreener
 */
export async function fetchSolPairs(): Promise<DexPair[]> {
  try {
    const response = await fetch(DEXSCREENER_API);
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data: any = await response.json();
    return data.pairs || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch DexScreener pairs:', error.message);
    return [];
  }
}

/**
 * Normalize DexScreener pair to simplified token format
 */
export function normalizePair(pair: DexPair): NormalizedToken | null {
  try {
    // Skip pairs without base token or invalid data
    if (!pair.baseToken?.address || !pair.baseToken?.symbol) {
      return null;
    }

    // Skip pairs with SOL as base (we want SOL pairs, not pairs where SOL is base)
    if (pair.baseToken.address === 'So11111111111111111111111111111111111111112') {
      return null;
    }

    return {
      mint: pair.baseToken.address,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      priceUsd: parseFloat(pair.priceUsd || '0'),
      priceNative: parseFloat(pair.priceNative || '0'),
      liquidity: pair.liquidity?.usd || 0,
      marketCap: pair.marketCap || 0,
      volume24h: pair.volume?.h24 || 0,
      priceChange24h: pair.priceChange?.h24 || 0,
      pairAddress: pair.pairAddress,
      dexId: pair.dexId,
      createdAt: pair.pairCreatedAt || 0,
      buys24h: pair.txns?.h24?.buys || 0,
      sells24h: pair.txns?.h24?.sells || 0,
    };
  } catch (error) {
    console.error('Failed to normalize pair:', error);
    return null;
  }
}

/**
 * Fetch and normalize all SOL tokens from DexScreener
 * De-duplicates by mint address, keeping pair with highest liquidity
 */
export async function fetchNormalizedTokens(): Promise<NormalizedToken[]> {
  const pairs = await fetchSolPairs();
  
  // Normalize all pairs
  const normalized = pairs
    .map(normalizePair)
    .filter((token): token is NormalizedToken => token !== null);

  // De-duplicate by mint address (keep highest liquidity)
  const tokenMap = new Map<string, NormalizedToken>();
  
  for (const token of normalized) {
    const existing = tokenMap.get(token.mint);
    if (!existing || token.liquidity > existing.liquidity) {
      tokenMap.set(token.mint, token);
    }
  }

  return Array.from(tokenMap.values());
}

import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface XMEToken {
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

export interface UseXMETokensOptions {
  limit?: number;
  minLiquidity?: number;
  sortBy?: 'liquidity' | 'volume24h' | 'marketCap' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useXMETokens(options: UseXMETokensOptions = {}) {
  const {
    limit = 100,
    minLiquidity = 0,
    sortBy = 'liquidity',
    sortOrder = 'desc',
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [tokens, setTokens] = useState<XMEToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [cached, setCached] = useState(false);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        minLiquidity: minLiquidity.toString(),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`${API_URL}/xme/tokens?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ok) {
        setTokens(data.tokens);
        setTotal(data.total);
        setCached(data.cached || false);
      } else {
        throw new Error(data.error || 'Failed to fetch tokens');
      }
    } catch (err: any) {
      console.error('❌ useXMETokens error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();

    if (autoRefresh) {
      const interval = setInterval(fetchTokens, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [limit, minLiquidity, sortBy, sortOrder, autoRefresh, refreshInterval]);

  return {
    tokens,
    loading,
    error,
    total,
    cached,
    refresh: fetchTokens,
  };
}

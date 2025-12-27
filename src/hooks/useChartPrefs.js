import { useState, useEffect } from 'react';

/**
 * Manage chart preferences per token contract
 * @param {string} contract - Token contract address (or "global")
 * @returns {{timeframe: string, setTimeframe: (tf: string) => void}}
 */
export default function useChartPrefs(contract = 'global') {
  const key = `chart_${contract}_timeframe`;
  const [timeframe, setTimeframeState] = useState(() => {
    try {
      return localStorage.getItem(key) || '15m';
    } catch {
      return '15m';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, timeframe);
    } catch {
      // Ignore storage errors
    }
  }, [key, timeframe]);

  return { timeframe, setTimeframe: setTimeframeState };
}

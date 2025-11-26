import React from 'react';
import TokenChart from './TokenChart';
import TimeframeSelect from './TimeframeSelect';
import useChartPrefs from '../hooks/useChartPrefs';

/**
 * Token detail item with integrated chart
 * @param {{token: {contract: string, symbol?: string, name?: string, priceUsd?: number}}} props
 */
export default function TokenItem({ token }) {
  const { timeframe, setTimeframe } = useChartPrefs(token?.contract || 'global');

  if (!token || !token.contract) {
    return (
      <div className="rounded-3xl border border-gray-800 bg-black/70 p-4">
        <p className="text-gray-500 text-sm">No token selected</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-black/70 p-4 hover:border-cyan-500/40 transition-all">
      {/* Token Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-cyan-300">
            {token.symbol || 'Unknown'}
          </h3>
          {token.name && (
            <p className="text-xs text-gray-400">{token.name}</p>
          )}
        </div>
        {token.priceUsd && (
          <div className="text-right">
            <p className="text-sm font-mono text-pink-400">
              ${token.priceUsd.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Timeframe Selector */}
      <TimeframeSelect value={timeframe} onChange={setTimeframe} />

      {/* Token Chart */}
      <div className="mt-2">
        <TokenChart contract={token.contract} timeframe={timeframe} />
      </div>

      {/* Contract Address */}
      <div className="mt-3 pt-3 border-t border-gray-800">
        <p className="text-xs text-gray-500 font-mono truncate">
          {token.contract}
        </p>
      </div>
    </div>
  );
}

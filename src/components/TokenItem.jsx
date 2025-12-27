import React from 'react';
import TokenChart from './TokenChart';
import TimeframeSelect from './TimeframeSelect';
import TradesTape from './TradesTape';
import QuickSnipeButton from './QuickSnipeButton';
import RiskBadge from './RiskBadge';
import useChartPrefs from '../hooks/useChartPrefs';

/**
 * Token detail item with integrated chart, live trades, and quick snipe
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cyan-300">
              {token.symbol || 'Unknown'}
            </h3>
            <RiskBadge score={token.riskScore || 50} />
          </div>
          {token.name && (
            <p className="text-xs text-gray-400">{token.name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {token.priceUsd && (
            <div className="text-right">
              <p className="text-sm font-mono text-pink-400">
                ${token.priceUsd.toFixed(6)}
              </p>
            </div>
          )}
          {/* Buy/Sell + Quick Snipe */}
          <div className="flex items-center gap-2">
            <button className="rounded-lg bg-blue-500/80 hover:bg-blue-400 text-black font-semibold px-4 py-2 transition text-sm">
              Buy
            </button>
            <button className="rounded-lg bg-pink-500/80 hover:bg-pink-400 text-black font-semibold px-4 py-2 transition text-sm">
              Sell
            </button>
            <QuickSnipeButton mint={token.contract} lamports={500000} />
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <TimeframeSelect value={timeframe} onChange={setTimeframe} />

      {/* Token Chart */}
      <div className="mt-2 rounded-3xl border border-pink-500/40 bg-black/70 p-4">
        <TokenChart contract={token.contract} timeframe={timeframe} />
      </div>

      {/* Live Trades (WebSocket) */}
      <div className="mt-4 rounded-2xl border border-pink-500/40 bg-black/60 p-4">
        <h3 className="text-lg text-blue-300 font-semibold mb-2">Live Trades</h3>
        <TradesTape contract={token.contract} />
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

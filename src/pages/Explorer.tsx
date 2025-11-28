import React, { useState } from 'react';
import { useXMETokens } from '../hooks/useXMETokens';

export default function Explorer() {
  const [minLiquidity, setMinLiquidity] = useState(1000);
  const [sortBy, setSortBy] = useState<'liquidity' | 'volume24h' | 'marketCap' | 'createdAt'>('liquidity');
  
  const { tokens, loading, error, total, cached, refresh } = useXMETokens({
    limit: 100,
    minLiquidity,
    sortBy,
    sortOrder: 'desc',
    autoRefresh: true,
    refreshInterval: 30000,
  });

  return (
    <main className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
            🔥 All SOL Tokens
          </h1>
          <p className="text-gray-400">
            Real-time token explorer powered by XME (Expanded Mind Engine)
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm text-gray-400 mr-2">Min Liquidity:</label>
            <select
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(Number(e.target.value))}
              className="bg-gray-700 text-white rounded px-3 py-1"
            >
              <option value="0">All</option>
              <option value="1000">$1k+</option>
              <option value="5000">$5k+</option>
              <option value="10000">$10k+</option>
              <option value="50000">$50k+</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mr-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 text-white rounded px-3 py-1"
            >
              <option value="liquidity">Liquidity</option>
              <option value="volume24h">Volume 24h</option>
              <option value="marketCap">Market Cap</option>
              <option value="createdAt">Newest</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {cached && (
              <span className="text-xs text-yellow-400">📦 Cached</span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 rounded hover:opacity-80 disabled:opacity-50"
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
            <span className="text-sm text-gray-400">{total} tokens</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-4 mb-6">
            ❌ {error}
          </div>
        )}

        {/* Loading */}
        {loading && tokens.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-4xl">⏳</div>
            <p className="text-gray-400 mt-4">Loading tokens...</p>
          </div>
        )}

        {/* Token Grid */}
        {!loading && tokens.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No tokens found</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <div
              key={token.mint}
              className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700 hover:border-pink-500 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white text-lg">{token.symbol}</h3>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{token.name}</p>
                </div>
                <div className={`text-sm font-semibold ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.priceChange24h >= 0 ? '↗' : '↘'} {Math.abs(token.priceChange24h).toFixed(1)}%
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-mono">
                    ${token.priceUsd > 0.01 ? token.priceUsd.toFixed(4) : token.priceUsd.toExponential(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Liquidity:</span>
                  <span className="text-white">${(token.liquidity / 1000).toFixed(1)}k</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Volume 24h:</span>
                  <span className="text-white">${(token.volume24h / 1000).toFixed(1)}k</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap:</span>
                  <span className="text-white">${(token.marketCap / 1000).toFixed(1)}k</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Buys/Sells 24h:</span>
                  <span className="text-gray-300">{token.buys24h} / {token.sells24h}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">DEX:</span>
                  <span className="text-gray-300">{token.dexId}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700">
                <a
                  href={`https://dexscreener.com/solana/${token.pairAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-400 hover:text-pink-300 flex items-center justify-center gap-1"
                >
                  📊 View on DexScreener →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
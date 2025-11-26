import React, { useState } from 'react';

/**
 * Quick snipe button - sends snipe intent to backend
 * @param {{mint: string, lamports: number}} props
 */
export default function QuickSnipeButton({ mint, lamports = 500000 }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSnipe = async () => {
    if (!mint) return;
    
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/snipe/intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mint, lamports })
        }
      );

      const data = await response.json();
      setResult(data);
      
      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      console.error('Snipe failed:', error);
      setResult({ error: 'Failed to execute snipe' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSnipe}
        disabled={loading || !mint}
        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
          loading
            ? 'bg-gray-600 text-gray-400 cursor-wait'
            : 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white hover:from-cyan-400 hover:to-pink-400'
        }`}
      >
        {loading ? '⚡ Sniping...' : '⚡ Quick Snipe'}
      </button>
      
      {result && (
        <div
          className={`absolute top-full mt-2 right-0 px-3 py-2 rounded text-xs font-mono whitespace-nowrap ${
            result.error
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-green-500/20 text-green-400 border border-green-500/50'
          }`}
        >
          {result.error || `Sniped: ${result.signature?.slice(0, 8)}...`}
        </div>
      )}
    </div>
  );
}

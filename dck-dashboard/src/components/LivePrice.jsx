import { useState, useEffect } from 'react';

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';

export function useLivePrice(tokenMint) {
  const [price, setPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenMint) return;

    const fetchPrice = async () => {
      try {
        const res = await fetch(`${DEXSCREENER_API}/${tokenMint}`);
        const data = await res.json();
        
        if (data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0];
          setPrice(parseFloat(pair.priceUsd));
          setPriceChange(parseFloat(pair.priceChange?.h24 || 0));
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [tokenMint]);

  return { price, priceChange, loading, error };
}

export default function LivePriceDisplay({ tokenMint, symbol = 'TOKEN' }) {
  const { price, priceChange, loading, error } = useLivePrice(tokenMint);

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-24"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-4 text-red-400">
        Price unavailable
      </div>
    );
  }

  const isPositive = priceChange >= 0;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-gray-400 text-sm">{symbol} Price</span>
          <div className="text-2xl font-bold text-cyan-400">
            ${price?.toFixed(6) || '0.000000'}
          </div>
        </div>
        <div className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

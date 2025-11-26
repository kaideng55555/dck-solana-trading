import React, { useEffect, useState } from 'react';

/**
 * Live trades tape - connects to WebSocket /stream/trades
 * @param {{contract: string}} props
 */
export default function TradesTape({ contract }) {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    if (!contract) return;

    // Connect to SSE stream
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/stream/trades?contracts=${contract}`
    );

    eventSource.onmessage = (event) => {
      try {
        const trade = JSON.parse(event.data);
        setTrades((prev) => [trade, ...prev].slice(0, 50)); // Keep last 50 trades
      } catch (err) {
        console.error('Failed to parse trade:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
    };

    return () => eventSource.close();
  }, [contract]);

  if (trades.length === 0) {
    return (
      <div className="text-xs text-gray-500 py-2">
        Waiting for trades...
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {trades.map((trade, idx) => (
        <div
          key={`${trade.ts}-${idx}`}
          className={`flex items-center justify-between text-xs p-2 rounded ${
            trade.side === 'buy'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          <span className="font-bold uppercase">{trade.side}</span>
          <span className="font-mono">{trade.amountUi.toFixed(2)}</span>
          <span className="font-mono">${trade.priceUi.toFixed(6)}</span>
          {trade.wallet && (
            <span className="text-gray-500 truncate max-w-[80px]">
              {trade.wallet.slice(0, 4)}...{trade.wallet.slice(-4)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

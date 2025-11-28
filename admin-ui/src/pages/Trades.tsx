import { useState, useEffect, useRef } from 'react';
import { subscribeToTrades, type Trade } from '../api';

export default function Trades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('closed');
  const [paused, setPaused] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    connect();
    return () => {
      unsubRef.current?.();
    };
  }, []);

  function connect() {
    unsubRef.current?.();
    unsubRef.current = subscribeToTrades(
      (trade) => {
        if (!paused) {
          setTrades(prev => [trade, ...prev].slice(0, 100)); // Keep last 100
        }
      },
      setStatus
    );
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  const formatAmount = (amount: number) => {
    if (amount < 1) return amount.toFixed(4);
    if (amount < 100) return amount.toFixed(2);
    return amount.toFixed(0);
  };

  const formatPrice = (price: number) => {
    if (price < 0.0001) return price.toExponential(4);
    if (price < 1) return price.toFixed(6);
    return price.toFixed(4);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'open': return 'online';
      case 'connecting': return 'warning';
      default: return 'offline';
    }
  };

  const buyCount = trades.filter(t => t.side === 'buy').length;
  const sellCount = trades.filter(t => t.side === 'sell').length;
  const totalVolume = trades.reduce((sum, t) => sum + (t.amountUi * t.priceUi), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📈 Live Trades</h1>
        <p className="page-subtitle">Real-time trade stream from WebSocket</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Connection Status</div>
          <div className="stat-value flex items-center">
            <span className={`status-dot ${getStatusColor()}`}></span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Trades Received</div>
          <div className="stat-value">{trades.length}</div>
          <div className="stat-change">
            <span className="side-buy">{buyCount} buys</span>
            {' / '}
            <span className="side-sell">{sellCount} sells</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Volume (Session)</div>
          <div className="stat-value">${totalVolume.toFixed(2)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Buy/Sell Ratio</div>
          <div className="stat-value">
            {sellCount > 0 ? (buyCount / sellCount).toFixed(2) : '∞'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔴 Live Feed</h3>
          <div className="flex gap-2">
            <button 
              className={`btn btn-sm ${paused ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPaused(!paused)}
            >
              {paused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => setTrades([])}
            >
              🗑️ Clear
            </button>
            {status !== 'open' && (
              <button 
                className="btn btn-sm btn-primary"
                onClick={connect}
              >
                🔄 Reconnect
              </button>
            )}
          </div>
        </div>

        <div className="table-container trades-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Side</th>
                <th>Amount (SOL)</th>
                <th>Price</th>
                <th>Value</th>
                <th>Contract</th>
                <th>Wallet</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted">
                    {status === 'open' 
                      ? 'Waiting for trades...' 
                      : 'Not connected. Click Reconnect to start.'}
                  </td>
                </tr>
              ) : (
                trades.map((trade, i) => (
                  <tr key={`${trade.ts}-${i}`} className={`trade-row trade-${trade.side}`}>
                    <td>{formatTime(trade.ts)}</td>
                    <td>
                      <span className={`badge ${trade.side === 'buy' ? 'badge-success' : 'badge-error'}`}>
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td>{formatAmount(trade.amountUi)}</td>
                    <td>${formatPrice(trade.priceUi)}</td>
                    <td>${(trade.amountUi * trade.priceUi).toFixed(4)}</td>
                    <td>
                      <span className="wallet-address">
                        {trade.contract?.slice(0, 6)}...{trade.contract?.slice(-4)}
                      </span>
                    </td>
                    <td>
                      {trade.wallet && (
                        <span className="wallet-address">
                          {trade.wallet.slice(0, 4)}...{trade.wallet.slice(-4)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

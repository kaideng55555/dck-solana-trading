import { useState, useEffect } from 'react';
import { getTokens, getTokenPrice, type Token } from '../api';

export default function Tokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [priceResult, setPriceResult] = useState<{ price: number; change24h?: number } | null>(null);
  const [pricingToken, setPricingToken] = useState(false);

  useEffect(() => {
    loadTokens();
  }, []);

  async function loadTokens() {
    try {
      setLoading(true);
      const data = await getTokens();
      setTokens(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      // Demo tokens for display
      setTokens([
        { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'BONK', symbol: 'BONK', price: 0.0000234 },
        { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', name: 'USD Coin', symbol: 'USDC', price: 1.00 },
        { address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', name: 'POPCAT', symbol: 'POPCAT', price: 0.89 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function checkPrice() {
    if (!priceInput.trim()) return;
    try {
      setPricingToken(true);
      const result = await getTokenPrice(priceInput.trim());
      setPriceResult(result);
    } catch (err: any) {
      setPriceResult(null);
      alert(`Failed to get price: ${err.message}`);
    } finally {
      setPricingToken(false);
    }
  }

  const filteredTokens = tokens.filter(t => 
    t.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price?: number) => {
    if (!price) return '--';
    if (price < 0.0001) return price.toExponential(4);
    if (price < 1) return price.toFixed(6);
    return price.toFixed(2);
  };

  const getRowLabel = (row?: number) => {
    switch (row) {
      case 1: return <span className="badge badge-info">New</span>;
      case 2: return <span className="badge badge-warning">Graduating</span>;
      case 3: return <span className="badge badge-success">Graduated</span>;
      default: return '--';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🪙 Tokens</h1>
        <p className="page-subtitle">Track and monitor token prices</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔍 Price Lookup</h3>
          </div>
          
          <div className="form-group">
            <label className="form-label">Token Address</label>
            <input
              type="text"
              className="form-input"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="Enter Solana token address"
            />
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={checkPrice}
            disabled={pricingToken || !priceInput.trim()}
          >
            {pricingToken ? 'Loading...' : '💰 Check Price'}
          </button>

          {priceResult && (
            <div className="fee-display">
              <div className="form-label">Current Price</div>
              <div className="fee-value">${formatPrice(priceResult.price)}</div>
              {priceResult.change24h !== undefined && (
                <div className={`stat-change ${priceResult.change24h >= 0 ? 'positive' : 'negative'}`}>
                  {priceResult.change24h >= 0 ? '↑' : '↓'} {Math.abs(priceResult.change24h).toFixed(2)}% (24h)
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 Quick Stats</h3>
          </div>
          
          <div className="stats-mini">
            <div>
              <div className="form-label">Tokens Tracked</div>
              <div className="fee-value">{tokens.length}</div>
            </div>
            <div>
              <div className="form-label">Row 1 (New)</div>
              <div className="fee-value">{tokens.filter(t => t.row === 1).length}</div>
            </div>
            <div>
              <div className="form-label">Row 2 (Graduating)</div>
              <div className="fee-value">{tokens.filter(t => t.row === 2).length}</div>
            </div>
            <div>
              <div className="form-label">Row 3 (Graduated)</div>
              <div className="fee-value">{tokens.filter(t => t.row === 3).length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 Token List</h3>
          <input
            type="text"
            className="form-input"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Address</th>
                  <th>Price</th>
                  <th>Market Cap</th>
                  <th>Progress</th>
                  <th>Row</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-muted">No tokens found</td>
                  </tr>
                ) : (
                  filteredTokens.map((token) => (
                    <tr key={token.address}>
                      <td>
                        <div className="token-info">
                          <strong>{token.symbol || '???'}</strong>
                          <span className="text-muted">{token.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="wallet-address">
                          {token.address.slice(0, 6)}...{token.address.slice(-4)}
                        </span>
                      </td>
                      <td>${formatPrice(token.price)}</td>
                      <td>{token.marketCap ? `$${(token.marketCap / 1000).toFixed(1)}k` : '--'}</td>
                      <td>
                        {token.progress !== undefined && (
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${Math.min(100, token.progress)}%` }}
                            />
                            <span>{token.progress.toFixed(1)}%</span>
                          </div>
                        )}
                      </td>
                      <td>{getRowLabel(token.row)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

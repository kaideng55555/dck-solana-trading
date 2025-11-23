import React, { useState } from 'react';
import { useSelectedToken } from '../contexts/SelectedTokenContext';
import TradeForm from './TradeForm';
import './TradingPanel.css';

export default function TradingPanel() {
  const { selectedToken } = useSelectedToken();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'info'>('buy');

  if (!selectedToken) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-placeholder">
          <div className="neon-pulse neon-pink">🎯 SELECT A TOKEN</div>
          <p>Choose a token from the board to view trading options</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-panel">
      <div className="trading-panel-header">
        <h2 className="dck-title">{selectedToken.name}</h2>
        <div className="token-quick-stats">
          <span className="neon-cyan">MCAP: ${selectedToken.marketCap.toLocaleString()}</span>
          <span className={selectedToken.change1m >= 0 ? 'neon-cyan' : 'neon-pink'}>
            1M: {selectedToken.change1m >= 0 ? '+' : ''}{selectedToken.change1m.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="trading-tabs">
        <button 
          className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
        >
          🚀 BUY
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          💰 SELL
        </button>
        <button 
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          📊 INFO
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'buy' && <TradeForm mode="buy" />}
        {activeTab === 'sell' && <TradeForm mode="sell" />}
        {activeTab === 'info' && (
          <div className="token-info">
            <div className="info-section">
              <h4>Token Details</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{selectedToken.address.slice(0, 8)}...{selectedToken.address.slice(-8)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Market Cap:</span>
                  <span className="info-value">${selectedToken.marketCap.toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">LP Created:</span>
                  <span className={`info-value ${selectedToken.lpCreated ? 'neon-cyan' : 'neon-pink'}`}>
                    {selectedToken.lpCreated ? '✅ YES' : '❌ NO'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Supply:</span>
                  <span className="info-value">
                    {selectedToken.soldSupply?.toLocaleString()} / {selectedToken.totalSupply?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h4>Contract Actions</h4>
              <div className="action-buttons">
                <button className="action-btn neon-btn cyan">
                  📋 COPY ADDRESS
                </button>
                <button className="action-btn neon-btn">
                  🔍 VIEW ON EXPLORER
                </button>
                <button className="action-btn neon-btn cyan">
                  📈 DEXSCREENER
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
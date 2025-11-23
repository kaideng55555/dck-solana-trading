import React, { useState } from 'react';
import { useSelectedToken } from '../contexts/SelectedTokenContext';
import './TradeForm.css';

interface TradeFormProps {
  mode: 'buy' | 'sell';
}

export default function TradeForm({ mode }: TradeFormProps) {
  const { selectedToken } = useSelectedToken();
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrade = async () => {
    if (!selectedToken || !amount) return;
    
    setIsLoading(true);
    try {
      console.log(`${mode.toUpperCase()} ${amount} SOL of ${selectedToken.name}`);
      
      // TODO: Integrate with Jupiter for real trading
      const response = await fetch(`http://localhost:3001/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: selectedToken.address,
          amount: parseFloat(amount),
          mode,
          slippage: parseFloat(slippage)
        })
      });
      
      const result = await response.json();
      console.log('Trade result:', result);
      
    } catch (error) {
      console.error('Trade failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedToken) {
    return (
      <div className="trade-form-placeholder">
        <div className="neon-cyan">🎯 SELECT A TOKEN TO TRADE</div>
        <p>Choose a token from the board to start trading</p>
      </div>
    );
  }

  return (
    <div className={`trade-form ${mode}`}>
      <h3 className={mode === 'buy' ? 'neon-cyan' : 'neon-pink'}>
        {mode === 'buy' ? '🚀 BUY' : '💰 SELL'} {selectedToken.name}
      </h3>
      
      <div className="form-group">
        <label>Amount (SOL)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.1"
          step="0.01"
          min="0.01"
        />
      </div>
      
      <div className="form-group">
        <label>Slippage (%)</label>
        <div className="slippage-options">
          {['0.5', '1', '2', '5'].map(val => (
            <button
              key={val}
              className={`slippage-btn ${slippage === val ? 'active' : ''}`}
              onClick={() => setSlippage(val)}
            >
              {val}%
            </button>
          ))}
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            placeholder="Custom"
            step="0.1"
            min="0.1"
            max="50"
          />
        </div>
      </div>
      
      <div className="trade-summary">
        <div className="summary-row">
          <span>Token:</span>
          <span>{selectedToken.name}</span>
        </div>
        <div className="summary-row">
          <span>Market Cap:</span>
          <span>${selectedToken.marketCap.toLocaleString()}</span>
        </div>
        <div className="summary-row">
          <span>Amount:</span>
          <span>{amount} SOL</span>
        </div>
        <div className="summary-row">
          <span>Slippage:</span>
          <span>{slippage}%</span>
        </div>
      </div>
      
      <button
        className={`trade-btn ${mode} ${isLoading ? 'loading' : ''}`}
        onClick={handleTrade}
        disabled={!amount || isLoading}
      >
        {isLoading ? '⏳ PROCESSING...' : 
         mode === 'buy' ? `🚀 BUY ${selectedToken.name}` : `💰 SELL ${selectedToken.name}`}
      </button>
    </div>
  );
}
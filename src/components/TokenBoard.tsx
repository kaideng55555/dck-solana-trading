import { useState } from 'react';
import { Token, getBondingCurveProgress, calculateBondingCurvePrice, getTokenClassification } from '../hooks/bondingCurveLogic';

interface TokenRows {
  row1: Token[]; // New tokens
  row2: Token[]; // About to Graduate  
  row3: Token[]; // Graduated (LP Created)
}

interface TokenBoardProps {
  tokenRows: TokenRows;
  onSelectToken: (token: Token | null) => void;
}

export default function TokenBoard({ tokenRows, onSelectToken }: TokenBoardProps) {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    onSelectToken(token);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const TokenColumn = ({ title, tokens, colorClass }: { title: string, tokens: Token[], colorClass: string }) => (
    <div className="token-column">
      <h3 className={`column-title ${colorClass}`}>{title}</h3>
      <div className="column-tokens">
        {tokens.map((token, index) => {
          const progress = getBondingCurveProgress(token);
          const price = calculateBondingCurvePrice(token);
          const classification = getTokenClassification(token);
          
          return (
            <div 
              key={token.address}
              className={`token-card ${selectedToken?.address === token.address ? 'selected' : ''}`}
              onClick={() => handleTokenSelect(token)}
            >
              <div className="token-header">
                <div className="token-name neon-pulse">{token.name}</div>
                <div className={`token-classification ${colorClass}`}>{classification}</div>
              </div>
              
              <div className="bonding-curve-progress">
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${colorClass}`}
                    style={{width: `${progress * 100}%`}}
                  />
                </div>
                <span className="progress-text">{(progress * 100).toFixed(1)}%</span>
              </div>
              
              <div className="token-stats">
                <div className="stat">
                  <span className="stat-label">MCAP</span>
                  <span className="stat-value">{formatNumber(token.marketCap)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">PRICE</span>
                  <span className="stat-value">${price.toFixed(8)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">1M</span>
                  <span className={`stat-value ${token.change1m >= 0 ? 'neon-cyan' : 'neon-pink'}`}>
                    {token.change1m >= 0 ? '+' : ''}{token.change1m.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="token-actions">
                <button className="quick-buy">BUY</button>
                <button className="quick-sell">SELL</button>
              </div>
            </div>
          );
        })}
        
        {tokens.length === 0 && (
          <div className="empty-column">
            <div className="neon-pulse neon-cyan">🔍 SCANNING...</div>
            <div className="loading-text">Waiting for REAL tokens</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="token-board">
      <h2 className="dck-title live-tokens-title">DCK$ BONDING CURVE ROWS</h2>
      
      <div className="token-rows">
        <TokenColumn 
          title="🆕 NEW TOKENS"
          tokens={tokenRows.row1}
          colorClass="neon-cyan"
        />
        <TokenColumn 
          title="🎓 GRADUATING"
          tokens={tokenRows.row2}
          colorClass="neon-pink"
        />
        <TokenColumn 
          title="✅ GRADUATED"
          tokens={tokenRows.row3}
          colorClass="neon-cyan"
        />
      </div>
    </div>
  );
}
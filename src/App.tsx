import TokenBoard from './components/TokenBoard'
import TradingPanel from './components/TradingPanel'
import TokenCreator from './components/TokenCreator'
import AnalyticsView from './components/AnalyticsView'
import { DCKZNFT, DCKZGallery } from './components/DCKZNFT'
import NewMintsFeed from './components/NewMintsFeed'
import CapsuleReveal, { CapsuleRevealHandle } from './components/CapsuleReveal'
import RealBadge from './components/RealBadge'
import useBondingCurveTracker from './hooks/useBondingCurveTracker'
import useRealWS from './ws/useRealWS'
import { useState, useRef } from 'react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { SelectedTokenProvider, useSelectedToken } from './contexts/SelectedTokenContext'
import './styles/dck-theme.css'

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { setSelectedToken } = useSelectedToken();
  const [activeTab, setActiveTab] = useState<'trading' | 'create' | 'analytics' | 'nfts' | 'sniper' | 'capsule'>('trading');
  const capsuleRef = useRef<CapsuleRevealHandle>(null);
  const [selectedTokenForAnalytics, setSelectedTokenForAnalytics] = useState<string>('');
  
  const ws = useRealWS()
  const tokenRows = useBondingCurveTracker(ws)
  
  const totalTokens = tokenRows.row1.length + tokenRows.row2.length + tokenRows.row3.length;

  // Sample token data for NFT gallery
  const sampleTokens = [
    {
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      price: 0.000045,
      change24h: 125.5,
      volume: 892000,
      symbol: 'MOON'
    },
    {
      address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      price: 0.001234,
      change24h: -15.2,
      volume: 456000,
      symbol: 'HODL'
    },
    {
      address: '2b9WrfEYvBT8WxrCJW5xVX8Zw7R3nM5cG8pQ4aT1sX9',
      price: 0.000789,
      change24h: 67.8,
      volume: 1200000,
      symbol: 'DEGEN'
    }
  ];

  const handleTokenCreated = (mintAddress: string) => {
    setSelectedTokenForAnalytics(mintAddress);
    setActiveTab('analytics');
  };

  return (
    <div className="app-container">
      {/* DCK Header */}
      <header className="dck-header">
        <div className="dck-header-left">
          <h1 className="dck-title drip-effect">DCK$ TOOLS</h1>
          <RealBadge />
        </div>
        <div className="header-stats">
          <span className="neon-pink">LIVE TOKENS: {totalTokens}</span>
          <span className="neon-cyan">NEW: {tokenRows.row1.length}</span>
          <span className="neon-pink">GRADUATING: {tokenRows.row2.length}</span>
          <span className="neon-cyan">GRADUATED: {tokenRows.row3.length}</span>
          <button className="theme-toggle neon-btn" onClick={toggleTheme}>
            {theme.name === 'neon' ? '🌟 PLATINUM' : '🔥 NEON'}
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="dck-navigation">
          <button
            onClick={() => setActiveTab('trading')}
            className={`nav-tab ${activeTab === 'trading' ? 'active' : ''}`}
          >
            🚀 TRADING
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`nav-tab ${activeTab === 'create' ? 'active' : ''}`}
          >
            🎯 CREATE TOKEN
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            📈 ANALYTICS
          </button>
          <button
            onClick={() => setActiveTab('nfts')}
            className={`nav-tab ${activeTab === 'nfts' ? 'active' : ''}`}
          >
            🎨 DCKZ NFTS
          </button>
          <button
            onClick={() => setActiveTab('sniper')}
            className={`nav-tab ${activeTab === 'sniper' ? 'active' : ''}`}
          >
            🎯 NEW MINTS SNIPER
          </button>
          <button
            onClick={() => setActiveTab('capsule')}
            className={`nav-tab ${activeTab === 'capsule' ? 'active' : ''}`}
          >
            💎 NFT CAPSULE
          </button>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'trading' && (
          <div className="trading-grid">
            <TokenBoard tokenRows={tokenRows} onSelectToken={setSelectedToken} />
            <TradingPanel />
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-section">
            <TokenCreator onTokenCreated={handleTokenCreated} />
            <div className="creation-features dck-panel">
              <h3 className="neon-cyan">🎯 Advanced Token Creation</h3>
              <div className="features-grid">
                <div className="feature-card">
                  <span className="feature-icon">✨</span>
                  <h4>SPL Token Standard</h4>
                  <p>Native Solana token creation with full SPL compliance</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">🎨</span>
                  <h4>DCK Branding</h4>
                  <p>Automatic metadata and DCK ecosystem integration</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">💰</span>
                  <h4>Custom Economics</h4>
                  <p>Set supply, decimals, and tokenomics parameters</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">🔐</span>
                  <h4>Secure Creation</h4>
                  <p>Direct wallet integration with transaction signing</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">📊</span>
                  <h4>Auto Analytics</h4>
                  <p>Instant tracking and performance monitoring</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">🎭</span>
                  <h4>DCKZ NFT</h4>
                  <p>Automatic animated NFT generation for your token</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            {selectedTokenForAnalytics ? (
              <AnalyticsView 
                tokenAddress={selectedTokenForAnalytics}
                rpcEndpoint="https://api.devnet.solana.com"
              />
            ) : (
              <div className="analytics-placeholder dck-panel">
                <h3 className="neon-pink">📊 Advanced DEX Analytics</h3>
                <p className="neon-cyan">Select a token or create one to view comprehensive analytics</p>
                <div className="analytics-features">
                  <div className="feature-grid">
                    <div className="feature">
                      <span className="neon-pink">📈</span>
                      <span>Real-time Price Tracking</span>
                    </div>
                    <div className="feature">
                      <span className="neon-cyan">💧</span>
                      <span>Liquidity Analysis</span>
                    </div>
                    <div className="feature">
                      <span className="neon-pink">⚡</span>
                      <span>Price Impact Calculations</span>
                    </div>
                    <div className="feature">
                      <span className="neon-cyan">📊</span>
                      <span>Volume Profile Analysis</span>
                    </div>
                    <div className="feature">
                      <span className="neon-pink">🎯</span>
                      <span>Support/Resistance Levels</span>
                    </div>
                    <div className="feature">
                      <span className="neon-cyan">⚠️</span>
                      <span>Risk Assessment (HHI)</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTokenForAnalytics('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU')}
                  className="neon-btn demo-btn"
                >
                  🚀 VIEW DEMO ANALYTICS
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="nfts-section">
            <div className="nft-showcase dck-panel">
              <h3 className="neon-cyan">🎨 Featured DCKZ NFT</h3>
              <div className="featured-nft-container">
                <DCKZNFT
                  tokenData={sampleTokens[0]}
                  size="large"
                  autoRotate={true}
                />
                <div className="featured-info">
                  <h4>{sampleTokens[0].symbol}</h4>
                  <p className="neon-pink">${sampleTokens[0].price.toFixed(6)}</p>
                  <p className="neon-cyan">+{sampleTokens[0].change24h.toFixed(2)}%</p>
                  <p>Volume: ${(sampleTokens[0].volume / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </div>
            
            <DCKZGallery tokens={sampleTokens} />
            
            <div className="nft-info-panel dck-panel">
              <h4 className="neon-pink">🎭 About DCKZ NFTs</h4>
              <p>
                DCKZ NFTs are dynamic, performance-driven 3D characters that evolve in real-time based on your token's market performance. 
                Each NFT is uniquely generated with DCK street art aesthetics and EDM-inspired animations.
              </p>
              <div className="nft-variants">
                <div className="variant-list">
                  <h5 className="neon-cyan">🎪 Performance Variants:</h5>
                  <ul>
                    <li><span className="neon-pink">🥇 VIP:</span> +50% gains (golden celebration mode)</li>
                    <li><span className="neon-cyan">🤖 Cyber:</span> +10% gains (tech dance mode)</li>
                    <li><span className="neon-pink">🌈 Neon:</span> Positive performance (trading mode)</li>
                    <li><span className="neon-cyan">🏙️ Street:</span> Sideways action (idle chill mode)</li>
                  </ul>
                </div>
                <div className="animation-list">
                  <h5 className="neon-pink">⚡ Real-time Animations:</h5>
                  <ul>
                    <li><span className="neon-cyan">🎉</span> Celebrate on major pumps</li>
                    <li><span className="neon-pink">💃</span> Dance on good performance</li>
                    <li><span className="neon-cyan">📈</span> Trade gestures for activity</li>
                    <li><span className="neon-pink">🌙</span> Moonwalk for epic gains</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sniper' && (
          <div className="sniper-section">
            <div className="sniper-header dck-panel">
              <h3 className="neon-pink">🎯 DCK NEW MINTS SNIPER</h3>
              <p className="neon-cyan">Real-time feed of new Solana token mints with advanced filtering and instant sniping capabilities</p>
              <div className="sniper-features">
                <div className="feature-list">
                  <span className="neon-pink">⚡</span> <span>Real-time WebSocket streams</span>
                  <span className="neon-cyan">🔍</span> <span>Authority verification</span>
                  <span className="neon-pink">👥</span> <span>Holder analysis</span>
                  <span className="neon-cyan">🎯</span> <span>One-click sniping</span>
                  <span className="neon-pink">🔊</span> <span>Audio alerts</span>
                  <span className="neon-cyan">📊</span> <span>Market integrations</span>
                </div>
              </div>
            </div>
            <NewMintsFeed />
          </div>
        )}

        {activeTab === 'capsule' && (
          <div className="capsule-section">
            <div className="capsule-header dck-panel">
              <h3 className="neon-cyan">💎 DCK NFT REVELATION CAPSULE</h3>
              <p className="neon-pink">Experience the ultimate NFT reveal with animated particle effects and cinematic capsule opening</p>
              <div className="capsule-actions">
                <button 
                  className="neon-btn reveal-btn"
                  onClick={() => capsuleRef.current?.startReveal()}
                >
                  🔓 REVEAL NFT
                </button>
                <button 
                  className="neon-btn reset-btn"
                  onClick={() => window.location.reload()}
                >
                  🔄 RESET CAPSULE
                </button>
              </div>
            </div>
            <CapsuleReveal ref={capsuleRef} showControls={true} />
            <div className="capsule-info dck-panel">
              <h4 className="neon-pink">🎭 About DCK NFT Capsules</h4>
              <p>DCK NFT Capsules provide an immersive reveal experience with:</p>
              <div className="capsule-features">
                <div className="feature-grid">
                  <div className="feature">
                    <span className="neon-cyan">🎨</span>
                    <span>Real-time particle effects</span>
                  </div>
                  <div className="feature">
                    <span className="neon-pink">⚡</span>
                    <span>Cinematic animations</span>
                  </div>
                  <div className="feature">
                    <span className="neon-cyan">💫</span>
                    <span>Interactive controls</span>
                  </div>
                  <div className="feature">
                    <span className="neon-pink">🎪</span>
                    <span>Burst reveal effects</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SelectedTokenProvider>
        <AppContent />
      </SelectedTokenProvider>
    </ThemeProvider>
  );
}

import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import DEXAnalytics, { DEXMetrics, TickData } from '../analytics/DEXAnalytics';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AnalyticsViewProps {
    tokenAddress: string;
    rpcEndpoint: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tokenAddress, rpcEndpoint }) => {
    const [analytics] = useState(() => new DEXAnalytics(rpcEndpoint));
    const [metrics, setMetrics] = useState<DEXMetrics | null>(null);
    const [tickData, setTickData] = useState<TickData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'liquidity' | 'trades' | 'impact'>('overview');

    useEffect(() => {
        const loadMetrics = async () => {
            try {
                setLoading(true);
                const tokenMetrics = await analytics.getTokenMetrics(tokenAddress);
                setMetrics(tokenMetrics);
                setTickData(tokenMetrics.trades);

                // Connect to real-time tick stream
                await analytics.connectToTickStream(tokenAddress, (tick: TickData) => {
                    setTickData(prev => [...prev.slice(-99), tick]); // Keep last 100 ticks
                });

            } catch (error) {
                console.error('Failed to load metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        if (tokenAddress) {
            loadMetrics();
        }

        return () => {
            analytics.disconnect();
        };
    }, [tokenAddress, analytics]);

    if (loading) {
        return (
            <div className="analytics-loading">
                <div className="loading-spinner"></div>
                <p>📊 Loading analytics...</p>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="analytics-error">
                <p>❌ Failed to load analytics data</p>
            </div>
        );
    }

    // Chart configurations
    const priceChartData = {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
            {
                label: 'Price (24h)',
                data: metrics.price24h,
                borderColor: '#00bfff',
                backgroundColor: 'rgba(0, 191, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
            }
        ]
    };

    const volumeProfileData = {
        labels: tickData.slice(-20).map(tick => tick.price.toFixed(6)),
        datasets: [
            {
                label: 'Volume Profile',
                data: tickData.slice(-20).map(tick => tick.volume),
                backgroundColor: tickData.slice(-20).map(tick => 
                    tick.side === 'buy' ? 'rgba(0, 255, 128, 0.7)' : 'rgba(255, 0, 128, 0.7)'
                ),
                borderColor: tickData.slice(-20).map(tick => 
                    tick.side === 'buy' ? '#00ff80' : '#ff0080'
                ),
                borderWidth: 1,
            }
        ]
    };

    const liquidityData = {
        labels: ['Bid Liquidity', 'Ask Liquidity'],
        datasets: [
            {
                label: 'Liquidity Distribution',
                data: [metrics.liquidityData.bidLiquidity, metrics.liquidityData.askLiquidity],
                backgroundColor: ['rgba(0, 255, 128, 0.7)', 'rgba(255, 0, 128, 0.7)'],
                borderColor: ['#00ff80', '#ff0080'],
                borderWidth: 2,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'white'
                }
            }
        },
        scales: {
            x: {
                ticks: { color: 'white' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                ticks: { color: 'white' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    const formatNumber = (num: number, decimals: number = 2): string => {
        if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
        return num.toFixed(decimals);
    };

    const getRiskLevel = (hhi: number): { level: string; color: string } => {
        if (hhi > 2500) return { level: 'High Risk', color: '#ff0080' };
        if (hhi > 1500) return { level: 'Medium Risk', color: '#ffaa00' };
        return { level: 'Low Risk', color: '#00ff80' };
    };

    const riskAssessment = getRiskLevel(metrics.liquidityData.hhiIndex);

    return (
        <div className="analytics-view">
            <div className="analytics-header">
                <h2>📈 DEX Analytics Dashboard</h2>
                <div className="analytics-tabs">
                    {(['overview', 'liquidity', 'trades', 'impact'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`tab-button ${selectedTab === tab ? 'active' : ''}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {selectedTab === 'overview' && (
                <div className="overview-tab">
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <h4>24h Volume</h4>
                            <span className="metric-value cyan">
                                ${formatNumber(metrics.volume24h)}
                            </span>
                            <span className={`metric-change ${metrics.volumeChange24h >= 0 ? 'positive' : 'negative'}`}>
                                {metrics.volumeChange24h >= 0 ? '+' : ''}{metrics.volumeChange24h.toFixed(2)}%
                            </span>
                        </div>

                        <div className="metric-card">
                            <h4>Total Liquidity</h4>
                            <span className="metric-value pink">
                                ${formatNumber(metrics.liquidityData.totalLiquidity)}
                            </span>
                        </div>

                        <div className="metric-card">
                            <h4>Spread</h4>
                            <span className="metric-value cyan">
                                {metrics.liquidityData.spread.toFixed(4)}%
                            </span>
                        </div>

                        <div className="metric-card">
                            <h4>Risk Level</h4>
                            <span className="metric-value" style={{ color: riskAssessment.color }}>
                                {riskAssessment.level}
                            </span>
                            <small>HHI: {metrics.liquidityData.hhiIndex.toFixed(0)}</small>
                        </div>
                    </div>

                    <div className="chart-container">
                        <h3>Price Movement (24h)</h3>
                        <div className="chart-wrapper">
                            <Line data={priceChartData} options={chartOptions} />
                        </div>
                    </div>
                </div>
            )}

            {selectedTab === 'liquidity' && (
                <div className="liquidity-tab">
                    <div className="liquidity-metrics">
                        <div className="liquidity-summary">
                            <h3>🌊 Liquidity Analysis</h3>
                            <div className="liquidity-stats">
                                <div className="stat">
                                    <label>Total Liquidity:</label>
                                    <span>${formatNumber(metrics.liquidityData.totalLiquidity)}</span>
                                </div>
                                <div className="stat">
                                    <label>Bid/Ask Ratio:</label>
                                    <span>{(metrics.liquidityData.bidLiquidity / metrics.liquidityData.askLiquidity).toFixed(2)}</span>
                                </div>
                                <div className="stat">
                                    <label>HHI Index:</label>
                                    <span style={{ color: riskAssessment.color }}>
                                        {metrics.liquidityData.hhiIndex.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="chart-container">
                            <h4>Liquidity Distribution</h4>
                            <div className="chart-wrapper">
                                <Bar data={liquidityData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedTab === 'trades' && (
                <div className="trades-tab">
                    <div className="chart-container">
                        <h3>📊 Volume Profile</h3>
                        <div className="chart-wrapper">
                            <Bar data={volumeProfileData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="trades-list">
                        <h4>Recent Trades</h4>
                        <div className="trades-table">
                            <div className="trade-header">
                                <span>Time</span>
                                <span>Side</span>
                                <span>Price</span>
                                <span>Volume</span>
                            </div>
                            {tickData.slice(-10).reverse().map((trade, i) => (
                                <div key={i} className="trade-row">
                                    <span>{new Date(trade.timestamp).toLocaleTimeString()}</span>
                                    <span className={`trade-side ${trade.side}`}>
                                        {trade.side.toUpperCase()}
                                    </span>
                                    <span>${trade.price.toFixed(6)}</span>
                                    <span>{formatNumber(trade.volume)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {selectedTab === 'impact' && (
                <div className="impact-tab">
                    <div className="impact-analysis">
                        <h3>⚡ Price Impact Analysis</h3>
                        <div className="impact-grid">
                            <div className="impact-section">
                                <h4 className="buy-header">Buy Orders</h4>
                                <div className="impact-item">
                                    <span>1 SOL:</span>
                                    <span className="impact-value buy">{metrics.priceImpact.buy1Sol.toFixed(3)}%</span>
                                </div>
                                <div className="impact-item">
                                    <span>5 SOL:</span>
                                    <span className="impact-value buy">{metrics.priceImpact.buy5Sol.toFixed(3)}%</span>
                                </div>
                                <div className="impact-item">
                                    <span>10 SOL:</span>
                                    <span className="impact-value buy">{metrics.priceImpact.buy10Sol.toFixed(3)}%</span>
                                </div>
                            </div>

                            <div className="impact-section">
                                <h4 className="sell-header">Sell Orders</h4>
                                <div className="impact-item">
                                    <span>1 SOL:</span>
                                    <span className="impact-value sell">{metrics.priceImpact.sell1Sol.toFixed(3)}%</span>
                                </div>
                                <div className="impact-item">
                                    <span>5 SOL:</span>
                                    <span className="impact-value sell">{metrics.priceImpact.sell5Sol.toFixed(3)}%</span>
                                </div>
                                <div className="impact-item">
                                    <span>10 SOL:</span>
                                    <span className="impact-value sell">{metrics.priceImpact.sell10Sol.toFixed(3)}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="impact-warning">
                            <p>⚠️ Higher price impact indicates lower liquidity. Consider splitting large orders.</p>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .analytics-view {
                    background: rgba(0, 0, 0, 0.9);
                    border: 2px solid var(--dck-cyan);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 20px;
                    min-height: 600px;
                }

                .analytics-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .analytics-header h2 {
                    color: var(--dck-cyan);
                    text-shadow: 0 0 15px var(--dck-cyan);
                    margin: 0;
                }

                .analytics-tabs {
                    display: flex;
                    gap: 10px;
                }

                .tab-button {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid var(--dck-pink);
                    border-radius: 8px;
                    color: white;
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: capitalize;
                }

                .tab-button:hover {
                    background: rgba(255, 0, 128, 0.2);
                }

                .tab-button.active {
                    background: var(--dck-pink);
                    box-shadow: 0 0 15px rgba(255, 0, 128, 0.5);
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }

                .metric-card {
                    background: rgba(0, 0, 0, 0.7);
                    border: 1px solid var(--dck-cyan);
                    border-radius: 10px;
                    padding: 15px;
                    text-align: center;
                }

                .metric-card h4 {
                    color: white;
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    font-weight: normal;
                }

                .metric-value {
                    display: block;
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .metric-value.cyan { color: var(--dck-cyan); }
                .metric-value.pink { color: var(--dck-pink); }

                .metric-change {
                    font-size: 12px;
                }

                .metric-change.positive { color: #00ff80; }
                .metric-change.negative { color: #ff4444; }

                .chart-container {
                    margin-bottom: 25px;
                }

                .chart-container h3, .chart-container h4 {
                    color: var(--dck-pink);
                    text-align: center;
                    margin-bottom: 15px;
                }

                .chart-wrapper {
                    height: 300px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 10px;
                    padding: 15px;
                }

                .liquidity-summary {
                    margin-bottom: 25px;
                }

                .liquidity-summary h3 {
                    color: var(--dck-cyan);
                    text-align: center;
                    margin-bottom: 20px;
                }

                .liquidity-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }

                .liquidity-stats .stat {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 8px;
                    border: 1px solid var(--dck-cyan);
                }

                .liquidity-stats .stat label {
                    color: white;
                }

                .liquidity-stats .stat span {
                    color: var(--dck-pink);
                    font-weight: bold;
                }

                .trades-list {
                    margin-top: 25px;
                }

                .trades-list h4 {
                    color: var(--dck-cyan);
                    margin-bottom: 15px;
                }

                .trades-table {
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .trade-header {
                    display: grid;
                    grid-template-columns: 1fr 80px 100px 100px;
                    gap: 15px;
                    padding: 10px 15px;
                    background: var(--dck-pink);
                    font-weight: bold;
                    color: white;
                }

                .trade-row {
                    display: grid;
                    grid-template-columns: 1fr 80px 100px 100px;
                    gap: 15px;
                    padding: 8px 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 14px;
                }

                .trade-side.buy { color: #00ff80; }
                .trade-side.sell { color: #ff0080; }

                .impact-analysis h3 {
                    color: var(--dck-cyan);
                    text-align: center;
                    margin-bottom: 25px;
                }

                .impact-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 25px;
                    margin-bottom: 25px;
                }

                .impact-section {
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 10px;
                    padding: 20px;
                    border: 1px solid var(--dck-cyan);
                }

                .buy-header { color: #00ff80; text-align: center; margin-bottom: 15px; }
                .sell-header { color: #ff0080; text-align: center; margin-bottom: 15px; }

                .impact-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .impact-value.buy { color: #00ff80; font-weight: bold; }
                .impact-value.sell { color: #ff0080; font-weight: bold; }

                .impact-warning {
                    background: rgba(255, 165, 0, 0.1);
                    border: 1px solid orange;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                    color: orange;
                }

                .analytics-loading, .analytics-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 300px;
                    color: white;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(0, 191, 255, 0.3);
                    border-top: 3px solid var(--dck-cyan);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 15px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .analytics-tabs {
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    
                    .metrics-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .impact-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .trade-header, .trade-row {
                        grid-template-columns: 80px 50px 80px 80px;
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AnalyticsView;
import { useState, useEffect } from 'react';
import { getHealth, getMetrics, getFeeConfig, type FeeConfig } from '../api';

export default function Dashboard() {
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [fees, setFees] = useState<FeeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [h, m, f] = await Promise.all([
        getHealth().catch(() => null),
        getMetrics().catch(() => null),
        getFeeConfig().catch(() => null),
      ]);
      setHealth(h);
      setMetrics(m);
      setFees(f);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">DCK$ Trading System Overview</p>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--neon-red)' }}>
          <p style={{ color: 'var(--neon-red)' }}>⚠️ {error}</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 12 }}>
            Make sure the backend is running on port 3001
          </p>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">System Status</div>
          <div className="stat-value flex items-center gap-2">
            <span className={`status-dot ${health ? 'online' : 'offline'}`}></span>
            {health ? 'Online' : 'Offline'}
          </div>
          {health?.uptime && (
            <div className="stat-change">Uptime: {formatUptime(health.uptime)}</div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Memory Usage</div>
          <div className="stat-value">
            {health?.memory ? formatBytes(health.memory.used) : '--'}
          </div>
          {health?.memory && (
            <div className="stat-change">
              of {formatBytes(health.memory.total)}
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">WebSocket Connections</div>
          <div className="stat-value">{metrics?.wsConnections ?? '--'}</div>
          <div className="stat-change">Active clients</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tokens Tracked</div>
          <div className="stat-value">{metrics?.tokensTracked ?? '--'}</div>
          <div className="stat-change">In price feed</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💰 Fee Configuration</h3>
            <span className={`badge ${fees?.enabled ? 'badge-success' : 'badge-warning'}`}>
              {fees?.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          
          {fees ? (
            <div>
              <div className="form-group">
                <label className="form-label">Fee Wallet</label>
                <div className="wallet-address">
                  {fees.feeWallet.slice(0, 8)}...{fees.feeWallet.slice(-8)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fee Percentage</label>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--neon-cyan)' }}>
                  {fees.feePercentage}%
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📡 Quick Actions</h3>
          </div>
          
          <div className="flex flex-col gap-2">
            <button className="btn btn-secondary" onClick={loadData}>
              🔄 Refresh Data
            </button>
            <a href="http://localhost:3001/health" target="_blank" rel="noopener" className="btn btn-secondary">
              🔍 View Health Endpoint
            </a>
            <a href="http://localhost:3001/metrics" target="_blank" rel="noopener" className="btn btn-secondary">
              📊 View Metrics
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔗 API Endpoints</h3>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Description</th>
                <th>Auth</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>/health</code></td>
                <td><span className="badge badge-success">GET</span></td>
                <td>System health check</td>
                <td>No</td>
              </tr>
              <tr>
                <td><code>/metrics</code></td>
                <td><span className="badge badge-success">GET</span></td>
                <td>System metrics</td>
                <td>No</td>
              </tr>
              <tr>
                <td><code>/price/:token</code></td>
                <td><span className="badge badge-success">GET</span></td>
                <td>Get token price</td>
                <td>No</td>
              </tr>
              <tr>
                <td><code>/admin/fees</code></td>
                <td><span className="badge badge-info">GET/POST</span></td>
                <td>Fee configuration</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td><code>/admin/testers</code></td>
                <td><span className="badge badge-info">GET/POST/DELETE</span></td>
                <td>Manage testers</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td><code>/stream/trades</code></td>
                <td><span className="badge badge-success">SSE</span></td>
                <td>Real-time trade stream</td>
                <td>No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

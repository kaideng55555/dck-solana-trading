import { useState, useEffect } from 'react';
import { getStreamStatus } from '../api';

export default function Streams() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sseTest, setSseTest] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [sseEvents, setSseEvents] = useState<any[]>([]);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const data = await getStreamStatus();
      setStatus(data);
    } catch {
      setStatus({ sseClients: 0, wsClients: 0, contracts: [] });
    } finally {
      setLoading(false);
    }
  }

  function testSSE() {
    setSseTest('connecting');
    setSseEvents([]);
    
    const eventSource = new EventSource('http://localhost:3001/stream/trades');
    
    eventSource.onopen = () => {
      setSseTest('connected');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSseEvents(prev => [data, ...prev].slice(0, 10));
      } catch {}
    };
    
    eventSource.onerror = () => {
      setSseTest('error');
      eventSource.close();
    };
    
    // Auto-close after 30 seconds
    setTimeout(() => {
      eventSource.close();
      setSseTest('idle');
    }, 30000);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📡 Streams</h1>
        <p className="page-subtitle">Monitor real-time data streams</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">SSE Clients</div>
          <div className="stat-value">{status?.sseClients ?? '--'}</div>
          <div className="stat-change">Server-Sent Events</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">WebSocket Clients</div>
          <div className="stat-value">{status?.wsClients ?? '--'}</div>
          <div className="stat-change">Real-time trades</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Contracts Watched</div>
          <div className="stat-value">{status?.contracts?.length ?? '--'}</div>
          <div className="stat-change">Token filters active</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🧪 SSE Test</h3>
            <span className={`badge ${
              sseTest === 'connected' ? 'badge-success' :
              sseTest === 'connecting' ? 'badge-warning' :
              sseTest === 'error' ? 'badge-error' :
              'badge-info'
            }`}>
              {sseTest}
            </span>
          </div>

          <p className="info-text">
            Test the Server-Sent Events stream at <code>/stream/trades</code>
          </p>

          <button 
            className="btn btn-primary"
            onClick={testSSE}
            disabled={sseTest === 'connecting' || sseTest === 'connected'}
          >
            {sseTest === 'connected' ? '🔴 Listening...' : '▶️ Start SSE Test'}
          </button>

          {sseEvents.length > 0 && (
            <div className="events-list">
              <div className="form-label">Recent Events:</div>
              {sseEvents.map((event, i) => (
                <div key={i} className="event-item">
                  <pre>{JSON.stringify(event, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 Stream Endpoints</h3>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>/stream/trades</code></td>
                  <td><span className="badge badge-info">SSE</span></td>
                  <td>Real-time trade events</td>
                </tr>
                <tr>
                  <td><code>/ws</code></td>
                  <td><span className="badge badge-success">WebSocket</span></td>
                  <td>Bidirectional trades stream</td>
                </tr>
                <tr>
                  <td><code>/dev/pushTrade</code></td>
                  <td><span className="badge badge-warning">POST</span></td>
                  <td>Push test trade (dev only)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔗 Watched Contracts</h3>
        </div>

        {status?.contracts?.length > 0 ? (
          <div className="contracts-grid">
            {status.contracts.map((contract: string) => (
              <div key={contract} className="contract-chip">
                <span className="wallet-address">{contract}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No contracts currently being watched</p>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📖 Integration Guide</h3>
        </div>

        <div className="info-box">
          <p><strong>SSE (Server-Sent Events):</strong></p>
          <pre className="code-block">
{`const eventSource = new EventSource('/stream/trades?contracts=TOKEN1,TOKEN2');
eventSource.onmessage = (event) => {
  const trade = JSON.parse(event.data);
  console.log('New trade:', trade);
};`}
          </pre>

          <p><strong>WebSocket:</strong></p>
          <pre className="code-block">
{`const ws = new WebSocket('ws://localhost:3001/ws');
ws.onmessage = (event) => {
  const trade = JSON.parse(event.data);
  console.log('Trade:', trade);
};`}
          </pre>
        </div>
      </div>
    </div>
  );
}

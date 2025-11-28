import { useState, useEffect } from 'react';
import { setAdminToken } from '../api';

export default function Settings() {
  const [adminToken, setToken] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved settings
    const storedToken = localStorage.getItem('dck_admin_token') || '';
    const storedUrl = localStorage.getItem('dck_backend_url') || 'http://localhost:3001';
    setToken(storedToken);
    setBackendUrl(storedUrl);
  }, []);

  function handleSave() {
    setAdminToken(adminToken);
    localStorage.setItem('dck_backend_url', backendUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleClear() {
    if (confirm('Clear all settings and reload?')) {
      localStorage.removeItem('dck_admin_token');
      localStorage.removeItem('dck_backend_url');
      window.location.reload();
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-subtitle">Configure admin dashboard</p>
      </div>

      {saved && (
        <div className="alert alert-success">
          ✅ Settings saved successfully!
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔐 Authentication</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Admin Token</label>
            <input
              type="password"
              className="form-input"
              value={adminToken}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter admin token"
            />
            <p className="form-hint">
              Token is sent as <code>x-admin-token</code> header
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Backend URL</label>
            <input
              type="text"
              className="form-input"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:3001"
            />
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleSave}>
              💾 Save Settings
            </button>
            <button className="btn btn-danger" onClick={handleClear}>
              🗑️ Clear All
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 Environment Info</h3>
          </div>

          <div className="info-list">
            <div className="info-row">
              <span className="form-label">Admin UI Version</span>
              <span>1.0.0</span>
            </div>
            <div className="info-row">
              <span className="form-label">Expected Backend</span>
              <span>localhost:3001</span>
            </div>
            <div className="info-row">
              <span className="form-label">Browser</span>
              <span>{navigator.userAgent.split(' ').pop()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔧 Backend Configuration</h3>
        </div>

        <div className="info-box">
          <p><strong>Required Environment Variables:</strong></p>
          <pre className="code-block">
{`# backend-node/.env

# Solana RPC
QUICKNODE_HTTP=https://your-quicknode-url.com
QUICKNODE_WSS=wss://your-quicknode-url.com

# Fee Configuration
FEE_WALLET=FaciyzhG9zvki2uRxUfrhghGnv2aFBHibsSnRHoeqd9y
FEE_PERCENTAGE=1.0

# Admin Access
ADMIN_TOKEN=dck-admin-secret-2025

# Server
PORT=3001`}
          </pre>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🚀 Quick Start</h3>
        </div>

        <div className="info-box">
          <p><strong>1. Start the backend:</strong></p>
          <pre className="code-block">
{`cd backend-node
npm install
npx tsx src/index.ts`}
          </pre>

          <p><strong>2. Start the admin UI:</strong></p>
          <pre className="code-block">
{`cd admin-ui
npm install
npm run dev`}
          </pre>

          <p><strong>3. Open in browser:</strong></p>
          <pre className="code-block">
{`http://localhost:5175`}
          </pre>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getFeeConfig, updateFeeConfig, type FeeConfig } from '../api';

export default function Fees() {
  const [config, setConfig] = useState<FeeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [feeWallet, setFeeWallet] = useState('');
  const [feePercentage, setFeePercentage] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const data = await getFeeConfig();
      setConfig(data);
      setFeeWallet(data.feeWallet);
      setFeePercentage(data.feePercentage.toString());
      setEnabled(data.enabled);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await updateFeeConfig({
        feeWallet,
        feePercentage: parseFloat(feePercentage),
        enabled,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadConfig();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isValidWallet = feeWallet.length >= 32 && feeWallet.length <= 44;
  const isValidPercentage = !isNaN(parseFloat(feePercentage)) && 
    parseFloat(feePercentage) >= 0 && 
    parseFloat(feePercentage) <= 100;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💰 Fee Configuration</h1>
        <p className="page-subtitle">Manage trading fee collection settings</p>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--neon-red)', marginBottom: 20 }}>
          <p style={{ color: 'var(--neon-red)' }}>⚠️ {error}</p>
        </div>
      )}

      {success && (
        <div className="card" style={{ borderColor: 'var(--neon-green)', marginBottom: 20 }}>
          <p style={{ color: 'var(--neon-green)' }}>✅ Fee configuration updated successfully!</p>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Current Configuration</h3>
            <span className={`badge ${config?.enabled ? 'badge-success' : 'badge-warning'}`}>
              {config?.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : config ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">Fee Wallet Address</div>
                <div className="wallet-address" style={{ wordBreak: 'break-all' }}>
                  {config.feeWallet}
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">Fee Percentage</div>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--neon-cyan)' }}>
                  {config.feePercentage}%
                </div>
              </div>

              <div>
                <div className="form-label">Example Calculation</div>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--text-muted)' }}>Trade: 10 SOL</td>
                      <td style={{ textAlign: 'right' }}>
                        Fee: {(10 * config.feePercentage / 100).toFixed(4)} SOL
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)' }}>Trade: 100 SOL</td>
                      <td style={{ textAlign: 'right' }}>
                        Fee: {(100 * config.feePercentage / 100).toFixed(4)} SOL
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Failed to load configuration</p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Update Configuration</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Fee Wallet Address</label>
            <input
              type="text"
              className="form-input"
              value={feeWallet}
              onChange={(e) => setFeeWallet(e.target.value)}
              placeholder="Enter Solana wallet address"
            />
            {feeWallet && !isValidWallet && (
              <p style={{ color: 'var(--neon-red)', fontSize: 12, marginTop: 4 }}>
                Invalid wallet address format
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Fee Percentage (%)</label>
            <input
              type="number"
              className="form-input"
              value={feePercentage}
              onChange={(e) => setFeePercentage(e.target.value)}
              placeholder="e.g., 1.0"
              min="0"
              max="100"
              step="0.1"
            />
            {feePercentage && !isValidPercentage && (
              <p style={{ color: 'var(--neon-red)', fontSize: 12, marginTop: 4 }}>
                Must be between 0 and 100
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <div className="flex gap-2">
              <button
                className={`btn ${enabled ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setEnabled(true)}
              >
                ✅ Enabled
              </button>
              <button
                className={`btn ${!enabled ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setEnabled(false)}
              >
                ❌ Disabled
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !isValidWallet || !isValidPercentage}
            style={{ width: '100%', marginTop: 16 }}
          >
            {saving ? 'Saving...' : '💾 Save Configuration'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 Fee Collection Info</h3>
        </div>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p><strong>How it works:</strong></p>
          <ul style={{ marginLeft: 20, marginTop: 8 }}>
            <li>Fees are collected on every trade executed through the DCK$ platform</li>
            <li>The configured percentage is deducted from each trade amount</li>
            <li>Fees are sent directly to the specified wallet address</li>
            <li>Fee collection can be disabled without changing other settings</li>
          </ul>
          
          <p style={{ marginTop: 16 }}><strong>Environment Variable Override:</strong></p>
          <p style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}>
            <code>FEE_WALLET</code> and <code>FEE_PERCENTAGE</code> in <code>.env</code> take precedence
          </p>
        </div>
      </div>
    </div>
  );
}

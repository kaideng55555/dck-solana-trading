import { useState, useEffect } from 'react';
import { getTesters, addTester, removeTester, type Tester } from '../api';

export default function Testers() {
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add tester form
  const [newWallet, setNewWallet] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadTesters();
  }, []);

  async function loadTesters() {
    try {
      setLoading(true);
      const data = await getTesters();
      setTesters(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      // Demo data
      setTesters([
        { wallet: 'FaciyzhG9zvki2uRxUfrhghGnv2aFBHibsSnRHoeqd9y', addedAt: new Date().toISOString(), label: 'Admin' },
        { wallet: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', addedAt: new Date().toISOString(), label: 'Tester 1' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newWallet.trim()) return;
    
    try {
      setAdding(true);
      await addTester(newWallet.trim(), newLabel.trim() || undefined);
      setNewWallet('');
      setNewLabel('');
      await loadTesters();
    } catch (err: any) {
      alert(`Failed to add tester: ${err.message}`);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(wallet: string) {
    if (!confirm(`Remove tester ${wallet.slice(0, 8)}...?`)) return;
    
    try {
      await removeTester(wallet);
      await loadTesters();
    } catch (err: any) {
      alert(`Failed to remove tester: ${err.message}`);
    }
  }

  const isValidWallet = newWallet.length >= 32 && newWallet.length <= 44;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 Testers</h1>
        <p className="page-subtitle">Manage closed beta access list</p>
      </div>

      {error && (
        <div className="alert alert-warning">
          <p>⚠️ Could not connect to backend. Showing demo data.</p>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">➕ Add Tester</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Wallet Address</label>
            <input
              type="text"
              className="form-input"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              placeholder="Enter Solana wallet address"
            />
            {newWallet && !isValidWallet && (
              <p className="form-error">Invalid wallet address format</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Label (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g., Discord: username#1234"
            />
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleAdd}
            disabled={adding || !isValidWallet}
          >
            {adding ? 'Adding...' : '➕ Add Tester'}
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 Stats</h3>
          </div>

          <div className="stats-mini">
            <div>
              <div className="form-label">Total Testers</div>
              <div className="fee-value">{testers.length}</div>
            </div>
            <div>
              <div className="form-label">With Labels</div>
              <div className="fee-value">{testers.filter(t => t.label).length}</div>
            </div>
          </div>

          <div className="info-box">
            <p><strong>Access Control:</strong></p>
            <p>Testers can access the closed beta platform. Only wallets on this list can connect and trade.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 Tester List</h3>
          <span className="badge badge-info">{testers.length} testers</span>
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
                  <th>Wallet Address</th>
                  <th>Label</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {testers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted">No testers added yet</td>
                  </tr>
                ) : (
                  testers.map((tester) => (
                    <tr key={tester.wallet}>
                      <td>
                        <span className="wallet-address wallet-full">
                          {tester.wallet}
                        </span>
                      </td>
                      <td>{tester.label || <span className="text-muted">--</span>}</td>
                      <td>{formatDate(tester.addedAt)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemove(tester.wallet)}
                        >
                          🗑️ Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📖 Bulk Import</h3>
        </div>
        
        <div className="info-box">
          <p>To bulk import testers, use the command line:</p>
          <pre className="code-block">
{`cd backend-node
./scripts/add-testers.sh wallet1 wallet2 wallet3`}
          </pre>
          <p>Or edit <code>testers.txt</code> directly (one wallet per line).</p>
        </div>
      </div>
    </div>
  );
}

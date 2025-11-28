import React, { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';

export default function AdminTrading() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newWallet, setNewWallet] = useState('');
  const [limits, setLimits] = useState({
    minLiqUsd: 3000,
    minTokenAgeMinutes: 20,
    maxTaxPct: 10,
  });

  // Fetch config
  const fetchConfig = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/admin/trading/config', {
        headers: { 'x-admin-token': token }
      });
      
      if (!res.ok) throw new Error('Unauthorized or server error');
      
      const data = await res.json();
      setConfig(data);
      setLimits({
        minLiqUsd: data.minLiqUsd,
        minTokenAgeMinutes: data.minTokenAgeMinutes,
        maxTaxPct: data.maxTaxPct,
      });
      setAuthenticated(true);
    } catch (e) {
      setError(e.message);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Toggle public/private
  const togglePublic = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/admin/trading/toggle', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ public: !config.tradingPublic })
      });
      
      if (!res.ok) throw new Error('Failed to toggle');
      
      await fetchConfig();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Add wallet
  const addWallet = async () => {
    if (!newWallet.trim()) {
      setError('Enter a wallet address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/admin/trading/wallets/add', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ wallet: newWallet.trim() })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add wallet');
      }
      
      setNewWallet('');
      await fetchConfig();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove wallet
  const removeWallet = async (wallet) => {
    if (!confirm(`Remove ${wallet}?`)) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/admin/trading/wallets/remove', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ wallet })
      });
      
      if (!res.ok) throw new Error('Failed to remove wallet');
      
      await fetchConfig();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Update limits
  const updateLimits = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/admin/trading/limits', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify(limits)
      });
      
      if (!res.ok) throw new Error('Failed to update limits');
      
      await fetchConfig();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auth form
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-purple-500/30">
            <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500">
              🛡️ Trading Admin
            </h1>
            
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Admin Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && fetchConfig()}
              />
              
              <button
                onClick={fetchConfig}
                disabled={loading || !token}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Authenticating...' : 'Authenticate'}
              </button>
              
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500">
              🛡️ Trading Controls
            </h1>
            <button
              onClick={() => setAuthenticated(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
          <AdminNav />
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Public/Private Toggle */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h2 className="text-xl font-bold text-white mb-4">Trading Mode</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold mb-1" style={{ color: config?.tradingPublic ? '#00ff88' : '#ff4444' }}>
                {config?.tradingPublic ? '🌍 PUBLIC' : '🔒 CLOSED BETA'}
              </div>
              <div className="text-gray-400 text-sm">
                {config?.tradingPublic ? 'Anyone can trade' : 'Only allowlisted wallets'}
              </div>
            </div>
            
            <button
              onClick={togglePublic}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Updating...' : config?.tradingPublic ? 'Close Beta' : 'Open Public'}
            </button>
          </div>
        </div>

        {/* Allowlist Management */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h2 className="text-xl font-bold text-white mb-4">Wallet Allowlist ({config?.allowedWallets?.length || 0})</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Base58 wallet address"
                value={newWallet}
                onChange={(e) => setNewWallet(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && addWallet()}
              />
              <button
                onClick={addWallet}
                disabled={loading || !newWallet.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {config?.allowedWallets?.map((wallet) => (
                <div key={wallet} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
                  <code className="text-sm text-gray-300 font-mono">{wallet}</code>
                  <button
                    onClick={() => removeWallet(wallet)}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:opacity-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              {(!config?.allowedWallets || config.allowedWallets.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  No wallets in allowlist
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trading Limits */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h2 className="text-xl font-bold text-white mb-4">Trading Limits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Liquidity (USD)</label>
              <input
                type="number"
                value={limits.minLiqUsd}
                onChange={(e) => setLimits({ ...limits, minLiqUsd: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Token Age (minutes)</label>
              <input
                type="number"
                value={limits.minTokenAgeMinutes}
                onChange={(e) => setLimits({ ...limits, minTokenAgeMinutes: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Tax (%)</label>
              <input
                type="number"
                value={limits.maxTaxPct}
                onChange={(e) => setLimits({ ...limits, maxTaxPct: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <button
            onClick={updateLimits}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
          >
            {loading ? 'Updating...' : 'Update Limits'}
          </button>
        </div>

        {/* Info */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-yellow-200 text-sm">
            <strong>⚠️ Note:</strong> Changes take effect immediately but are not persisted to .env file. 
            Restart server or manually update .env for permanent changes.
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

export default function AdminLogin({ onAuth }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!token) {
      setError('Please enter admin token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Test token by hitting a simple endpoint
      const res = await fetch('/admin/trading/config', {
        headers: { 'x-admin-token': token }
      });

      if (res.ok) {
        localStorage.setItem('adminToken', token);
        if (onAuth) onAuth();
      } else {
        setError('Invalid admin token');
        setLoading(false);
      }
    } catch (e) {
      setError('Failed to authenticate - is backend running?');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-black/70 border border-pink-500/40">
      <h2 className="text-2xl font-bold text-pink-400 mb-4">🔐 Admin Login</h2>
      
      <div className="space-y-4">
        <input
          type="password"
          placeholder="Admin Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full px-4 py-3 bg-black/50 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-500 focus:shadow-[0_0_8px_rgba(236,72,153,0.5)]"
          onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
        />
        
        <button
          onClick={handleAuth}
          disabled={loading || !token}
          className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-[0_0_16px_rgba(236,72,153,0.8)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Authenticating...' : 'Authenticate'}
        </button>
        
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

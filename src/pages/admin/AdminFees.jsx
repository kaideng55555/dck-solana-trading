import React, { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';

export default function AdminFees() {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('24h');

  // Fetch stats
  const fetchStats = async () => {
    if (!token) {
      window.location.href = '/admin';
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/admin/fees/stats?period=${period}`, {
        headers: { 'x-admin-token': token }
      });
      
      if (!res.ok) throw new Error('Unauthorized or server error');
      
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events
  const fetchEvents = async () => {
    if (!token) return;
    
    try {
      const res = await fetch('/admin/fees/events?limit=50', {
        headers: { 'x-admin-token': token }
      });
      
      if (!res.ok) throw new Error('Failed to fetch events');
      
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
  };

  // Record test event
  const recordTestEvent = async () => {
    setLoading(true);
    
    try {
      const res = await fetch('/admin/fees/record', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          source: 'test',
          amountLamports: Math.floor(Math.random() * 10000000),
          note: 'Test event from dashboard'
        })
      });
      
      if (!res.ok) throw new Error('Failed to record event');
      
      await fetchStats();
      await fetchEvents();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30s
  useEffect(() => {
    if (token) {
      fetchStats();
      fetchEvents();
      const interval = setInterval(() => {
        fetchStats();
        fetchEvents();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [period, token]);

  if (!token) {
    return null;
  }

  return (
    <div className="relative w-full h-full bg-black text-white overflow-auto">
      <div className="absolute inset-0 bg-[url('/assets/cyber.png')] bg-cover bg-center opacity-40 -z-10" />
      <div className="px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-pink-400">Admin • Fees Received</h1>
          <AdminNav />
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-200">
            {error}
          </div>
        )}

        {/* Period Selector */}
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                period === p
                  ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                  : 'bg-black/50 text-pink-300 border border-pink-500/30 hover:bg-pink-500/10'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-black/70 border border-pink-500/40">
            <div className="text-pink-300/70 text-sm mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-green-400">
              {stats?.totalSol?.toFixed(4) || '0.0000'} SOL
            </div>
            <div className="text-pink-300/50 text-xs mt-1">
              ≈ ${((stats?.totalSol || 0) * 20).toFixed(2)} USD
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-black/70 border border-pink-500/40">
            <div className="text-pink-300/70 text-sm mb-2">Total Events</div>
            <div className="text-3xl font-bold text-blue-400">
              {stats?.totalEvents || 0}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-black/70 border border-pink-500/40">
            <div className="text-pink-300/70 text-sm mb-2">Avg per Event</div>
            <div className="text-3xl font-bold text-purple-400">
              {stats?.totalEvents
                ? ((stats.totalSol / stats.totalEvents) * 1000).toFixed(2)
                : '0.00'} mSOL
            </div>
          </div>
        </div>

        {/* Revenue by Source */}
        {stats?.bySource && Object.keys(stats.bySource).length > 0 && (
          <div className="p-6 rounded-3xl bg-black/70 border border-pink-500/40">
            <h2 className="text-xl font-bold text-white mb-4">Revenue by Source</h2>
            <div className="space-y-3">
              {Object.entries(stats.bySource).map(([source, data]) => (
                <div key={source}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-pink-300/70 capitalize">{source}</span>
                    <span className="text-white font-mono">
                      {data.totalSol.toFixed(4)} SOL ({data.count} events)
                    </span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                      style={{
                        width: `${(data.totalSol / (stats.totalSol || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="p-6 rounded-3xl bg-black/70 border border-pink-500/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Events</h2>
            <button
              onClick={recordTestEvent}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-xl disabled:opacity-50 transition-colors"
            >
              + Test Event
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pink-500/20">
                  <th className="text-left py-2 px-3 text-pink-300/70">Time</th>
                  <th className="text-left py-2 px-3 text-pink-300/70">Source</th>
                  <th className="text-right py-2 px-3 text-pink-300/70">Amount</th>
                  <th className="text-left py-2 px-3 text-pink-300/70">Note</th>
                </tr>
              </thead>
              <tbody>
                {events.slice().reverse().slice(0, 50).map((event, i) => (
                  <tr key={i} className="border-b border-pink-500/10 hover:bg-pink-500/5">
                    <td className="py-2 px-3 text-pink-300/70 font-mono text-xs">
                      {new Date(event.ts).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs capitalize">
                        {event.source}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-white font-mono">
                      {(event.amountLamports / 1e9).toFixed(4)} SOL
                    </td>
                    <td className="py-2 px-3 text-pink-300/50 text-xs">
                      {event.note || '-'}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-pink-300/50">
                      No fee events recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFees() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('24h');

  // Fetch stats
  const fetchStats = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/admin/fees/stats?period=${period}`, {
        headers: { 'x-admin-token': token }
      });
      
      if (!res.ok) throw new Error('Unauthorized or server error');
      
      const data = await res.json();
      setStats(data);
      setAuthenticated(true);
    } catch (e) {
      setError(e.message);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events
  const fetchEvents = async () => {
    if (!token) return;
    
    try {
      const res = await fetch('/admin/fees/events?limit=50', {
        headers: { 'x-admin-token': token }
      });
      
      if (!res.ok) throw new Error('Failed to fetch events');
      
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
  };

  // Record test event
  const recordTestEvent = async () => {
    setLoading(true);
    
    try {
      const res = await fetch('/admin/fees/record', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          source: 'test',
          amountLamports: Math.floor(Math.random() * 10000000),
          note: 'Test event from dashboard'
        })
      });
      
      if (!res.ok) throw new Error('Failed to record event');
      
      await fetchStats();
      await fetchEvents();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30s
  useEffect(() => {
    if (authenticated) {
      fetchStats();
      fetchEvents();
      const interval = setInterval(() => {
        fetchStats();
        fetchEvents();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, period]);

  // Auth form
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-purple-500/30">
            <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500">
              💰 Fees Dashboard
            </h1>
            
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Admin Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && fetchStats()}
              />
              
              <button
                onClick={fetchStats}
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

  // Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-pink-400">Admin • Fees Received</h1>
          <AdminNav />
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Period Selector */}
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <div className="text-gray-400 text-sm mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-green-400">
              {stats?.totalSol?.toFixed(4) || '0.0000'} SOL
            </div>
            <div className="text-gray-500 text-xs mt-1">
              ≈ ${((stats?.totalSol || 0) * 20).toFixed(2)} USD
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <div className="text-gray-400 text-sm mb-2">Total Events</div>
            <div className="text-3xl font-bold text-blue-400">
              {stats?.totalEvents || 0}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <div className="text-gray-400 text-sm mb-2">Avg per Event</div>
            <div className="text-3xl font-bold text-purple-400">
              {stats?.totalEvents
                ? ((stats.totalSol / stats.totalEvents) * 1000).toFixed(2)
                : '0.00'} mSOL
            </div>
          </div>
        </div>

        {/* Revenue by Source */}
        {stats?.bySource && Object.keys(stats.bySource).length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold text-white mb-4">Revenue by Source</h2>
            <div className="space-y-3">
              {Object.entries(stats.bySource).map(([source, data]) => (
                <div key={source}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{source}</span>
                    <span className="text-white font-mono">
                      {data.totalSol.toFixed(4)} SOL ({data.count} events)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{
                        width: `${(data.totalSol / (stats.totalSol || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Events</h2>
            <button
              onClick={recordTestEvent}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
            >
              + Test Event
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400">Time</th>
                  <th className="text-left py-2 px-3 text-gray-400">Source</th>
                  <th className="text-right py-2 px-3 text-gray-400">Amount</th>
                  <th className="text-left py-2 px-3 text-gray-400">Note</th>
                </tr>
              </thead>
              <tbody>
                {events.slice().reverse().slice(0, 50).map((event, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-700/30">
                    <td className="py-2 px-3 text-gray-400 font-mono text-xs">
                      {new Date(event.ts).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs capitalize">
                        {event.source}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-white font-mono">
                      {(event.amountLamports / 1e9).toFixed(4)} SOL
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">
                      {event.note || '-'}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No fee events recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

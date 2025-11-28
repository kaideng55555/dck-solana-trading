import { useState, useEffect, useRef } from 'react';

// WebSocket URL for real-time mints (connects to your QuickNode)
const WS_URL = import.meta.env.VITE_QUICKNODE_WSS || 'wss://ultra-ultra-fog.solana-mainnet.quiknode.pro/48fa88a641cbd2a15f2e0c4f8d9c96c41c70fcf5/';

export function useRealTimeMints(maxMints = 50) {
  const [mints, setMints] = useState([]);
  const [status, setStatus] = useState('disconnected');
  const wsRef = useRef(null);

  useEffect(() => {
    // For demo, generate mock mints if no WS available
    const isDemoMode = !import.meta.env.VITE_MINTS_WS_URL;
    
    if (isDemoMode) {
      setStatus('demo');
      // Generate demo mints
      const demoInterval = setInterval(() => {
        const newMint = {
          id: Date.now(),
          mint: generateRandomAddress(),
          name: `Demo Token #${Math.floor(Math.random() * 1000)}`,
          symbol: ['DCK', 'MOON', 'PUMP', 'BONK', 'WIF'][Math.floor(Math.random() * 5)],
          timestamp: Date.now(),
          supply: Math.floor(Math.random() * 1000000000),
        };
        setMints(prev => [newMint, ...prev].slice(0, maxMints));
      }, 3000);
      
      return () => clearInterval(demoInterval);
    }

    // Real WebSocket connection
    const connect = () => {
      setStatus('connecting');
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => setStatus('connected');
      wsRef.current.onclose = () => {
        setStatus('disconnected');
        setTimeout(connect, 5000); // Reconnect after 5s
      };
      wsRef.current.onerror = () => setStatus('error');
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.mint) {
            setMints(prev => [{ ...data, id: Date.now() }, ...prev].slice(0, maxMints));
          }
        } catch (e) {
          console.error('Failed to parse mint event:', e);
        }
      };
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [maxMints]);

  return { mints, status };
}

function generateRandomAddress() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  return Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function RealTimeMints() {
  const { mints, status } = useRealTimeMints();

  const statusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
    demo: 'bg-purple-500',
    error: 'bg-red-500',
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">🚀 Real-Time Mints</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}></div>
          <span className="text-xs text-gray-400 capitalize">{status}</span>
        </div>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {mints.length === 0 ? (
          <div className="text-gray-500 text-center py-4">Waiting for new mints...</div>
        ) : (
          mints.map((mint) => (
            <div 
              key={mint.id} 
              className="flex items-center justify-between bg-[#252525] rounded p-2 hover:bg-[#2a2a2a] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-pink-400 font-mono text-sm">
                  {mint.mint?.slice(0, 6)}...{mint.mint?.slice(-4)}
                </span>
                {mint.symbol && (
                  <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded">
                    {mint.symbol}
                  </span>
                )}
              </div>
              <span className="text-gray-500 text-xs">
                {new Date(mint.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';

interface TokenUpdate {
  mint: string;
  symbol: string;
  name: string;
  price: number;
  volume24h: number;
  marketCap: number;
  change24h: number;
  holders: number;
}

interface WebSocketClient {
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channels: string[]) => void;
}

export default function useRealWS(): WebSocketClient {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const eventListeners = useRef<Map<string, Set<Function>>>(new Map());

  const connect = () => {
    try {
      const wsUrl = (import.meta as any).env.VITE_MINTS_STREAM_URL || 'ws://localhost:8000/ws/new-mints';
      console.log(`🔌 Connecting to Real WS: ${wsUrl}`);
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('🔥 DCK$ TOOLS - Connected to REAL live data feed!');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle backend "mint" events
          if (data.mint) {
             const newTokenPayload = {
                address: data.mint,
                name: data.name || 'Unknown',
                symbol: data.symbol || 'UNK',
                icon: '', 
                marketCap: 0, // Initial cap
                soldSupply: 0,
                totalSupply: 1000000000,
                timestamp: data.timestamp
             };

             // Emit as 'newToken'
             const listeners = eventListeners.current.get('newToken');
             if (listeners) {
               listeners.forEach(callback => callback(newTokenPayload));
             }
          }

          // Handle legacy DEXScreener format if still used or mixed
          if (data.type === 'token_update') {
            const listeners = eventListeners.current.get('tokenUpdate');
            if (listeners) {
              listeners.forEach(callback => callback(data.payload));
            }
          }
          
          if (data.type === 'new_token') {
            const listeners = eventListeners.current.get('newToken');
            if (listeners) {
              listeners.forEach(callback => callback(data.payload));
            }
          }
          
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        setIsConnected(false);
        // Auto-reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  };

  const subscribe = (channels: string[]) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        channels
      }));
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    eventListeners.current.get(event)?.add(callback);
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (callback) {
      eventListeners.current.get(event)?.delete(callback);
    } else {
      eventListeners.current.delete(event);
    }
  };

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  // Also connect to Solana WebSocket for real-time transaction data
  useEffect(() => {
    const solanaWs = new WebSocket('wss://api.mainnet-beta.solana.com');
    
    solanaWs.onopen = () => {
      console.log('🚀 Connected to Solana mainnet WebSocket');
      
      // Subscribe to program account changes (new token launches)
      solanaWs.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'programSubscribe',
        params: [
          '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P', // Pump.fun program ID
          {
            commitment: 'confirmed',
            encoding: 'base64'
          }
        ]
      }));
    };

    solanaWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.method === 'programNotification') {
          // New pump.fun token detected!
          const listeners = eventListeners.current.get('newPumpToken');
          if (listeners) {
            listeners.forEach(callback => callback(data.params));
          }
        }
      } catch (error) {
        console.error('Solana WebSocket error:', error);
      }
    };

    return () => {
      solanaWs.close();
    };
  }, []);

  return {
    on,
    off,
    connect,
    disconnect,
    subscribe
  };
}

/*
## Testing Strategy
- **Vitest**: Used for unit and component testing.
- **Real-time**: `useRealWS.ts` handles live WebSocket connections (QuickNode).
- **Setup**: `src/test/setup.ts` configures the test environment.
*/
import { useEffect, useState } from 'react';

export function useTradesStream(contract) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!contract) return;

    const ws = new WebSocket(`ws://localhost:3001/stream/trades?token=${encodeURIComponent(contract)}`);
    
    ws.onmessage = (e) => {
      try {
        const trade = JSON.parse(e.data);
        setEvents(prev => [...prev.slice(-100), trade]);
      } catch (err) {
        console.error('Failed to parse trade:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => ws.close();
  }, [contract]);

  return { events };
}

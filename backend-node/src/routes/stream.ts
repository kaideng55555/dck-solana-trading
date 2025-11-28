import type { Express, Request, Response } from 'express';
import type { WebSocketServer } from 'ws';
import { TradeEvent } from './TradeEvent';

type Client = { res: Response; filter: Set<string> | null };
const clients: Set<Client> = new Set();

// WebSocket server for dev trades
let devWss: WebSocketServer | null = null;
let tradeInterval: NodeJS.Timeout | null = null;

// Realistic demo token contracts (pump.fun style addresses)
const DEMO_CONTRACTS = [
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK-style
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC-style
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', // POPCAT-style
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP-style
];

// Track price momentum per contract for realistic patterns
const priceState: Map<string, { price: number; momentum: number; volume24h: number }> = new Map();

function initPriceState(contract: string) {
  if (!priceState.has(contract)) {
    priceState.set(contract, {
      price: 0.00001 + Math.random() * 0.001, // Starting price: $0.00001 - $0.001
      momentum: 0,
      volume24h: Math.random() * 50000,
    });
  }
  return priceState.get(contract)!;
}

function generateRealisticTrade(): TradeEvent {
  const contract = DEMO_CONTRACTS[Math.floor(Math.random() * DEMO_CONTRACTS.length)];
  const state = initPriceState(contract);
  
  // Determine trade side with momentum bias
  // More buys when momentum positive, more sells when negative
  const momentumBias = state.momentum * 0.3;
  const side: 'buy' | 'sell' = Math.random() > (0.5 - momentumBias) ? 'buy' : 'sell';
  
  // Realistic SOL amounts with power-law distribution (many small, few large)
  const tradeSize = Math.random();
  let amountUi: number;
  if (tradeSize < 0.7) {
    // 70% small trades: 0.1 - 5 SOL
    amountUi = 0.1 + Math.random() * 4.9;
  } else if (tradeSize < 0.95) {
    // 25% medium trades: 5 - 50 SOL
    amountUi = 5 + Math.random() * 45;
  } else {
    // 5% whale trades: 50 - 500 SOL
    amountUi = 50 + Math.random() * 450;
  }
  amountUi = Number(amountUi.toFixed(4));
  
  // Price movement based on trade size and side
  const impact = (amountUi / 100) * 0.02; // Larger trades = more impact
  const priceChange = side === 'buy' ? impact : -impact;
  const volatility = (Math.random() - 0.5) * 0.01; // Random noise
  
  state.price = Math.max(0.000001, state.price * (1 + priceChange + volatility));
  state.momentum = state.momentum * 0.9 + (side === 'buy' ? 0.1 : -0.1); // Decay + new signal
  state.volume24h += amountUi * state.price;
  
  // Generate realistic wallet address prefix
  const walletChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  const wallet = Array.from({ length: 44 }, () => 
    walletChars[Math.floor(Math.random() * walletChars.length)]
  ).join('');
  
  return {
    contract,
    side,
    amountUi,
    priceUi: Number(state.price.toFixed(9)),
    ts: Date.now(),
    wallet,
  };
}

export function initDevTrades(wss: WebSocketServer) {
  devWss = wss;
  console.log('📡 Dev trades WebSocket initialized');
  
  // Start synthetic trade broadcasting
  startTradeLoop();
  
  // Check for disconnects
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    console.log(`WebSocket client connected: ${token || 'unknown'}`);
    
    // Send initial state on connect
    const welcome = { type: 'connected', contracts: DEMO_CONTRACTS, ts: Date.now() };
    ws.send(JSON.stringify(welcome));
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Stop loop if no clients
      if (wss.clients.size === 0) {
        stopTradeLoop();
      }
    });
  });
}

function startTradeLoop() {
  if (tradeInterval) return;
  
  // Variable interval: 500ms - 3000ms for realistic trading patterns
  const scheduleNext = () => {
    const delay = 500 + Math.random() * 2500; // Random delay between trades
    tradeInterval = setTimeout(() => {
      if (!devWss || devWss.clients.size === 0) {
        stopTradeLoop();
        return;
      }
      
      const trade = generateRealisticTrade();
      const payload = JSON.stringify(trade);
      
      devWss.clients.forEach(client => {
        if (client.readyState === 1) client.send(payload);
      });
      
      // Also publish to SSE clients
      publishTrade(trade);
      
      scheduleNext();
    }, delay);
  };
  
  scheduleNext();
}

function stopTradeLoop() {
  if (tradeInterval) {
    clearTimeout(tradeInterval);
    tradeInterval = null;
    console.log('📡 Trade loop stopped (no clients)');
  }
}

function send(res: Response, data: any) { res.write(`data: ${JSON.stringify(data)}\n\n`); }
export function publishTrade(ev: TradeEvent) {
  // Broadcast to SSE clients
  for (const c of clients) { if (c.filter && !c.filter.has(ev.contract)) continue; try { send(c.res, ev); } catch {} }
  // Broadcast to WebSocket clients
  if (devWss) {
    const payload = JSON.stringify(ev);
    devWss.clients.forEach(client => {
      if (client.readyState === 1) client.send(payload); // 1 = OPEN
    });
  }
}
export function getContractsWatchlist(): string[] {
  // Return all unique contracts being watched
  const contracts = new Set<string>();
  for (const c of clients) {
    if (c.filter) {
      for (const contract of c.filter) contracts.add(contract);
    }
  }
  return Array.from(contracts);
}
export function registerStreamRoutes(app: Express) {
  app.get('/stream/trades', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream'); res.setHeader('Cache-Control', 'no-cache'); res.setHeader('Connection', 'keep-alive'); (res as any).flushHeaders?.();
    const filterParam = (req.query.contracts as string | undefined)?.trim();
    const filter = filterParam ? new Set(filterParam.split(',').map(s => s.trim()).filter(Boolean)) : null;
    const c: Client = { res, filter }; clients.add(c);
    const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 15000);
    req.on('close', () => { clearInterval(hb); clients.delete(c); });
  });
  app.post('/dev/pushTrade', (req: Request, res: Response) => {
    if (process.env.DEV_STREAM !== 'true') return res.status(403).json({ error: 'disabled' });
    const ev = { ...req.body, ts: Date.now() }; publishTrade(ev as any); res.json({ ok: true });
  });
}

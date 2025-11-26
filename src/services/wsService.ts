/**
 * New Mints stream service.
 * Supports native WebSocket or Socket.IO depending on env config.
 *
 * Env:
 *  - VITE_MINTS_STREAM_URL: ws(s)://... OR http(s)://... (for socket.io)
 *  - VITE_MINTS_TRANSPORT: "ws" | "socket.io"  (default: "ws")
 */

import { Connection, PublicKey } from '@solana/web3.js';

export type MintEvent = {
  mint: string
  name?: string
  symbol?: string
  image?: string
  timestamp?: number
  supply?: number
  creators?: string[]
  mintAuthorityRevoked?: boolean
  freezeAuthorityRevoked?: boolean
  holders?: number
  topHolderPct?: number
  market?: { birdeye?: string; gmgn?: string; solscan?: string; pump?: string }
}

const URL = (import.meta as any).env?.VITE_MINTS_STREAM_URL as string | undefined;
const TRANSPORT = ((import.meta as any).env?.VITE_MINTS_TRANSPORT as 'ws' | 'socket.io' | undefined) || 'ws';

export function subscribeToNewMints(onEvent: (e: MintEvent) => void, onStatus?: (s: 'connecting'|'open'|'closed'|'error') => void) {
  if (!URL) {
    console.warn('VITE_MINTS_STREAM_URL is not set; using demo generator');
    return demoGenerator(onEvent, onStatus);
  }

  // Check if this is a Solana RPC URL (QuickNode, Helius, etc)
  const isSolanaRpc = URL.includes('solana') || URL.includes('quiknode') || URL.includes('helius') || URL.includes('alchemy');
  
  if (isSolanaRpc && TRANSPORT === 'ws') {
    return subscribeToSolanaRpc(URL, onEvent, onStatus);
  }

  if (TRANSPORT === 'socket.io') {
    // lazy import to keep bundle lean if not used
    // npm i socket.io-client if you use this
    // @ts-ignore
    return import('socket.io-client').then(({ io }) => {
      onStatus?.('connecting');
      const socket = io(URL, { transports: ['websocket'] });
      socket.on('connect', () => onStatus?.('open'));
      socket.on('disconnect', () => onStatus?.('closed'));
      socket.on('connect_error', () => onStatus?.('error'));
      socket.on('new-mint', (payload: MintEvent) => onEvent(payload));
      return () => socket.close();
    });
  }

  // default: native WebSocket
  onStatus?.('connecting');
  const ws = new WebSocket(URL);
  ws.addEventListener('open', () => onStatus?.('open'));
  ws.addEventListener('close', () => onStatus?.('closed'));
  ws.addEventListener('error', () => onStatus?.('error'));
  ws.addEventListener('message', (ev) => {
    try {
      const data = JSON.parse(ev.data as string) as MintEvent | MintEvent[];
      if (Array.isArray(data)) data.forEach(onEvent);
      else onEvent(data);
    } catch {}
  });
  return () => ws.close();
}

// Handle Solana RPC subscription for new mints
function subscribeToSolanaRpc(url: string, onEvent: (e: MintEvent) => void, onStatus?: (s: any) => void) {
  onStatus?.('connecting');
  const ws = new WebSocket(url);
  
  // Create connection for fetching tx details
  const httpUrl = url.replace('wss://', 'https://').replace('ws://', 'http://');
  const connection = new Connection(httpUrl, 'confirmed');

  ws.onopen = () => {
    onStatus?.('open');
    // Subscribe to logs for Metaplex Metadata Program to detect new mints
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'logsSubscribe',
      params: [
        { mentions: ['metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'] },
        { commitment: 'confirmed' }
      ]
    }));
  };

  ws.onmessage = async (ev) => {
    try {
      const msg = JSON.parse(ev.data as string);
      
      // Handle subscription confirmation
      if (msg.result !== undefined && msg.id === 1) {
        console.log('Subscribed to Solana logs:', msg.result);
        return;
      }

      if (msg.method === 'logsNotification') {
        const signature = msg.params.result.value.signature;
        const logs = msg.params.result.value.logs as string[];
        
        // Basic check if it looks like a creation
        const isCreation = logs.some(l => l.includes('Create Metadata Account') || l.includes('Instruction: CreateMetadataAccount'));
        
        if (isCreation) {
          // Fetch transaction to get details
          try {
            const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
            if (!tx || !tx.meta) return;

            // Try to find the mint address from postTokenBalances
            // Usually the mint has a supply change or is involved in the instruction
            const mint = tx.meta.postTokenBalances?.find(b => b.mint !== 'So11111111111111111111111111111111111111112')?.mint;
            
            if (mint) {
              onEvent({
                mint,
                timestamp: tx.blockTime || Math.floor(Date.now()/1000),
                market: {
                  solscan: `https://solscan.io/token/${mint}`,
                  birdeye: `https://birdeye.so/token/${mint}`,
                  gmgn: `https://gmgn.ai/sol/token/${mint}`,
                  pump: `https://pump.fun/coin/${mint}`
                }
              });
              console.log('🚀 NEW TOKEN LAUNCHED:', mint);
            }
          } catch (e) {
            console.error('Error fetching tx details:', e);
          }
        }
      }
    } catch (e) {
      console.error('Error processing WS message:', e);
    }
  };

  ws.onerror = () => onStatus?.('error');
  ws.onclose = () => onStatus?.('closed');

  return () => ws.close();
}

// Local demo generator if no stream configured
function demoGenerator(onEvent: (e: MintEvent) => void, onStatus?: (s:any)=>void) {
  onStatus?.('open');
  let i = 1;
  const id = setInterval(() => {
    const mint = cryptoRandomBase58();
    onEvent({
      mint,
      name: `Demo Mint #${i}`,
      symbol: 'DEMO',
      image: `https://picsum.photos/seed/${mint}/80/80`,
      timestamp: Math.floor(Date.now()/1000),
      supply: 1111,
      mintAuthorityRevoked: Math.random() > 0.6,
      freezeAuthorityRevoked: Math.random() > 0.6,
      holders: Math.floor(100 + Math.random()*900),
      topHolderPct: Math.round( (5 + Math.random()*40) * 10 )/10,
      market: {
        solscan: `https://solscan.io/token/${mint}`,
        birdeye: `https://birdeye.so/token/${mint}`,
        gmgn: `https://gmgn.ai/sol/token/${mint}`,
        pump: `https://pump.fun/coin/${mint}`
      }
    });
    i++;
  }, 1800);
  return () => clearInterval(id);
}

// tiny base58-ish for demo
function cryptoRandomBase58(len=44) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let out = '';
  for (let i=0; i<len; i++) out += alphabet[Math.floor(Math.random()*alphabet.length)];
  return out;
}
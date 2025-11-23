import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { Connection, PublicKey } from '@solana/web3.js';

const app = express();
const PORT = process.env.PORT || 3001;

// QuickNode Solana connection
const connection = new Connection(
  process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// QuickNode WebSocket URL for real-time subscriptions
const QUICKNODE_WS_URL = process.env.QUICKNODE_WS_URL || 
  process.env.RPC_URL?.replace('https://', 'wss://') || 
  'wss://api.mainnet-beta.solana.com';

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (_, res) => {
  res.json({ status: 'DCK$ TOOLS Node backend running' });
});

// Real price endpoint - connects to Solana for actual token prices
app.get('/price/:tokenAddress', async (req, res) => {
  const { tokenAddress } = req.params;
  
  try {
    // TODO: implement real price fetch using Jupiter aggregator or DEX APIs
    // For now, fetch from DEXScreener
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await response.json() as any;
    
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      res.json({
        token: tokenAddress,
        price: parseFloat(pair.priceUsd),
        marketCap: parseFloat(pair.marketCap),
        volume24h: parseFloat(pair.volume24h),
        change24h: parseFloat(pair.priceChange24h)
      });
    } else {
      res.json({ token: tokenAddress, price: 0, error: 'Token not found' });
    }
  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// Token info endpoint - real Solana token data
app.get('/token/:tokenAddress', async (req, res) => {
  const { tokenAddress } = req.params;
  
  try {
    const mintPubkey = new PublicKey(tokenAddress);
    const tokenSupply = await connection.getTokenSupply(mintPubkey);
    
    res.json({
      token: tokenAddress,
      supply: tokenSupply.value.uiAmount,
      decimals: tokenSupply.value.decimals
    });
  } catch (error) {
    console.error('Error fetching token info:', error);
    res.status(500).json({ error: 'Failed to fetch token info' });
  }
});

// Bonding curve progress endpoint
app.get('/bonding-curve/:tokenAddress', async (req, res) => {
  const { tokenAddress } = req.params;
  
  try {
    // TODO: Implement real bonding curve progress calculation
    // This would query the pump.fun program account data
    
    // For now, return mock progress based on market cap
    const priceResponse = await fetch(`http://localhost:${PORT}/price/${tokenAddress}`);
    const priceData = await priceResponse.json() as any;
    
    const marketCap = priceData.marketCap || 0;
    let progress = 0;
    
    if (marketCap > 150000) progress = 1.0; // Graduated
    else if (marketCap > 30000) progress = 0.7; // About to graduate
    else progress = marketCap / 100000; // New token progress
    
    res.json({
      token: tokenAddress,
      progress: Math.min(progress, 1.0),
      marketCap,
      stage: progress >= 1.0 ? 'graduated' : progress > 0.4 ? 'graduating' : 'new'
    });
  } catch (error) {
    console.error('Error calculating bonding curve:', error);
    res.status(500).json({ error: 'Failed to calculate bonding curve' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 DCK$ TOOLS Node backend listening on port ${PORT}`);
});

// WebSocket server for real-time data
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('📡 New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'subscribe') {
        console.log(`🔔 Client subscribed to: ${data.tokens?.join(', ')}`);
        
        // TODO: Set up real-time token price monitoring
        // This would subscribe to DEX APIs or Solana account changes
        
        ws.send(JSON.stringify({
          type: 'subscription_confirmed',
          tokens: data.tokens
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('📡 WebSocket connection closed');
  });
  
  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to DCK$ TOOLS real-time data feed'
  }));
});
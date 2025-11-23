import express from 'express'
import http from 'http'
import cors from 'cors'
import { Connection, PublicKey } from '@solana/web3.js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server

const PORT = process.env.PORT || 8000
const QUICKNODE_HTTP = process.env.QUICKNODE_HTTP
const QUICKNODE_WSS  = process.env.QUICKNODE_WSS
if (!QUICKNODE_HTTP || !QUICKNODE_WSS) {
  console.error('❌ Set QUICKNODE_HTTP and QUICKNODE_WSS env vars before starting.')
  process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws/new-mints' })

// Track clients
const clients = new Set()
wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
  ws.send(JSON.stringify({ type:'status', source:'quicknode', live:true, ts:Date.now() }))
})

function broadcast(obj) {
  const msg = typeof obj === 'string' ? obj : JSON.stringify(obj)
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(msg)
  }
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok:true, source:'quicknode', wsClients: clients.size, ts: Date.now() })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend (REAL) http://localhost:${PORT}`)
  console.log(`    WS → ws://localhost:${PORT}/ws/new-mints`)
})

// ----- SOLANA SUBSCRIPTION (REAL) -----
// Metaplex Token Metadata program = catches new metadata accounts (new mints)
const MPL_METADATA = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Use HTTP for RPC + WS for subscriptions
const connection = new Connection(QUICKNODE_HTTP, {
  wsEndpoint: QUICKNODE_WSS,
  commitment: 'confirmed'
})

console.log('⏳ Connecting to QuickNode WSS…')
let subId = null

// Helper: emit a minimal “mint event” by inspecting a tx
async function emitFromSignature(signature, slot) {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0
    })
    // Try to guess the mint address from postTokenBalances or account keys
    let mint = tx?.meta?.postTokenBalances?.[0]?.mint || null
    
    // If we found a mint, enhance the event with market links
    if (mint) {
        const evt = {
            mint,
            name: 'New Mint', // Placeholder, would need metadata fetch
            symbol: 'UNK',    // Placeholder
            timestamp: tx.blockTime || Math.floor(Date.now()/1000),
            market: {
                solscan: `https://solscan.io/token/${mint}`,
                birdeye: `https://birdeye.so/token/${mint}`,
                gmgn: `https://gmgn.ai/sol/token/${mint}`,
                pump: `https://pump.fun/coin/${mint}`
            }
        }
        broadcast(evt)
    } else {
        // Fallback if mint not found immediately
        broadcast({ type:'mint', signature, slot, ts:Date.now() })
    }
  } catch (e) {
    broadcast({ type:'mint', signature, slot, ts:Date.now() })
  }
}

// Subscribe to logs that mention the Metaplex metadata program
try {
  subId = connection.onLogs(MPL_METADATA, async (logInfo) => {
    // Each log has a signature; fetch parsed tx to extract mint if possible
    const { signature, slot } = logInfo
    emitFromSignature(signature, slot)
  }, 'confirmed');
  console.log('🟢 QuickNode logsSubscribe → Metaplex metadata (LIVE)')
} catch (err) {
  console.error('logsSubscribe error:', err)
}

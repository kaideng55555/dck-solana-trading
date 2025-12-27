# DCK$ TOOLS - Solana Trading System

Full-stack Solana trading platform with real-time token discovery, analytics, and trading capabilities.

## Features

- 🚀 Real-time token discovery and tracking
- 📊 Advanced DEX analytics
- 🎯 Quick snipe functionality
- 💎 NFT gallery and reveals
- 📈 Live price charts and trades
- 🔐 Wallet integration

## Tech Stack

### Frontend
- React 18 + Vite
- TypeScript/JavaScript
- Tailwind CSS with custom neon theme
- Solana Web3.js
- Wallet Adapter

### Backend (Node.js)
- Express + TypeScript
- WebSocket (ws) for real-time updates
- SSE for event streams
- Solana RPC integration

### Backend (Python)
- FastAPI
- SQLite for analytics
- WebSocket support

## Development

### Prerequisites
- Node.js 20+
- Python 3.9+
- Solana CLI (optional)

### Setup

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend-node
npm install
cd ..

# Install Python backend
cd backend-python
pip install -r requirements.txt
cd ..
```

### Running Locally

```bash
# Terminal 1: Frontend
npm run dev
# Runs on http://localhost:5173

# Terminal 2: Node Backend
cd backend-node
npm run dev
# Runs on http://localhost:3001

# Terminal 3: Python Backend (optional)
cd backend-python
uvicorn main:app --reload --port 8000
```

### Environment Variables

Create `.env` files in respective directories:

**backend-node/.env**:
```env
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
RPC_HTTP=https://api.mainnet-beta.solana.com
QUICKNODE_HTTP=your-quicknode-endpoint
QUICKNODE_WSS=your-quicknode-wss-endpoint
SENTRY_DSN=your-sentry-dsn (optional)
```

**Root .env**:
```env
VITE_API_URL=http://localhost:3001
VITE_MINTS_STREAM_URL=ws://localhost:3001/stream/mints
VITE_ENABLE_DEMO_MODE=true
```

## Testing

```bash
# Run frontend tests
npm run test

# Run API smoke tests
npm run smoke:api

# Run with custom API base
API_BASE=https://api.dcktoken.com npm run smoke:api
```

## Server Deployment (Hetzner)

### PM2 Process Management

```bash
# Start services
pm2 start ecosystem.config.js

# View logs
pm2 logs dck-backend-node
pm2 logs dck-backend-python

# Restart services
pm2 restart dck-backend-node
pm2 restart dck-backend-python

# Stop services
pm2 stop all

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

### Nginx Configuration

Configuration file: `/etc/nginx/sites-available/dck-api.conf`

```nginx
server {
    listen 80;
    server_name api.dcktoken.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /stream {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/dck-api.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL/TLS with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.dcktoken.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

### Required Environment Keys

**Production .env** (backend-node):
```env
PORT=3001
ALLOWED_ORIGINS=https://dcktoken.com,https://app.dcktoken.com
RPC_HTTP=https://your-mainnet-rpc.com
QUICKNODE_HTTP=https://your-quicknode-endpoint.quiknode.pro/xxxxx/
QUICKNODE_WSS=wss://your-quicknode-endpoint.quiknode.pro/xxxxx/
SENTRY_DSN=https://xxx@sentry.io/xxx
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120

# Admin & Trading Guard
ADMIN_TOKEN=change-me-super-secret-in-production
TRADING_PUBLIC=0                    # 0=closed beta, 1=public
ALLOWED_WALLETS=Wallet1,Wallet2     # comma-separated base58 pubkeys
MIN_LIQ_USD=3000
MIN_TOKEN_AGE_MINUTES=20
MAX_TAX_PCT=10
```

### Admin System Deployment

The admin panel allows you to control trading access and monitor fees.

**1. Configure Admin Token**
```bash
# Edit .env on server
sudo nano /opt/dck/backend-node/.env

# Set secure admin token
ADMIN_TOKEN=your-secure-random-token-here

# Configure trading guard
TRADING_PUBLIC=0                    # Start in closed beta
ALLOWED_WALLETS=YourWallet1,YourWallet2
MIN_LIQ_USD=3000
MIN_TOKEN_AGE_MINUTES=20
MAX_TAX_PCT=10
```

**2. Restart Backend**
```bash
pm2 restart dck-api
pm2 logs dck-api --lines 50
```

**3. Verify Admin Endpoints**
```bash
# Test without token (expect 403 or 500)
curl -s https://api.dcktoken.com/admin/trading/config | jq .

# Test with token (expect config)
curl -s https://api.dcktoken.com/admin/trading/config \
  -H 'x-admin-token: your-secure-token' | jq .

# Toggle trading public
curl -s -X POST https://api.dcktoken.com/admin/trading/toggle \
  -H 'content-type: application/json' \
  -H 'x-admin-token: your-secure-token' \
  -d '{"public":true}' | jq .

# Add wallet to allowlist
curl -s -X POST https://api.dcktoken.com/admin/trading/wallets/add \
  -H 'content-type: application/json' \
  -H 'x-admin-token: your-secure-token' \
  -d '{"wallet":"YourWalletBase58Address"}' | jq .

# Remove wallet from allowlist
curl -s -X POST https://api.dcktoken.com/admin/trading/wallets/remove \
  -H 'content-type: application/json' \
  -H 'x-admin-token: your-secure-token' \
  -d '{"wallet":"YourWalletBase58Address"}' | jq .

# Update trading limits
curl -s -X POST https://api.dcktoken.com/admin/trading/limits \
  -H 'content-type: application/json' \
  -H 'x-admin-token: your-secure-token' \
  -d '{"minLiqUsd":5000,"minTokenAgeMinutes":30,"maxTaxPct":5}' | jq .

# Record a fee event
curl -s -X POST https://api.dcktoken.com/admin/fees/record \
  -H 'content-type: application/json' \
  -H 'x-admin-token: your-secure-token' \
  -d '{"source":"jito","amountLamports":2500000,"tx":"sig...","note":"Bundle tip"}' | jq .

# Get fee stats (24h/7d/30d)
curl -s https://api.dcktoken.com/admin/fees/stats?period=24h \
  -H 'x-admin-token: your-secure-token' | jq .
```

**Trading Guard in Action**
```bash
# Blocked without allowlist (expect 403 in closed beta)
curl -s -X POST https://api.dcktoken.com/snipe/intent \
  -H 'content-type: application/json' \
  -d '{"mint":"So11111111111111111111111111111111111111112","lamports":500000}' | jq .

# Allowed with x-wallet header (allowlisted wallet)
curl -s -X POST https://api.dcktoken.com/snipe/intent \
  -H 'content-type: application/json' \
  -H 'x-wallet: YourWalletBase58' \
  -d '{"mint":"So11111111111111111111111111111111111111112","lamports":500000}' | jq .

# Admin bypass (always works)
curl -s -X POST https://api.dcktoken.com/snipe/intent \
  -H 'content-type: application/json' \
  -H 'x-admin-token: your-secure-token' \
  -d '{"mint":"So11111111111111111111111111111111111111112","lamports":500000}' | jq .
```

**4. Access Admin Dashboard**
```
https://app.dcktoken.com/admin
```

Login with your `ADMIN_TOKEN`, then:
- `/admin/switches` - Control trading access (public/beta, allowlist, safety limits)
- `/admin/fees` - Monitor revenue and fee events

**Admin Features:**
- 🔒 **Trading Guard**: Protect snipe/sell endpoints with allowlist or public mode
- 💰 **Fee Tracking**: Record and monitor Jito tips, bot profits, etc.
- 👥 **Allowlist Management**: Add/remove wallets in real-time
- ⚙️ **Safety Limits**: Configure min liquidity, token age, max tax
- 🔄 **Live Updates**: Changes take effect immediately (persist with server restart)


## API Endpoints

### Health & Status
- `GET /` - API status
- `GET /healthz` - Health check
- `GET /readyz` - Readiness check

### Fees
- `GET /fees/suggest` - Get priority fee suggestions
- `GET /fees/suggest?mult=1.5` - Get fees with multiplier

### Risk Analysis
- `GET /risk/:mint` - Get risk score for token
- `POST /risk/batch` - Batch risk analysis

### Presets
- `GET /presets/encode?params` - Encode filter preset
- `GET /presets/decode/:code` - Decode preset code

### Social & Streaming
- `GET /social/stream` - SSE social sentiment stream
- `GET /stream/trades?token=MINT` - WebSocket live trades

### Trading
- `POST /snipe/intent` - Create snipe intent (protected by trading guard)
- `POST /sell/intent` - Create sell intent (protected by trading guard)

### Admin (Protected)
All admin endpoints require `x-admin-token` header.

**Trading Control:**
- `GET /admin/trading/config` - Get current configuration
- `POST /admin/trading/toggle` - Toggle public/closed beta mode
- `POST /admin/trading/wallets/add` - Add wallet to allowlist
- `POST /admin/trading/wallets/remove` - Remove wallet from allowlist
- `POST /admin/trading/limits` - Update safety limits

**Fee Tracking:**
- `POST /admin/fees/record` - Record fee event
- `GET /admin/fees/events` - Query fee history
- `GET /admin/fees/stats?period=24h` - Get aggregated stats (24h/7d/30d)
- `DELETE /admin/fees/events` - Clear all events

## Architecture

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed architecture documentation.

## License

MIT

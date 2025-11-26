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
```

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
- `POST /snipe/intent` - Create snipe intent

## Architecture

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed architecture documentation.

## License

MIT

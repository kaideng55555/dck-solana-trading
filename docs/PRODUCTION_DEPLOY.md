# Production Deployment Guide

Complete guide for deploying DCK$ Tools to production with PM2, nginx, and SSL.

## Prerequisites

- Ubuntu/Debian server with root access
- Domain pointing to your server (e.g., `api.dcktoken.com`)
- QuickNode Solana RPC endpoint (recommended)
- Node.js 18+ installed
- Git installed

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/kaideng55555/dck-solana-trading.git
cd dck-solana-trading

# 2. Setup nginx + SSL
cd scripts
sudo bash setup-nginx-ssl.sh
sudo certbot --nginx -d api.dcktoken.com --email admin@dcktoken.com --agree-tos

# 3. Deploy with PM2
export QUICKNODE_RPC="https://your-quicknode-endpoint.solana-mainnet.quiknode.pro/..."
export ADMIN_TOKEN="$(openssl rand -hex 32)"  # Generate secure token
bash pm2-deploy.sh

# 4. Verify
curl -s https://api.dcktoken.com/healthz | jq .
```

## Step-by-Step Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y git nginx certbot python3-certbot-nginx ufw nodejs npm

# Install PM2
sudo npm install -g pm2

# Create deployment directory
sudo mkdir -p /opt/dcktoken/api
sudo chown $USER:$USER /opt/dcktoken/api
```

### 2. Clone & Build

```bash
# Clone repository
cd /opt/dcktoken/api
git clone https://github.com/kaideng55555/dck-solana-trading.git .

# Install backend dependencies
cd backend-node
npm install
```

### 3. Configure Environment

Create `/opt/dcktoken/api/backend-node/.env`:

```bash
# Server
PORT=3001
NODE_ENV=production

# Security
ADMIN_TOKEN=your-super-secret-token-here

# Trading Configuration
TRADING_PUBLIC=0              # 0=closed beta, 1=public
MIN_RISK_SCORE=50             # 0-100, reject below this
ALLOWED_WALLETS=              # Comma-separated for closed beta
ALLOWED_ORIGINS=https://dcktoken.com,http://localhost:5173

# Solana RPC
QUICKNODE_RPC=https://your-quicknode-endpoint.solana-mainnet.quiknode.pro/...

# Content
SITE_URL=https://dcktoken.com
INTRO_VIDEO_URL=https://dcktoken.com/assets/intro.mp4
```

### 4. Setup Nginx + SSL

```bash
cd /opt/dcktoken/api/scripts

# Edit values in setup-nginx-ssl.sh if needed
# Default: DOMAIN=api.dcktoken.com, UPSTREAM=127.0.0.1:3001

# Run setup
sudo bash setup-nginx-ssl.sh

# Get SSL certificate
sudo certbot --nginx -d api.dcktoken.com \
  --email admin@dcktoken.com \
  --agree-tos --non-interactive

# Verify
curl -I https://api.dcktoken.com/healthz
```

### 5. Deploy with PM2

```bash
cd /opt/dcktoken/api/scripts

# Option A: Use deployment script
export QUICKNODE_RPC="https://your-endpoint..."
export ADMIN_TOKEN="your-secret-token"
bash pm2-deploy.sh

# Option B: Manual PM2 start
cd /opt/dcktoken/api/backend-node
pm2 start ecosystem.config.js
pm2 save

# Setup auto-start on boot
pm2 startup
# Copy and run the sudo command it prints
```

### 6. Verify Deployment

```bash
# Check PM2 status
pm2 status
pm2 logs dck-api

# Test health endpoints
curl -s https://api.dcktoken.com/healthz | jq .
curl -s https://api.dcktoken.com/readyz | jq .

# Test admin (use your ADMIN_TOKEN)
curl -s https://api.dcktoken.com/admin/config \
  -H "x-admin-token: your-secret-token" | jq .

# Test risk scoring
curl -s https://api.dcktoken.com/risk/So11111111111111111111111111111111111111112 | jq .

# Test XME tokens
curl -s "https://api.dcktoken.com/xme/tokens?limit=5" | jq .

# Run comprehensive tests
cd /opt/dcktoken/api/scripts
export BASE=https://api.dcktoken.com
bash smoke-full.sh
```

## Frontend Configuration

Update your frontend to point to the production API:

```bash
# frontend/.env.production
VITE_API_BASE=https://api.dcktoken.com
```

Rebuild and deploy frontend:
```bash
npm run build
# Deploy dist/ to your static hosting (Vercel, Cloudflare Pages, etc.)
```

## Closed Beta Management

### Add Beta Testers (Bulk)

Create `testers.txt` with one wallet per line:
```
DemoWa11et1111111111111111111111111111111
AnotherWa11et222222222222222222222222222
TestWa11et3333333333333333333333333333333
```

Run the script:
```bash
export API=https://api.dcktoken.com
export ADMIN_TOKEN=your-secret-token
bash scripts/add-testers.sh testers.txt
```

### Add Single Tester

```bash
API=https://api.dcktoken.com
ADMIN_TOKEN=your-secret-token

curl -s -X POST "$API/admin/wallets/add" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"wallet":"DemoWa11et1111111111111111111111111111111"}' | jq .
```

### View Allowlist

```bash
curl -s "$API/admin/config" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq '.config.ALLOWED_WALLETS_LIST'
```

## Admin Controls

### Emergency Stop (Pause Trading)

```bash
curl -s -X POST "$API/admin/config" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"TRADING_PUBLIC":"0"}' | jq .
```

### Resume Trading

```bash
curl -s -X POST "$API/admin/config" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"TRADING_PUBLIC":"1"}' | jq .
```

### Adjust Risk Threshold

```bash
# Tighten (more strict)
curl -s -X POST "$API/admin/config" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"MIN_RISK_SCORE":"60"}' | jq .

# Relax (more lenient)
curl -s -X POST "$API/admin/config" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"MIN_RISK_SCORE":"40"}' | jq .
```

### Interactive Admin Panel

```bash
export API=https://api.dcktoken.com
export ADMIN_TOKEN=your-secret-token
bash scripts/admin-panel.sh
```

## Monitoring

### PM2 Commands

```bash
pm2 status                    # View process status
pm2 logs dck-api              # View logs
pm2 logs dck-api --lines 100  # Last 100 lines
pm2 logs dck-api -f           # Follow logs
pm2 monit                     # Real-time monitoring
pm2 restart dck-api           # Restart process
pm2 stop dck-api              # Stop process
pm2 delete dck-api            # Remove process
```

### Nginx Logs

```bash
# Error logs
sudo tail -f /var/log/nginx/dck-api-error.log

# Access logs
sudo tail -f /var/log/nginx/dck-api-access.log

# Check nginx status
sudo systemctl status nginx
sudo nginx -t  # Test config
```

### System Monitoring

```bash
# Check ports
sudo ss -lntp | grep -E ':80|:443|:3001'

# Check firewall
sudo ufw status

# Check disk space
df -h

# Check memory
free -h

# Check CPU
top
```

## Updates & Maintenance

### Update Code

```bash
cd /opt/dcktoken/api
git pull origin main

# Rebuild backend
cd backend-node
npm install

# Restart with PM2
pm2 restart dck-api
pm2 logs dck-api
```

### Update Environment Variables

Edit `ecosystem.config.js` or restart with new env:

```bash
pm2 restart dck-api --update-env
pm2 save
```

### SSL Certificate Renewal

Certbot auto-renews, but you can test:

```bash
# Dry run
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

## Troubleshooting

### API Not Responding

```bash
# Check PM2
pm2 status
pm2 logs dck-api --err

# Check if port is listening
sudo ss -lntp | grep 3001

# Restart
pm2 restart dck-api
```

### Nginx Errors

```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -50 /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### SSE Streaming Not Working

Check nginx config for:
- `proxy_buffering off;`
- `X-Accel-Buffering: no`
- Long timeouts on `/xme/stream` locations

### High CPU/Memory

```bash
# Check process
pm2 monit

# Restart if needed
pm2 restart dck-api

# Check for memory leaks in logs
pm2 logs dck-api | grep -i "memory\|leak"
```

## Security Checklist

- [ ] Strong `ADMIN_TOKEN` set (32+ random characters)
- [ ] Firewall enabled (only 22, 80, 443 open)
- [ ] SSL certificate installed and auto-renewing
- [ ] PM2 running as non-root user
- [ ] Rate limiting enabled in nginx
- [ ] CORS configured for your domain only
- [ ] `TRADING_PUBLIC=0` for closed beta
- [ ] Allowlist populated with verified testers
- [ ] Monitoring alerts configured (optional)

## Support

- Documentation: `/docs/`
- Issues: GitHub Issues
- Emergency: Stop trading with admin panel

---

**Status:** Production Ready ✅  
**Last Updated:** 2025-11-26

# DCK$ Tools - Closed Beta Deployment Guide

## 🎯 Overview

This guide walks you through launching DCK$ Tools in **closed beta mode** with:
- Trading guard (allowlist-only access)
- XME risk engine (auto-reject unsafe tokens)
- Admin controls for managing beta testers
- Fee tracking and monitoring

---

## 📋 Pre-Flight Checklist

### Backend Requirements
- [ ] Node.js backend deployed (Render, Railway, or VPS)
- [ ] Environment variables set (see below)
- [ ] PM2 running with auto-restart
- [ ] QuickNode RPC endpoint active

### Frontend Requirements
- [ ] React app deployed (Vercel, Netlify, or Cloudflare)
- [ ] `VITE_API_URL` pointing to backend
- [ ] DNS configured (api.dcktoken.com → backend)

### Admin Requirements
- [ ] Secure `ADMIN_TOKEN` generated (use: `openssl rand -hex 32`)
- [ ] Admin token stored securely (password manager)
- [ ] Beta tester wallet addresses collected

---

## 🔧 Environment Variables

### Backend (.env)
```bash
# Server
PORT=3001
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://dcktoken.com,https://www.dcktoken.com

# Solana RPC (QuickNode recommended)
QUICKNODE_RPC=https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_TOKEN/
RPC_HTTP=https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_TOKEN/

# Admin (CHANGE THIS!)
ADMIN_TOKEN=your-secure-random-token-here

# Trading Guard - CLOSED BETA
TRADING_PUBLIC=0                    # 0 = closed beta (allowlist only)
ALLOWED_WALLETS=                    # Empty initially, add via API

# Trading Safety Limits
MIN_LIQ_USD=3000                    # Minimum liquidity in USD
MIN_TOKEN_AGE_MINUTES=20            # Minimum token age in minutes
MAX_TAX_PCT=10                      # Maximum buy/sell tax percentage
MIN_RISK_SCORE=40                   # Minimum XME risk score (0-100)

# XME Risk Engine
XME_RISK_TTL_MS=20000              # Risk score cache TTL (20 seconds)

# DexScreener & Jupiter
DEXSCREENER_PAIRS_URL=https://api.dexscreener.com/latest/dex/pairs/solana
JUPITER_API=https://quote-api.jup.ag
PRIORITY_FEE_LAMPORTS=5000

# Optional: Monitoring
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Frontend (.env)
```bash
VITE_API_URL=https://api.dcktoken.com
VITE_ENABLE_DEMO_MODE=false
```

---

## 🚀 Deployment Steps

### 1. Deploy Backend

#### Using PM2 (Recommended)
```bash
cd backend-node

# Install dependencies
npm install

# Start with PM2
pm2 start npm --name dck-api -- run start

# Save PM2 config
pm2 save
pm2 startup

# Check logs
pm2 logs dck-api --lines 50
```

#### Using Docker
```bash
cd backend-node
docker build -t dck-api .
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  --name dck-api \
  --restart unless-stopped \
  dck-api
```

### 2. Verify Backend Health
```bash
export API='https://api.dcktoken.com'

# Health check
curl -s $API/healthz | jq .

# Should return:
# {"ok":true,"uptime":123.456,"rpc":true}
```

### 3. Deploy Frontend

#### Using Vercel
```bash
cd /path/to/frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# VITE_API_URL=https://api.dcktoken.com
```

#### Using Netlify
```bash
# Build locally
npm run build

# Deploy dist/ folder via Netlify UI or CLI
netlify deploy --prod --dir=dist
```

---

## 👥 Beta Tester Onboarding

### Step 1: Collect Wallet Addresses

Create `allowlist.txt` with one wallet per line:
```
5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d
7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
...
```

### Step 2: Validate & Clean

Remove duplicates and invalid addresses:
```bash
# Keep only valid base58 addresses (32-44 chars)
grep -E '^[1-9A-HJ-NP-Za-km-z]{32,44}$' allowlist.txt | \
  awk 'NF' | \
  sort -u > allowlist.clean.txt

# Check count
wc -l allowlist.clean.txt
```

### Step 3: Bulk Add to Allowlist

Set your admin credentials:
```bash
export ADMIN_TOKEN='your-secure-admin-token'
export API='https://api.dcktoken.com'
```

#### Option A: Bulk Update (Recommended for large lists)
```bash
# One-shot: replaces entire allowlist
paste -sd, allowlist.clean.txt | \
  xargs -I{} curl -s -X POST "$API/admin/config" \
    -H 'content-type: application/json' \
    -H "x-admin-token: $ADMIN_TOKEN" \
    -d '{"ALLOWED_WALLETS":"{}"}' | jq .
```

#### Option B: Line-by-Line (Incremental)
```bash
# Adds wallets one at a time
while read -r W; do
  echo "Adding: $W"
  curl -s -X POST "$API/admin/wallets/add" \
    -H 'content-type: application/json' \
    -H "x-admin-token: $ADMIN_TOKEN" \
    -d "{\"wallet\":\"$W\"}" | jq .
  sleep 0.5  # Rate limit safety
done < allowlist.clean.txt
```

### Step 4: Verify Allowlist
```bash
# View current config
curl -s "$API/admin/config" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq .

# Just the allowlist
curl -s "$API/admin/config" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq '.config.ALLOWED_WALLETS'
```

---

## 🎛️ Admin Operations

### Toggle Public/Private Mode

#### Go Public (Open Trading)
```bash
curl -s -X POST "$API/admin/config" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"TRADING_PUBLIC":"1"}' | jq .
```

#### Go Private (Closed Beta)
```bash
curl -s -X POST "$API/admin/config" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"TRADING_PUBLIC":"0"}' | jq .
```

### Manage Individual Wallets

#### Add Single Wallet
```bash
curl -s -X POST "$API/admin/wallets/add" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"wallet":"WALLET_BASE58_HERE"}' | jq .
```

#### Remove Single Wallet
```bash
curl -s -X POST "$API/admin/wallets/remove" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"wallet":"WALLET_BASE58_HERE"}' | jq .
```

### Adjust Risk Threshold

```bash
# Set minimum risk score (0-100)
# 40 = reject HIGH risk tokens
# 60 = reject HIGH + MEDIUM risk tokens
curl -s -X POST "$API/admin/config" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"MIN_RISK_SCORE":40}' | jq .
```

### Update Trading Limits

```bash
# All limits in one call
curl -s -X POST "$API/admin/config" \
  -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{
    "MIN_LIQ_USD": 5000,
    "MIN_TOKEN_AGE_MINUTES": 30,
    "MAX_TAX_PCT": 8,
    "MIN_RISK_SCORE": 50
  }' | jq .
```

---

## 📊 Monitoring During Beta

### Health Checks
```bash
# Backend health
curl $API/healthz

# Admin config status
curl -s $API/admin/config -H "x-admin-token: $ADMIN_TOKEN" | jq .
```

### Fee Tracking
```bash
# Recent fee events
curl -s "$API/admin/fees/events?limit=50" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq .

# Fee stats (24h/7d/30d)
curl -s "$API/admin/fees/stats?period=24h" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq .
```

### PM2 Logs
```bash
# Real-time logs
pm2 logs dck-api

# Last 100 lines
pm2 logs dck-api --lines 100

# Error logs only
pm2 logs dck-api --err
```

### Key Metrics to Watch
- ✅ **Trading Guard Blocks**: Expect `403` for non-allowlisted wallets
- ✅ **Risk Rejects**: Clean messages like `"Token risk too high (score: 35, minimum: 40)"`
- ⚠️ **RPC Errors**: If you see `429 Too Many Requests`, upgrade RPC tier
- ⚠️ **Fee Spikes**: Monitor `/admin/fees/stats` for unusual activity
- ❌ **Unhandled Rejections**: Check PM2 logs for stack traces

---

## 👥 Beta Tester Communication

### Welcome Message (Copy/Paste)

```
🎯 You're invited to the DCK$ Tools Closed Beta!

Welcome to the Bull Slayer early access program. Here's what you need to know:

**Getting Started:**
1. Visit https://dcktoken.com
2. Connect your Phantom wallet
3. Your wallet is pre-approved for closed beta trading

**Features to Test:**
• /trenches - Real-time token discovery with bonding curve tracking
• /explorer - Browse all SOL tokens with XME engine
• Quick Snipe - Client-signed Jupiter swaps (0.01-1 SOL)
• Risk Badges - LOW/MED/HIGH risk indicators on every token

**Trading Notes:**
• Only allowlisted wallets can trade (closed beta mode)
• Tokens with HIGH risk (score < 40) are auto-blocked
• Risk reasons: low liquidity, too new, mint authority present, etc.
• If blocked, you'll see a clear error message with the risk score

**Reporting Issues:**
1. Screenshot the error message
2. Copy the token mint address
3. Send to [your Discord/Telegram]

Thanks for helping us battle-test the platform! 🐂⚔️

Questions? DM me anytime.
```

### Status Updates Template

```
📊 DCK$ Beta Status Update - [DATE]

**Metrics:**
• Active testers: [X]
• Trades executed: [Y]
• Avg risk score: [Z]
• Uptime: [%]

**Known Issues:**
• [List any bugs]

**Coming Soon:**
• [Feature 1]
• [Feature 2]

Keep the feedback coming! 🚀
```

---

## 🔥 Troubleshooting

### Trading Guard Not Working
```bash
# Check config
curl -s $API/admin/config -H "x-admin-token: $ADMIN_TOKEN" | jq .

# Verify TRADING_PUBLIC=false and ALLOWED_WALLETS has entries
```

### Risk Check Failing
```bash
# Test risk endpoint directly
curl -s "$API/risk/So11111111111111111111111111111111111111112" | jq .

# Should return score ~97 for SOL (safe token)
```

### Backend Not Responding
```bash
# Check PM2 status
pm2 status

# Restart if needed
pm2 restart dck-api

# Check logs for errors
pm2 logs dck-api --lines 50 --err
```

### High RPC Costs
- Upgrade to QuickNode Pro tier (higher rate limits)
- Increase `XME_RISK_TTL_MS` to cache risk scores longer
- Monitor `/admin/fees/stats` for unusual patterns

---

## 🎓 Next Steps

### After Successful Beta
1. **Gather Feedback**: Survey testers on UX, bugs, feature requests
2. **Optimize Limits**: Adjust `MIN_RISK_SCORE` based on false positive rate
3. **Scale Allowlist**: Add 50-100 more testers incrementally
4. **Go Public**: Set `TRADING_PUBLIC=1` when ready for public launch

### Upgrade to Server Sniper
- Integrate Jito bundles for MEV protection
- Add server-side wallet custody (optional)
- Implement advanced order types (limit, stop-loss)

---

## 📞 Support

**Backend Issues:**
- Check PM2 logs: `pm2 logs dck-api`
- Health endpoint: `curl $API/healthz`
- Admin dashboard: `https://dcktoken.com/admin`

**Frontend Issues:**
- Browser console errors (F12)
- Network tab (check API responses)
- Clear cache + hard refresh

**Emergency Shutdown:**
```bash
# Stop trading (keep site up)
curl -s -X POST "$API/admin/config" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"TRADING_PUBLIC":"0","ALLOWED_WALLETS":""}' | jq .

# Full shutdown
pm2 stop dck-api
```

---

**🚀 Ready to launch closed beta! Share your allowlist.txt and I'll format it for deployment.**

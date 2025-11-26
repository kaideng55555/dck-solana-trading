# DCK$ Tools Deployment Guide

## Quick Deploy (5 Steps)

### 1. Add Deployment Files

```bash
cd ~/Downloads/solana_full_trading_system
git add .github/workflows scripts
git commit -m "Add PM2 deploy workflow + helper scripts"
git push origin ops/ci-deploy
```

Then merge the PR: https://github.com/kaideng55555/dck-solana-trading/pull/1

### 2. Set GitHub Secrets

**Interactive setup:**
```bash
bash scripts/set-secrets.sh
```

**Or manual:**
```bash
gh secret set DEPLOY_HOST -R kaideng55555/dck-solana-trading -b "YOUR.SERVER.IP"
gh secret set DEPLOY_USER -R kaideng55555/dck-solana-trading -b "ubuntu"
gh secret set SSH_PRIVATE_KEY -R kaideng55555/dck-solana-trading -b "$(cat ~/.ssh/id_ed25519)"
gh secret set DEPLOY_PATH_API -R kaideng55555/dck-solana-trading -b "/opt/dcktoken/api"
gh secret set QUICKNODE_HTTP -R kaideng55555/dck-solana-trading -b "https://...quiknode.pro/YOUR_KEY/"
gh secret set QUICKNODE_WSS -R kaideng55555/dck-solana-trading -b "wss://...quiknode.pro/YOUR_KEY/"
gh secret set SLACK_WEBHOOK_URL -R kaideng55555/dck-solana-trading -b "https://hooks.slack.com/services/AAA/BBB/CCC"
```

### 3. Prepare Server (One-time)

```bash
# Create deployment directory
ssh ubuntu@YOUR.SERVER.IP 'sudo mkdir -p /opt/dcktoken/api && sudo chown ubuntu:ubuntu /opt/dcktoken/api'

# Install dependencies (Node 20, Python 3.11, PM2)
ssh ubuntu@YOUR.SERVER.IP << 'EOF'
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.11
sudo apt-get install -y python3.11 python3.11-venv python3-pip

# PM2
sudo npm install -g pm2

# Configure PM2 startup
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash
EOF
```

### 4. Trigger Deployment

**Via GitHub Actions UI:**
- Go to: https://github.com/kaideng55555/dck-solana-trading/actions
- Select "Deploy API with PM2"
- Click "Run workflow" → "Run workflow"

**Via CLI:**
```bash
gh workflow run deploy-api-pm2.yml -R kaideng55555/dck-solana-trading --ref main
```

### 5. Monitor Deployment

```bash
# Watch the latest run
gh run watch -R kaideng55555/dck-solana-trading

# List recent runs
gh run list -R kaideng55555/dck-solana-trading --limit 10

# View specific run logs
gh run view -R kaideng55555/dck-solana-trading
```

---

## What Gets Deployed

### Backend-Node (Port 3001)
- Express server with QuickNode WebSocket integration
- Real-time Solana mint stream
- Managed by PM2 as `dck-api-node`

### Backend-Python (Port 8000)
- FastAPI server with SQLite database
- Analytics and price history
- Managed by PM2 as `dck-api-python`

---

## Post-Deployment

### Check Service Status

```bash
ssh ubuntu@YOUR.SERVER.IP 'pm2 list'
```

Expected output:
```
┌─────┬────────────────┬─────────┬──────┬────────┐
│ id  │ name           │ mode    │ ↺    │ status │
├─────┼────────────────┼─────────┼──────┼────────┤
│ 0   │ dck-api-node   │ fork    │ 0    │ online │
│ 1   │ dck-api-python │ fork    │ 0    │ online │
└─────┴────────────────┴─────────┴──────┴────────┘
```

### View Logs

```bash
# Node backend logs
ssh ubuntu@YOUR.SERVER.IP 'pm2 logs dck-api-node --lines 50'

# Python backend logs
ssh ubuntu@YOUR.SERVER.IP 'pm2 logs dck-api-python --lines 50'
```

### Test Endpoints

```bash
# Node API health check
curl http://YOUR.SERVER.IP:3001/health

# Python API docs
curl http://YOUR.SERVER.IP:8000/docs
```

---

## Troubleshooting

### Deployment Failed

1. **Check GitHub Actions logs:**
   ```bash
   gh run view -R kaideng55555/dck-solana-trading
   ```

2. **Verify secrets are set:**
   ```bash
   gh secret list -R kaideng55555/dck-solana-trading
   ```

3. **Test SSH connection:**
   ```bash
   ssh ubuntu@YOUR.SERVER.IP 'echo "SSH connection OK"'
   ```

### Service Not Running

```bash
# Restart services
ssh ubuntu@YOUR.SERVER.IP 'pm2 restart all'

# Check detailed status
ssh ubuntu@YOUR.SERVER.IP 'pm2 describe dck-api-node'
```

### Port Already in Use

```bash
# Find process using port 3001
ssh ubuntu@YOUR.SERVER.IP 'sudo lsof -i :3001'

# Kill and restart
ssh ubuntu@YOUR.SERVER.IP 'pm2 delete dck-api-node && pm2 start /opt/dcktoken/api/backend-node/server.js --name dck-api-node'
```

---

## Rollback

If deployment causes issues:

```bash
ssh ubuntu@YOUR.SERVER.IP << 'EOF'
cd /opt/dcktoken/api
git log --oneline -10  # Find previous commit
git reset --hard COMMIT_HASH
pm2 restart all
EOF
```

---

## Add Status Badges to README

```bash
bash scripts/add-readme-badges.sh
git add README.md
git commit -m "Add deployment status badges"
git push
```

This adds badges like:
- [![Deploy API](https://github.com/kaideng55555/dck-solana-trading/actions/workflows/deploy-api-pm2.yml/badge.svg)](https://github.com/kaideng55555/dck-solana-trading/actions/workflows/deploy-api-pm2.yml)

---

## Automatic Deployments

After initial setup, deployments happen automatically:
- **Push to `main`** → Triggers deployment
- **Backend files change** → Only backend deploys
- **No changes** → Workflow skips

Disable auto-deploy by removing `push:` trigger from `.github/workflows/deploy-api-pm2.yml`

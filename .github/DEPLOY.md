# Deployment Guide

## Required GitHub Secrets

Configure these in: **Settings → Secrets and variables → Actions**

### Server Access
- `DEPLOY_HOST` - Server hostname/IP (e.g., `dcktoken.com` or `123.45.67.89`)
- `DEPLOY_USER` - SSH username (e.g., `ubuntu`, `root`)
- `SSH_PRIVATE_KEY` - Private SSH key for authentication

### Deployment Paths
- `DEPLOY_PATH_WEB` - Frontend deployment path (e.g., `/var/www/dcktoken.com`)
- `DEPLOY_PATH_API_NODE` - Node backend path (e.g., `/opt/dck-api-node`)
- `DEPLOY_PATH_API_PYTHON` - Python backend path (e.g., `/opt/dck-api-python`)

### Environment Variables (Optional)
- `VITE_API_BASE` - API base URL (default: `https://api.dcktoken.com`)
- `VITE_REQUIRE_CONNECTED_WALLET` - Require wallet connection (default: `true`)
- `VITE_SENTRY_DSN` - Sentry error tracking DSN
- `VITE_DEFAULT_OWNER_PUBKEY` - Default owner public key
- `SLACK_WEBHOOK_URL` - Slack notifications webhook

### QuickNode (for backend-node)
- `QUICKNODE_HTTP` - Solana mainnet HTTP endpoint
- `QUICKNODE_WSS` - Solana mainnet WebSocket endpoint

## Workflows

### 1. `deploy-ui.yml` - Frontend Deployment
**Triggers:**
- Push to `main` branch (when UI files change)
- Manual dispatch via Actions tab

**Steps:**
1. Builds React app with Vite
2. Generates production `dist/` folder
3. Uploads to server via SCP
4. Sends Slack notification

### 2. `deploy-api.yml` - Backend Deployment
**Triggers:**
- Push to `main` branch (when backend files change)
- Manual dispatch via Actions tab

**Jobs:**
- **deploy-node-backend**: Deploys Express server, restarts with PM2
- **deploy-python-backend**: Deploys FastAPI server, restarts with PM2

### 3. `ci.yml` - Continuous Integration
**Triggers:**
- All PRs to `main`
- Pushes to `main` and `ops/**` branches

**Jobs:**
- **test-ui**: Runs Vitest tests, builds UI
- **test-backend-node**: Lints and tests Node backend
- **test-backend-python**: Lints and tests Python backend

## Manual Deployment

To trigger a deployment manually:
1. Go to **Actions** tab
2. Select workflow (`Deploy UI` or `Deploy API`)
3. Click **Run workflow** → **Run workflow**

## Server Requirements

### Frontend Server
- Nginx or Apache configured for SPA routing
- Path: `$DEPLOY_PATH_WEB` (writable by `$DEPLOY_USER`)

### Backend Server
- Node.js 20.x
- Python 3.11+
- PM2 process manager (`npm i -g pm2`)
- Git repository cloned to backend paths

### Example Nginx Config
```nginx
server {
  listen 80;
  server_name dcktoken.com;
  root /var/www/dcktoken.com;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## First-Time Setup

1. **Clone repos on server:**
   ```bash
   git clone https://github.com/kaideng55555/dck-solana-trading /opt/dck-api-node
   git clone https://github.com/kaideng55555/dck-solana-trading /opt/dck-api-python
   ```

2. **Install dependencies:**
   ```bash
   cd /opt/dck-api-node/backend-node && npm ci
   cd /opt/dck-api-python/backend-python && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   ```

3. **Start services with PM2:**
   ```bash
   cd /opt/dck-api-node/backend-node && pm2 start server.js --name dck-api-node
   cd /opt/dck-api-python/backend-python && pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name dck-api-python
   pm2 save
   pm2 startup
   ```

4. **Configure secrets in GitHub** (see above)

## Monitoring

- **Check deployment status:** Actions tab in GitHub
- **Check server logs:**
  ```bash
  pm2 logs dck-api-node
  pm2 logs dck-api-python
  ```
- **Slack notifications:** Configure `SLACK_WEBHOOK_URL` secret

## Rollback

If a deployment fails:
1. SSH to server
2. Revert to previous commit: `git reset --hard HEAD~1`
3. Restart services: `pm2 restart all`

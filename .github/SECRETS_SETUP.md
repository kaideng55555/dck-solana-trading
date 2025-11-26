# GitHub Secrets Setup

## Quick Setup Scripts

Two scripts are provided to help you set GitHub secrets:

### Option 1: Interactive Script

```bash
bash set_secrets_pr.sh
```

This will prompt you for each value interactively.

### Option 2: Inline Script (Recommended)

Set all values as environment variables:

```bash
export REPO="kaideng55555/dck-solana-trading"

DEPLOY_HOST=203.0.113.10 \
DEPLOY_USER=ubuntu \
SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)" \
DEPLOY_PATH_WEB=/var/www/dcktoken.com \
DEPLOY_PATH_API_NODE=/opt/dck-api-node \
DEPLOY_PATH_API_PYTHON=/opt/dck-api-python \
QUICKNODE_HTTP=https://ultra-ultra-fog.solana-mainnet.quiknode.pro/YOUR_KEY/ \
QUICKNODE_WSS=wss://ultra-ultra-fog.solana-mainnet.quiknode.pro/YOUR_KEY/ \
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/AAA/BBB/CCC" \
bash set_secrets_inline.sh
```

## Manual Setup via GitHub UI

Alternatively, set secrets manually:

1. Go to: https://github.com/kaideng55555/dck-solana-trading/settings/secrets/actions
2. Click **New repository secret**
3. Add each secret from the list below

## Required Secrets

### Server Access
- **DEPLOY_HOST**: Server IP or hostname (e.g., `203.0.113.10` or `dcktoken.com`)
- **DEPLOY_USER**: SSH username (e.g., `ubuntu`, `root`, `deploy`)
- **SSH_PRIVATE_KEY**: Complete private SSH key for authentication

### Deployment Paths
- **DEPLOY_PATH_WEB**: Frontend path (e.g., `/var/www/dcktoken.com`)
- **DEPLOY_PATH_API_NODE**: Node backend path (e.g., `/opt/dck-api-node`)
- **DEPLOY_PATH_API_PYTHON**: Python backend path (e.g., `/opt/dck-api-python`)

### Solana RPC (QuickNode)
- **QUICKNODE_HTTP**: Mainnet HTTP endpoint
  - Example: `https://ultra-ultra-fog.solana-mainnet.quiknode.pro/48fa88a641cbd2a15f2e0c4f8d9c96c41c70fcf5/`
- **QUICKNODE_WSS**: Mainnet WebSocket endpoint
  - Example: `wss://ultra-ultra-fog.solana-mainnet.quiknode.pro/48fa88a641cbd2a15f2e0c4f8d9c96c41c70fcf5/`

## Optional Secrets

### API Configuration
- **VITE_API_BASE**: API base URL (default: `https://api.dcktoken.com`)
- **VITE_REQUIRE_CONNECTED_WALLET**: Require wallet connection (default: `true`)
- **VITE_DEFAULT_OWNER_PUBKEY**: Default owner public key

### Monitoring
- **VITE_SENTRY_DSN**: Sentry error tracking DSN
- **SLACK_WEBHOOK_URL**: Slack notifications webhook URL
  - Example: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`

## Verify Secrets

After setting secrets, verify with:

```bash
gh secret list -R kaideng55555/dck-solana-trading
```

Expected output:
```
DEPLOY_HOST              Updated 2024-XX-XX
DEPLOY_PATH_API_NODE     Updated 2024-XX-XX
DEPLOY_PATH_API_PYTHON   Updated 2024-XX-XX
DEPLOY_PATH_WEB          Updated 2024-XX-XX
DEPLOY_USER              Updated 2024-XX-XX
QUICKNODE_HTTP           Updated 2024-XX-XX
QUICKNODE_WSS            Updated 2024-XX-XX
SLACK_WEBHOOK_URL        Updated 2024-XX-XX
SSH_PRIVATE_KEY          Updated 2024-XX-XX
VITE_API_BASE            Updated 2024-XX-XX
```

## Getting Your SSH Private Key

```bash
# Display your private key
cat ~/.ssh/id_rsa

# Or generate a new key pair for deployment
ssh-keygen -t rsa -b 4096 -C "deploy@dcktoken.com" -f ~/.ssh/dck_deploy
cat ~/.ssh/dck_deploy  # Use this as SSH_PRIVATE_KEY

# Add public key to server
ssh-copy-id -i ~/.ssh/dck_deploy.pub user@server
```

## Testing Deployment

After secrets are configured:

1. **Test CI workflow**: Create a test PR
2. **Test manual deployment**:
   - Go to Actions → "Deploy UI" → "Run workflow"
   - Monitor deployment logs
3. **Merge PR**: Auto-deployment will trigger on merge to `main`

## Troubleshooting

### Secret Not Found
Make sure you're setting secrets at the **repository** level, not environment level.

### SSH Connection Failed
- Verify `DEPLOY_HOST` is reachable: `ping $DEPLOY_HOST`
- Test SSH connection: `ssh $DEPLOY_USER@$DEPLOY_HOST`
- Ensure public key is in `~/.ssh/authorized_keys` on server

### Deployment Path Not Found
- Ensure paths exist on server
- Ensure `DEPLOY_USER` has write permissions
- Create directories: `sudo mkdir -p /var/www/dcktoken.com && sudo chown $DEPLOY_USER:$DEPLOY_USER /var/www/dcktoken.com`

### QuickNode Connection Failed
- Verify URLs include the full path with API key
- Test endpoints:
  ```bash
  curl -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
    $QUICKNODE_HTTP
  ```

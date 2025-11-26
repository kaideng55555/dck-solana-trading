#!/bin/bash
set -e

# Repository (override with REPO env var)
REPO="${REPO:-kaideng55555/dck-solana-trading}"

echo "🔐 Setting GitHub Secrets for: $REPO"
echo ""

# Required secrets with prompts
read -p "DEPLOY_HOST (server IP/hostname): " DEPLOY_HOST
read -p "DEPLOY_USER (SSH username, e.g. ubuntu): " DEPLOY_USER
echo "SSH_PRIVATE_KEY (paste private key, then Ctrl+D):"
SSH_PRIVATE_KEY=$(cat)

read -p "DEPLOY_PATH_WEB (e.g. /var/www/dcktoken.com): " DEPLOY_PATH_WEB
read -p "DEPLOY_PATH_API_NODE (e.g. /opt/dck-api-node): " DEPLOY_PATH_API_NODE
read -p "DEPLOY_PATH_API_PYTHON (e.g. /opt/dck-api-python): " DEPLOY_PATH_API_PYTHON

read -p "QUICKNODE_HTTP (https://...quiknode.pro/...): " QUICKNODE_HTTP
read -p "QUICKNODE_WSS (wss://...quiknode.pro/...): " QUICKNODE_WSS

# Optional secrets
read -p "VITE_API_BASE (default: https://api.dcktoken.com): " VITE_API_BASE
VITE_API_BASE="${VITE_API_BASE:-https://api.dcktoken.com}"

read -p "SLACK_WEBHOOK_URL (optional, press Enter to skip): " SLACK_WEBHOOK_URL

echo ""
echo "📤 Setting secrets..."

# Set required secrets
gh secret set DEPLOY_HOST -b"$DEPLOY_HOST" -R "$REPO"
gh secret set DEPLOY_USER -b"$DEPLOY_USER" -R "$REPO"
gh secret set SSH_PRIVATE_KEY -b"$SSH_PRIVATE_KEY" -R "$REPO"
gh secret set DEPLOY_PATH_WEB -b"$DEPLOY_PATH_WEB" -R "$REPO"
gh secret set DEPLOY_PATH_API_NODE -b"$DEPLOY_PATH_API_NODE" -R "$REPO"
gh secret set DEPLOY_PATH_API_PYTHON -b"$DEPLOY_PATH_API_PYTHON" -R "$REPO"
gh secret set QUICKNODE_HTTP -b"$QUICKNODE_HTTP" -R "$REPO"
gh secret set QUICKNODE_WSS -b"$QUICKNODE_WSS" -R "$REPO"
gh secret set VITE_API_BASE -b"$VITE_API_BASE" -R "$REPO"

# Set optional secrets
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  gh secret set SLACK_WEBHOOK_URL -b"$SLACK_WEBHOOK_URL" -R "$REPO"
fi

echo ""
echo "✅ Secrets configured successfully!"
echo ""
echo "📋 Set secrets:"
gh secret list -R "$REPO"

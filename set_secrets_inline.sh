#!/bin/bash
set -e

# Repository (override with REPO env var)
REPO="${REPO:-kaideng55555/dck-solana-trading}"

echo "🔐 Setting GitHub Secrets for: $REPO"
echo ""

# Validate required env vars
REQUIRED_VARS=(
  "DEPLOY_HOST"
  "DEPLOY_USER"
  "SSH_PRIVATE_KEY"
  "DEPLOY_PATH_WEB"
  "DEPLOY_PATH_API_NODE"
  "DEPLOY_PATH_API_PYTHON"
  "QUICKNODE_HTTP"
  "QUICKNODE_WSS"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: $var is not set"
    echo ""
    echo "Usage example:"
    echo "  DEPLOY_HOST=203.0.113.10 \\"
    echo "  DEPLOY_USER=ubuntu \\"
    echo "  SSH_PRIVATE_KEY=\"\$(cat ~/.ssh/id_rsa)\" \\"
    echo "  DEPLOY_PATH_WEB=/var/www/dcktoken.com \\"
    echo "  DEPLOY_PATH_API_NODE=/opt/dck-api-node \\"
    echo "  DEPLOY_PATH_API_PYTHON=/opt/dck-api-python \\"
    echo "  QUICKNODE_HTTP=https://...quiknode.pro/... \\"
    echo "  QUICKNODE_WSS=wss://...quiknode.pro/... \\"
    echo "  bash set_secrets_inline.sh"
    exit 1
  fi
done

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

# Set optional secrets with defaults
gh secret set VITE_API_BASE -b"${VITE_API_BASE:-https://api.dcktoken.com}" -R "$REPO"

if [ -n "$SLACK_WEBHOOK_URL" ]; then
  gh secret set SLACK_WEBHOOK_URL -b"$SLACK_WEBHOOK_URL" -R "$REPO"
  echo "✅ SLACK_WEBHOOK_URL configured"
fi

if [ -n "$VITE_SENTRY_DSN" ]; then
  gh secret set VITE_SENTRY_DSN -b"$VITE_SENTRY_DSN" -R "$REPO"
  echo "✅ VITE_SENTRY_DSN configured"
fi

if [ -n "$VITE_DEFAULT_OWNER_PUBKEY" ]; then
  gh secret set VITE_DEFAULT_OWNER_PUBKEY -b"$VITE_DEFAULT_OWNER_PUBKEY" -R "$REPO"
  echo "✅ VITE_DEFAULT_OWNER_PUBKEY configured"
fi

echo ""
echo "✅ Secrets configured successfully!"
echo ""
echo "📋 Set secrets:"
gh secret list -R "$REPO"

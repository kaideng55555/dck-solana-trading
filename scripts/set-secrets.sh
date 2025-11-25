#!/bin/bash
# Quick script to set all required GitHub secrets for deployment

REPO="${REPO:-kaideng55555/dck-solana-trading}"

echo "🔐 Setting GitHub secrets for $REPO"
echo ""
echo "⚠️  Replace placeholder values with your actual credentials!"
echo ""

# Server configuration
read -p "Server IP/hostname: " DEPLOY_HOST
read -p "SSH username [ubuntu]: " DEPLOY_USER
DEPLOY_USER=${DEPLOY_USER:-ubuntu}

echo ""
echo "SSH private key path:"
echo "  1) ~/.ssh/id_rsa"
echo "  2) ~/.ssh/id_ed25519"
echo "  3) Custom path"
read -p "Choice [2]: " KEY_CHOICE
KEY_CHOICE=${KEY_CHOICE:-2}

case $KEY_CHOICE in
  1) SSH_KEY_PATH="$HOME/.ssh/id_rsa" ;;
  2) SSH_KEY_PATH="$HOME/.ssh/id_ed25519" ;;
  3) read -p "Enter path: " SSH_KEY_PATH ;;
esac

if [ ! -f "$SSH_KEY_PATH" ]; then
  echo "❌ Key file not found: $SSH_KEY_PATH"
  exit 1
fi

read -p "API deployment path [/opt/dcktoken/api]: " DEPLOY_PATH_API
DEPLOY_PATH_API=${DEPLOY_PATH_API:-/opt/dcktoken/api}

read -p "QuickNode HTTP URL: " QUICKNODE_HTTP
read -p "QuickNode WSS URL: " QUICKNODE_WSS

read -p "Slack webhook URL (optional, press Enter to skip): " SLACK_WEBHOOK_URL

echo ""
echo "📤 Setting secrets..."

gh secret set DEPLOY_HOST -R "$REPO" -b "$DEPLOY_HOST"
gh secret set DEPLOY_USER -R "$REPO" -b "$DEPLOY_USER"
gh secret set SSH_PRIVATE_KEY -R "$REPO" -b "$(cat $SSH_KEY_PATH)"
gh secret set DEPLOY_PATH_API -R "$REPO" -b "$DEPLOY_PATH_API"
gh secret set QUICKNODE_HTTP -R "$REPO" -b "$QUICKNODE_HTTP"
gh secret set QUICKNODE_WSS -R "$REPO" -b "$QUICKNODE_WSS"

if [ -n "$SLACK_WEBHOOK_URL" ]; then
  gh secret set SLACK_WEBHOOK_URL -R "$REPO" -b "$SLACK_WEBHOOK_URL"
fi

echo ""
echo "✅ Secrets configured!"
echo ""
echo "📋 Configured secrets:"
gh secret list -R "$REPO"

echo ""
echo "🚀 Next steps:"
echo "  1. Prepare server: ssh $DEPLOY_USER@$DEPLOY_HOST 'sudo mkdir -p $DEPLOY_PATH_API'"
echo "  2. Trigger deploy: gh workflow run deploy-api-pm2.yml -R $REPO --ref main"
echo "  3. Watch progress: gh run watch -R $REPO"

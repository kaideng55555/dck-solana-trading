#!/bin/bash
# Deploy DCK$ API with PM2 for production
# Run this on your production server

set -e

# Configuration - Edit these for your environment
API_DIR="${API_DIR:-/opt/dcktoken/api/backend-node}"
PORT="${PORT:-3001}"
ADMIN_TOKEN="${ADMIN_TOKEN:-change-me-super-secret}"
TRADING_PUBLIC="${TRADING_PUBLIC:-0}"
MIN_RISK_SCORE="${MIN_RISK_SCORE:-50}"
ALLOWED_WALLETS="${ALLOWED_WALLETS:-}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://dcktoken.com,http://localhost:5173}"
QUICKNODE_RPC="${QUICKNODE_RPC:-}"
SITE_URL="${SITE_URL:-https://dcktoken.com}"
INTRO_VIDEO_URL="${INTRO_VIDEO_URL:-https://dcktoken.com/assets/intro.mp4}"

echo "🚀 Deploying DCK$ API with PM2"
echo "==============================="
echo "API Directory: $API_DIR"
echo "Port: $PORT"
echo "Trading Mode: $([ "$TRADING_PUBLIC" = "1" ] && echo "PUBLIC" || echo "CLOSED BETA")"
echo "Min Risk Score: $MIN_RISK_SCORE"
echo ""

# 1) Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
  echo "1️⃣  Installing PM2..."
  npm install -g pm2
else
  echo "1️⃣  PM2 already installed ($(pm2 --version))"
fi

# 2) Change to API directory
echo ""
echo "2️⃣  Navigating to API directory..."
cd "$API_DIR"

# 3) Install dependencies
echo ""
echo "3️⃣  Installing dependencies..."
npm install

# 4) Stop existing PM2 process if running
echo ""
echo "4️⃣  Stopping existing process..."
pm2 delete dck-api 2>/dev/null || echo "No existing process to stop"

# 5) Create PM2 ecosystem file
echo ""
echo "5️⃣  Creating PM2 ecosystem file..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'dck-api',
    script: 'npx',
    args: 'tsx src/index.ts',
    cwd: '${API_DIR}',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '${PORT}',
      ADMIN_TOKEN: '${ADMIN_TOKEN}',
      TRADING_PUBLIC: '${TRADING_PUBLIC}',
      MIN_RISK_SCORE: '${MIN_RISK_SCORE}',
      ALLOWED_WALLETS: '${ALLOWED_WALLETS}',
      ALLOWED_ORIGINS: '${ALLOWED_ORIGINS}',
      QUICKNODE_RPC: '${QUICKNODE_RPC}',
      SITE_URL: '${SITE_URL}',
      INTRO_VIDEO_URL: '${INTRO_VIDEO_URL}'
    },
    error_file: '/var/log/dck-api-error.log',
    out_file: '/var/log/dck-api-out.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# 6) Start with PM2
echo ""
echo "6️⃣  Starting API with PM2..."
pm2 start ecosystem.config.js

# 7) Save PM2 configuration
echo ""
echo "7️⃣  Saving PM2 configuration..."
pm2 save

# 8) Setup PM2 startup script
echo ""
echo "8️⃣  Setting up PM2 to start on boot..."
echo "Run the following command as root or with sudo:"
echo ""
pm2 startup | grep "sudo"
echo ""
echo "⚠️  IMPORTANT: Copy and run the 'sudo env PATH=...' command above!"
echo ""

# 9) Display status
echo ""
echo "9️⃣  PM2 Status:"
pm2 list

echo ""
echo "================================================"
echo "✅ Deployment complete!"
echo ""
echo "📊 Monitoring commands:"
echo "  pm2 status           - View process status"
echo "  pm2 logs dck-api     - View live logs"
echo "  pm2 logs dck-api -f  - Follow logs"
echo "  pm2 restart dck-api  - Restart process"
echo "  pm2 stop dck-api     - Stop process"
echo "  pm2 delete dck-api   - Remove process"
echo ""
echo "🔄 Update environment without restart:"
echo "  pm2 restart dck-api --update-env"
echo ""
echo "💾 Save changes:"
echo "  pm2 save"
echo ""
echo "🧪 Test the API:"
echo "  curl -s http://localhost:${PORT}/healthz | jq ."
echo "  curl -s https://api.dcktoken.com/healthz | jq ."
echo ""

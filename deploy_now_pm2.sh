#!/bin/bash
set -e

echo "🚀 DCK$ TOOLS - Full Stack Deployment Script"
echo "=============================================="
echo ""

# Configuration prompts
read -p "Server hostname/IP (e.g., dcktoken.com): " SERVER_HOST
read -p "SSH username (e.g., ubuntu): " SSH_USER
read -p "SSH port [22]: " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

read -p "Deploy frontend? (y/n) [y]: " DEPLOY_FRONTEND
DEPLOY_FRONTEND=${DEPLOY_FRONTEND:-y}

read -p "Deploy backend-node? (y/n) [y]: " DEPLOY_NODE
DEPLOY_NODE=${DEPLOY_NODE:-y}

read -p "Deploy backend-python? (y/n) [y]: " DEPLOY_PYTHON
DEPLOY_PYTHON=${DEPLOY_PYTHON:-y}

# Paths
read -p "Frontend path [/var/www/dcktoken.com]: " WEB_PATH
WEB_PATH=${WEB_PATH:-/var/www/dcktoken.com}

read -p "Backend-node path [/opt/dck-api-node]: " NODE_PATH
NODE_PATH=${NODE_PATH:-/opt/dck-api-node}

read -p "Backend-python path [/opt/dck-api-python]: " PYTHON_PATH
PYTHON_PATH=${PYTHON_PATH:-/opt/dck-api-python}

# QuickNode credentials
if [[ "$DEPLOY_NODE" == "y" ]]; then
  read -p "QuickNode HTTP URL: " QUICKNODE_HTTP
  read -p "QuickNode WSS URL: " QUICKNODE_WSS
fi

echo ""
echo "📦 Configuration Summary:"
echo "  Server: $SSH_USER@$SERVER_HOST:$SSH_PORT"
echo "  Frontend: $([[ "$DEPLOY_FRONTEND" == "y" ]] && echo "✅ $WEB_PATH" || echo "❌ Skipped")"
echo "  Node API: $([[ "$DEPLOY_NODE" == "y" ]] && echo "✅ $NODE_PATH" || echo "❌ Skipped")"
echo "  Python API: $([[ "$DEPLOY_PYTHON" == "y" ]] && echo "✅ $PYTHON_PATH" || echo "❌ Skipped")"
echo ""
read -p "Continue? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" ]]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

# SSH connection helper
SSH_CMD="ssh -p $SSH_PORT $SSH_USER@$SERVER_HOST"

echo ""
echo "🔧 Step 1: Installing dependencies on server..."
$SSH_CMD << 'ENDSSH'
# Update system
sudo apt-get update

# Install Node.js 20
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Install Python 3.11
if ! command -v python3.11 &> /dev/null; then
  sudo apt-get install -y python3.11 python3.11-venv python3-pip
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# Install Git
if ! command -v git &> /dev/null; then
  sudo apt-get install -y git
fi

echo "✅ Dependencies installed"
ENDSSH

# Deploy Frontend
if [[ "$DEPLOY_FRONTEND" == "y" ]]; then
  echo ""
  echo "🎨 Step 2: Building and deploying frontend..."
  
  # Build locally
  npm ci
  npm run build
  
  # Create remote directory
  $SSH_CMD "sudo mkdir -p $WEB_PATH && sudo chown $SSH_USER:$SSH_USER $WEB_PATH"
  
  # Upload build
  rsync -avz --delete -e "ssh -p $SSH_PORT" dist/ $SSH_USER@$SERVER_HOST:$WEB_PATH/
  
  echo "✅ Frontend deployed to $WEB_PATH"
fi

# Deploy Backend-Node
if [[ "$DEPLOY_NODE" == "y" ]]; then
  echo ""
  echo "🟢 Step 3: Deploying backend-node..."
  
  $SSH_CMD << ENDSSH
# Clone or update repo
if [ ! -d "$NODE_PATH" ]; then
  sudo mkdir -p $NODE_PATH
  sudo chown $SSH_USER:$SSH_USER $NODE_PATH
  git clone https://github.com/kaideng55555/dck-solana-trading.git $NODE_PATH
else
  cd $NODE_PATH && git pull origin main
fi

# Install dependencies
cd $NODE_PATH/backend-node
npm ci

# Create .env file
cat > .env << 'EOF'
QUICKNODE_HTTP=$QUICKNODE_HTTP
QUICKNODE_WSS=$QUICKNODE_WSS
PORT=3001
EOF

# Start with PM2
pm2 delete dck-api-node 2>/dev/null || true
pm2 start server.js --name dck-api-node --cwd $NODE_PATH/backend-node
pm2 save

echo "✅ Backend-node deployed and running"
ENDSSH
fi

# Deploy Backend-Python
if [[ "$DEPLOY_PYTHON" == "y" ]]; then
  echo ""
  echo "🐍 Step 4: Deploying backend-python..."
  
  $SSH_CMD << ENDSSH
# Clone or update repo
if [ ! -d "$PYTHON_PATH" ]; then
  sudo mkdir -p $PYTHON_PATH
  sudo chown $SSH_USER:$SSH_USER $PYTHON_PATH
  git clone https://github.com/kaideng55555/dck-solana-trading.git $PYTHON_PATH
else
  cd $PYTHON_PATH && git pull origin main
fi

# Create virtual environment
cd $PYTHON_PATH/backend-python
if [ ! -d "venv" ]; then
  python3.11 -m venv venv
fi

# Install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Start with PM2
pm2 delete dck-api-python 2>/dev/null || true
pm2 start --name dck-api-python --interpreter $PYTHON_PATH/backend-python/venv/bin/python \
  --cwd $PYTHON_PATH/backend-python \
  -- -m uvicorn main:app --host 0.0.0.0 --port 8000
pm2 save

echo "✅ Backend-python deployed and running"
ENDSSH
fi

# Configure PM2 startup
echo ""
echo "⚙️  Step 5: Configuring PM2 startup..."
$SSH_CMD "pm2 startup systemd -u $SSH_USER --hp /home/$SSH_USER | tail -n 1" | $SSH_CMD

# Show status
echo ""
echo "📊 Deployment Status:"
$SSH_CMD "pm2 list"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Configure Nginx/Apache for frontend (see below)"
echo "  2. Set up SSL with certbot"
echo "  3. Configure firewall (ufw allow 80,443,3001,8000/tcp)"
echo "  4. Test endpoints:"
echo "     - Frontend: http://$SERVER_HOST"
echo "     - Node API: http://$SERVER_HOST:3001"
echo "     - Python API: http://$SERVER_HOST:8000"
echo ""
echo "📖 Nginx config example:"
cat << 'NGINXCONF'
server {
  listen 80;
  server_name dcktoken.com www.dcktoken.com;
  root /var/www/dcktoken.com;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /api/node {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
  
  location /api/python {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }
}
NGINXCONF

echo ""
echo "🔐 To enable SSL:"
echo "  sudo apt-get install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d dcktoken.com -d www.dcktoken.com"

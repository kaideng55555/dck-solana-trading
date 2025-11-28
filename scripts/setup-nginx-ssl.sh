#!/bin/bash
# Setup nginx reverse proxy + SSL for DCK$ API
# Run this on your production server

set -e

# Configuration - Edit these defaults as needed
DOMAIN="${DOMAIN:-api.dcktoken.com}"
UPSTREAM="${UPSTREAM:-127.0.0.1:3001}"
EMAIL="${EMAIL:-admin@dcktoken.com}"

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🌐 Setting up nginx + SSL for DCK$ API"
echo "======================================="
echo "Domain: $DOMAIN"
echo "Upstream: $UPSTREAM"
echo "Email: $EMAIL"
echo ""

# 1) Install dependencies
echo "1️⃣  Installing nginx + certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx ufw

# 2) Configure firewall
echo ""
echo "2️⃣  Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"   # opens 80 + 443
sudo ufw --force enable
sudo ufw status

# 3) Create nginx configuration
echo ""
echo "3️⃣  Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/dck-api.conf >/dev/null <<EOF
# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=admin_limit:10m rate=2r/s;

# Backend upstream
upstream dck_backend {
  server ${UPSTREAM} max_fails=3 fail_timeout=30s;
  keepalive 32;
}

server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN};

  # Let's Encrypt challenge
  location /.well-known/acme-challenge/ {
    root /var/www/html;
  }

  # Redirect to HTTPS (will be configured after certbot)
  location / {
    return 301 https://\$server_name\$request_uri;
  }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN};

  # SSL certificates (will be added by certbot)
  # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
  # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Logging
  access_log /var/log/nginx/dck-api-access.log;
  error_log /var/log/nginx/dck-api-error.log warn;

  # Important for SSE / streaming
  proxy_buffering off;
  proxy_cache off;
  proxy_read_timeout 300;
  proxy_send_timeout 300;
  proxy_connect_timeout 10;
  add_header X-Accel-Buffering no;

  # Admin endpoints (stricter rate limiting)
  location /admin {
    limit_req zone=admin_limit burst=5 nodelay;
    
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "";
    
    proxy_pass http://dck_backend;
  }

  # SSE streaming endpoints (no buffering)
  location ~ ^/(xme/stream|trades/stream) {
    limit_req zone=api_limit burst=10 nodelay;
    
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Connection "";
    
    # Critical for SSE
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 3600;
    chunked_transfer_encoding off;
    
    proxy_pass http://dck_backend;
  }

  # Trading endpoints
  location ~ ^/(snipe|sell|swap) {
    limit_req zone=api_limit burst=20 nodelay;
    
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "";
    
    proxy_pass http://dck_backend;
  }

  # All other endpoints
  location / {
    limit_req zone=api_limit burst=10 nodelay;
    
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "";
    
    proxy_pass http://dck_backend;
  }
}
EOF

# 4) Enable site
echo ""
echo "4️⃣  Enabling site..."
sudo ln -sf /etc/nginx/sites-available/dck-api.conf /etc/nginx/sites-enabled/dck-api.conf
sudo rm -f /etc/nginx/sites-enabled/default  # Remove default site

# 5) Test nginx config
echo ""
echo "5️⃣  Testing nginx configuration..."
sudo nginx -t

# 6) Reload nginx
echo ""
echo "6️⃣  Reloading nginx..."
sudo systemctl enable nginx
sudo systemctl reload nginx

# 7) Create status page for root
echo ""
echo "7️⃣  Creating status page..."
STATUS_PAGE="${PROJECT_ROOT}/backend-node/public/status.html"
mkdir -p "$(dirname "$STATUS_PAGE")"
cat > "$STATUS_PAGE" <<'STATUSEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DCK$ API Status</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%);
      color: #00ff88;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 2rem;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid #00ff88;
      border-radius: 8px;
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      text-shadow: 0 0 20px #00ff88;
    }
    .status {
      font-size: 1.5rem;
      margin: 1rem 0;
      color: #ff00ff;
    }
    .pulse {
      display: inline-block;
      width: 12px;
      height: 12px;
      background: #00ff88;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .endpoints {
      margin-top: 2rem;
      text-align: left;
      font-size: 0.9rem;
    }
    .endpoints a {
      color: #00ffff;
      text-decoration: none;
      display: block;
      padding: 0.5rem 0;
    }
    .endpoints a:hover {
      color: #ff00ff;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>DCK$ API</h1>
    <div class="status">
      <span class="pulse"></span> ONLINE
    </div>
    <div class="endpoints">
      <strong>Public Endpoints:</strong>
      <a href="/healthz" target="_blank">→ /healthz</a>
      <a href="/readyz" target="_blank">→ /readyz</a>
      <a href="/xme/tokens?limit=10" target="_blank">→ /xme/tokens</a>
      <a href="/risk/So11111111111111111111111111111111111111112" target="_blank">→ /risk/SOL</a>
    </div>
  </div>
  <script>
    // Auto-refresh status every 30s
    fetch('/healthz')
      .then(r => r.json())
      .then(d => console.log('Health:', d))
      .catch(e => console.error('Health check failed:', e));
  </script>
</body>
</html>
STATUSEOF
echo "✅ Status page created at ${STATUS_PAGE}"

# 8) Test HTTP first
echo ""
echo "8️⃣  Testing HTTP endpoint..."
sleep 2
curl -I "http://${DOMAIN}/healthz" || echo "⚠️  Backend may not be running yet"

echo ""
echo "================================================"
echo "✅ Nginx configuration complete!"
echo ""
echo "🔐 Next: Setup SSL with Let's Encrypt"
echo ""
echo "Run this command to get SSL certificate:"
echo "  sudo certbot --nginx -d ${DOMAIN} --email ${EMAIL} --agree-tos --non-interactive"
echo ""
echo "Or manually:"
echo "  sudo certbot --nginx"
echo ""
echo "📋 Verification Steps:"
echo ""
echo "1) Check nginx:"
echo "   sudo nginx -t && sudo systemctl status nginx --no-pager"
echo ""
echo "2) Test local backend:"
echo "   curl -s http://127.0.0.1:3001/healthz && echo"
echo ""
echo "3) Test public HTTP:"
echo "   curl -I http://${DOMAIN}/healthz"
echo ""
echo "4) Test public HTTPS (after certbot):"
echo "   curl -I https://${DOMAIN}/healthz"
echo "   curl -s https://${DOMAIN}/readyz && echo"
echo ""
echo "5) Test SSE streaming (5 seconds):"
echo "   curl -sN --max-time 5 -H 'Accept: text/event-stream' \\"
echo "     https://${DOMAIN}/xme/stream/newpairs | head -n 5"
echo ""
echo "6) Check firewall:"
echo "   sudo ufw status"
echo "   sudo ss -lntp | egrep ':80|:443|:3001'"
echo ""
echo "7) Monitor logs:"
echo "   sudo tail -f /var/log/nginx/error.log"
echo "   sudo tail -f /var/log/nginx/access.log"
echo ""
echo "📊 Rate Limits Configured:"
echo "   • API endpoints: 10 req/s (burst 10)"
echo "   • Admin endpoints: 2 req/s (burst 5)"
echo "   • Trading endpoints: 10 req/s (burst 20)"
echo "   • SSE streams: No buffering, 1hr timeout"
echo ""
echo "To auto-renew SSL (certbot sets this up automatically):"
echo "  sudo certbot renew --dry-run"
echo ""

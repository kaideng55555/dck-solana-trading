#!/bin/bash
# Admin control panel - Quick commands for production management

API="${API:-https://api.dcktoken.com}"
ADMIN_TOKEN="${ADMIN_TOKEN:-change-me-super-secret}"

echo "🎛️  DCK$ Admin Control Panel"
echo "============================"
echo "API: $API"
echo ""

# Function to make admin calls
admin_call() {
  local endpoint="$1"
  local data="$2"
  local method="${3:-POST}"
  
  curl -s -X "$method" "$API/$endpoint" \
    -H 'content-type: application/json' \
    -H "x-admin-token: $ADMIN_TOKEN" \
    ${data:+-d "$data"}
}

# Menu
echo "Select an action:"
echo ""
echo "  1) View current config"
echo "  2) Pause trading (emergency stop)"
echo "  3) Resume trading"
echo "  4) Set risk score threshold"
echo "  5) Add wallet to allowlist"
echo "  6) Remove wallet from allowlist"
echo "  7) View fee stats"
echo "  8) Broadcast message"
echo "  9) Broadcast intro video"
echo "  0) Exit"
echo ""

read -p "Choice: " CHOICE

case $CHOICE in
  1)
    echo ""
    echo "📊 Current Configuration:"
    admin_call "admin/config" "" "GET" | jq .
    ;;
    
  2)
    echo ""
    echo "⏸️  Pausing trading..."
    admin_call "admin/config" '{"TRADING_PUBLIC":"0"}' | jq .
    echo ""
    echo "✅ Trading paused. API is now read-only."
    ;;
    
  3)
    echo ""
    echo "▶️  Resuming trading..."
    admin_call "admin/config" '{"TRADING_PUBLIC":"1"}' | jq .
    echo ""
    echo "✅ Trading resumed. Allowlist still enforced."
    ;;
    
  4)
    echo ""
    read -p "Enter new MIN_RISK_SCORE (0-100): " SCORE
    echo "Setting MIN_RISK_SCORE to $SCORE..."
    admin_call "admin/config" "{\"MIN_RISK_SCORE\":\"$SCORE\"}" | jq .
    ;;
    
  5)
    echo ""
    read -p "Enter wallet address: " WALLET
    echo "Adding $WALLET to allowlist..."
    admin_call "admin/wallets/add" "{\"wallet\":\"$WALLET\"}" | jq .
    ;;
    
  6)
    echo ""
    read -p "Enter wallet address: " WALLET
    echo "Removing $WALLET from allowlist..."
    admin_call "admin/wallets/remove" "{\"wallet\":\"$WALLET\"}" | jq .
    ;;
    
  7)
    echo ""
    echo "📈 Fee Statistics (last 24h):"
    curl -s "$API/admin/fees/stats?period=24h" \
      -H "x-admin-token: $ADMIN_TOKEN" | jq .
    ;;
    
  8)
    echo ""
    read -p "Enter message text: " TEXT
    echo "Broadcasting message..."
    admin_call "ads/broadcast" "{\"text\":\"$TEXT\"}" | jq .
    ;;
    
  9)
    echo ""
    read -p "Enter video caption [Meet the Bull Slayer]: " CAPTION
    CAPTION="${CAPTION:-Meet the Bull Slayer — DCK\$ Tools intro}"
    echo "Broadcasting intro video..."
    admin_call "ads/broadcast-video" "{\"caption\":\"$CAPTION\"}" | jq .
    ;;
    
  0)
    echo "Goodbye!"
    exit 0
    ;;
    
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "Done!"

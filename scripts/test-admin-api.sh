#!/bin/bash
# Test script for admin API endpoints
# Usage: 
#   Local:      ./test-admin-api.sh local
#   Production: ./test-admin-api.sh prod

set -e

MODE="${1:-local}"

if [ "$MODE" = "prod" ]; then
  BASE_URL="https://api.dcktoken.com"
  echo "🔴 PRODUCTION MODE - USE WITH CAUTION"
  read -p "Enter production ADMIN_TOKEN: " ADMIN_TOKEN
else
  BASE_URL="http://localhost:3001"
  ADMIN_TOKEN="change-me-super-secret"
  echo "🟢 LOCAL MODE - Testing on $BASE_URL"
fi

echo ""
echo "🧪 Testing Admin API Endpoints"
echo "================================"
echo ""

# Test 1: Get current config
echo "1️⃣  GET /admin/config"
curl -s -X GET "$BASE_URL/admin/config" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq .
echo ""
echo ""

# Test 2: Pause trading (emergency stop)
echo "2️⃣  POST /admin/config - PAUSE TRADING"
echo "   Setting TRADING_PUBLIC=0..."
curl -s -X POST "$BASE_URL/admin/config" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"TRADING_PUBLIC":"0"}' | jq .
echo ""
echo ""

# Test 3: Update MIN_RISK_SCORE
echo "3️⃣  POST /admin/config - Update MIN_RISK_SCORE to 50"
curl -s -X POST "$BASE_URL/admin/config" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"MIN_RISK_SCORE":"50"}' | jq .
echo ""
echo ""

# Test 4: Add wallet to allowlist
TEST_WALLET="DemoWa11et1111111111111111111111111111111"
echo "4️⃣  POST /admin/wallets/add - Add test wallet"
echo "   Wallet: $TEST_WALLET"
curl -s -X POST "$BASE_URL/admin/wallets/add" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d "{\"wallet\":\"$TEST_WALLET\"}" | jq .
echo ""
echo ""

# Test 5: Get updated config
echo "5️⃣  GET /admin/config - Verify changes"
curl -s -X GET "$BASE_URL/admin/config" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq .
echo ""
echo ""

# Test 6: Remove wallet from allowlist
echo "6️⃣  POST /admin/wallets/remove - Remove test wallet"
curl -s -X POST "$BASE_URL/admin/wallets/remove" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d "{\"wallet\":\"$TEST_WALLET\"}" | jq .
echo ""
echo ""

# Test 7: Reset config to defaults
echo "7️⃣  POST /admin/config - Reset to defaults"
echo "   TRADING_PUBLIC=0, MIN_RISK_SCORE=40"
curl -s -X POST "$BASE_URL/admin/config" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"TRADING_PUBLIC":"0","MIN_RISK_SCORE":"40"}' | jq .
echo ""
echo ""

echo "✅ Admin API tests complete!"
echo ""
if [ "$MODE" = "prod" ]; then
  echo "⚠️  Remember to review production config and re-enable trading if needed:"
  echo "   curl -X POST $BASE_URL/admin/config \\"
  echo "     -H 'x-admin-token: YOUR_TOKEN' -H 'content-type: application/json' \\"
  echo "     -d '{\"TRADING_PUBLIC\":\"1\"}'"
fi

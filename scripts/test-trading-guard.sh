#!/bin/bash
# Test script for trading guard middleware

BASE_URL="${1:-http://localhost:3001}"
echo "🧪 Testing Trading Guard at $BASE_URL"
echo ""

# Test 1: Health check (no guard)
echo "✅ Test 1: Health check (no guard required)"
curl -s "$BASE_URL/healthz" | jq -c .
echo ""

# Test 2: Closed beta - expect 403
echo "❌ Test 2: Snipe without wallet header (expect 403)"
curl -s -X POST "$BASE_URL/snipe/intent" \
  -H 'content-type: application/json' \
  -d '{"mint":"So11111111111111111111111111111111111111112","lamports":500000}' | jq -c .
echo ""

# Test 3: Closed beta - with wallet in allowlist
echo "✅ Test 3: Snipe with allowlisted wallet (expect 200)"
curl -s -X POST "$BASE_URL/snipe/intent" \
  -H 'content-type: application/json' \
  -H 'x-wallet: YourWallet1' \
  -d '{"mint":"So11111111111111111111111111111111111111112","lamports":500000}' | jq -c .
echo ""

# Test 4: Admin override
echo "✅ Test 4: Snipe with admin token (expect 200)"
curl -s -X POST "$BASE_URL/snipe/intent" \
  -H 'content-type: application/json' \
  -H 'x-admin-token: change-me-super-secret' \
  -d '{"mint":"So11111111111111111111111111111111111111112","lamports":500000}' | jq -c .
echo ""

# Test 5: Sell endpoint - closed beta
echo "❌ Test 5: Sell without wallet header (expect 403)"
curl -s -X POST "$BASE_URL/sell/intent" \
  -H 'content-type: application/json' \
  -d '{"mint":"So11111111111111111111111111111111111111112","amount":"all"}' | jq -c .
echo ""

# Test 6: Sell endpoint - with allowlist
echo "✅ Test 6: Sell with allowlisted wallet (expect 200)"
curl -s -X POST "$BASE_URL/sell/intent" \
  -H 'content-type: application/json' \
  -H 'x-wallet: YourWallet1' \
  -d '{"mint":"So11111111111111111111111111111111111111112","amount":"all"}' | jq -c .
echo ""

# Test 7: CORS check
echo "📡 Test 7: CORS preflight (fees endpoint)"
curl -s "$BASE_URL/fees/suggest" | jq -c .
echo ""

echo "🎉 Trading guard tests complete!"
echo ""
echo "💡 To switch to public mode:"
echo "   Set TRADING_PUBLIC=1 in .env and restart"

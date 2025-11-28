#!/bin/bash
# Comprehensive smoke test for DCK$ API

BASE="${BASE:-http://localhost:3001}"
echo "🧪 Running comprehensive smoke tests on $BASE"
echo "================================================"
echo ""

# Test 1: Health check
echo "1️⃣  Health check"
HEALTH=$(curl -s "$BASE/healthz")
echo "$HEALTH"
if echo "$HEALTH" | jq -e '.ok == true' > /dev/null 2>&1; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
echo ""

# Test 2: Ready check
echo "2️⃣  Ready check"
READY=$(curl -s "$BASE/readyz")
echo "$READY"
if echo "$READY" | jq -e '.ok == true' > /dev/null 2>&1; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
echo ""

# Test 3: Admin protected (should be 401)
echo "3️⃣  Admin endpoint without auth (expect 401)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin/config")
echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ PASS - Properly protected"
else
  echo "❌ FAIL - Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 4: Admin with token
echo "4️⃣  Admin endpoint with auth token"
ADMIN_CONFIG=$(curl -s "$BASE/admin/config" -H "x-admin-token: change-me-super-secret")
echo "$ADMIN_CONFIG" | jq .
MIN_RISK=$(echo "$ADMIN_CONFIG" | jq -r '.config.MIN_RISK_SCORE')
TRADING_PUBLIC=$(echo "$ADMIN_CONFIG" | jq -r '.config.TRADING_PUBLIC')
echo "MIN_RISK_SCORE: $MIN_RISK"
echo "TRADING_PUBLIC: $TRADING_PUBLIC"
if [ "$MIN_RISK" = "50" ] && [ "$TRADING_PUBLIC" = "0" ]; then
  echo "✅ PASS - Config matches expected values"
else
  echo "⚠️  Config values differ from expected (MIN_RISK_SCORE=50, TRADING_PUBLIC=0)"
fi
echo ""

# Test 5: Risk scoring on SOL
echo "5️⃣  Risk scoring for SOL"
RISK=$(curl -s "$BASE/risk/So11111111111111111111111111111111111111112")
LABEL=$(echo "$RISK" | jq -r '.label')
SCORE=$(echo "$RISK" | jq -r '.score')
echo "Label: $LABEL"
echo "Score: $SCORE"
if [ "$LABEL" = "LOW" ] && [ "$SCORE" -gt "90" ]; then
  echo "✅ PASS - SOL properly scored as LOW risk"
else
  echo "⚠️  Unexpected risk score"
fi
echo ""

# Test 6: XME tokens endpoint
echo "6️⃣  XME tokens endpoint"
XME=$(curl -s "$BASE/xme/tokens?limit=10")
XME_OK=$(echo "$XME" | jq -r '.ok')
XME_COUNT=$(echo "$XME" | jq -r '.count')
echo "OK: $XME_OK"
echo "Count: $XME_COUNT"
if [ "$XME_OK" = "true" ]; then
  echo "✅ PASS - XME endpoint responding"
else
  echo "❌ FAIL - XME endpoint error"
fi
echo ""

echo "================================================"
echo "🎉 Smoke tests complete!"

#!/bin/bash
# scripts/smoke.sh - API smoke tests

API_BASE="${API_BASE:-http://localhost:3001}"
VITE_BIRDEYE_API_KEY=your-actual-key

echo "🧪 DCK$ API Smoke Tests"
echo "========================"
echo "Base URL: $API_BASE"
echo ""

# Test 1: Health check
echo "1️⃣  Testing /healthz..."
curl -s "$API_BASE/healthz" | jq '.'
echo ""

# Test 2: Ready check
echo "2️⃣  Testing /readyz..."
curl -s "$API_BASE/readyz" | jq '.'
echo ""

# Test 3: Fee suggestions
echo "3️⃣  Testing /fees/suggest..."
curl -s "$API_BASE/fees/suggest" | jq '.'
echo ""

# Test 4: Fee suggestions with multiplier
echo "4️⃣  Testing /fees/suggest?mult=1.5..."
curl -s "$API_BASE/fees/suggest?mult=1.5" | jq '.'
echo ""

# Test 5: Risk check (placeholder mint)
echo "5️⃣  Testing /risk/:mint..."
curl -s "$API_BASE/risk/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" | jq '.'
echo ""

echo "✅ Smoke tests complete!"

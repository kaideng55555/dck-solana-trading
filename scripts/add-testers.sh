#!/bin/bash
# Bulk add testers to allowlist
# Usage: ./add-testers.sh testers.txt

set -e

API="${API:-https://api.dcktoken.com}"
ADMIN_TOKEN="${ADMIN_TOKEN:-change-me-super-secret}"
TESTER_FILE="${1:-testers.txt}"

if [ ! -f "$TESTER_FILE" ]; then
  echo "❌ File not found: $TESTER_FILE"
  echo ""
  echo "Usage: $0 <testers-file>"
  echo ""
  echo "Create a file with one wallet address per line:"
  echo "  DemoWa11et1111111111111111111111111111111"
  echo "  AnotherWa11et222222222222222222222222222"
  echo ""
  exit 1
fi

echo "🔐 Adding testers from: $TESTER_FILE"
echo "API: $API"
echo ""

# Count total
TOTAL=$(grep -c -v '^[[:space:]]*$' "$TESTER_FILE" || true)
echo "Found $TOTAL wallet(s) to add"
echo ""

# Add each wallet
SUCCESS=0
FAILED=0

while IFS= read -r WALLET; do
  # Skip empty lines and comments
  [[ -z "$WALLET" ]] && continue
  [[ "$WALLET" =~ ^[[:space:]]*# ]] && continue
  
  # Trim whitespace
  WALLET=$(echo "$WALLET" | xargs)
  
  echo -n "Adding: $WALLET ... "
  
  RESPONSE=$(curl -s -X POST "$API/admin/wallets/add" \
    -H 'content-type: application/json' \
    -H "x-admin-token: $ADMIN_TOKEN" \
    -d "{\"wallet\":\"$WALLET\"}")
  
  if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    echo "✅"
    ((SUCCESS++))
  else
    echo "❌"
    echo "  Error: $(echo "$RESPONSE" | jq -r '.error // .message // "Unknown error"')"
    ((FAILED++))
  fi
  
  # Small delay to avoid rate limits
  sleep 0.1
  
done < "$TESTER_FILE"

echo ""
echo "================================================"
echo "✅ Added: $SUCCESS"
echo "❌ Failed: $FAILED"
echo ""

# Verify final allowlist
echo "📋 Current allowlist:"
curl -s "$API/admin/config" -H "x-admin-token: $ADMIN_TOKEN" | jq -r '.config.ALLOWED_WALLETS_LIST[]'
echo ""
echo "Total wallets: $(curl -s "$API/admin/config" -H "x-admin-token: $ADMIN_TOKEN" | jq -r '.config.ALLOWED_WALLETS_LIST | length')"

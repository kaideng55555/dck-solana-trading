#!/bin/bash
# Add deployment status badges to README.md

README_FILE="README.md"
REPO="kaideng55555/dck-solana-trading"

# Badges to add
BADGES="
[![Deploy UI](https://github.com/$REPO/actions/workflows/deploy-ui.yml/badge.svg)](https://github.com/$REPO/actions/workflows/deploy-ui.yml)
[![Deploy API](https://github.com/$REPO/actions/workflows/deploy-api-pm2.yml/badge.svg)](https://github.com/$REPO/actions/workflows/deploy-api-pm2.yml)
[![CI](https://github.com/$REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/$REPO/actions/workflows/ci.yml)
"

if [ ! -f "$README_FILE" ]; then
  echo "# DCK\$ Tools - Solana Trading System" > "$README_FILE"
  echo "" >> "$README_FILE"
  echo "$BADGES" >> "$README_FILE"
  echo "" >> "$README_FILE"
  echo "Full-stack Solana trading system with real-time token discovery." >> "$README_FILE"
  echo "✅ Created README.md with badges"
else
  # Check if badges already exist
  if grep -q "actions/workflows" "$README_FILE"; then
    echo "⚠️  Badges already present in README.md"
  else
    # Insert badges after first heading
    sed -i.bak "1a\\
$BADGES
" "$README_FILE"
    rm -f "${README_FILE}.bak"
    echo "✅ Added badges to README.md"
  fi
fi

echo ""
echo "📋 README.md preview:"
head -n 10 "$README_FILE"

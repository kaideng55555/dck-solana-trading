#!/bin/bash
# health_check.sh - Quick backend health check
# Usage: ./health_check.sh [API_URL]

API="${1:-http://localhost:3001}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}🔍 DCK$ Health Check${NC}"
echo "Target: $API"
echo "---"

# Health endpoint
echo -n "Health endpoint: "
HEALTH=$(curl -s -w "%{http_code}" -o /tmp/health.json "$API/healthz" 2>/dev/null)
if [ "$HEALTH" = "200" ]; then
  echo -e "${GREEN}OK${NC}"
  cat /tmp/health.json | jq -c . 2>/dev/null || cat /tmp/health.json
else
  echo -e "${RED}FAIL ($HEALTH)${NC}"
fi

# RPC check
echo -n "RPC connection: "
RPC_OK=$(cat /tmp/health.json | jq -r '.rpc // false' 2>/dev/null)
if [ "$RPC_OK" = "true" ]; then
  echo -e "${GREEN}Connected${NC}"
else
  echo -e "${RED}Disconnected${NC}"
fi

# Uptime
UPTIME=$(cat /tmp/health.json | jq -r '.uptime // 0' 2>/dev/null)
echo "Uptime: ${UPTIME}s"

# Price API test
echo -n "Price API (SOL): "
PRICE=$(curl -s "$API/price/So11111111111111111111111111111111111111112" 2>/dev/null | jq -r '.price // "error"')
if [ "$PRICE" != "error" ] && [ "$PRICE" != "null" ]; then
  echo -e "${GREEN}\$${PRICE}${NC}"
else
  echo -e "${RED}FAIL${NC}"
fi

# Risk API test
echo -n "Risk API (SOL): "
RISK=$(curl -s "$API/risk/So11111111111111111111111111111111111111112" 2>/dev/null | jq -r '.score // "error"')
if [ "$RISK" != "error" ] && [ "$RISK" != "null" ]; then
  echo -e "${GREEN}Score: ${RISK}${NC}"
else
  echo -e "${RED}FAIL${NC}"
fi

echo "---"
echo -e "${YELLOW}Done${NC}\n"

# Production Quick Reference

**API:** https://api.dcktoken.com  
**Admin Token:** Set in `ADMIN_TOKEN` env var

## Emergency Commands

```bash
# Set vars
export API=https://api.dcktoken.com
export ADMIN_TOKEN=your-secret-token

# PAUSE TRADING (immediate)
curl -X POST "$API/admin/config" -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" -d '{"TRADING_PUBLIC":"0"}' | jq .

# RESUME TRADING
curl -X POST "$API/admin/config" -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" -d '{"TRADING_PUBLIC":"1"}' | jq .

# CHECK STATUS
curl "$API/admin/config" -H "x-admin-token: $ADMIN_TOKEN" | jq .
```

## PM2 Commands

```bash
pm2 status              # Status
pm2 logs dck-api -f     # Follow logs
pm2 restart dck-api     # Restart
pm2 monit              # Monitor
```

## Add Beta Testers

```bash
# Single wallet
curl -X POST "$API/admin/wallets/add" -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"wallet":"WALLET_ADDRESS_HERE"}' | jq .

# Bulk (use script)
bash scripts/add-testers.sh testers.txt
```

## Admin Panel

```bash
bash scripts/admin-panel.sh
```

## Monitoring

```bash
# Logs
pm2 logs dck-api --lines 100
sudo tail -f /var/log/nginx/dck-api-error.log

# Health
curl "$API/healthz" | jq .
curl "$API/readyz" | jq .

# Test suite
BASE=$API bash scripts/smoke-full.sh
```

## Config Changes

```bash
# Risk threshold
curl -X POST "$API/admin/config" -H 'content-type: application/json' \
  -H "x-admin-token: $ADMIN_TOKEN" -d '{"MIN_RISK_SCORE":"60"}' | jq .

# View current
curl "$API/admin/config" -H "x-admin-token: $ADMIN_TOKEN" | jq '.config'
```

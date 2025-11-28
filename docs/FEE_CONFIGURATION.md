# Fee Configuration Guide

Complete guide for setting up platform fees in DCK$ Tools.

## Overview

The platform collects a configurable percentage fee on all trades. Fees are deducted before the swap and sent to a designated wallet.

## Configuration

### 1. Set Fee Wallet

Add to your `.env` file:

```bash
# Platform Fee Configuration
FEE_WALLET=YourSolanaWalletPublicKeyHere
FEE_PERCENTAGE=1.0
```

**Important:**
- `FEE_WALLET` must be a valid Solana base58 public key
- `FEE_PERCENTAGE` is the fee percentage (1.0 = 1%, 2.5 = 2.5%, etc.)
- Maximum recommended: 5% (higher fees may deter users)

### 2. Generate a Fee Wallet

If you don't have a wallet yet:

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate new keypair
solana-keygen new --outfile ~/fee-wallet.json

# View public key
solana-keygen pubkey ~/fee-wallet.json
```

**Or use an existing wallet:**
- Phantom wallet address
- Hardware wallet address
- Any Solana wallet you control

### 3. Verify Configuration

```bash
curl -s http://localhost:3001/admin/fees \
  -H "x-admin-token: your-admin-token" | jq .
```

**Example response:**
```json
{
  "ok": true,
  "fees": {
    "wallet": "DCKFee1111111111111111111111111111111111111",
    "percentage": 1.0,
    "enabled": true
  }
}
```

## How Fees Work

### Fee Calculation

**For Buy/Snipe:**
```
User wants to spend: 0.1 SOL
Platform fee (1%): 0.001 SOL
Net swap amount: 0.099 SOL
```

The system:
1. Receives 0.1 SOL from user
2. Transfers 0.001 SOL to fee wallet
3. Swaps remaining 0.099 SOL for tokens
4. User receives tokens from 0.099 SOL swap

**For Sell:**
```
User wants to sell: 1000 tokens
Swap output: 0.05 SOL
Platform fee (1%): 0.0005 SOL
Net to user: 0.0495 SOL
```

The system:
1. Swaps 1000 tokens for 0.05 SOL
2. Transfers 0.0005 SOL to fee wallet
3. Sends remaining 0.0495 SOL to user

### Fee Tracking

All fees are automatically recorded in the admin fee tracking system:

```bash
# View fee statistics
curl -s http://localhost:3001/admin/fees/stats?period=24h \
  -H "x-admin-token: your-admin-token" | jq .
```

**Example response:**
```json
{
  "ok": true,
  "period": "24h",
  "stats": {
    "totalFees": 1.5,
    "totalVolume": 150.0,
    "feeCount": 42,
    "avgFee": 0.0357,
    "topTraders": [...]
  }
}
```

## Production Setup

### 1. Create Dedicated Fee Wallet

```bash
# Generate secure fee wallet
solana-keygen new --outfile ~/dck-fee-wallet.json --no-bip39-passphrase

# Get public key
FEE_WALLET=$(solana-keygen pubkey ~/dck-fee-wallet.json)
echo "Fee Wallet: $FEE_WALLET"

# Backup the keypair securely!
# Store ~/dck-fee-wallet.json in a secure location
```

### 2. Update Production Environment

```bash
# Add to your .env or PM2 config
export FEE_WALLET="<your-fee-wallet-public-key>"
export FEE_PERCENTAGE="1.0"

# Restart backend
pm2 restart dck-api
```

### 3. Verify in Production

```bash
# Test fee configuration
curl -s https://api.dcktoken.com/admin/fees \
  -H "x-admin-token: $ADMIN_TOKEN" | jq .

# Monitor fee collection
curl -s https://api.dcktoken.com/admin/fees/stats?period=24h \
  -H "x-admin-token: $ADMIN_TOKEN" | jq .
```

## Security Best Practices

### Fee Wallet Security

1. **Never commit private keys to git**
   ```bash
   # Add to .gitignore
   echo "*-wallet.json" >> .gitignore
   echo "*.key" >> .gitignore
   ```

2. **Use separate wallet for fees**
   - Don't use your personal wallet
   - Don't use deployment wallet
   - Create dedicated fee collection wallet

3. **Backup securely**
   ```bash
   # Encrypt backup
   gpg -c ~/dck-fee-wallet.json
   # Store encrypted backup offline
   ```

4. **Regular withdrawals**
   - Don't accumulate large amounts
   - Transfer to cold storage regularly
   - Monitor wallet balance

### Monitoring

```bash
# Check fee wallet balance
solana balance <FEE_WALLET>

# View recent transactions
solana transaction-history <FEE_WALLET> --limit 10

# Set up alerts (optional)
# Use Solana RPC webhooks or polling script
```

## Fee Strategies

### Recommended Fee Tiers

- **Beta testing**: 0.5% (attract early users)
- **Standard**: 1.0% (industry standard)
- **Premium features**: 1.5-2.0%
- **Maximum**: 5.0% (users may avoid higher)

### Dynamic Fees (Future Enhancement)

```typescript
// Example: Lower fees for higher volume
if (userMonthlyVolume > 100 SOL) {
  feePercentage = 0.5; // VIP rate
} else if (userMonthlyVolume > 10 SOL) {
  feePercentage = 0.75; // Regular
} else {
  feePercentage = 1.0; // Standard
}
```

## API Reference

### GET /admin/fees

View current fee configuration.

**Headers:**
- `x-admin-token`: Admin authentication token

**Response:**
```json
{
  "ok": true,
  "fees": {
    "wallet": "DCKFee1111111111111111111111111111111111111",
    "percentage": 1.0,
    "enabled": true
  }
}
```

### GET /admin/fees/stats

View fee collection statistics.

**Query Parameters:**
- `period`: `1h`, `24h`, `7d`, `30d`, `all`

**Headers:**
- `x-admin-token`: Admin authentication token

**Response:**
```json
{
  "ok": true,
  "period": "24h",
  "stats": {
    "totalFees": 1.5,
    "totalVolume": 150.0,
    "feeCount": 42,
    "avgFee": 0.0357
  }
}
```

## Troubleshooting

### Fees Not Being Collected

**Check fee configuration:**
```bash
curl http://localhost:3001/admin/fees -H "x-admin-token: $ADMIN_TOKEN" | jq .
```

**Verify enabled:**
```json
{
  "fees": {
    "enabled": true  // Must be true
  }
}
```

### Invalid Fee Wallet

**Error:** "Invalid FEE_WALLET address"

**Solution:**
1. Verify wallet is valid Solana address (base58)
2. Check for typos or extra spaces
3. Use `solana-keygen pubkey` to verify

### Fees Too High/Low

**Update fee percentage:**
```bash
# Edit .env
FEE_PERCENTAGE=1.5

# Restart
pm2 restart dck-api
```

## Revenue Monitoring

### Daily Revenue Check

```bash
#!/bin/bash
# daily-revenue.sh

API="https://api.dcktoken.com"
ADMIN_TOKEN="your-token"

echo "📊 Daily Revenue Report"
echo "======================="

# Last 24h
curl -s "$API/admin/fees/stats?period=24h" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq '{
    fees: .stats.totalFees,
    volume: .stats.totalVolume,
    trades: .stats.feeCount,
    avgFee: .stats.avgFee
  }'

# Check wallet balance
FEE_WALLET=$(curl -s "$API/admin/fees" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq -r '.fees.wallet')

echo ""
echo "Fee Wallet Balance:"
solana balance $FEE_WALLET
```

---

**Status:** Production Ready ✅  
**Last Updated:** 2025-11-26

# Trading Guard Middleware

Protects trading endpoints (`/snipe/intent`, `/sell/intent`) with allowlist and admin override capabilities.

## Configuration

Add these environment variables to `backend-node/.env`:

```bash
# Trading Access Control
TRADING_PUBLIC=0                                    # 0 = closed beta, 1 = open to everyone
ADMIN_TOKEN=your-super-secret-admin-token-here      # Admin override (MUST change in production!)
ALLOWED_WALLETS=Wallet1PubKey,Wallet2PubKey         # Comma-separated base58 wallet addresses

# Trading Safety Limits (optional)
MIN_LIQ_USD=3000                                    # Minimum liquidity requirement
MIN_TOKEN_AGE_MINUTES=20                            # Minimum token age
MAX_TAX_PCT=10                                      # Maximum buy/sell tax
```

## Access Control Rules

Access to trading endpoints is granted if **any** of the following are true:

1. **Admin Override**: Request includes valid `x-admin-token` header
2. **Public Mode**: `TRADING_PUBLIC=1` (open to everyone)
3. **Allowlist**: Request includes `x-wallet` header with wallet address in `ALLOWED_WALLETS`

Otherwise, returns `403 Forbidden` with error message: `"Closed beta: wallet not allowlisted"`

## Usage Examples

### Closed Beta Mode (Default)

```bash
# Set environment
TRADING_PUBLIC=0
ALLOWED_WALLETS=9xQeW...abc,5yRtP...xyz
ADMIN_TOKEN=my-secret-token

# ❌ Blocked - no wallet header
curl -X POST http://localhost:3001/snipe/intent \
  -H 'content-type: application/json' \
  -d '{"mint":"So11111...","lamports":500000}'
# Response: {"ok":false,"error":"Closed beta: wallet not allowlisted"}

# ✅ Allowed - wallet in allowlist
curl -X POST http://localhost:3001/snipe/intent \
  -H 'content-type: application/json' \
  -H 'x-wallet: 9xQeW...abc' \
  -d '{"mint":"So11111...","lamports":500000}'
# Response: {"ok":true,"txId":"DEV_MODE_BUY",...}

# ✅ Allowed - admin override
curl -X POST http://localhost:3001/snipe/intent \
  -H 'content-type: application/json' \
  -H 'x-admin-token: my-secret-token' \
  -d '{"mint":"So11111...","lamports":500000}'
# Response: {"ok":true,"txId":"DEV_MODE_BUY",...}
```

### Public Mode

```bash
# Set environment
TRADING_PUBLIC=1

# ✅ Allowed - anyone can trade
curl -X POST http://localhost:3001/snipe/intent \
  -H 'content-type: application/json' \
  -d '{"mint":"So11111...","lamports":500000}'
# Response: {"ok":true,"txId":"DEV_MODE_BUY",...}
```

## Testing

Run the test suite to verify trading guard is working:

```bash
# Test locally
./scripts/test-trading-guard.sh

# Test production
./scripts/test-trading-guard.sh https://api.dcktoken.com
```

Expected output:
- ✅ Health checks pass (no guard)
- ❌ Snipe/sell without headers returns 403
- ✅ Snipe/sell with allowlisted wallet returns 200
- ✅ Snipe/sell with admin token returns 200

## Frontend Integration

Include the wallet address in API requests:

```typescript
// Get connected wallet
const wallet = useWallet();

// Make trading request
const response = await fetch('/snipe/intent', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-wallet': wallet.publicKey.toBase58(), // Include wallet pubkey
  },
  body: JSON.stringify({
    mint: tokenAddress,
    lamports: 500000,
  }),
});

// Handle 403 response
if (response.status === 403) {
  const error = await response.json();
  alert(error.error); // "Closed beta: wallet not allowlisted"
}
```

## Security Notes

1. **Change `ADMIN_TOKEN`**: The default value `change-me-super-secret` is insecure
2. **Use HTTPS**: Always use HTTPS in production to protect admin token
3. **Rate Limiting**: Trading endpoints respect global rate limits
4. **Wallet Validation**: Frontend should verify wallet signatures before sending requests

## Protected Endpoints

- `POST /snipe/intent` - Buy tokens
- `POST /sell/intent` - Sell tokens

All other endpoints (fees, status, price, etc.) remain public.

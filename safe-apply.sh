#!/usr/bin/env bash
set -euo pipefail

# DCK$ Tools v2 - Safe Upgrade Installer
# Usage:
#   bash safe-apply.sh --zip repo_wiring_patch_pack.zip --zip repo_upgrade_full.zip --zip price_upgrade_pack.zip
# Tips:
#   DRY_RUN=1 bash safe-apply.sh ...   # show what would happen, no writes
#   ROLLBACK: git reset --hard && git clean -fd

ZIPS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --zip) ZIPS+=("$2"); shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Not a git repo. Please run inside your repo root." >&2
  exit 1
fi

branch="dck-upgrade-$(date +%Y%m%d-%H%M%S)"
echo "🔧 Creating branch: $branch"
git checkout -b "$branch"

mkdir -p .dck_tmp
tmpdir="$(mktemp -d .dck_tmp/zip-XXXXXX)"

# Map function: copy from zip tree to project tree
copy_tree() {
  local src="$1"
  local dst="$2"
  if [[ -n "${DRY_RUN:-}" ]]; then
    echo "DRY cp -r \"$src\" -> \"$dst\""
    return 0
  fi
  mkdir -p "$dst"
  rsync -a --delete --mkpath "$src"/ "$dst"/
}

# Extract zips and stage file copies
for z in "${ZIPS[@]}"; do
  if [[ ! -f "$z" ]]; then
    echo "❌ Zip not found: $z"
    exit 1
  fi
  echo "📦 Unzipping $z"
  unzip -q "$z" -d "$tmpdir"
done

echo "🗂  Copying backend-node files (routes, lib, public)"
if [[ -d "$tmpdir/backend-node" ]]; then
  copy_tree "$tmpdir/backend-node" "backend-node"
fi

echo "🗂  Copying FRONTEND files (map web/src → src)"
# Support both layouts: frontend/web/src/* and web/src/*
if [[ -d "$tmpdir/frontend/web/src" ]]; then
  copy_tree "$tmpdir/frontend/web/src" "src"
fi
if [[ -d "$tmpdir/web/src" ]]; then
  copy_tree "$tmpdir/web/src" "src"
fi
if [[ -d "$tmpdir/src" ]]; then
  copy_tree "$tmpdir/src" "src"
fi

# Patches to try (optional)
declare -a PATCHES=(
  "backend-node/src_index_register_all.patch"
  "backend-node/src_index_start_ingest.patch"
  "backend-node/src_index_register_price.patch"
)

echo "🩹 Applying git patches (if present)"
for p in "${PATCHES[@]}"; do
  if [[ -f "$tmpdir/$p" ]]; then
    echo "— Checking $p"
    if git apply --check "$tmpdir/$p" 2>/dev/null; then
      if [[ -n "${DRY_RUN:-}" ]]; then
        echo "DRY git apply $p"
      else
        git apply "$tmpdir/$p"
        echo "✓ Applied $p"
      fi
    else
      echo "⚠️  Patch failed check: $p"
      echo "    I saved the manual snippet to .dck_tmp/$(basename "$p").txt"
      mkdir -p .dck_tmp
      # Dump the patch for manual use
      cp "$tmpdir/$p" ".dck_tmp/$(basename "$p").txt"
    fi
  fi
done

echo "📄 Writing manual index.ts snippet (in case patches failed)"
cat > .dck_tmp/index_manual_snippet.ts.txt <<'SNIP'
// IMPORTS (top of backend-node/src/index.ts)
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { registerHealthRoutes } from './routes/health';
import { registerMetricsRoutes } from './routes/metrics';
import { registerStreamRoutes } from './routes/stream';
import { registerFeeRoutes } from './routes/fees';
import { registerJitoRoutes } from './routes/jito';
import { registerSnipeRoutes } from './routes/snipe';
import { registerLaunchRoutes } from './routes/launch';
import { registerLockLPRoutes } from './routes/lock-lp';
import { registerTokenRoutes } from './routes/token';
import { registerPriceRoutes } from './routes/price';
import { Connection } from '@solana/web3.js';
import { startOnchainTradeIngest } from './ingest/onchainTrades';

// MIDDLEWARE (after const app = express())
app.set('trust proxy', 1);
Sentry.init({ dsn: process.env.SENTRY_DSN || undefined, environment: process.env.NODE_ENV || 'development', tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1) });
app.use(Sentry.Handlers.requestHandler());

const ALLOWED = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => { if (!origin || ALLOWED.includes('*') || ALLOWED.includes(origin)) return cb(null, true); cb(new Error('Not allowed by CORS')); }, credentials: true }));
app.use(helmet());
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.static('public'));
app.use(rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000), max: Number(process.env.RATE_LIMIT_MAX || 120) }));

// ROUTES (before app.listen)
registerHealthRoutes(app);
registerMetricsRoutes(app);
registerStreamRoutes(app);
registerFeeRoutes(app);
registerJitoRoutes(app);
registerSnipeRoutes(app);
registerLaunchRoutes(app);
registerLockLPRoutes(app);
registerTokenRoutes(app);
registerPriceRoutes(app);

// INGEST (after routes)
if ((process.env.RPC_HTTP || process.env.QUICKNODE_RPC) && process.env.TRADE_INGEST === 'on') {
  const conn = new Connection(process.env.RPC_HTTP || process.env.QUICKNODE_RPC, 'confirmed');
  startOnchainTradeIngest(conn);
}
SNIP

echo "✅ Staging changes"
git add -A
git status --short

echo
echo "Next steps:"
echo "1) Install backend deps (run once):"
echo "   npm i -w backend-node cors helmet morgan express-rate-limit @sentry/node prom-client @solana/web3.js @solana/spl-token @raydium-io/raydium-sdk-v2 @jito-foundation/jito-ts"
echo "2) Env vars (example):"
echo "   export PORT=3001"
echo "   export RPC_HTTP=<YOUR_QUICKNODE_HTTP>"
echo "   export TRADE_INGEST=on"
echo "   export DEV_STREAM=true"
echo "   export ALLOWED_ORIGINS=http://localhost:5173"
echo "3) Start backend, then verify:"
echo "   curl localhost:3001/healthz"
echo "   curl localhost:3001/readyz"
echo "   curl localhost:3001/api/price/<MINT>"
echo "   curl localhost:3001/api/token/<MINT>"
echo "4) If any patch failed:"
echo "   - Open backend-node/src/index.ts and paste from .dck_tmp/index_manual_snippet.ts.txt into the right sections."
echo "5) Commit when happy:"
echo "   git commit -m 'DCK upgrade: routes, SSE, ingest, price cache, frontend pages'"

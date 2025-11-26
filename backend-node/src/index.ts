import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { WebSocketServer } from 'ws';
import { Connection } from '@solana/web3.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerMetricsRoutes } from './routes/metrics.js';
import { registerStreamRoutes, initDevTrades } from './routes/stream.js';
import { registerFeeSuggestRoutes } from './routes/fees.js';
import { registerStatusRoutes } from './routes/status.js';
import { registerJitoRoutes } from './routes/jito.js';
import { registerSnipeRoutes } from './routes/snipe.js';
// import { registerLaunchRoutes } from './routes/launch.js'; // Temporarily disabled - needs Metaplex v3 API update
import { registerLockLPRoutes } from './routes/lock-lp.js';
import { registerTokenRoutes } from './routes/token.js';
import { registerPriceRoutes } from './routes/price.js';
import { registerChainRoutes } from './routes/chain.js';
// import { registerNftRoutes } from './routes/nft.js'; // Temporarily disabled - needs Metaplex v3 API update
import { registerWalletRoutes } from './routes/wallet.js';
import { registerSocialRoutes } from './routes/social.js';
import { registerDevSocialRoutes } from './routes/devSocial.js';
import { registerRiskRoutes } from './routes/risk.js';
import { registerPresetsRoutes } from './routes/presets.js';
import { startOnchainTradeIngest } from './ingest/onchainTrades.js';
import { startOnchainWalletIngest } from './ingest/onchainWallet.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Sentry init
app.set('trust proxy', 1);
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    integrations: [Sentry.expressIntegration()]
  });
}

// Security & logging
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX || 120)
});
app.use(limiter);

// Solana connection
const connection = new Connection(
  process.env.RPC_HTTP || process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Basic health check
app.get('/', (_, res) => {
  res.json({ status: 'DCK$ TOOLS Node backend running' });
});

// Register all routes
registerHealthRoutes(app);
registerMetricsRoutes(app);
registerStatusRoutes(app);
registerStreamRoutes(app);
registerFeeSuggestRoutes(app);
registerJitoRoutes(app);
registerSnipeRoutes(app);
// registerLaunchRoutes(app); // Temporarily disabled - needs Metaplex v3 API update
registerLockLPRoutes(app);
registerTokenRoutes(app);
registerPriceRoutes(app);
registerChainRoutes(app);
// registerNftRoutes(app); // Temporarily disabled - needs Metaplex v3 API update
registerWalletRoutes(app);
registerSocialRoutes(app);
registerDevSocialRoutes(app);
registerRiskRoutes(app);
registerPresetsRoutes(app);

// Sentry error handler
if (process.env.SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

// Start ingest if enabled
if (process.env.TRADE_INGEST === 'on' && (process.env.RPC_HTTP || process.env.QUICKNODE_RPC)) {
  console.log('🔄 Starting onchain trade ingest...');
  startOnchainTradeIngest(connection);
}

if (process.env.WALLET_INGEST === 'on' && (process.env.RPC_HTTP || process.env.QUICKNODE_RPC)) {
  console.log('🔄 Starting onchain wallet ingest...');
  startOnchainWalletIngest(connection);
}

const server = app.listen(PORT, () => {
  console.log(`🚀 DCK$ TOOLS Node backend listening on port ${PORT}`);
  console.log(`🌐 CORS: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`📊 Trade ingest: ${process.env.TRADE_INGEST === 'on' ? 'ENABLED' : 'OFF'}`);
  console.log(`👛 Wallet ingest: ${process.env.WALLET_INGEST === 'on' ? 'ENABLED' : 'OFF'}`);
});

// WebSocket server for real-time trade updates
const wss = new WebSocketServer({ server });
initDevTrades(wss);
console.log('📡 WebSocket server initialized with dev trades');
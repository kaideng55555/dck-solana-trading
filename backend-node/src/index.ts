import dotenv from 'dotenv';
// Load environment variables as early as possible
const dotenvResult = dotenv.config();
console.log('🔧 dotenv.config() result:', dotenvResult.error ? `ERROR: ${dotenvResult.error}` : 'SUCCESS');
console.log('🔧 Current working directory:', process.cwd());
console.log('🔧 Raw FEE_WALLET from process.env:', process.env.FEE_WALLET ? `'${process.env.FEE_WALLET}'` : 'UNDEFINED');

// Global error handlers to prevent process exit
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});
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
// import { registerTokenRoutes } from './routes/token.js'; // Temporarily disabled - needs analyzers module
import { registerPriceRoutes } from './routes/price.js';
import { registerChainRoutes } from './routes/chain.js';
// import { registerNftRoutes } from './routes/nft.js'; // Temporarily disabled - needs Metaplex v3 API update
import { registerWalletRoutes } from './routes/wallet.js';
import { registerSocialRoutes } from './routes/social.js';
import { registerDevSocialRoutes } from './routes/devSocial.js';
import { registerRiskRoutes } from './routes/risk.js';
import { registerPresetsRoutes } from './routes/presets.js';
import { registerAdminFeesRoutes } from './routes/feesAdmin.js';
import { registerAdminTradingRoutes } from './routes/adminTrading.js';
import { registerAdminConfigRoutes } from './routes/adminConfig.js';
import { registerXmeRoutes } from './routes/xme.js';
import { tradingGuard, riskGuard } from './middleware/tradingGuard.js';
import { loadRuntimeConfig } from './lib/runtimeConfig.js';
import { loadFeeConfig } from './lib/feeConfig.js';
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
app.use(cors({ 
  origin: (process.env.ALLOWED_ORIGINS || '').split(','), 
  credentials: true 
}));
app.use(helmet());
app.use(morgan('tiny'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public'));

// Load runtime configuration
loadRuntimeConfig();

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX || 120)
});
app.use(limiter);

// Load fee configuration with execution verification
console.log('🔧 About to load fee configuration...');
try {
  loadFeeConfig();
  console.log('✅ Fee configuration loaded successfully');
} catch (error) {
  console.error('❌ Fee configuration failed:', error);
}

// Solana connection
const connection = new Connection(
  process.env.RPC_HTTP || process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Basic health check
app.get('/', (_, res) => {
  res.json({ status: 'DCK$ TOOLS Node backend running' });
});

// Register all routes with error handling
try {
  console.log('🔧 Registering routes...');
  registerHealthRoutes(app);
  registerMetricsRoutes(app);
  registerStatusRoutes(app);
  registerStreamRoutes(app);
  registerFeeSuggestRoutes(app);
  registerJitoRoutes(app);

  // Admin routes
  registerAdminConfigRoutes(app);
  registerAdminFeesRoutes(app);
  registerAdminTradingRoutes(app);

  // XME (Expanded Mind Engine) routes
  registerXmeRoutes(app);
  console.log('✅ Core routes registered successfully');
} catch (error) {
  console.error('❌ Route registration failed:', error);
  throw error;
}

// Trading routes with combined guards (trading + risk)
try {
  console.log('🔧 Registering trading and auxiliary routes...');
  registerSnipeRoutes(app, [tradingGuard, riskGuard]);

  // Other routes
  // registerLaunchRoutes(app); // Temporarily disabled - needs Metaplex v3 API update
  registerLockLPRoutes(app);
  // registerTokenRoutes(app); // Temporarily disabled - needs analyzers module
  registerPriceRoutes(app);
  registerChainRoutes(app);
  // registerNftRoutes(app); // Temporarily disabled - needs Metaplex v3 API update
  registerWalletRoutes(app);
  registerSocialRoutes(app);
  registerDevSocialRoutes(app);
  registerRiskRoutes(app);
  registerPresetsRoutes(app);
  console.log('✅ All auxiliary routes registered successfully');
} catch (error) {
  console.error('❌ Auxiliary route registration failed:', error);
  // Don't throw here, allow server to start with core routes
}

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
  console.log(`🌐 CORS: ${process.env.ALLOWED_ORIGINS || '*'}`);
  console.log(`📊 Trade ingest: ${process.env.TRADE_INGEST === 'on' ? 'ENABLED' : 'OFF'}`);
  console.log(`👛 Wallet ingest: ${process.env.WALLET_INGEST === 'on' ? 'ENABLED' : 'OFF'}`);
});

// WebSocket server for real-time trade updates
try {
  const wss = new WebSocketServer({ server });
  initDevTrades(wss);
  console.log('📡 WebSocket server initialized with dev trades');
  
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    wss.close();
    server.close(() => {
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    wss.close();
    server.close(() => {
      process.exit(0);
    });
  });
} catch (error) {
  console.error('❌ WebSocket initialization failed:', error);
  // Continue without WebSocket if it fails
}
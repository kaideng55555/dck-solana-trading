# DCK$ Tools - Solana Trading System

## Architecture Overview

This is a **full-stack Solana trading system** designed for real-time token discovery and trading. It features a React frontend, a dual-backend architecture (Node.js + Python), and WebSocket integration for live data.

### Core Components

- **Frontend**: React + TypeScript + Vite. Uses a custom "Neon Cyberpunk" theme (`dck-theme.css`).
- **Backend-Node** (`backend-node/`): Express server. Handles:
  - Token price feeds (via DEXScreener API).
  - Solana RPC connections (QuickNode/Mainnet).
- **Backend-Python** (`backend-python/`): FastAPI server with SQLite (`dck_data.db`). Handles:
  - Advanced analytics and price history.
  - WebSocket chat and real-time updates.
- **Real-time Service** (`src/services/wsService.ts`):
  - Abstraction over native WebSocket or Socket.IO.
  - Connects to a mint stream (e.g., Helius, QuickNode) or falls back to a demo generator.

## Key Architecture Patterns

### 1. Bonding Curve Mechanics (`src/hooks/bondingCurveLogic.ts`)
Tokens are classified into 3 rows based on their "graduation" progress:
- **Row 1 (New)**: Progress < 40%, Market Cap < $30k.
- **Row 2 (Graduating)**: Progress > 40% OR Market Cap > $30k.
- **Row 3 (Graduated)**: LP Created OR Market Cap > $150k.

**Rule**: "REAL DCK Layer2 implementation - NO SIMULATIONS". Logic must reflect real on-chain state.

### 2. State Management
- **Context-based**: No Redux/Zustand.
  - `SelectedTokenContext`: Global state for the currently active token.
  - `ThemeContext`: UI theming.
- **Data Flow**: `App.tsx` orchestrates the main tabs (`trading`, `create`, `analytics`, etc.) and passes context down.

### 3. Real-time Data
- **New Mints**: Handled by `wsService.ts`. Configurable via `VITE_MINTS_STREAM_URL`.
- **Price Updates**: Polled or streamed via Backend-Node.

## Critical Developer Workflows

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run test         # Run Vitest
npm run test:ui      # Run Vitest UI
```

### Backend - Node.js
```bash
cd backend-node
npm install
npm run dev          # Runs `ts-node src/index.ts` on port 3001
```

### Backend - Python
```bash
cd backend-python
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 # Standard FastAPI dev server
```

## Project-Specific Conventions

### Component Structure
- **Tabs**: The UI is divided into 6 main tabs managed in `App.tsx`: `trading`, `create`, `analytics`, `nfts`, `sniper`, `capsule`.
- **RealBadge**: Displays "REAL ON-CHAIN" or "DEMO MODE" in the header based on env.
- **Styling**: Use CSS modules or global `dck-theme.css` classes.
  - Colors: `.neon-cyan`, `.neon-pink`.
  - Components: `.dck-card`, `.neon-btn`.
- **Token Data**: Always use the `Token` type from `bondingCurveLogic.ts`.

### Environment Variables
- `VITE_MINTS_STREAM_URL`: WebSocket URL for new mints.
- `VITE_MINTS_TRANSPORT`: `ws` (default) or `socket.io`.
- `VITE_ENABLE_DEMO_MODE`: `true` or `false` to toggle real/demo badge.
- `QUICKNODE_HTTP` (Backend-Node): Solana RPC endpoint (HTTP).
- `QUICKNODE_WSS` (Backend-Node): WebSocket RPC endpoint (WSS).
- `PORT`: Port for the Backend-Node server.

## Integration Points

- **DEXScreener**: Used in `backend-node` to fetch real-time token prices (`/price/:tokenAddress`).
- **Solana Web3.js**: Direct interaction for wallet connection and transaction building.
- **SQLite**: Local database for the Python backend to store token history.

## Testing Strategy
- **Vitest**: Used for unit and component testing.
- **Real-time**: `useRealWS.ts` handles live WebSocket connections (QuickNode).
- **Setup**: `src/test/setup.ts` configures the test environment.

QUICKNODE_HTTP=your-mainnet-https-url
QUICKNODE_WSS=your-mainnet-wss-url
PORT=3001

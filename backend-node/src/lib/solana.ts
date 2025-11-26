// backend-node/src/lib/solana.ts
export const CHAIN = "solana";
export const NETWORK = process.env.SOLANA_NETWORK || "mainnet-beta"; // 'mainnet-beta' | 'devnet' | 'testnet'
export const RPC_HTTP = process.env.RPC_HTTP || process.env.QUICKNODE_RPC || "";
export const DEFAULT_SLIPPAGE_BPS = Number(process.env.DEFAULT_SLIPPAGE_BPS || 300);
export const DEFAULT_PRIORITY_FEE = Number(process.env.PRIORITY_FEE_MICROLAMPORTS || 0);

// canonical mints
export const WSOL = "So11111111111111111111111111111111111111112";
export const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export function baseQuotes() {
  // switch here if you want to enable USDC too
  const allowUSDC = String(process.env.ALLOW_USDC || "false").toLowerCase() === "true";
  return allowUSDC ? [WSOL, USDC] : [WSOL];
}

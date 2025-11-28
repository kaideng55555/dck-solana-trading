// backend-node/src/lib/runtimeConfig.ts
import fs from "fs";
import path from "path";

export type RuntimeConfig = {
  TRADING_PUBLIC: string;          // "0" | "1"
  ALLOWED_WALLETS: string;         // CSV
  MIN_LIQ_USD: string;
  MIN_TOKEN_AGE_MINUTES: string;
  MAX_TAX_PCT: string;
  MIN_RISK_SCORE: string;          // 0..100 (fail below this)
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const CFG_FILE = path.join(DATA_DIR, "runtime-config.json");

const defaults: RuntimeConfig = {
  TRADING_PUBLIC: process.env.TRADING_PUBLIC ?? "0",
  ALLOWED_WALLETS: process.env.ALLOWED_WALLETS ?? "",
  MIN_LIQ_USD: process.env.MIN_LIQ_USD ?? "0",
  MIN_TOKEN_AGE_MINUTES: process.env.MIN_TOKEN_AGE_MINUTES ?? "0",
  MAX_TAX_PCT: process.env.MAX_TAX_PCT ?? "100",
  MIN_RISK_SCORE: process.env.MIN_RISK_SCORE ?? "40",
};

export function ensureDataDir(){
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadRuntimeConfig(): RuntimeConfig {
  ensureDataDir();
  let fileCfg: Partial<RuntimeConfig> = {};
  if (fs.existsSync(CFG_FILE)) {
    try { fileCfg = JSON.parse(fs.readFileSync(CFG_FILE, "utf-8")); } catch {}
  }
  const cfg: RuntimeConfig = { ...defaults, ...fileCfg };
  Object.entries(cfg).forEach(([k, v]) => (process.env[k] = String(v)));
  return cfg;
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    TRADING_PUBLIC: process.env.TRADING_PUBLIC ?? "0",
    ALLOWED_WALLETS: process.env.ALLOWED_WALLETS ?? "",
    MIN_LIQ_USD: process.env.MIN_LIQ_USD ?? "0",
    MIN_TOKEN_AGE_MINUTES: process.env.MIN_TOKEN_AGE_MINUTES ?? "0",
    MAX_TAX_PCT: process.env.MAX_TAX_PCT ?? "100",
    MIN_RISK_SCORE: process.env.MIN_RISK_SCORE ?? "40",
  };
}

export function saveRuntimeConfig(patch: Partial<RuntimeConfig>): RuntimeConfig {
  const current = getRuntimeConfig();
  const next = { ...current, ...patch };
  ensureDataDir();
  fs.writeFileSync(CFG_FILE, JSON.stringify(next, null, 2), "utf-8");
  return loadRuntimeConfig();
}

export function parseWalletList(raw?: string): string[] {
  return (raw || "").split(",").map(s => s.trim()).filter(Boolean);
}

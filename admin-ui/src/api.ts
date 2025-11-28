const API_BASE = '/api';

// Get admin token from localStorage
function getAdminToken(): string {
  return localStorage.getItem('dck_admin_token') || '';
}

// Set admin token
export function setAdminToken(token: string) {
  localStorage.setItem('dck_admin_token', token);
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return res.json();
}

// Health & Status
export async function getHealth() {
  return apiRequest<{
    status: string;
    uptime: number;
    memory: { used: number; total: number };
    version?: string;
  }>('/health');
}

export async function getMetrics() {
  return apiRequest<{
    requests: number;
    wsConnections: number;
    activeStreams: number;
    tokensTracked: number;
  }>('/metrics');
}

// Fee Configuration
export interface FeeConfig {
  feeWallet: string;
  feePercentage: number;
  enabled: boolean;
}

export async function getFeeConfig(): Promise<FeeConfig> {
  return apiRequest<FeeConfig>('/admin/fees');
}

export async function updateFeeConfig(config: Partial<FeeConfig>) {
  return apiRequest<FeeConfig>('/admin/fees', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

// Testers
export interface Tester {
  wallet: string;
  addedAt: string;
  label?: string;
}

export async function getTesters(): Promise<Tester[]> {
  return apiRequest<Tester[]>('/admin/testers');
}

export async function addTester(wallet: string, label?: string) {
  return apiRequest<{ success: boolean }>('/admin/testers', {
    method: 'POST',
    body: JSON.stringify({ wallet, label }),
  });
}

export async function removeTester(wallet: string) {
  return apiRequest<{ success: boolean }>(`/admin/testers/${wallet}`, {
    method: 'DELETE',
  });
}

// Tokens
export interface Token {
  address: string;
  name?: string;
  symbol?: string;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  holders?: number;
  progress?: number;
  row?: number;
}

export async function getTokens(): Promise<Token[]> {
  return apiRequest<Token[]>('/tokens');
}

export async function getTokenPrice(address: string) {
  return apiRequest<{ price: number; change24h?: number }>(`/price/${address}`);
}

// Trades
export interface Trade {
  contract: string;
  side: 'buy' | 'sell';
  amountUi: number;
  priceUi: number;
  ts: number;
  wallet?: string;
}

// WebSocket for real-time trades
export function subscribeToTrades(
  onTrade: (trade: Trade) => void,
  onStatus?: (status: 'connecting' | 'open' | 'closed' | 'error') => void
): () => void {
  const wsUrl = `ws://${window.location.hostname}:3001/ws`;
  onStatus?.('connecting');
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => onStatus?.('open');
  ws.onclose = () => onStatus?.('closed');
  ws.onerror = () => onStatus?.('error');
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (data.side && data.amountUi !== undefined) {
        onTrade(data as Trade);
      }
    } catch {}
  };
  
  return () => ws.close();
}

// Streams
export async function getStreamStatus() {
  return apiRequest<{
    sseClients: number;
    wsClients: number;
    contracts: string[];
  }>('/stream/status');
}

// Settings
export async function getSettings() {
  return apiRequest<Record<string, any>>('/admin/settings');
}

export async function updateSettings(settings: Record<string, any>) {
  return apiRequest<{ success: boolean }>('/admin/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

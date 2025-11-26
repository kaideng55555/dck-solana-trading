import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
type MintCore = { decimals: number; supplyUi: number; mintAuthority: 'none'|'other'; freezeAuthority: 'none'|'other'; holdersApprox?: number; symbol?: string };
type Holder = { tokenAccount: string; owner: string; uiAmount: number };
export async function analyzeMintCore(conn: Connection, mint: PublicKey): Promise<MintCore> {
  const mintInfo = await getMint(conn, mint);
  const decimals = mintInfo.decimals; const supplyUi = Number(mintInfo.supply) / Math.pow(10, decimals);
  const mintAuthority = mintInfo.mintAuthority ? 'other' : 'none'; const freezeAuthority = mintInfo.freezeAuthority ? 'other' : 'none';
  return { decimals, supplyUi, mintAuthority, freezeAuthority };
}
export async function getTopHolders(conn: Connection, mint: PublicKey, topN = 10): Promise<Holder[]> {
  const largest = await conn.getTokenLargestAccounts(mint, 'confirmed');
  const list = largest.value.slice(0, topN); const out: Holder[] = [];
  for (const item of list) { const ata = item.address; const acc = await conn.getParsedAccountInfo(ata, 'confirmed'); const owner = (acc.value?.data as any)?.parsed?.info?.owner ?? ''; const uiAmount = Number(item.uiAmount); out.push({ tokenAccount: ata.toBase58(), owner, uiAmount }); }
  return out;
}
export function computeSafetyFromHolders(core: MintCore, holders: Holder[]) {
  const topSum = holders.reduce((s, h) => s + (h.uiAmount || 0), 0);
  const holderSkew = core.supplyUi ? (topSum / core.supplyUi) * 100 : undefined;
  return { lpLockedPct: null as number | null, mintAuthority: core.mintAuthority, freezeAuthority: core.freezeAuthority, holderSkew: holderSkew ? Number(holderSkew.toFixed(2)) : undefined, isHoneypot: null as boolean | null };
}
export type { MintCore, Holder };

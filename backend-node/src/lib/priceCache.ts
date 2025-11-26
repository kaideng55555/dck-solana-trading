// backend-node/src/lib/priceCache.ts
type Point = { t: number; p: number };
const store: Record<string, { last: Point|null; buf: Point[] }> = {};

const MAX_POINTS = Number(process.env.PRICE_CACHE_POINTS || 120); // ~2h if 1/min

export function setPrice(mint: string, price: number) {
  const t = Date.now();
  if (!store[mint]) store[mint] = { last: null, buf: [] };
  store[mint].last = { t, p: price };
  store[mint].buf.push({ t, p: price });
  if (store[mint].buf.length > MAX_POINTS) store[mint].buf.shift();
}

export function getPrice(mint: string) {
  const it = store[mint];
  if (!it?.last) return { last: null, sma: null, updatedAt: null };
  const last = it.last;
  const pts = it.buf;
  const sum = pts.reduce((s, x) => s + x.p, 0);
  const sma = pts.length ? sum / pts.length : last.p;
  return { last: last.p, sma, updatedAt: last.t };
}

export function getSeries(mint: string) {
  return store[mint]?.buf ?? [];
}

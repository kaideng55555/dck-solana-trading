export const short = (a: string, n = 4) => (a?.length > 2*n ? a.slice(0,n) + "…" + a.slice(-n) : a);
export const fromUnix = (s?: number) => s ? new Date(s * 1000).toLocaleTimeString() : "";
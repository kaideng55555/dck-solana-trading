import { useState, useEffect } from 'react';

const cache = new Map();

/**
 * Load risk score for a single mint
 * @param {string} mint - Token mint address
 * @param {string} baseUrl - API base URL (default: VITE_API_URL or http://localhost:3001)
 * @returns {{risk: any, loading: boolean, error: string}}
 */
export function useRisk(mint, baseUrl = '') {
  const apiUrl = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [risk, setRisk] = useState(mint ? (cache.get(mint) || null) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!mint) return;
    if (cache.has(mint)) {
      setRisk(cache.get(mint));
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${apiUrl}/risk/${mint}`);
        if (!r.ok) throw new Error(await r.text());
        const j = await r.json();
        if (!alive) return;
        cache.set(mint, j);
        setRisk(j);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'failed to load risk');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [mint, apiUrl]);

  return { risk, loading, error };
}

/**
 * Fetch risk scores for multiple mints in batch
 * @param {string[]} mints - Array of mint addresses
 * @param {string} baseUrl - API base URL
 * @returns {Promise<Record<string, any>>}
 */
export async function fetchRiskBatch(mints, baseUrl = '') {
  const apiUrl = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const need = mints.filter(m => !cache.has(m));
  
  if (need.length) {
    const r = await fetch(`${apiUrl}/risk/batch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mints: need }),
    });
    
    if (r.ok) {
      const j = await r.json();
      for (const it of (j.items || [])) {
        cache.set(it.mint, it);
      }
    }
  }
  
  const out = {};
  for (const m of mints) {
    const v = cache.get(m);
    if (v) out[m] = v;
  }
  return out;
}

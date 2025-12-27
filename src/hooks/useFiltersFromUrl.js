import { useState, useEffect } from 'react';
import { decodeFiltersParam } from '../lib/filtersCodec';

/**
 * Load filters from URL query params (?preset=id or ?flt=base64)
 * @param {string} backend - Backend API URL
 * @returns {any | null} - Filters object or null
 */
export function useFiltersFromUrl(backend = '') {
  const apiUrl = backend || import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [filters, setFilters] = useState(null);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const preset = sp.get('preset');
    const flt = sp.get('flt');

    (async () => {
      // Try backend preset first
      if (preset) {
        try {
          const r = await fetch(`${apiUrl}/presets/${encodeURIComponent(preset)}`);
          if (r.ok) {
            const j = await r.json();
            setFilters(j.filters || null);
            return;
          }
        } catch {
          // Fall through to inline filter
        }
      }

      // Try inline base64 filter
      const local = decodeFiltersParam(flt);
      if (local) setFilters(local);
    })();
  }, [apiUrl]);

  return filters;
}

import React, { useState } from 'react';
import { encodeFiltersParam } from '../lib/filtersCodec';

/**
 * Share preset button - copies shareable URL to clipboard
 * @param {{
 *   filters: any,
 *   backend?: string,
 *   routePath?: string,
 *   useBackend?: boolean,
 *   label?: string
 * }} props
 */
export default function SharePresetButton({ 
  filters, 
  backend = '', 
  routePath, 
  useBackend = true, 
  label = 'Share' 
}) {
  const apiUrl = backend || import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function share() {
    setBusy(true);
    setMsg(null);
    
    try {
      const path = routePath || location.pathname;
      let url;

      if (useBackend) {
        // Create preset on backend
        const r = await fetch(`${apiUrl}/presets`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ filters })
        });
        
        if (!r.ok) throw new Error(await r.text());
        
        const j = await r.json();
        const id = j.id || j.preset?.id;
        url = `${location.origin}${path}?preset=${encodeURIComponent(id)}`;
      } else {
        // Inline base64 encoding
        const flt = encodeFiltersParam(filters);
        url = `${location.origin}${path}?flt=${flt}`;
      }

      await navigator.clipboard.writeText(url);
      setMsg('Link copied');
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setMsg(e?.message || 'Failed to share');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 font-semibold text-sm transition-all"
      onClick={share}
      disabled={busy}
      title="Create a shareable link with current filters"
    >
      {busy ? 'Sharing…' : label}
      {msg && ` • ${msg}`}
    </button>
  );
}

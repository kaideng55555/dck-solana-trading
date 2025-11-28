// src/hooks/useRisk.js
import { useEffect, useState } from "react";

export default function useRisk(mint){
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    if (!mint) return;
    let cancel = false;
    setLoading(true);
    const cacheKey = "risk:"+mint;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached){
      try {
        const j = JSON.parse(cached);
        setData(j); setLoading(false);
      } catch {}
    }
    fetch(`/risk/${mint}`)
      .then(r => r.json())
      .then(j => { if (!cancel){ setData(j); sessionStorage.setItem(cacheKey, JSON.stringify(j)); } })
      .catch(e => { if (!cancel) setError(String(e?.message||e)); })
      .finally(()=> { if (!cancel) setLoading(false); });
    return ()=> { cancel = true; };
  }, [mint]);

  return { data, error, loading };
}

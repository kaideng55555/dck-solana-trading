// web/src/hooks/useNodeStatus.js
import { useState, useEffect } from "react";

export default function useNodeStatus(intervalMs = 10_000) {
  const [data, setData] = useState({ ok: false });
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      const r = await fetch("/readyz");
      const j = await r.json();
      setData(j);
    } catch (e) {
      setData({ ok: false, error: e?.message || "failed" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchFees() {
    try {
      const r = await fetch("/fees/suggest");
      const j = await r.json();
      if (j?.ok && j?.suggest) setFee(j.suggest);
    } catch {}
  }

  useEffect(() => {
    fetchStatus();
    fetchFees();
    const t = setInterval(() => { 
      fetchStatus(); 
      fetchFees(); 
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return { data, fee, loading };
}

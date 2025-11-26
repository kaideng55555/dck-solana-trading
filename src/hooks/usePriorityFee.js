// web/src/hooks/usePriorityFee.js
import { useState, useEffect } from "react";

const KEY = "priority_preset";
const DEFAULT = "normal";

export default function usePriorityFee(suggest) {
  const [preset, setPreset] = useState(DEFAULT);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setPreset(saved);
    } catch {}
  }, []);

  function choose(p) {
    setPreset(p);
    try { localStorage.setItem(KEY, p); } catch {}
  }

  const microLamports = suggest ? suggest[preset] : undefined;

  return { preset, choose, microLamports };
}

// src/components/RiskMeter.jsx
import React from "react";

export default function RiskMeter({ score = 50 }){
  const pct = Math.max(0, Math.min(100, Number(score||0)));
  return (
    <div className="w-full">
      <div className="text-xs text-pink-300 mb-1">Safety Score: {pct}</div>
      <div className="w-full h-3 rounded bg-pink-500/20 overflow-hidden">
        <div className="h-full bg-pink-500/70" style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

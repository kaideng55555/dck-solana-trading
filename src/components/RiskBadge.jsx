// src/components/RiskBadge.jsx
import React from "react";

export default function RiskBadge({ label = "MEDIUM" }){
  const color =
    label === "LOW" ? "bg-green-500/30 text-green-200 border-green-400/50" :
    label === "HIGH" ? "bg-red-500/30 text-red-200 border-red-400/50" :
    "bg-yellow-500/30 text-yellow-200 border-yellow-400/50";
  return (
    <span className={"px-3 py-1 text-xs rounded-full border " + color}>
      {label} RISK
    </span>
  );
}

// node scripts/mintToken.js create "Token Name" "SYMBOL" 6 1000000 "PRIVATE_KEY"

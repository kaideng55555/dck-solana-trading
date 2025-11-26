import React from 'react';

/**
 * Risk badge pill showing LOW/MED/HIGH
 * @param {{score: number}} props
 */
export default function RiskBadge({ score }) {
  if (typeof score !== 'number') return null;
  
  const level = score >= 75 ? 'LOW' : score >= 45 ? 'MED' : 'HIGH';
  const colorClass = 
    score >= 75 ? 'border-green-500/50 text-green-400' :
    score >= 45 ? 'border-yellow-500/50 text-yellow-400' :
    'border-red-500/50 text-red-400';
  
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${colorClass}`}
      title={`Safety Score: ${score}/100`}
      aria-label={`risk ${level}`}
    >
      RISK: {level}
    </span>
  );
}

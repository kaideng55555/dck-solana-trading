import React from 'react';

/**
 * Risk meter bar visualization
 * @param {{score: number}} props
 */
export default function RiskMeter({ score = 0 }) {
  const pct = Math.max(0, Math.min(100, score));
  
  const color = 
    pct >= 75 ? '#10b981' : // green
    pct >= 45 ? '#eab308' : // yellow
    '#ef4444'; // red
  
  return (
    <div 
      className="w-full h-2 rounded-lg bg-gray-800 border border-gray-700" 
      title={`Safety Score ${pct}`}
    >
      <div 
        className="h-full rounded-lg transition-all" 
        style={{ width: `${pct}%`, backgroundColor: color }} 
      />
    </div>
  );
}

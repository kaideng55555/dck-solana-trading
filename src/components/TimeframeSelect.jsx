import React from 'react';

const TIMEFRAMES = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' }
];

/**
 * Timeframe selector for charts
 * @param {{value: string, onChange: (tf: string) => void}} props
 */
export default function TimeframeSelect({ value, onChange }) {
  return (
    <div className="flex gap-1 mb-2">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf.value}
          onClick={() => onChange(tf.value)}
          className={`px-3 py-1 rounded text-xs font-mono transition-all ${
            value === tf.value
              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500'
              : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}

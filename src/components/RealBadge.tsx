import React from 'react';

const RealBadge: React.FC = () => {
  const isDemo = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

  return (
    <div className={`real-badge ${isDemo ? 'demo' : 'real'}`}>
      <span className="real-badge-icon">
        {isDemo ? '⚠️' : '⚡'}
      </span>
      {isDemo ? 'DEMO MODE' : 'REAL ON-CHAIN'}
    </div>
  );
};

export default RealBadge;

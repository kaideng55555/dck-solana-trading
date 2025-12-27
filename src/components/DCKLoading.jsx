import React from 'react';

/**
 * DCK Loading Spinner - Neon animated loader
 */
export default function DCKLoading({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div className="dck-loading flex flex-col items-center justify-center gap-4 p-8">
      <div className="neon-spinner relative">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-800 border-t-neonPink`}></div>
        <div className={`${sizeClasses[size]} animate-spin-reverse rounded-full border-4 border-transparent border-r-neonBlue absolute top-0 left-0`}></div>
      </div>
      {text && (
        <p className="text-neonBlue animate-pulse font-semibold">
          {text}
        </p>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';

/**
 * NFT Cinematic Reveal - spin → flash → reveal sequence
 */
export default function NFTCinematic({ nftData, onComplete }) {
  const [phase, setPhase] = useState('spin'); // 'spin' | 'flash' | 'reveal'

  useEffect(() => {
    // Spin phase: 2s
    const spinTimer = setTimeout(() => setPhase('flash'), 2000);
    
    // Flash phase: 1s
    const flashTimer = setTimeout(() => setPhase('reveal'), 3000);
    
    // Complete: 0.5s after reveal
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3500);

    return () => {
      clearTimeout(spinTimer);
      clearTimeout(flashTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="nft-cinematic-container relative w-full h-96 flex items-center justify-center overflow-hidden">
      {phase === 'spin' && (
        <div className="nft-spin-phase">
          <div className="animate-spin-slow w-48 h-48 rounded-full border-4 border-neonPink border-t-neonBlue"></div>
        </div>
      )}
      
      {phase === 'flash' && (
        <div className="nft-flash-phase animate-flash-burst">
          <div className="w-64 h-64 bg-gradient-to-r from-neonPink to-neonBlue rounded-full blur-3xl opacity-80"></div>
        </div>
      )}
      
      {phase === 'reveal' && (
        <div className="nft-reveal-phase animate-scale-in">
          <div className="nft-card rounded-3xl border-4 border-neonBlue p-4 bg-black/80 shadow-glow-md">
            {nftData?.image && (
              <img 
                src={nftData.image} 
                alt={nftData.name || 'NFT'} 
                className="w-64 h-64 object-cover rounded-2xl"
              />
            )}
            {nftData?.name && (
              <h3 className="text-2xl font-bold text-neonPink mt-4 text-center">
                {nftData.name}
              </h3>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

cd ~/Downloads/solana_full_trading_system && npm install && npm run dev// Gallery.tsx - Image gallery with lightbox
import { useState } from 'react'

type ImageItem = {
  id: string
  src: string
  alt?: string
  tag?: string
}

type Props = {
  images: ImageItem[]
}

export default function Gallery({ images }: Props) {
  const [active, setActive] = useState<ImageItem | null>(null)
  
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map(img => (
          <button 
            key={img.id} 
            onClick={() => setActive(img)} 
            className="aspect-square overflow-hidden rounded-xl border border-[#1a1a2e] hover:border-[#00ffcc] transition-colors"
          >
            <img 
              src={img.src} 
              alt={img.alt || ''} 
              className="w-full h-full object-cover" 
              loading="lazy" 
            />
            {img.tag && (
              <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 text-xs text-[#00ffcc] rounded">
                {img.tag}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Lightbox Modal */}
      {active && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50" 
          onClick={() => setActive(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white text-2xl hover:text-[#00ffcc]"
            onClick={() => setActive(null)}
          >
            ✕
          </button>
          <img 
            src={active.src} 
            alt={active.alt || ''} 
            className="max-w-[90vw] max-h-[90vh] rounded-xl border border-[#1a1a2e]" 
          />
        </div>
      )}
    </div>
  )
}

// Settings for terminal
"terminal.integrated.defaultProfile.osx": "zsh",
"terminal.integrated.inheritEnv": true

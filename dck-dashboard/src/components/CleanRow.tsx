// CleanRow.tsx - Token row component for lists
import Sparkline from './Sparkline'

type Token = {
  mint: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  marketCap?: number
  volume24h?: number
  sparklineData?: number[]
  logoUrl?: string
}

type Props = {
  token: Token
  onClick?: (token: Token) => void
  showSparkline?: boolean
}

export default function CleanRow({ token, onClick, showSparkline = true }: Props) {
  const isPositive = token.priceChange24h >= 0
  
  const formatPrice = (p: number) => {
    if (p < 0.0001) return `$${p.toExponential(2)}`
    if (p < 1) return `$${p.toFixed(6)}`
    return `$${p.toFixed(2)}`
  }
  
  const formatMarketCap = (mc?: number) => {
    if (!mc) return '-'
    if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(2)}M`
    if (mc >= 1_000) return `$${(mc / 1_000).toFixed(1)}K`
    return `$${mc.toFixed(0)}`
  }

  return (
    <div 
      onClick={() => onClick?.(token)}
      className="flex items-center gap-3 p-3 bg-[#0a0a0a] hover:bg-[#111] border border-[#1a1a2e] rounded-lg cursor-pointer transition-colors group"
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center overflow-hidden flex-shrink-0">
        {token.logoUrl ? (
          <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#00ffcc] font-bold text-sm">{token.symbol.slice(0, 2)}</span>
        )}
      </div>
      
      {/* Name & Symbol */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate group-hover:text-[#00ffcc] transition-colors">
          {token.symbol}
        </div>
        <div className="text-xs text-gray-500 truncate">{token.name}</div>
      </div>
      
      {/* Sparkline */}
      {showSparkline && token.sparklineData && (
        <div className="w-20 h-8 flex-shrink-0">
          <Sparkline data={token.sparklineData} color={isPositive ? '#00ffcc' : '#ff0066'} />
        </div>
      )}
      
      {/* Price */}
      <div className="text-right flex-shrink-0">
        <div className="font-mono text-white">{formatPrice(token.price)}</div>
        <div className={`text-xs font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(token.priceChange24h).toFixed(2)}%
        </div>
      </div>
      
      {/* Market Cap */}
      <div className="text-right w-20 flex-shrink-0 hidden sm:block">
        <div className="text-xs text-gray-500">MCap</div>
        <div className="text-sm text-gray-300 font-mono">{formatMarketCap(token.marketCap)}</div>
      </div>
    </div>
  )
}

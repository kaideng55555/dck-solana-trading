// Classifieds.tsx - Token discovery page with filters
import { useState, useEffect } from 'react'
import CleanRow from '../components/CleanRow'
import TokenDetails from '../components/TokenDetails'

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

type SortField = 'price' | 'priceChange24h' | 'marketCap' | 'volume24h'
type SortDir = 'asc' | 'desc'

export default function Classifieds() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Token | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all')

  useEffect(() => {
    // Demo data - replace with API call
    const demoTokens: Token[] = [
      { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', price: 198.45, priceChange24h: 3.2, marketCap: 95_000_000_000, volume24h: 2_500_000_000, sparklineData: [195, 196, 198, 197, 199, 198, 200, 198] },
      { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', price: 1.00, priceChange24h: 0.01, marketCap: 35_000_000_000, volume24h: 5_000_000_000, sparklineData: [1, 1, 1, 1, 1, 1, 1, 1] },
      { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', price: 0.0000234, priceChange24h: -5.4, marketCap: 1_500_000_000, volume24h: 150_000_000, sparklineData: [0.000025, 0.000024, 0.000023, 0.000024, 0.000023, 0.000024, 0.000023, 0.000023] },
      { mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'POPCAT', name: 'Popcat', price: 1.23, priceChange24h: 12.5, marketCap: 1_200_000_000, volume24h: 80_000_000, sparklineData: [1.1, 1.15, 1.18, 1.2, 1.22, 1.25, 1.23, 1.23] },
      { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', price: 0.89, priceChange24h: -2.1, marketCap: 1_100_000_000, volume24h: 45_000_000, sparklineData: [0.92, 0.91, 0.90, 0.89, 0.88, 0.89, 0.90, 0.89] },
    ]
    
    setTimeout(() => {
      setTokens(demoTokens)
      setLoading(false)
    }, 500)
  }, [])

  // Filter and sort
  const filteredTokens = tokens
    .filter(t => {
      if (search && !t.symbol.toLowerCase().includes(search.toLowerCase()) && !t.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (filter === 'gainers' && t.priceChange24h < 0) return false
      if (filter === 'losers' && t.priceChange24h >= 0) return false
      return true
    })
    .sort((a, b) => {
      const aVal = a[sortField] || 0
      const bVal = b[sortField] || 0
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      {/* Token List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a2e]">
          <h1 className="text-2xl font-bold text-[#00ffcc] mb-4">🔍 Token Explorer</h1>
          
          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search tokens..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 bg-[#111] border border-[#1a1a2e] rounded-lg text-white placeholder-gray-500 focus:border-[#00ffcc] outline-none"
            />
            
            <div className="flex gap-1">
              {(['all', 'gainers', 'losers'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f 
                      ? 'bg-[#00ffcc] text-black' 
                      : 'bg-[#111] text-gray-400 hover:text-white border border-[#1a1a2e]'
                  }`}
                >
                  {f === 'all' ? '📊 All' : f === 'gainers' ? '🟢 Gainers' : '🔴 Losers'}
                </button>
              ))}
            </div>
          </div>

          {/* Sort buttons */}
          <div className="flex gap-2 mt-3">
            {[
              { field: 'marketCap' as SortField, label: 'MCap' },
              { field: 'volume24h' as SortField, label: 'Volume' },
              { field: 'priceChange24h' as SortField, label: '24h %' },
              { field: 'price' as SortField, label: 'Price' },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`px-2 py-1 text-xs rounded ${
                  sortField === field ? 'text-[#00ffcc]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label} {sortField === field && (sortDir === 'desc' ? '↓' : '↑')}
              </button>
            ))}
          </div>
        </div>
        
        {/* Token List */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[#00ffcc] animate-pulse">
              Loading tokens...
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No tokens found
            </div>
          ) : (
            filteredTokens.map(token => (
              <CleanRow 
                key={token.mint} 
                token={token} 
                onClick={setSelected}
                showSparkline={true}
              />
            ))
          )}
        </div>
      </div>

      {/* Details Panel */}
      {selected && (
        <div className="w-96 border-l border-[#1a1a2e] bg-[#0a0a0a] overflow-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{selected.symbol}</h2>
              <button 
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <TokenDetails />
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import TokenChart from './TokenChart'

const TOKEN_MINT = '7LZG3H2hTYbaebnvUveBGW4bqmEiEdoNp3BRk9zLbrHc'
const API_KEY = 'y#PBki2wu48sCYJ'

export default function TokenDetails() {
  const [prices, setPrices] = useState([])
  const [currentPrice, setCurrentPrice] = useState(null)
  const [priceChange, setPriceChange] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`https://public-api.birdeye.so/public/price?address=${TOKEN_MINT}`, {
          headers: {
            'X-API-KEY': API_KEY,
          },
        })
        const data = await res.json()
        const price = data?.data?.value

        if (price) {
          const now = Math.floor(Date.now() / 1000)
          setCurrentPrice(price)
          setPrices(prev => {
            const newPrices = [...prev.slice(-49), { time: now, value: price }]
            // Calculate price change
            if (newPrices.length > 1) {
              const oldPrice = newPrices[0].value
              const change = ((price - oldPrice) / oldPrice) * 100
              setPriceChange(change)
            }
            return newPrices
          })
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to fetch price:', err)
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 bg-[#101010] p-6 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#00ffcc]">📈 Live Token Price</h3>
        {currentPrice && (
          <div className="flex items-center gap-4">
            <span className="text-2xl font-mono text-white">
              ${currentPrice.toFixed(6)}
            </span>
            <span className={`text-sm px-2 py-1 rounded ${
              priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mb-2 font-mono truncate">
        {TOKEN_MINT}
      </div>

      {loading ? (
        <div className="h-[320px] flex items-center justify-center bg-[#0a0a0a] rounded-lg border border-[#1a1a2e]">
          <div className="text-[#00ffcc] animate-pulse">Loading chart...</div>
        </div>
      ) : (
        <TokenChart 
          prices={prices} 
          chartType="line" 
          showVolume={true} 
          realtime={false} 
        />
      )}

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#1a1a2e]">
          <div className="text-gray-500">Data Points</div>
          <div className="text-white font-mono">{prices.length}</div>
        </div>
        <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#1a1a2e]">
          <div className="text-gray-500">Update Interval</div>
          <div className="text-white font-mono">60s</div>
        </div>
        <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#1a1a2e]">
          <div className="text-gray-500">Source</div>
          <div className="text-[#00ffcc] font-mono">Birdeye</div>
        </div>
      </div>
    </div>
  )
}

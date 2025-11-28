import { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'

export default function TokenChart({ 
  prices, 
  chartType = 'line',  // 'line' | 'candlestick'
  showVolume = true,
  realtime = false,
  tokenAddress = null 
}) {
  const chartContainerRef = useRef()
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const lineSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 320,
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#00ffcc',
      },
      grid: {
        vertLines: { color: '#1a1a2e' },
        horzLines: { color: '#1a1a2e' },
      },
      crosshair: { 
        mode: 1,
        vertLine: { color: '#00ffcc', width: 1, style: 2 },
        horzLine: { color: '#00ffcc', width: 1, style: 2 },
      },
      rightPriceScale: { 
        borderColor: '#333',
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.25 : 0.1 },
      },
      timeScale: { 
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
      },
    })
    chartRef.current = chart

    // Add volume series (behind price)
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        scaleMargins: { top: 0.8, bottom: 0 },
      })
      volumeSeriesRef.current = volumeSeries
    }

    // Add price series based on type
    if (chartType === 'candlestick') {
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#00ffcc',
        downColor: '#ff0066',
        borderUpColor: '#00ffcc',
        borderDownColor: '#ff0066',
        wickUpColor: '#00ffcc',
        wickDownColor: '#ff0066',
      })
      candleSeriesRef.current = candleSeries
      
      const candleData = prices || generateCandlestickData()
      candleSeries.setData(candleData)
      
      if (showVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(generateVolumeData(candleData))
      }
    } else {
      const lineSeries = chart.addLineSeries({
        color: '#00ffcc',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      })
      lineSeriesRef.current = lineSeries
      
      const lineData = prices || generateLineData()
      lineSeries.setData(lineData)
      
      if (showVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(generateVolumeFromLine(lineData))
      }
    }

    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    // Real-time updates
    let realtimeInterval = null
    if (realtime) {
      setIsLive(true)
      realtimeInterval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000)
        
        if (chartType === 'candlestick' && candleSeriesRef.current) {
          const lastPrice = 0.022 + Math.random() * 0.003
          candleSeriesRef.current.update({
            time: now,
            open: lastPrice,
            high: lastPrice + Math.random() * 0.001,
            low: lastPrice - Math.random() * 0.001,
            close: lastPrice + (Math.random() - 0.5) * 0.001,
          })
        } else if (lineSeriesRef.current) {
          lineSeriesRef.current.update({
            time: now,
            value: 0.022 + Math.random() * 0.003,
          })
        }
        
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: now,
            value: Math.random() * 100000,
            color: Math.random() > 0.5 ? '#00ffcc55' : '#ff006655',
          })
        }
      }, 2000)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (realtimeInterval) clearInterval(realtimeInterval)
      chart.remove()
    }
  }, [prices, chartType, showVolume, realtime])

  return (
    <div className="relative">
      {isLive && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-black/50 rounded text-xs">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-green-400">LIVE</span>
        </div>
      )}
      <div
        ref={chartContainerRef}
        className="w-full rounded-lg bg-[#0a0a0a] shadow-lg border border-[#1a1a2e]"
      />
    </div>
  )
}

// Generate candlestick OHLC data
function generateCandlestickData() {
  const now = Math.floor(Date.now() / 1000)
  const data = []
  let price = 0.020
  
  for (let i = 0; i < 50; i++) {
    const open = price
    const volatility = 0.002
    const change = (Math.random() - 0.5) * volatility
    const high = open + Math.abs(change) + Math.random() * volatility * 0.5
    const low = open - Math.abs(change) - Math.random() * volatility * 0.5
    const close = open + change
    
    data.push({
      time: now - (3600 * (49 - i)),
      open,
      high,
      low,
      close,
    })
    price = close
  }
  return data
}

// Generate line data
function generateLineData() {
  const now = Math.floor(Date.now() / 1000)
  return Array.from({ length: 50 }, (_, i) => ({
    time: now - (3600 * (49 - i)),
    value: 0.021 + Math.random() * 0.004 + Math.sin(i * 0.2) * 0.001,
  }))
}

// Generate volume data from candles
function generateVolumeData(candles) {
  return candles.map(c => ({
    time: c.time,
    value: Math.random() * 150000 + 50000,
    color: c.close >= c.open ? '#00ffcc55' : '#ff006655',
  }))
}

// Generate volume data from line prices
function generateVolumeFromLine(lineData) {
  return lineData.map((d, i) => ({
    time: d.time,
    value: Math.random() * 150000 + 50000,
    color: i > 0 && d.value >= lineData[i-1].value ? '#00ffcc55' : '#ff006655',
  }))
}

// Sparkline.tsx - Mini inline chart
import { useRef, useEffect } from 'react'

type Props = {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export default function Sparkline({ 
  data, 
  color = '#00ffcc', 
  width = 80, 
  height = 32 
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Calculate bounds
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 2

    // Draw line
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    data.forEach((value, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color + '40')
    gradient.addColorStop(1, color + '00')
    
    ctx.lineTo(width - padding, height)
    ctx.lineTo(padding, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

  }, [data, color, width, height])

  if (data.length < 2) {
    return <div className="w-full h-full bg-[#1a1a2e] rounded" />
  }

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width, height }}
      className="block"
    />
  )
}

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import '../styles/capsule.css'

export type CapsuleRevealHandle = {
  startReveal: () => void
}

type Props = {
  showControls?: boolean
}

const CapsuleReveal = forwardRef<CapsuleRevealHandle, Props>(({ showControls = true }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const capsuleRef = useRef<HTMLDivElement | null>(null)
  const reqRef = useRef<number | null>(null)
  const lastRef = useRef<number>(performance.now())
  const [autoSmoke, setAutoSmoke] = useState(true)
  const [slowMo, setSlowMo] = useState(false)
  const [opened, setOpened] = useState(false)

  const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
  const particles = useRef<Array<{
    x:number; y:number; vx:number; vy:number; life:number; decay:number; size:number
  }>>([])

  const resize = () => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    c.width = rect.width * DPR
    c.height = rect.height * DPR
    const ctx = c.getContext('2d')
    if (ctx) ctx.setTransform(DPR,0,0,DPR,0,0)
  }

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function spawnParticle(x:number, y:number, burst=false){
    const angle = Math.random() * Math.PI - Math.PI/2
    const speed = burst ? 1.8 + Math.random()*0.8 : 0.6 + Math.random()*0.5
    const size = 18 + Math.random()*18
    particles.current.push({
      x, y,
      vx: Math.cos(angle) * speed * 0.6,
      vy: -(0.8 + Math.random()*0.7) * speed,
      life: 1,
      decay: (0.006 + Math.random()*0.008) * (burst? 1.2 : 1.0),
      size
    })
    // cap list
    if (particles.current.length > 240) particles.current.shift()
  }

  function drawParticle(ctx:CanvasRenderingContext2D, p:any){
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
    g.addColorStop(0, 'rgba(0,191,255,0.9)')
    g.addColorStop(0.3, 'rgba(0,191,255,0.55)')
    g.addColorStop(1, 'rgba(0,191,255,0.0)')
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  function loop(now:number){
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const dt = Math.min(32, now - lastRef.current)
    lastRef.current = now

    // fade trail
    ctx.fillStyle = 'rgba(10,12,20,0.10)'
    ctx.fillRect(0,0,c.width,c.height)

    const rect = c.getBoundingClientRect()
    const originX = rect.width / 2
    const originY = rect.height * 0.68

    if (autoSmoke) {
      for (let i=0;i<3;i++){
        spawnParticle(originX + (Math.random()-0.5)*26, originY + (Math.random()-0.5)*6)
      }
    }

    for (let i=particles.current.length-1; i>=0; i--){
      const p = particles.current[i]
      const mult = (slowMo ? 0.5 : 1) * 0.06
      p.x += p.vx * (dt * mult)
      p.y += p.vy * (dt * mult)
      p.vx += (Math.sin(p.y*0.02) * 0.02)
      p.life -= p.decay * (dt/16)
      drawParticle(ctx, p)
      if (p.life <= 0) particles.current.splice(i,1)
    }

    reqRef.current = requestAnimationFrame(loop)
  }

  useEffect(() => {
    reqRef.current = requestAnimationFrame(loop)
    return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSmoke, slowMo])

  function burst(){
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const x = rect.width/2, y = rect.height*0.68
    for (let i=0; i<60; i++){
      spawnParticle(x + (Math.random()-0.5)*20, y + (Math.random()-0.5)*10, true)
    }
  }

  function openCapsule(){
    setOpened(true)
    burst()
  }

  useImperativeHandle(ref, () => ({
    startReveal: () => openCapsule()
  }))

  return (
    <div className="capsule-stage-wrap">
      <div className="capsule-stage">
        <canvas ref={canvasRef} id="smokeCanvas" aria-hidden="true" />
        <div ref={capsuleRef} className={`capsule ${opened ? 'open' : ''}`}>
          <div className="cap top" />
          <div className="cap bottom" />
          <div className="chamber" />
          <div className="nft-card" role="img" aria-label="Revealed NFT">
            <div className="nft-glow" />
            <div className="nft-title">DCK GENESIS</div>
            <div className="nft-sub">#0001 • Instant Reveal</div>
          </div>
        </div>
      </div>

      {showControls && (
        <section className="capsule-controls">
          <label><input type="checkbox" checked={autoSmoke} onChange={e=>setAutoSmoke(e.target.checked)} /> Persistent smoke</label>
          <label><input type="checkbox" checked={slowMo} onChange={e=>setSlowMo(e.target.checked)} /> Slow-mo</label>
        </section>
      )}
    </div>
  )
})

export default CapsuleReveal
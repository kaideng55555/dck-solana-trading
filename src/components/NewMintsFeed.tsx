import React, { useEffect, useMemo, useRef, useState } from 'react'
import { subscribeToNewMints, MintEvent } from '../services/wsService'
import { short, fromUnix } from '../utils/format'
import '../styles/new-mints.css'

type Filter = {
  onlyRevoked: boolean
  minHolders: number
  maxTopHolderPct?: number
  search: string
}

export default function NewMintsFeed() {
  const [items, setItems] = useState<MintEvent[]>([])
  const [status, setStatus] = useState<'connecting'|'open'|'closed'|'error'>('connecting')
  const [filter, setFilter] = useState<Filter>({ onlyRevoked: false, minHolders: 0, maxTopHolderPct: undefined, search: '' })
  const [ping, setPing] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let stop: any
    const maybe = subscribeToNewMints((ev) => {
      setItems(prev => {
        const next = [ev, ...prev].slice(0, 200)
        return next
      })
      if (ping && audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    }, setStatus)

    // socket.io returns a Promise
    if (maybe instanceof Promise) {
      maybe.then((unsub) => { stop = unsub }).catch(() => {})
    } else {
      stop = maybe
    }

    return () => { if (typeof stop === 'function') stop() }
  }, [ping])

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (filter.onlyRevoked && !(i.mintAuthorityRevoked && i.freezeAuthorityRevoked)) return false
      if (filter.minHolders && (i.holders ?? 0) < filter.minHolders) return false
      if (filter.maxTopHolderPct !== undefined && (i.topHolderPct ?? 0) > filter.maxTopHolderPct) return false
      if (filter.search) {
        const s = filter.search.toLowerCase()
        const hay = [i.mint, i.name, i.symbol].join(' ').toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [items, filter])

  const snipe = (m: MintEvent) => {
    // Stub: open market link. Replace with your buy flow.
    const url = m.market?.pump || m.market?.gmgn || m.market?.birdeye || m.market?.solscan
    if (url) window.open(url, '_blank')
  }

  return (
    <div className="nm-wrap">
      <audio ref={audioRef} preload="auto" src="data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAAAAACAgICAgICAgA=" />
      <header className="nm-head">
        <h2>New Mint Sniper Feed</h2>
        <div className="nm-status" data-s={status}>
          <span className="dot" /> {status}
        </div>
      </header>

      <div className="nm-controls">
        <label><input type="checkbox" checked={filter.onlyRevoked} onChange={e=>setFilter(f=>({...f, onlyRevoked: e.target.checked}))}/> Revoked mint & freeze only</label>
        <label>Min holders <input type="number" min={0} value={filter.minHolders} onChange={e=>setFilter(f=>({...f, minHolders: Number(e.target.value)}))} /></label>
        <label>Max top holder % <input type="number" step="0.1" min={0} value={filter.maxTopHolderPct ?? ''} onChange={e=>setFilter(f=>({...f, maxTopHolderPct: e.target.value===''? undefined : Number(e.target.value)}))} /></label>
        <input className="nm-search" placeholder="Search name / symbol / mint" value={filter.search} onChange={e=>setFilter(f=>({...f, search: e.target.value}))}/>
        <label className="nm-right"><input type="checkbox" checked={ping} onChange={e=>setPing(e.target.checked)} /> ping</label>
      </div>

      <div className="nm-list">
        {filtered.map((m, idx) => (
          <article key={m.mint + idx} className="nm-row">
            <div className="nm-time">{fromUnix(m.timestamp)}</div>
            <div className="nm-asset">
              <img src={m.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${m.mint}`} alt="" />
              <div className="nm-meta">
                <div className="nm-name">{m.name || 'Unknown'} <span className="muted">{m.symbol || ''}</span></div>
                <div className="nm-mint">{short(m.mint, 6)}</div>
              </div>
            </div>
            <div className="nm-stats">
              <span title="Holders">👥 {m.holders ?? '—'}</span>
              <span title="Top Holder %">🏦 {m.topHolderPct ?? '—'}%</span>
              <span className={ (m.mintAuthorityRevoked && m.freezeAuthorityRevoked) ? 'ok' : 'warn' }
                    title="Authorities">🔐 {m.mintAuthorityRevoked ? 'mint✓' : 'mint×'} • {m.freezeAuthorityRevoked ? 'freeze✓' : 'freeze×'}</span>
            </div>
            <div className="nm-links">
              {m.market?.pump && <a href={m.market.pump} target="_blank">Pump</a>}
              {m.market?.gmgn && <a href={m.market.gmgn} target="_blank">GMGN</a>}
              {m.market?.birdeye && <a href={m.market.birdeye} target="_blank">Birdeye</a>}
              {m.market?.solscan && <a href={m.market.solscan} target="_blank">Solscan</a>}
            </div>
            <div className="nm-actions">
              <button className="btn snipe" onClick={() => snipe(m)}>Snipe</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
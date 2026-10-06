import { useState } from 'react'
import useCelebrationStore from '../../store/celebrationStore'

const CONFETTI_COLORS = ['#0079D2', '#EF9F27', '#1D9E75', '#D4537E', '#7F77DD']

const KEYFRAMES = `
@keyframes bp-pop { 0% { transform: scale(0) rotate(-25deg) } 60% { transform: scale(1.12) rotate(4deg) } 100% { transform: scale(1) rotate(0) } }
@keyframes bp-ring { 0% { transform: scale(1); opacity: .5 } 100% { transform: scale(1.4); opacity: 0 } }
@keyframes bp-up { 0% { opacity: 0; transform: translateY(14px) } 100% { opacity: 1; transform: none } }
@keyframes bp-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes bp-fall { 0% { transform: translate(0, -20px) rotate(0) } 100% { transform: translate(var(--sway), 150vh) rotate(720deg); opacity: .3 } }
`

function randomPieces() {
  return Array.from({ length: 70 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.6,
    sway: (Math.random() - 0.5) * 120,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }))
}

function Confetti() {
  // Positions tirées une fois, au montage de chaque célébration
  const [pieces] = useState(randomPieces)

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10001 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${p.left}%`,
          width: p.size, height: p.size * 1.5, borderRadius: 2, backgroundColor: p.color,
          '--sway': `${p.sway}px`,
          animation: `bp-fall ${p.duration}s linear ${p.delay}s forwards`,
        }} />
      ))}
    </div>
  )
}

/**
 * Affiche la première célébration de la file (montée dans AppLayout).
 */
export default function CelebrationHost() {
  const current = useCelebrationStore((s) => s.queue[0])
  const next = useCelebrationStore((s) => s.next)

  if (!current) return null

  const { Icon, color, light, title, message, stat, statLabel, confetti = true } = current
  const reveal = (delay) => ({ animation: `bp-up .45s ease-out ${delay}s both` })

  return (
    // key : rejoue les animations à chaque nouvelle célébration de la file
    <div key={current.id}>
      <style>{KEYFRAMES}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        animation: 'bp-fade .2s ease-out',
      }}>
        <div role="dialog" aria-modal="true" aria-label={title} style={{
          width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 24,
          padding: '40px 32px 28px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        }}>
          <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto' }}>
            <div style={{
              position: 'absolute', inset: 5, borderRadius: '50%', border: `3px solid ${color}`,
              animation: 'bp-ring 1s ease-out .3s both',
            }} />
            <div style={{
              position: 'absolute', inset: 5, borderRadius: '50%', backgroundColor: light,
              border: `5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'bp-pop .7s cubic-bezier(.2,1.4,.4,1) both',
            }}>
              <Icon size={60} color={color} strokeWidth={1.8} />
            </div>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#2C3E50', margin: '24px 0 8px', ...reveal(0.3) }}>
            {title}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: '#7F8C8D', margin: 0, ...reveal(0.4) }}>
            {message}
          </p>

          {stat && (
            <p style={{ margin: '20px 0 0', ...reveal(0.5) }}>
              <span style={{ fontSize: 28, fontWeight: 700, color }}>{stat}</span>
              {statLabel && <span style={{ fontSize: 15, color: '#7F8C8D' }}>{`  ${statLabel}`}</span>}
            </p>
          )}

          <button
            onClick={next}
            autoFocus
            style={{
              width: '100%', height: 52, marginTop: 32, border: 'none', borderRadius: 16,
              backgroundColor: color, color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', outline: 'none',
              ...reveal(0.6),
            }}
          >
            Continuer
          </button>
        </div>
      </div>
      {confetti && <Confetti />}
    </div>
  )
}

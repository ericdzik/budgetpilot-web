import { useEffect, useRef } from 'react'
import useCelebrationStore from '../../store/celebrationStore'

// Moment de l'impact du tampon après l'ouverture (ms), comme sur le mobile
const IMPACT_MS = 570
const GLITTER_MS = 2600
const GOLDS = ['#F6C343', '#E0A800', '#FFE08A', '#FFFFFF']

const KEYFRAMES = `
@keyframes bp-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes bp-slam {
  0% { transform: scale(3) rotate(-25deg); opacity: 0 }
  100% { transform: scale(1) rotate(-12deg); opacity: 1 }
}
@keyframes bp-shake {
  0%, 100% { transform: none }
  25% { transform: translate(-4px, 2px) }
  50% { transform: translate(4px, -2px) }
  75% { transform: translate(-1px, 1px) }
}
@keyframes bp-up { 0% { opacity: 0; transform: translateY(12px) } 100% { opacity: 1; transform: none } }
`

/** Paillettes projetées vers le haut depuis le point d'impact. */
function makeGlitter(accent) {
  return Array.from({ length: 90 }, (_, i) => ({
    angle: (-165 + Math.random() * 150) * Math.PI / 180,
    speed: 380 + Math.random() * 520,
    spin: (Math.random() - 0.5) * 18,
    size: 3 + Math.random() * 5,
    twinkle: Math.random() * Math.PI * 2,
    color: i % 3 === 0 ? accent : GOLDS[Math.floor(Math.random() * GOLDS.length)],
    star: Math.random() < 0.45,
  }))
}

/** Même physique que le mobile : poussée initiale freinée par l'air, puis gravité. */
function drawGlitter(ctx, particles, time, origin, fade) {
  for (const p of particles) {
    const drag = Math.exp(-1.4 * time)
    const x = origin.x + Math.cos(p.angle) * p.speed * (1 - drag) / 1.4
    const y = origin.y + Math.sin(p.angle) * p.speed * (1 - drag) / 1.4 + 0.5 * 1900 * time * time * 0.35
    const shimmer = 0.55 + 0.45 * Math.sin(time * 14 + p.twinkle)
    const r = p.size * (0.7 + 0.3 * shimmer)

    ctx.save()
    ctx.globalAlpha = Math.max(0, Math.min(1, shimmer * fade))
    ctx.fillStyle = p.color
    ctx.translate(x, y)
    ctx.rotate(time * p.spin)
    ctx.beginPath()
    if (p.star) {
      // Étoile scintillante à 4 branches
      ctx.moveTo(0, -r * 1.6)
      ctx.quadraticCurveTo(r * 0.25, -r * 0.25, r * 1.6, 0)
      ctx.quadraticCurveTo(r * 0.25, r * 0.25, 0, r * 1.6)
      ctx.quadraticCurveTo(-r * 0.25, r * 0.25, -r * 1.6, 0)
      ctx.quadraticCurveTo(-r * 0.25, -r * 0.25, 0, -r * 1.6)
    } else {
      ctx.moveTo(0, -r)
      ctx.lineTo(r * 0.6, 0)
      ctx.lineTo(0, r)
      ctx.lineTo(-r * 0.6, 0)
    }
    ctx.fill()
    ctx.restore()
  }
}

const line = (width) => (
  <div style={{ height: 7, width, borderRadius: 4, backgroundColor: '#EFEBE3', marginTop: 7 }} />
)

function StampedDocument({ data, paperRef }) {
  const { Icon, color, kind = 'certificate', stampText = 'BRAVO', docTitle, docSubtitle, docAmount, title } = data

  return (
    <div ref={paperRef} style={{
      position: 'relative', backgroundColor: '#fff', borderRadius: 10, border: '1px solid #DDD6C8',
      padding: '16px 18px 18px', animation: `bp-shake .3s ease-out ${IMPACT_MS}ms`,
    }}>
      {kind === 'certificate' ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#888780' }}>CERTIFICAT</div>
          <div style={{ marginTop: 8, opacity: 0.35 }}><Icon size={22} color={color} /></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2C3E50', marginTop: 4 }}>{docTitle || title}</div>
          {docSubtitle && <div style={{ fontSize: 12, color: '#888780' }}>{docSubtitle}</div>}
          <div style={{ width: 180, margin: '6px auto 0' }}>{line('100%')}{line('70%')}</div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, letterSpacing: 1, color: '#888780' }}>{kind === 'quote' ? 'DEVIS' : 'FACTURE'}</span>
            <Icon size={16} color="#BBBBBB" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2C3E50', marginTop: 10 }}>{docTitle || 'Votre client'}</div>
          {line('85%')}{line('60%')}{line('72%')}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 13, color: '#2C3E50' }}>
            <span>Total</span><strong style={{ fontSize: 14 }}>{docAmount || ''}</strong>
          </div>
        </div>
      )}

      {/* Le tampon arrive de haut, penché, et s'écrase en légère rotation */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{
          padding: '8px 18px', borderRadius: 10, border: `4px solid ${color}`,
          backgroundColor: 'rgba(255,255,255,0.75)', color, fontSize: 30, fontWeight: 900, letterSpacing: 3,
          animation: `bp-slam ${IMPACT_MS - 180}ms cubic-bezier(.55,0,.9,.35) 180ms both`,
        }}>
          {stampText}
        </div>
      </div>
    </div>
  )
}

/**
 * Affiche la première célébration de la file (montée dans AppLayout) :
 * un document tamponné et des paillettes projetées depuis l'impact.
 */
export default function CelebrationHost() {
  const current = useCelebrationStore((s) => s.queue[0])
  const next = useCelebrationStore((s) => s.next)
  const overlayRef = useRef(null)
  const dialogRef = useRef(null)
  const paperRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!current) return undefined

    let frame
    const particles = makeGlitter(current.color)

    const impact = setTimeout(() => {
      const overlay = overlayRef.current
      const dialog = dialogRef.current
      const paper = paperRef.current
      const canvas = canvasRef.current
      if (!overlay || !dialog || !paper || !canvas) return

      // Coordonnées de mise en page (offset*) : indépendantes du zoom CSS du site
      canvas.width = overlay.clientWidth
      canvas.height = overlay.clientHeight
      const origin = {
        x: dialog.offsetLeft + paper.offsetLeft + paper.offsetWidth / 2,
        y: dialog.offsetTop + paper.offsetTop + paper.offsetHeight / 2,
      }
      const ctx = canvas.getContext('2d')
      navigator.vibrate?.(40)

      const start = performance.now()
      const tick = (now) => {
        const t = (now - start) / GLITTER_MS
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (t >= 1) return
        drawGlitter(ctx, particles, t * (GLITTER_MS / 1000), origin, t > 0.8 ? (1 - t) / 0.2 : 1)
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, IMPACT_MS)

    return () => {
      clearTimeout(impact)
      cancelAnimationFrame(frame)
    }
  }, [current])

  if (!current) return null

  const { color, title, message, stat, statLabel } = current
  const reveal = (delay) => ({ animation: `bp-up .4s ease-out ${delay}ms both` })

  return (
    // key : rejoue les animations à chaque nouvelle célébration de la file
    <div key={current.id}>
      <style>{KEYFRAMES}</style>
      <div ref={overlayRef} style={{
        position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        animation: 'bp-fade .2s ease-out',
      }}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} style={{
          position: 'relative', width: '100%', maxWidth: 440, backgroundColor: '#F4F1EA', borderRadius: 24,
          padding: '32px 28px 26px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        }}>
          <StampedDocument data={current} paperRef={paperRef} />

          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#2C3E50', margin: '28px 0 8px', ...reveal(750) }}>
            {title}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: '#7F8C8D', margin: 0, ...reveal(840) }}>
            {message}
          </p>

          {stat && (
            <p style={{ margin: '16px 0 0', ...reveal(930) }}>
              <span style={{ fontSize: 26, fontWeight: 700, color }}>{stat}</span>
              {statLabel && <span style={{ fontSize: 15, color: '#7F8C8D' }}>{`  ${statLabel}`}</span>}
            </p>
          )}

          <button
            onClick={next}
            autoFocus
            style={{
              width: '100%', height: 52, marginTop: 30, border: 'none', borderRadius: 16, outline: 'none',
              backgroundColor: color, color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer',
              ...reveal(1020),
            }}
          >
            Continuer
          </button>
        </div>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

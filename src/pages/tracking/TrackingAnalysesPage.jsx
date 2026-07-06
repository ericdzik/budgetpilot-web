import { useEffect, useState, useCallback, useRef } from 'react'
import { QrCode, Users, User, MoreHorizontal, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { trackingService } from '../../services/trackingService'
import useTrackingSettingsStore from '../../store/trackingSettingsStore'

const COLORS = { getdenis: '#E65100', client: '#1565C0' }

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MOIS_COURTS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
const JOURS = ['LUN','MAR','MER','JEU','VEN','SAM','DIM']

// ─── Sélecteur de plage "Personnaliser" — s'ouvre directement sur le calendrier
function CustomDateButton({ startDate, endDate, onChange, accentColor = '#E65100' }) {
  const [open, setOpen]     = useState(false)
  const [calMonth, setCalMonth] = useState(() => {
    const d = startDate || new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [localStart, setLocalStart] = useState(startDate)
  const [localEnd,   setLocalEnd]   = useState(endDate)
  const [selectingStart, setSelectingStart] = useState(true)
  const ref = useRef(null)

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isSameDay = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()

  const isInRange = (d) => {
    if (!localStart || !localEnd) return false
    const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const sd = new Date(localStart.getFullYear(), localStart.getMonth(), localStart.getDate())
    const ed = new Date(localEnd.getFullYear(),   localEnd.getMonth(),   localEnd.getDate())
    return dd >= sd && dd <= ed
  }

  const today = new Date()
  const isNextDisabled =
    calMonth.getFullYear() === today.getFullYear() &&
    calMonth.getMonth()    >= today.getMonth()

  const prevMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => {
    if (!isNextDisabled) setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  const handleDayTap = (date) => {
    if (selectingStart) {
      setLocalStart(date); setLocalEnd(null); setSelectingStart(false)
    } else {
      if (date < localStart) { setLocalStart(date); setLocalEnd(null); setSelectingStart(false) }
      else { setLocalEnd(date); setSelectingStart(true) }
    }
  }

  const handleValidate = () => {
    if (localStart && localEnd) {
      onChange(localStart, localEnd)
      setOpen(false)
    }
  }

  // Label du bouton
  const fmtDate = (d) => {
    if (!d) return ''
    return `${d.getDate()} ${MOIS_COURTS[d.getMonth()]} ${d.getFullYear()}`
  }
  // Toujours afficher les dates (jamais "Personnaliser")
  const buttonLabel = startDate && endDate
    ? `${fmtDate(startDate)} – ${fmtDate(endDate)}`
    : `${fmtDate(new Date())}` // fallback date du jour

  // Grille calendrier
  const firstDOW    = (new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate()
  const rows        = Math.ceil((firstDOW + daysInMonth) / 7)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bouton */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 20,
          border: '1.5px solid #e0e0e0', fontSize: 14,
          fontWeight: 500, color: '#333',
          backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
        }}
      >
        {buttonLabel}
        <Calendar size={15} color={accentColor} />
      </button>

      {/* Panneau calendrier */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 300,
          backgroundColor: '#fff', borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          padding: '14px 14px 12px', minWidth: 300,
        }}>

          {/* Header "Filtre" */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '1px solid #ddd', background: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={14} color="#555" />
            </button>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>
              Filtre
            </span>
            <div style={{ width: 28 }} />
          </div>

          {/* Navigation mois */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '1.5px solid #bbb', marginRight: 8, flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>{calMonth.getFullYear()}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{MOIS[calMonth.getMonth()]}</div>
            </div>
            <button onClick={prevMonth} style={{
              width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd',
              background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4,
            }}>
              <ChevronLeft size={14} color="#555" />
            </button>
            <button onClick={nextMonth} disabled={isNextDisabled} style={{
              width: 28, height: 28, borderRadius: '50%',
              border: `1px solid ${isNextDisabled ? '#eee' : '#ddd'}`,
              background: '#fff', cursor: isNextDisabled ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={14} color={isNextDisabled ? '#ccc' : '#555'} />
            </button>
          </div>

          {/* En-têtes jours */}
          <div style={{ display: 'grid', gridTemplateColumns: '22px repeat(7, 1fr)', marginBottom: 4 }}>
            <div />
            {JOURS.map(j => (
              <div key={j} style={{ textAlign: 'center', fontSize: 9, color: '#aaa', fontWeight: 600 }}>{j}</div>
            ))}
          </div>

          {/* Grille */}
          {Array.from({ length: rows }, (_, rowIdx) => {
            const weekDays = []
            for (let col = 0; col < 7; col++) {
              const n = rowIdx * 7 + col - firstDOW + 1
              if (n >= 1 && n <= daysInMonth)
                weekDays.push(new Date(calMonth.getFullYear(), calMonth.getMonth(), n))
            }
            const isWeekSel = weekDays.length > 0 && localStart && localEnd &&
              isSameDay(weekDays[0], localStart) && isSameDay(weekDays[weekDays.length - 1], localEnd)

            const lightBg = accentColor === '#E65100' ? '#FFE0CC' : '#BBDEFB'

            return (
              <div key={rowIdx} style={{
                display: 'grid', gridTemplateColumns: '22px repeat(7, 1fr)', marginBottom: 2,
              }}>
                {/* Bouton semaine */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      if (!weekDays.length) return
                      if (isWeekSel) { setLocalStart(null); setLocalEnd(null); setSelectingStart(true) }
                      else { setLocalStart(weekDays[0]); setLocalEnd(weekDays[weekDays.length - 1]); setSelectingStart(true) }
                    }}
                    style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: `1.5px solid ${isWeekSel ? accentColor : '#bbb'}`,
                      background: '#fff', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {isWeekSel && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accentColor }} />}
                  </button>
                </div>

                {/* Cellules jours */}
                {Array.from({ length: 7 }, (_, col) => {
                  const n = rowIdx * 7 + col - firstDOW + 1
                  if (n < 1 || n > daysInMonth) return <div key={col} />
                  const date    = new Date(calMonth.getFullYear(), calMonth.getMonth(), n)
                  const isStart = isSameDay(date, localStart)
                  const isEnd   = isSameDay(date, localEnd)
                  const inRange = isInRange(date)
                  const isEdge  = isStart || isEnd
                  let bg = 'transparent', fg = '#2C3E50', fw = 400
                  if (isEdge)       { bg = accentColor; fg = '#fff'; fw = 700 }
                  else if (inRange) { bg = lightBg;     fg = accentColor }
                  return (
                    <button key={col} onClick={() => handleDayTap(date)} style={{
                      height: 30, borderRadius: '50%', border: 'none',
                      backgroundColor: bg, color: fg, fontWeight: fw,
                      fontSize: 11, cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {n}
                    </button>
                  )
                })}
              </div>
            )
          })}

          {/* Bouton Valider */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              disabled={!localStart || !localEnd}
              onClick={handleValidate}
              style={{
                padding: '10px 28px',
                backgroundColor: localStart && localEnd ? accentColor : '#e0e0e0',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                cursor: localStart && localEnd ? 'pointer' : 'not-allowed',
              }}
            >
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Donut SVG ────────────────────────────────────────────────────────────────
function DonutChart({ byGroup, total }) {
  if (!total) return (
    <div style={{ width: 90, height: 90, borderRadius: '50%', backgroundColor: '#f0f0f0' }} />
  )
  const getdenis = byGroup?.getdenis || 0
  const client   = byGroup?.client   || 0
  const r = 36, cx = 45, cy = 45
  const circ = 2 * Math.PI * r
  const dashG = (getdenis / total) * circ
  const dashC = (client   / total) * circ
  // Les deux segments couvrent-ils tout le cercle ?
  const isFull = (getdenis + client) >= total

  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      {/* Fond gris uniquement si les segments ne couvrent pas tout */}
      {!isFull && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth="14" />
      )}
      {getdenis > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={COLORS.getdenis} strokeWidth="14"
          strokeDasharray={`${dashG} ${circ - dashG}`}
          strokeDashoffset={circ / 4}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '45px 45px' }}
        />
      )}
      {client > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={COLORS.client} strokeWidth="14"
          strokeDasharray={`${dashC} ${circ - dashC}`}
          strokeDashoffset={circ / 4 - dashG}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '45px 45px' }}
        />
      )}
    </svg>
  )
}

// ─── Graphique barres empilées (SVG) ─────────────────────────────────────────
function BarChart({ data }) {
  const [hoveredDate, setHoveredDate] = useState(null)

  if (!data || data.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#ccc', fontSize: 13 }}>
      Aucune donnée
    </div>
  )

  // Grouper par date
  const grouped = {}
  data.forEach(({ date, count, group }) => {
    if (!grouped[date]) grouped[date] = { getdenis: 0, client: 0 }
    grouped[date][group] = (grouped[date][group] || 0) + count
  })
  const dates = Object.keys(grouped).sort()

  // Axe Y dynamique — 6 graduations propres
  const maxVal  = Math.max(...dates.map(d => grouped[d].getdenis + grouped[d].client), 1)
  const rawStep = maxVal / 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)))
  const niceStep  = rawStep / magnitude <= 1 ? magnitude
    : rawStep / magnitude <= 2 ? 2 * magnitude
    : rawStep / magnitude <= 5 ? 5 * magnitude
    : 10 * magnitude
  const yMax   = niceStep * 6
  const ySteps = [6, 5, 4, 3, 2, 1].map(i => i * niceStep)

  // Dimensions SVG
  const marginLeft = 32
  const marginBottom = 24  // espace pour les dates sous l'axe X
  const chartW = 400
  const chartH = 180
  const svgW   = chartW + marginLeft
  const svgH   = chartH + marginBottom
  const barW   = 14
  const colW   = chartW / (dates.length || 1)

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>

        {/* Lignes horizontales + labels Y */}
        {ySteps.map((v, i) => {
          const y = (1 - v / yMax) * chartH
          return (
            <g key={v}>
              <line
                x1={marginLeft} y1={y}
                x2={svgW}       y2={y}
                stroke="#f0f0f0" strokeWidth="1"
              />
              <text
                x={marginLeft - 4} y={y + 4}
                textAnchor="end"
                fontSize="10" fill="#bbb"
              >{v}</text>
            </g>
          )
        })}

        {/* Barres + dates */}
        {dates.map((date, i) => {
          const g     = grouped[date].getdenis
          const c     = grouped[date].client
          const total = g + c

          const hG = (g / yMax) * chartH
          const hC = (c / yMax) * chartH

          // Moins grand en bas, plus grand au-dessus
          const bottomVal   = g <= c ? g : c
          const topVal      = g <= c ? c : g
          const colorBottom = g <= c ? COLORS.getdenis : COLORS.client
          const colorTop    = g <= c ? COLORS.client   : COLORS.getdenis
          const hBottom = (bottomVal / yMax) * chartH
          const hTop    = (topVal    / yMax) * chartH

          const cx = marginLeft + i * colW + colW / 2
          const isHovered = hoveredDate === date

          return (
            <g key={date}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
              style={{ cursor: 'default' }}
            >
              {/* Segment bottom (moins grand) */}
              {hBottom > 0 && (
                <rect
                  x={cx - barW / 2}
                  y={chartH - hBottom}
                  width={barW} height={hBottom}
                  fill={colorBottom}
                  rx={hTop > 0 ? 0 : 3} ry={hTop > 0 ? 0 : 3}
                  opacity={isHovered ? 1 : 0.85}
                />
              )}
              {/* Segment top (plus grand) */}
              {hTop > 0 && (
                <rect
                  x={cx - barW / 2}
                  y={chartH - hBottom - hTop}
                  width={barW} height={hTop}
                  fill={colorTop}
                  rx={3} ry={3}
                  opacity={isHovered ? 1 : 0.85}
                />
              )}
              {/* Barre vide */}
              {g === 0 && c === 0 && (
                <rect x={cx - barW / 2} y={chartH - 4} width={barW} height={4}
                  fill="#f0f0f0" rx={3} />
              )}

              {/* Date sous l'axe X */}
              <text
                x={cx} y={chartH + 16}
                textAnchor="middle"
                fontSize="10" fill="#bbb"
              >{date.slice(5).replace('-', '.')}</text>

              {/* Tooltip au survol */}
              {isHovered && total > 0 && (
                <g>
                  <rect
                    x={cx - 50} y={chartH - hBottom - hTop - 32}
                    width={100} height={22}
                    fill="#111" rx={5}
                  />
                  <text
                    x={cx} y={chartH - hBottom - hTop - 17}
                    textAnchor="middle"
                    fontSize="11" fill="#fff" fontWeight="600"
                  >
                    {total} scan{total > 1 ? 's' : ''}{g > 0 ? ` · ${g} Gdn` : ''}{c > 0 ? ` · ${c} BP` : ''}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Axe X baseline */}
        <line
          x1={marginLeft} y1={chartH}
          x2={svgW}       y2={chartH}
          stroke="#e0e0e0" strokeWidth="1"
        />
      </svg>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS.getdenis }} />
          <span style={{ fontSize: 11, color: '#888' }}>Getdenis</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS.client }} />
          <span style={{ fontSize: 11, color: '#888' }}>Budget Pilot</span>
        </div>
      </div>
    </div>
  )
}

// ─── Carte stat ───────────────────────────────────────────────────────────────
function StatCard({ label, value, active = false, icon: Icon }) {
  return (
    <div style={{
      backgroundColor: active ? '#E65100' : '#fff',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 100,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 13, color: active ? 'rgba(255,255,255,0.85)' : '#666', fontWeight: 500 }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={14} color={active ? '#fff' : '#555'} />
          </div>
        )}
      </div>
      <p style={{
        fontSize: 40, fontWeight: 700, margin: 0,
        color: active ? '#fff' : '#111', lineHeight: 1,
        marginTop: 8,
      }}>
        {value}
      </p>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function TrackingAnalysesPage() {
  const { partnerLogoUrl, partnerName } = useTrackingSettingsStore()
  const [stats, setStats]     = useState(null)
  const [scans, setScans]     = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date()

  // Par défaut : mois en cours
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const defaultEnd   = today

  const [customStart, setCustomStart] = useState(defaultStart)
  const [customEnd,   setCustomEnd]   = useState(defaultEnd)

  const fmtDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const load = useCallback(async (from, to) => {
    setLoading(true)
    try {
      const [statsData, scansData] = await Promise.all([
        trackingService.getStats(from || null, to || null),
        trackingService.getScans({ page: 1 }),
      ])
      setStats(statsData)
      setScans(scansData.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Chargement initial — mois en cours par défaut
  useEffect(() => {
    load(fmtDate(defaultStart), fmtDate(defaultEnd))
  }, [])

  const handleRangeChange = (start, end) => {
    setCustomStart(start)
    setCustomEnd(end)
    load(fmtDate(start), fmtDate(end))
  }

  const total        = stats?.total_scans  || 0
  const byGroup      = stats?.by_group     || {}
  const byCommercial = stats?.by_commercial || []
  const daily        = stats?.daily        || []
  const clientLinks  = byCommercial.filter(l => l.group === 'client')
  const totalClient  = clientLinks.reduce((s, l) => s + (l.total_scans || 0), 0)

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        {/* Titre + Filtre à gauche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111', margin: 0 }}>Analyses</h1>

          <CustomDateButton
            startDate={customStart}
            endDate={customEnd}
            onChange={handleRangeChange}
            accentColor="#E65100"
          />
        </div>

        {/* Budget Pilot badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={partnerLogoUrl} alt={partnerName} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>{partnerName}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <p style={{ color: '#aaa' }}>Chargement...</p>
        </div>
      ) : (
        // ── Layout 2 colonnes ──
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* ══ COLONNE GAUCHE ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Grille 2×2 cartes stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Scan QR-code — orange */}
              <StatCard label="Scan QR-code" value={total} active icon={QrCode} />

              {/* Commercial 1 (premier client) */}
              {clientLinks[0] ? (
                <StatCard label={clientLinks[0].name} value={clientLinks[0].total_scans} icon={User} />
              ) : (
                <StatCard label="Commercial 1" value={0} icon={User} />
              )}

              {/* Getdenis */}
              <StatCard label="Getdenis" value={byGroup.getdenis || 0} icon={Users} />

              {/* Commercial 2 (deuxième client) */}
              {clientLinks[1] ? (
                <StatCard label={clientLinks[1].name} value={clientLinks[1].total_scans} icon={User} />
              ) : (
                <StatCard label="Commercial 2" value={0} icon={User} />
              )}
            </div>

            {/* Graphique barres */}
            <div style={{
              backgroundColor: '#fff', borderRadius: 16,
              padding: '20px 20px 16px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#444', margin: '0 0 16px' }}>
                Vue globale sur les scans
              </p>
              <BarChart data={daily} />
            </div>
          </div>

          {/* ══ COLONNE DROITE ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Carte Interne + camembert */}
            <div style={{
              backgroundColor: '#fff', borderRadius: 16,
              padding: '20px 24px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              {/* Gauche : chiffres */}
              <div>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>Interne</p>
                <p style={{ fontSize: 42, fontWeight: 700, color: '#111', margin: 0, lineHeight: 1 }}>{total}</p>
                <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 12px' }}>scans qr-code</p>
                {/* Pourcentage de chaque commercial du client entre eux */}
                {clientLinks.map(link => {
                  const pct = totalClient > 0 ? Math.round((link.total_scans / totalClient) * 100) : 0
                  return (
                    <p key={link.id} style={{ fontSize: 13, color: COLORS.client, margin: '0 0 3px' }}>
                      {pct}% {link.name}
                    </p>
                  )
                })}
                {clientLinks.length === 0 && (
                  <p style={{ fontSize: 12, color: '#ccc', margin: 0 }}>Aucun commercial client</p>
                )}
              </div>
              {/* Droite : donut */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Répartition des scans</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <DonutChart byGroup={byGroup} total={total} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Getdenis */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.getdenis, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>
                        {total ? Math.round(((byGroup.getdenis || 0) / total) * 100) : 0}%
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#aaa', marginLeft: 16, marginBottom: 4 }}>Getdenis</span>
                    {/* Budget Pilot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.client, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>
                        {total ? Math.round(((byGroup.client || 0) / total) * 100) : 0}%
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#aaa', marginLeft: 16 }}>Budget Pilot</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau liste des scans */}
            <div style={{
              backgroundColor: '#fff', borderRadius: 16,
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px 12px',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>Liste des scans</span>
                <MoreHorizontal size={18} color="#555" style={{ cursor: 'pointer' }} />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#111' }}>
                    {['#', 'Commercial', 'Date', 'Heure', 'Etat'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: 12, color: '#fff', fontWeight: 600,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scans.slice(0, 7).map((scan, i) => (
                    <tr key={scan.id} style={{
                      backgroundColor: scan.group === 'getdenis'
                        ? (i % 2 === 0 ? '#fff8f5' : '#fff3ee')
                        : (i % 2 === 0 ? '#fff' : '#f5f8ff'),
                    }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#bbb' }}>{scan.id}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#222', fontWeight: 500 }}>
                        {scan.commercial}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#666' }}>{scan.date}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#666' }}>{scan.time}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          backgroundColor: scan.group === 'getdenis' ? COLORS.getdenis : COLORS.client,
                          color: '#fff', fontSize: 11, fontWeight: 700,
                          padding: '3px 10px', borderRadius: 20,
                        }}>
                          scan
                        </span>
                      </td>
                    </tr>
                  ))}
                  {scans.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#ccc', fontSize: 13 }}>
                        Aucun scan pour le moment
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
          {/* ── fin 2 colonnes ── */}
        </div>
      )}
    </div>
  )
}

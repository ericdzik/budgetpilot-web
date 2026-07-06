import { useEffect, useState, useCallback } from 'react'
import { QrCode, Users, User, MoreHorizontal, Calendar } from 'lucide-react'
import { trackingService } from '../../services/trackingService'

const COLORS = { getdenis: '#E65100', client: '#1565C0' }

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
  const [stats, setStats]     = useState(null)
  const [scans, setScans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState({ from: '', to: '' })

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

  // Chargement initial
  useEffect(() => { load('', '') }, [])

  // Recharger automatiquement quand les deux dates sont renseignées
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
    if (newPeriod.from && newPeriod.to) {
      load(newPeriod.from, newPeriod.to)
    }
    // Si les deux dates sont vides, recharger toute la période
    if (!newPeriod.from && !newPeriod.to) {
      load('', '')
    }
  }

  const total        = stats?.total_scans  || 0
  const byGroup      = stats?.by_group     || {}
  const byCommercial = stats?.by_commercial || []
  const daily        = stats?.daily        || []
  const clientLinks  = byCommercial.filter(l => l.group === 'client')
  const totalClient  = clientLinks.reduce((s, l) => s + (l.total_scans || 0), 0)

  // Label période affiché
  const periodLabel = period.from && period.to
    ? `${period.from} - ${period.to}`
    : period.from
    ? `depuis ${period.from}`
    : 'Toute la période'

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111', margin: 0 }}>Analyses</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Sélecteur période */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: '#fff', borderRadius: 24,
            padding: '8px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            fontSize: 13,
          }}>
            <input type="date" value={period.from}
              onChange={e => handlePeriodChange({ ...period, from: e.target.value })}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#444', width: 110 }}
            />
            <span style={{ color: '#bbb' }}>–</span>
            <input type="date" value={period.to}
              onChange={e => handlePeriodChange({ ...period, to: e.target.value })}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#444', width: 110 }}
            />
            <Calendar size={16} color="#555" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => load(period.from, period.to)} />
          </div>
          {/* Budget Pilot badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: '#222',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14, fontWeight: 700,
            }}>B</div>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>Budget pilot</span>
          </div>
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

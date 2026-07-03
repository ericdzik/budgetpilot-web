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

// ─── Graphique barres empilées ────────────────────────────────────────────────
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

  // Axe Y dynamique — toujours 6 graduations régulières adaptées aux données
  const maxVal = Math.max(...dates.map(d => grouped[d].getdenis + grouped[d].client), 1)
  // Calcul d'un "step" propre (1, 2, 5, 10, 20, 50, 100...)
  const rawStep = maxVal / 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const niceStep = rawStep / magnitude <= 1 ? magnitude
    : rawStep / magnitude <= 2 ? 2 * magnitude
    : rawStep / magnitude <= 5 ? 5 * magnitude
    : 10 * magnitude
  const yMax   = niceStep * 6
  const ySteps = [6, 5, 4, 3, 2, 1].map(i => i * niceStep)
  const chartH = 180

  return (
    <div style={{ position: 'relative', paddingLeft: 36 }}>
      {/* Axe Y */}
      <div style={{
        position: 'absolute', left: 0, top: 0,
        height: chartH,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        {ySteps.map(v => (
          <span key={v} style={{ fontSize: 11, color: '#bbb', lineHeight: 1 }}>{v}</span>
        ))}
      </div>

      {/* Zone graphique */}
      <div style={{ position: 'relative' }}>
        {/* Lignes horizontales */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: chartH,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          pointerEvents: 'none',
        }}>
          {ySteps.map(v => (
            <div key={v} style={{ borderBottom: '1px solid #f0f0f0', width: '100%' }} />
          ))}
        </div>

        {/* Barres empilées */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: chartH }}>
          {dates.map(date => {
            const g     = grouped[date].getdenis
            const c     = grouped[date].client
            const total = g + c
            const hG    = Math.max((g / yMax) * chartH, g > 0 ? 4 : 0)
            const hC    = Math.max((c / yMax) * chartH, c > 0 ? 4 : 0)
            const isHovered = hoveredDate === date

            return (
              <div
                key={date}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
              >
                {/* Tooltip */}
                {isHovered && total > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: hG + hC + 10,
                    left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#111', color: '#fff',
                    fontSize: 11, fontWeight: 600,
                    padding: '4px 8px', borderRadius: 6,
                    whiteSpace: 'nowrap', zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}>
                    {total} scan{total > 1 ? 's' : ''}{g > 0 ? ` · ${g} Gdn` : ''}{c > 0 ? ` · ${c} BP` : ''}
                  </div>
                )}

                {/* Barre empilée dynamique : le plus grand segment en bas */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  {(() => {
                    // Le segment le plus petit va en haut, le plus grand en bas
                    const topGroup    = g >= c ? 'client'   : 'getdenis'
                    const bottomGroup = g >= c ? 'getdenis' : 'client'
                    const hTop    = topGroup    === 'getdenis' ? hG : hC
                    const hBottom = bottomGroup === 'getdenis' ? hG : hC
                    const colorTop    = COLORS[topGroup]
                    const colorBottom = COLORS[bottomGroup]
                    return (
                      <>
                        {hTop > 0 && (
                          <div style={{
                            width: 14, height: hTop,
                            backgroundColor: colorTop,
                            borderRadius: hBottom > 0 ? '3px 3px 0 0' : '3px',
                            opacity: isHovered ? 1 : 0.85,
                            transition: 'opacity 0.15s',
                          }} />
                        )}
                        {hBottom > 0 && (
                          <div style={{
                            width: 14, height: hBottom,
                            backgroundColor: colorBottom,
                            borderRadius: hTop > 0 ? '0 0 3px 3px' : '3px',
                            opacity: isHovered ? 1 : 0.85,
                            transition: 'opacity 0.15s',
                          }} />
                        )}
                        {g === 0 && c === 0 && (
                          <div style={{ width: 14, height: 4, backgroundColor: '#f0f0f0', borderRadius: 3 }} />
                        )}
                      </>
                    )
                  })()}
                </div>

                {/* Date */}
                <span style={{ fontSize: 10, color: '#bbb', marginTop: 6, whiteSpace: 'nowrap' }}>
                  {date.slice(5).replace('-', '.')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, scansData] = await Promise.all([
        trackingService.getStats(period.from || null, period.to || null),
        trackingService.getScans({ page: 1 }),
      ])
      setStats(statsData)
      setScans(scansData.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [period.from, period.to])

  useEffect(() => { load() }, [])

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
              onChange={e => setPeriod(p => ({ ...p, from: e.target.value }))}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#444', width: 110 }}
            />
            <span style={{ color: '#bbb' }}>–</span>
            <input type="date" value={period.to}
              onChange={e => setPeriod(p => ({ ...p, to: e.target.value }))}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#444', width: 110 }}
            />
            <Calendar size={16} color="#555" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={load} />
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

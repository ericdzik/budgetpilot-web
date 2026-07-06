import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { trackingService } from '../../services/trackingService'
import useTrackingSettingsStore from '../../store/trackingSettingsStore'

const COLORS = { getdenis: '#E65100', client: '#1565C0' }

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ─── Badge de point par groupe ─────────────────────────────────────────────
function DayDots({ getdenis, client }) {
  return (
    <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 3 }}>
      {getdenis > 0 && (
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: COLORS.getdenis,
        }} />
      )}
      {client > 0 && (
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: COLORS.client,
        }} />
      )}
    </div>
  )
}

// ─── Modal détail d'un jour ─────────────────────────────────────────────────
function DayDetailModal({ date, scans, onClose }) {
  const label = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const getdenisScans = scans.filter(s => s.group === 'getdenis')
  const clientScans   = scans.filter(s => s.group === 'client')

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}
      onClick={onClose}
    >
      <div style={{
        backgroundColor: '#fff', borderRadius: 20,
        padding: '28px', width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        maxHeight: '80vh', overflow: 'auto',
      }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, color: '#aaa', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Détail du jour</p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '4px 0 0', textTransform: 'capitalize' }}>
              {label}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#aaa', padding: 4,
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Résumé */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{
            flex: 1, backgroundColor: '#fff0ea', borderRadius: 12,
            padding: '12px 16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.getdenis, margin: 0 }}>{getdenisScans.length}</p>
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>Getdenis</p>
          </div>
          <div style={{
            flex: 1, backgroundColor: '#e8f0fe', borderRadius: 12,
            padding: '12px 16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.client, margin: 0 }}>{clientScans.length}</p>
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>Budget Pilot</p>
          </div>
          <div style={{
            flex: 1, backgroundColor: '#f5f5f5', borderRadius: 12,
            padding: '12px 16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#111', margin: 0 }}>{scans.length}</p>
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>Total</p>
          </div>
        </div>

        {/* Liste des scans */}
        {scans.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#ccc', fontSize: 14, padding: '20px 0' }}>
            Aucun scan ce jour
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scans.map((scan, i) => (
              <div key={scan.id ?? i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: scan.group === 'getdenis' ? '#fff8f5' : '#f5f8ff',
                borderRadius: 10,
                borderLeft: `3px solid ${COLORS[scan.group] || '#ccc'}`,
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>{scan.commercial}</p>
                  <p style={{ fontSize: 12, color: '#aaa', margin: '2px 0 0' }}>
                    {scan.group === 'getdenis' ? 'Getdenis' : 'Budget Pilot'}
                  </p>
                </div>
                <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>{scan.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ────────────────────────────────────────────────────────
export default function TrackingCalendrierPage() {
  const { partnerLogoUrl, partnerName } = useTrackingSettingsStore()
  const today    = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [dailyData, setDailyData]   = useState({}) // { 'YYYY-MM-DD': { getdenis: N, client: N, scans: [] } }
  const [loading, setLoading]       = useState(true)
  const [selectedDay, setSelectedDay] = useState(null) // 'YYYY-MM-DD'
  const [dayScans, setDayScans]     = useState([])
  const [dayLoading, setDayLoading] = useState(false)

  // Charger les stats du mois courant
  const loadMonth = useCallback(async (y, m) => {
    setLoading(true)
    try {
      const from = `${y}-${String(m + 1).padStart(2, '0')}-01`
      const lastDay = new Date(y, m + 1, 0).getDate()
      const to   = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const statsData = await trackingService.getStats(from, to)
      const daily = statsData?.daily || []

      // Transformer daily en map { date: { getdenis, client } }
      const map = {}
      daily.forEach(({ date, count, group }) => {
        if (!map[date]) map[date] = { getdenis: 0, client: 0 }
        map[date][group] = (map[date][group] || 0) + count
      })
      setDailyData(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMonth(year, month) }, [year, month])

  // Navigation mois
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  // Clic sur un jour — charger les scans de ce jour
  const handleDayClick = async (dateStr) => {
    const data = dailyData[dateStr]
    const total = (data?.getdenis || 0) + (data?.client || 0)
    if (total === 0) return // pas de scans ce jour, rien à afficher
    setSelectedDay(dateStr)
    setDayLoading(true)
    try {
      const res = await trackingService.getScans({ from: dateStr, to: dateStr, page: 1 })
      // Récupérer toutes les pages si > 1
      let scans = res.data || []
      if ((res.last_page || 1) > 1) {
        const extras = await Promise.all(
          Array.from({ length: res.last_page - 1 }, (_, i) =>
            trackingService.getScans({ from: dateStr, to: dateStr, page: i + 2 })
          )
        )
        extras.forEach(r => { scans = scans.concat(r.data || []) })
      }
      setDayScans(scans)
    } catch {
      setDayScans([])
    } finally {
      setDayLoading(false)
    }
  }

  // Construire la grille du calendrier
  const firstDayOfMonth = new Date(year, month, 1)
  // JS: 0=dim, on veut 0=lun
  const startDow = (firstDayOfMonth.getDay() + 6) % 7 // 0=lun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Cellules : des cases vides + les jours du mois
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // Compléter à multiple de 7
  while (cells.length % 7 !== 0) cells.push(null)

  // Totaux du mois
  const monthGetdenis = Object.values(dailyData).reduce((s, d) => s + (d.getdenis || 0), 0)
  const monthClient   = Object.values(dailyData).reduce((s, d) => s + (d.client   || 0), 0)
  const monthTotal    = monthGetdenis + monthClient

  // Jour max pour normaliser les intensités
  const maxDay = Math.max(...Object.values(dailyData).map(d => (d.getdenis || 0) + (d.client || 0)), 1)

  const todayStr = today.toISOString().split('T')[0]

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111', margin: 0 }}>Calendrier</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={partnerLogoUrl} alt={partnerName} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>{partnerName}</span>
        </div>
      </div>

      {/* ── Résumé du mois ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total scans', value: monthTotal, color: '#111', bg: '#fff' },
          { label: 'Getdenis',    value: monthGetdenis, color: COLORS.getdenis, bg: '#fff0ea' },
          { label: 'Budget Pilot', value: monthClient, color: COLORS.client, bg: '#e8f0fe' },
          { label: 'Jours actifs', value: Object.keys(dailyData).length, color: '#4CAF50', bg: '#f0faf0' },
        ].map(stat => (
          <div key={stat.label} style={{
            backgroundColor: stat.bg, borderRadius: 14,
            padding: '14px 20px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            flex: 1,
          }}>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{stat.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: stat.color, margin: '4px 0 0' }}>
              {loading ? '…' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Calendrier ── */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}>
        {/* Navigation mois */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <button onClick={prevMonth} style={{
            background: 'none', border: '1px solid #e0e0e0',
            borderRadius: 10, padding: '6px 10px',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <ChevronLeft size={18} color="#555" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>
              {MOIS[month]} {year}
            </h2>
            <button
              onClick={goToday}
              style={{
                padding: '4px 14px', borderRadius: 20,
                border: '1px solid #e0e0e0', background: '#f5f5f5',
                fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer',
              }}
            >
              Aujourd'hui
            </button>
          </div>

          <button onClick={nextMonth} style={{
            background: 'none', border: '1px solid #e0e0e0',
            borderRadius: 10, padding: '6px 10px',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <ChevronRight size={18} color="#555" />
          </button>
        </div>

        {/* Jours de la semaine */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          backgroundColor: '#111',
        }}>
          {JOURS.map(j => (
            <div key={j} style={{
              padding: '10px 0',
              textAlign: 'center',
              fontSize: 12, fontWeight: 600, color: '#fff',
              letterSpacing: 0.5,
            }}>{j}</div>
          ))}
        </div>

        {/* Grille des jours */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>
            Chargement du calendrier…
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          }}>
            {cells.map((day, idx) => {
              if (day === null) {
                return (
                  <div key={`empty-${idx}`} style={{
                    minHeight: 80,
                    borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #f5f5f5',
                    borderBottom: '1px solid #f5f5f5',
                    backgroundColor: '#fafafa',
                  }} />
                )
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const data    = dailyData[dateStr] || { getdenis: 0, client: 0 }
              const total   = (data.getdenis || 0) + (data.client || 0)
              const isToday = dateStr === todayStr
              const isWeekend = (idx % 7) >= 5 // sam/dim
              const intensity = total > 0 ? Math.max(0.08, total / maxDay) : 0

              // Couleur de fond selon intensité + groupe dominant
              let bg = isWeekend ? '#fafafa' : '#fff'
              let borderL = '3px solid transparent'
              if (total > 0) {
                const dominant = (data.getdenis || 0) >= (data.client || 0) ? 'getdenis' : 'client'
                const baseColor = dominant === 'getdenis' ? '230, 81, 0' : '21, 101, 192'
                bg = `rgba(${baseColor}, ${intensity * 0.18})`
                borderL = `3px solid ${COLORS[dominant]}`
              }

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  style={{
                    minHeight: 80,
                    padding: '8px 10px',
                    borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #f0f0f0',
                    borderBottom: '1px solid #f0f0f0',
                    borderLeft: borderL,
                    backgroundColor: bg,
                    cursor: total > 0 ? 'pointer' : 'default',
                    transition: 'background-color 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (total > 0) e.currentTarget.style.filter = 'brightness(0.95)' }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                >
                  {/* Numéro du jour */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 6,
                  }}>
                    <span style={{
                      width: 26, height: 26,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                      fontSize: 13, fontWeight: isToday ? 700 : 500,
                      color: isToday ? '#fff' : (isWeekend ? '#bbb' : '#333'),
                      backgroundColor: isToday ? '#E65100' : 'transparent',
                      flexShrink: 0,
                    }}>
                      {day}
                    </span>
                  </div>

                  {/* Nombre de scans */}
                  {total > 0 && (
                    <div>
                      <div style={{
                        fontSize: 20, fontWeight: 700,
                        color: (data.getdenis || 0) >= (data.client || 0) ? COLORS.getdenis : COLORS.client,
                        lineHeight: 1,
                      }}>
                        {total}
                      </div>
                      <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                        scan{total > 1 ? 's' : ''}
                      </div>
                      <DayDots getdenis={data.getdenis} client={data.client} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Légende */}
        <div style={{
          display: 'flex', gap: 20, alignItems: 'center',
          padding: '14px 24px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
        }}>
          {[
            { color: COLORS.getdenis, label: 'Getdenis' },
            { color: COLORS.client,   label: 'Budget Pilot' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ fontSize: 12, color: '#777' }}>{item.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', backgroundColor: '#E65100',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#fff', fontWeight: 700,
            }}>•</div>
            <span style={{ fontSize: 12, color: '#777' }}>Aujourd'hui</span>
          </div>
          <span style={{ fontSize: 12, color: '#bbb', marginLeft: 'auto' }}>
            Cliquer sur un jour pour voir le détail
          </span>
        </div>
      </div>

      {/* Modal détail */}
      {selectedDay && (
        <DayDetailModal
          date={selectedDay}
          scans={dayLoading ? [] : dayScans}
          onClose={() => { setSelectedDay(null); setDayScans([]) }}
        />
      )}
    </div>
  )
}

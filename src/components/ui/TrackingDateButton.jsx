/**
 * TrackingDateButton — bouton date avec calendrier de plage intégré
 * Partagé entre TrackingAnalysesPage et TrackingHistoriquePage
 *
 * Props:
 *   startDate   — Date | null  (date de début)
 *   endDate     — Date | null  (date de fin)
 *   onChange(start, end) — appelé quand une plage est validée
 *   accentColor — string (défaut '#E65100')
 */
import { useRef, useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin',
              'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MOIS_COURTS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
const JOURS = ['LUN','MAR','MER','JEU','VEN','SAM','DIM']

export default function TrackingDateButton({ startDate, endDate, onChange, accentColor = '#E65100' }) {
  const today = new Date()
  const [open, setOpen]       = useState(false)
  const [calMonth, setCalMonth] = useState(() => {
    const d = startDate || today
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [localStart, setLocalStart] = useState(startDate)
  const [localEnd,   setLocalEnd]   = useState(endDate)
  const [selectingStart, setSelectingStart] = useState(true)
  const ref = useRef(null)

  useEffect(() => { setLocalStart(startDate) }, [startDate])
  useEffect(() => { setLocalEnd(endDate)     }, [endDate])

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

  const isNextDisabled =
    calMonth.getFullYear() === today.getFullYear() &&
    calMonth.getMonth()    >= today.getMonth()

  const prevMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => { if (!isNextDisabled) setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)) }

  const handleDayTap = (date) => {
    if (selectingStart) {
      setLocalStart(date); setLocalEnd(null); setSelectingStart(false)
    } else {
      if (date < localStart) { setLocalStart(date); setLocalEnd(null); setSelectingStart(false) }
      else { setLocalEnd(date); setSelectingStart(true) }
    }
  }

  const handleValidate = () => {
    if (localStart && localEnd) { onChange(localStart, localEnd); setOpen(false) }
  }

  const fmtDate = (d) => d ? `${d.getDate()} ${MOIS_COURTS[d.getMonth()]} ${d.getFullYear()}` : ''
  const buttonLabel = startDate && endDate
    ? `${fmtDate(startDate)} – ${fmtDate(endDate)}`
    : 'Toutes les dates'

  const firstDOW    = (new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate()
  const rows        = Math.ceil((firstDOW + daysInMonth) / 7)
  const lightBg     = accentColor === '#E65100' ? '#FFE0CC' : '#BBDEFB'

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
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {buttonLabel}
        <Calendar size={15} color={accentColor} />
      </button>

      {/* Panneau calendrier */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 300,
          backgroundColor: '#fff', borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          padding: '14px 14px 12px', minWidth: 300,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <button onClick={() => setOpen(false)} style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '1px solid #ddd', background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={14} color="#555" />
            </button>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>
              Filtre
            </span>
            <div style={{ width: 28 }} />
          </div>

          {/* Nav mois */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #bbb', marginRight: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>{calMonth.getFullYear()}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{MOIS[calMonth.getMonth()]}</div>
            </div>
            <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
              <ChevronLeft size={14} color="#555" />
            </button>
            <button onClick={nextMonth} disabled={isNextDisabled} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${isNextDisabled ? '#eee' : '#ddd'}`, background: '#fff', cursor: isNextDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

            return (
              <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: '22px repeat(7, 1fr)', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      if (!weekDays.length) return
                      if (isWeekSel) { setLocalStart(null); setLocalEnd(null); setSelectingStart(true) }
                      else { setLocalStart(weekDays[0]); setLocalEnd(weekDays[weekDays.length - 1]); setSelectingStart(true) }
                    }}
                    style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${isWeekSel ? accentColor : '#bbb'}`, background: '#fff', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isWeekSel && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accentColor }} />}
                  </button>
                </div>
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

          {/* Valider */}
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

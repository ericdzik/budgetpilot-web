/**
 * PeriodDropdown — sélecteur de période partagé (Dashboard + Tracking)
 * Reproduit le design du PeriodSelectorSheet Flutter.
 *
 * Props :
 *   period         — valeur active : 'day' | 'week' | 'month' | 'year' | 'all' | 'custom'
 *   options        — [{ value, label }]  liste des options à afficher
 *   customStart    — Date | null
 *   customEnd      — Date | null
 *   onChange(period, start, end) — appelé quand une sélection est validée
 *   accentColor    — couleur principale (défaut #1E88E5)
 */
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin',
              'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const JOURS = ['LUN','MAR','MER','JEU','VEN','SAM','DIM']

// ─── Calendrier de plage ──────────────────────────────────────────────────────
export function RangeDatePicker({ startDate, endDate, onRangeChange, accentColor }) {
  const today = new Date()
  const [calMonth, setCalMonth] = useState(
    () => startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), 1)
                    : new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectingStart, setSelectingStart] = useState(true)
  const [mode, setMode] = useState('calendar') // 'calendar' | 'month' | 'year'
  const [yearGridBase, setYearGridBase] = useState(() => calMonth.getFullYear())

  const isSameDay = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()

  const isInRange = (d) => {
    if (!startDate || !endDate) return false
    const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const sd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const ed = new Date(endDate.getFullYear(),   endDate.getMonth(),   endDate.getDate())
    return dd >= sd && dd <= ed
  }

  const prevMonth = () =>
    setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))

  const nextMonth = () => {
    const next = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1)
    if (next <= new Date(today.getFullYear(), today.getMonth(), 1))
      setCalMonth(next)
  }

  const isNextDisabled =
    calMonth.getFullYear() === today.getFullYear() &&
    calMonth.getMonth()    >= today.getMonth()

  const handleDayTap = (date) => {
    if (selectingStart) {
      onRangeChange(date, null)
      setSelectingStart(false)
    } else {
      if (date < startDate) {
        onRangeChange(date, null)
        setSelectingStart(false)
      } else {
        onRangeChange(startDate, date)
        setSelectingStart(true)
      }
    }
  }

  const firstDOW = (new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate()
  const rows = Math.ceil((firstDOW + daysInMonth) / 7)

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Navigation — année et mois sur la même ligne, flèches à droite */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '1.5px solid #bbb', marginRight: 8, flexShrink: 0,
        }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Année cliquable — recliquer referme */}
          <button
            onClick={() => setMode(m => m === 'year' ? 'calendar' : 'year')}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 15, fontWeight: 700, color: mode === 'year' ? accentColor : '#1A1A2E',
            }}
          >
            {calMonth.getFullYear()}
          </button>
          <span style={{ fontSize: 15, color: '#ccc', fontWeight: 700 }}>·</span>
          {/* Mois cliquable — recliquer referme */}
          <button
            onClick={() => setMode(m => m === 'month' ? 'calendar' : 'month')}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 15, fontWeight: 700, color: mode === 'month' ? accentColor : '#1A1A2E',
            }}
          >
            {MOIS[calMonth.getMonth()]}
          </button>
        </div>
        {/* Flèches : en mode année/mois elles naviguent la grille, sinon les mois */}
        <button
          onClick={() => {
            if (mode === 'year') setYearGridBase(y => y - 12)
            else if (mode === 'month') setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            else prevMonth()
          }}
          style={{
            width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd',
            background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4,
          }}
        >
          <ChevronLeft size={14} color="#555" />
        </button>
        <button
          onClick={() => {
            if (mode === 'year') setYearGridBase(y => y + 12)
            else if (mode === 'month') setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            else nextMonth()
          }}
          disabled={mode === 'calendar' && isNextDisabled}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: `1px solid ${(mode === 'calendar' && isNextDisabled) ? '#eee' : '#ddd'}`,
            background: '#fff', cursor: (mode === 'calendar' && isNextDisabled) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={14} color={(mode === 'calendar' && isNextDisabled) ? '#ccc' : '#555'} />
        </button>
      </div>

      {/* ── Sélecteur de mois ── */}
      {mode === 'month' && (
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {MOIS.map((m, i) => {
              const isCurrent = i === calMonth.getMonth()
              return (
                <button
                  key={m}
                  onClick={() => {
                    setCalMonth(new Date(calMonth.getFullYear(), i, 1))
                    setMode('calendar')
                  }}
                  style={{
                    padding: '10px 0', borderRadius: 8, border: 'none',
                    backgroundColor: isCurrent ? accentColor : '#f5f5f5',
                    color: isCurrent ? '#fff' : '#333',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {m.slice(0, 3)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Sélecteur d'année ── (navigation via les flèches du header) */}
      {mode === 'year' && (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', textAlign: 'center', marginBottom: 8 }}>
            {yearGridBase} – {yearGridBase + 11}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {Array.from({ length: 12 }, (_, i) => yearGridBase + i).map(year => {
              const isCurrent = year === calMonth.getFullYear()
              return (
                <button
                  key={year}
                  onClick={() => {
                    setCalMonth(new Date(year, calMonth.getMonth(), 1))
                    setMode('calendar')
                  }}
                  style={{
                    padding: '10px 0', borderRadius: 8, border: 'none',
                    backgroundColor: isCurrent ? accentColor : '#f5f5f5',
                    color: isCurrent ? '#fff' : '#333',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {year}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Calendrier ── */}
      {mode !== 'calendar' ? null : (<>
      {/* En-têtes jours */}
      <div style={{ display: 'grid', gridTemplateColumns: '22px repeat(7, 1fr)', marginBottom: 4 }}>
        <div />
        {JOURS.map(j => (
          <div key={j} style={{ textAlign: 'center', fontSize: 9, color: '#aaa', fontWeight: 600 }}>
            {j}
          </div>
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
        const isWeekSel = weekDays.length > 0 && startDate && endDate &&
          isSameDay(weekDays[0], startDate) && isSameDay(weekDays[weekDays.length - 1], endDate)

        return (
          <div key={rowIdx} style={{
            display: 'grid', gridTemplateColumns: '22px repeat(7, 1fr)', marginBottom: 2,
          }}>
            {/* Bouton semaine */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  if (weekDays.length === 0) return
                  if (isWeekSel) { onRangeChange(null, null); setSelectingStart(true) }
                  else { onRangeChange(weekDays[0], weekDays[weekDays.length - 1]); setSelectingStart(true) }
                }}
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: `1.5px solid ${isWeekSel ? accentColor : '#bbb'}`,
                  background: '#fff', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isWeekSel && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accentColor }} />
                )}
              </button>
            </div>

            {/* Cellules */}
            {Array.from({ length: 7 }, (_, col) => {
              const n = rowIdx * 7 + col - firstDOW + 1
              if (n < 1 || n > daysInMonth) return <div key={col} />

              const date    = new Date(calMonth.getFullYear(), calMonth.getMonth(), n)
              const isStart = isSameDay(date, startDate)
              const isEnd   = isSameDay(date, endDate)
              const inRange = isInRange(date)
              const isEdge  = isStart || isEnd

              // Couleur claire dérivée de l'accent
              const lightBg = accentColor === '#E65100'
                ? '#FFE0CC'
                : accentColor === '#1E88E5' ? '#BBDEFB' : '#BBDEFB'

              let bg = 'transparent', fg = '#2C3E50', fw = 400
              if (isEdge)       { bg = accentColor; fg = '#fff'; fw = 700 }
              else if (inRange) { bg = lightBg;     fg = accentColor }

              return (
                <button
                  key={col}
                  onClick={() => handleDayTap(date)}
                  style={{
                    width: 28, height: 28, justifySelf: 'center', alignSelf: 'center',
                    borderRadius: '50%', border: 'none',
                    backgroundColor: bg, color: fg, fontWeight: fw,
                    fontSize: 10, cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.1s',
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
        )
      })}
      </>)}
    </div>
  )
}

// ─── Calendrier simple (une seule date) ───────────────────────────────────────
// Même design que RangeDatePicker, mais sélectionne une date unique.
// Props :
//   value         — Date | null   date sélectionnée
//   onSelect(date)  — appelé au clic sur un jour
//   accentColor   — couleur principale (défaut #1E88E5)
export function SingleDatePicker({ value, onSelect, accentColor }) {
  const today = new Date()
  const [calMonth, setCalMonth] = useState(
    () => value ? new Date(value.getFullYear(), value.getMonth(), 1)
                : new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [mode, setMode] = useState('calendar') // 'calendar' | 'month' | 'year'
  const [yearGridBase, setYearGridBase] = useState(() => calMonth.getFullYear())

  const isSameDay = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()

  const prevMonth = () =>
    setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))

  const nextMonth = () => {
    const next = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1)
    if (next <= new Date(today.getFullYear(), today.getMonth(), 1))
      setCalMonth(next)
  }

  const isNextDisabled =
    calMonth.getFullYear() === today.getFullYear() &&
    calMonth.getMonth()    >= today.getMonth()

  const firstDOW = (new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate()
  const rows = Math.ceil((firstDOW + daysInMonth) / 7)

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Navigation — année et mois sur la même ligne, flèches à droite */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '1.5px solid #bbb', marginRight: 8, flexShrink: 0,
        }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Année cliquable — recliquer referme */}
          <button
            onClick={() => setMode(m => m === 'year' ? 'calendar' : 'year')}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 15, fontWeight: 700, color: mode === 'year' ? accentColor : '#1A1A2E',
            }}
          >
            {calMonth.getFullYear()}
          </button>
          <span style={{ fontSize: 15, color: '#ccc', fontWeight: 700 }}>·</span>
          {/* Mois cliquable — recliquer referme */}
          <button
            onClick={() => setMode(m => m === 'month' ? 'calendar' : 'month')}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 15, fontWeight: 700, color: mode === 'month' ? accentColor : '#1A1A2E',
            }}
          >
            {MOIS[calMonth.getMonth()]}
          </button>
        </div>
        {/* Flèches : en mode année/mois elles naviguent la grille, sinon les mois */}
        <button
          onClick={() => {
            if (mode === 'year') setYearGridBase(y => y - 12)
            else if (mode === 'month') setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            else prevMonth()
          }}
          style={{
            width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd',
            background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4,
          }}
        >
          <ChevronLeft size={14} color="#555" />
        </button>
        <button
          onClick={() => {
            if (mode === 'year') setYearGridBase(y => y + 12)
            else if (mode === 'month') setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            else nextMonth()
          }}
          disabled={mode === 'calendar' && isNextDisabled}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: `1px solid ${(mode === 'calendar' && isNextDisabled) ? '#eee' : '#ddd'}`,
            background: '#fff', cursor: (mode === 'calendar' && isNextDisabled) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={14} color={(mode === 'calendar' && isNextDisabled) ? '#ccc' : '#555'} />
        </button>
      </div>

      {/* ── Sélecteur de mois ── */}
      {mode === 'month' && (
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {MOIS.map((m, i) => {
              const isCurrent = i === calMonth.getMonth()
              return (
                <button
                  key={m}
                  onClick={() => {
                    setCalMonth(new Date(calMonth.getFullYear(), i, 1))
                    setMode('calendar')
                  }}
                  style={{
                    padding: '10px 0', borderRadius: 8, border: 'none',
                    backgroundColor: isCurrent ? accentColor : '#f5f5f5',
                    color: isCurrent ? '#fff' : '#333',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {m.slice(0, 3)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Sélecteur d'année ── */}
      {mode === 'year' && (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', textAlign: 'center', marginBottom: 8 }}>
            {yearGridBase} – {yearGridBase + 11}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {Array.from({ length: 12 }, (_, i) => yearGridBase + i).map(year => {
              const isCurrent = year === calMonth.getFullYear()
              return (
                <button
                  key={year}
                  onClick={() => {
                    setCalMonth(new Date(year, calMonth.getMonth(), 1))
                    setMode('calendar')
                  }}
                  style={{
                    padding: '10px 0', borderRadius: 8, border: 'none',
                    backgroundColor: isCurrent ? accentColor : '#f5f5f5',
                    color: isCurrent ? '#fff' : '#333',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {year}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Calendrier ── */}
      {mode !== 'calendar' ? null : (<>
      {/* En-têtes jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {JOURS.map(j => (
          <div key={j} style={{ textAlign: 'center', fontSize: 9, color: '#aaa', fontWeight: 600 }}>
            {j}
          </div>
        ))}
      </div>

      {/* Grille */}
      {Array.from({ length: rows }, (_, rowIdx) => {
        return (
          <div key={rowIdx} style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2,
          }}>
            {Array.from({ length: 7 }, (_, col) => {
              const n = rowIdx * 7 + col - firstDOW + 1
              if (n < 1 || n > daysInMonth) return <div key={col} />

              const date    = new Date(calMonth.getFullYear(), calMonth.getMonth(), n)
              const isSel   = isSameDay(date, value)
              const isToday = isSameDay(date, today)

              return (
                <button
                  key={col}
                  onClick={() => onSelect(date)}
                  style={{
                    width: 28, height: 28, justifySelf: 'center', alignSelf: 'center',
                    borderRadius: '50%', border: isToday && !isSel ? '1px solid ' + accentColor : 'none',
                    backgroundColor: isSel ? accentColor : 'transparent',
                    color: isSel ? '#fff' : '#2C3E50',
                    fontWeight: isSel ? 700 : 400,
                    fontSize: 10, cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.1s',
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
        )
      })}
      </>)}
    </div>
  )
}

// ─── Dropdown principal ───────────────────────────────────────────────────────
export default function PeriodDropdown({
  period,
  options,
  customStart,
  customEnd,
  onChange,
  accentColor = '#1E88E5',
}) {
  const [open, setOpen]             = useState(false)
  const [view, setView]             = useState('list') // 'list' | 'calendar'
  const [localStart, setLocalStart] = useState(customStart)
  const [localEnd,   setLocalEnd]   = useState(customEnd)
  const ref = useRef(null)

  // Sync si les props changent depuis l'extérieur
  useEffect(() => { setLocalStart(customStart) }, [customStart])
  useEffect(() => { setLocalEnd(customEnd) },     [customEnd])

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false); setView('list')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Label du bouton
  const fmtShort = (d) =>
    d ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}` : ''

  const buttonLabel = (() => {
    if (period === 'custom' && customStart && customEnd)
      return `${fmtShort(customStart)} – ${fmtShort(customEnd)}`
    return options.find(o => o.value === period)?.label || options[0]?.label || ''
  })()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bouton déclencheur */}
      <button
        onClick={() => { setOpen(v => !v); setView('list') }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 20,
          border: '1.5px solid #e0e0e0', fontSize: 15,
          fontWeight: 600, color: '#333',
          backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
        }}
      >
        {buttonLabel}
        <ChevronDown
          size={15}
          color={accentColor}
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {/* Panneau déroulant */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 300,
          backgroundColor: '#fff', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          padding: 8,
          minWidth: view === 'calendar' ? 300 : 200,
        }}>

          {/* ── Vue liste ── */}
          {view === 'list' && (
            <>
              <p style={{
                fontSize: 14, fontWeight: 700, color: '#1A1A2E',
                margin: '4px 8px 8px', textAlign: 'center',
              }}>
                Filtre temps
              </p>

              {options.map(opt => {
                const isActive = period === opt.value
                const isCustom = opt.value === 'custom'
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (isCustom) {
                        setView('calendar')
                        // Ne pas appeler onChange ici — attendre la validation des dates
                      } else {
                        onChange(opt.value, null, null)
                        setOpen(false)
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '10px 16px',
                      background: isActive ? '#E3F2FD' : 'none',
                      border: 'none', borderRadius: 10,
                      fontSize: 15, fontWeight: isActive ? 700 : 500,
                      color: isActive ? accentColor : '#333',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isCustom && <Calendar size={15} color={accentColor} />}
                      {opt.label}
                    </span>
                    {isActive && isCustom && <ChevronDown size={16} color={accentColor} />}
                    {isActive && !isCustom && (
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        backgroundColor: accentColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </>
          )}

          {/* ── Vue calendrier ── */}
          {view === 'calendar' && (
            <div style={{ padding: '8px 4px' }}>
              {/* Header retour */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <button
                  onClick={() => setView('list')}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '1px solid #ddd', background: '#fff',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ChevronLeft size={14} color="#555" />
                </button>
                <span style={{
                  flex: 1, textAlign: 'center',
                  fontSize: 14, fontWeight: 700, color: '#1A1A2E',
                }}>
                  Filtre
                </span>
                <div style={{ width: 28 }} />
              </div>

              <RangeDatePicker
                startDate={localStart}
                endDate={localEnd}
                onRangeChange={(s, e) => { setLocalStart(s); setLocalEnd(e) }}
                accentColor={accentColor}
              />

              {/* Valider */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, padding: '0 4px' }}>
                <button
                  disabled={!localStart}
                  onClick={() => {
                    if (localStart) {
                      // Si pas de date de fin, utiliser la date de début comme fin (même jour)
                      const end = localEnd || localStart
                      onChange('custom', localStart, end)
                      setOpen(false)
                      setView('list')
                    }
                  }}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: localStart ? accentColor : '#e0e0e0',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 600,
                    cursor: localStart ? 'pointer' : 'not-allowed',
                  }}
                >
                  Valider
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

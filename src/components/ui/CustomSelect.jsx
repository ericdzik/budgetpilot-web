import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const PRIMARY = '#1E88E5'

/**
 * Dropdown custom avec le même style que le filtre du dashboard.
 * Props:
 *  - value: valeur sélectionnée
 *  - onChange: (value) => void
 *  - options: [{ value, label }]
 *  - label: string (optionnel, affiché au-dessus)
 *  - required: bool
 *  - placeholder: string
 */
export default function CustomSelect({ value, onChange, options = [], label, required, placeholder = 'Sélectionner' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: '500', color: '#888', marginBottom: '4px', display: 'block' }}>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
      )}

      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid #e0e0e0',
          backgroundColor: '#fff',
          fontSize: '14px', fontWeight: '500', color: '#111',
          cursor: 'pointer', outline: 'none',
          textAlign: 'left',
        }}
      >
        {selectedLabel}
        <ChevronDown
          size={15}
          color={PRIMARY}
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0, marginLeft: '8px' }}
        />
      </button>

      {/* Menu déroulant */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 9999,
          backgroundColor: '#fff', borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          padding: '6px',
          border: '1px solid #f0f0f0',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px',
                background: value === opt.value ? '#e8f4ff' : 'none',
                border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: value === opt.value ? '700' : '500',
                color: value === opt.value ? PRIMARY : '#333',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              {opt.label}
              {value === opt.value && (
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: PRIMARY,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'

// ─── Liste des pays avec indicatifs et drapeaux emoji ─────────────────────────

const COUNTRIES = [
  { code: 'TG', name: 'Togo',                  dial: '228', flag: '🇹🇬', hint: '90 00 00 00' },
  { code: 'BJ', name: 'Bénin',                 dial: '229', flag: '🇧🇯', hint: '90 00 00 00' },
  { code: 'CI', name: "Côte d'Ivoire",         dial: '225', flag: '🇨🇮', hint: '07 00 00 00 00' },
  { code: 'SN', name: 'Sénégal',               dial: '221', flag: '🇸🇳', hint: '77 000 00 00' },
  { code: 'ML', name: 'Mali',                  dial: '223', flag: '🇲🇱', hint: '70 00 00 00' },
  { code: 'BF', name: 'Burkina Faso',          dial: '226', flag: '🇧🇫', hint: '70 00 00 00' },
  { code: 'GH', name: 'Ghana',                 dial: '233', flag: '🇬🇭', hint: '024 000 0000' },
  { code: 'NG', name: 'Nigeria',               dial: '234', flag: '🇳🇬', hint: '0801 000 0000' },
  { code: 'CM', name: 'Cameroun',              dial: '237', flag: '🇨🇲', hint: '6 00 00 00 00' },
  { code: 'GA', name: 'Gabon',                 dial: '241', flag: '🇬🇦', hint: '06 00 00 00' },
  { code: 'CG', name: 'Congo',                 dial: '242', flag: '🇨🇬', hint: '06 000 0000' },
  { code: 'CD', name: 'RD Congo',              dial: '243', flag: '🇨🇩', hint: '081 000 0000' },
  { code: 'MA', name: 'Maroc',                 dial: '212', flag: '🇲🇦', hint: '06 00 00 00 00' },
  { code: 'DZ', name: 'Algérie',               dial: '213', flag: '🇩🇿', hint: '0551 00 00 00' },
  { code: 'TN', name: 'Tunisie',               dial: '216', flag: '🇹🇳', hint: '20 000 000' },
  { code: 'FR', name: 'France',                dial: '33',  flag: '🇫🇷', hint: '06 00 00 00 00' },
  { code: 'BE', name: 'Belgique',              dial: '32',  flag: '🇧🇪', hint: '0470 00 00 00' },
  { code: 'DE', name: 'Allemagne',             dial: '49',  flag: '🇩🇪', hint: '0151 00000000' },
  { code: 'GB', name: 'Royaume-Uni',           dial: '44',  flag: '🇬🇧', hint: '07700 000000' },
  { code: 'US', name: 'États-Unis',            dial: '1',   flag: '🇺🇸', hint: '(201) 000-0000' },
]

// ─── Composant PhoneInputField ────────────────────────────────────────────────

export default function PhoneInputField({
  label = 'Téléphone',
  value = '',
  onChange,
  initialCountry = 'TG',
  disabled = false,
}) {
  const [country, setCountry] = useState(
    COUNTRIES.find(c => c.code === initialCountry) || COUNTRIES[0]
  )
  const [localNumber, setLocalNumber] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const searchRef = useRef(null)

  // Initialiser le numéro local depuis la valeur passée
  useEffect(() => {
    if (!value) return
    // Si le numéro commence par +, extraire l'indicatif
    if (value.startsWith('+')) {
      const matched = COUNTRIES.find(c => value.startsWith(`+${c.dial}`))
      if (matched) {
        setCountry(matched)
        setLocalNumber(value.slice(matched.dial.length + 1))
        return
      }
    }
    setLocalNumber(value)
  }, [])

  // Focus sur la recherche quand le picker s'ouvre
  useEffect(() => {
    if (showPicker && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [showPicker])

  const handleLocalChange = (val) => {
    setLocalNumber(val)
    onChange?.(`+${country.dial}${val.trim()}`)
  }

  const handleCountrySelect = (c) => {
    setCountry(c)
    setSearch('')
    setShowPicker(false)
    onChange?.(`+${c.dial}${localNumber.trim()}`)
  }

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>{label}</label>
      )}

      {/* Champ téléphone */}
      <div style={{
        display: 'flex', alignItems: 'center',
        border: focused ? '2px solid #1E88E5' : '1.5px solid #e0e0e0',
        borderRadius: '8px', backgroundColor: '#fff',
        overflow: 'hidden', transition: 'border 0.15s',
      }}>
        {/* Bouton pays */}
        <button
          type="button"
          onClick={() => !disabled && setShowPicker(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '10px 8px 10px 10px',
            backgroundColor: 'transparent', border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            flexShrink: 0,
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            border: '1.5px solid #90CAF9', borderRadius: '20px',
            padding: '4px 8px',
          }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{country.flag}</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1E88E5' }}>
              +{country.dial}
            </span>
            {!disabled && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
          </div>
        </button>

        {/* Séparateur */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#e0e0e0', flexShrink: 0 }} />

        {/* Champ numéro */}
        <input
          type="tel"
          value={localNumber}
          onChange={e => handleLocalChange(e.target.value)}
          placeholder={country.hint}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, padding: '11px 12px',
            border: 'none', outline: 'none',
            fontSize: '15px', fontWeight: '500', color: '#111',
            backgroundColor: 'transparent',
          }}
        />
      </div>

      {/* Modal de sélection de pays */}
      {showPicker && (
        <>
          {/* Overlay */}
          <div
            onClick={() => { setShowPicker(false); setSearch('') }}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />

          {/* Modal centrée */}
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: '#fff',
            borderRadius: '20px',
            width: '380px',
            maxHeight: '70vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: '600', color: '#111', margin: '16px 0 12px' }}>
              Choisir un pays
            </p>

            {/* Recherche */}
            <div style={{ padding: '0 16px 12px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: '#f5f5f5', borderRadius: '12px',
                padding: '10px 14px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '14px', color: '#111',
                  }}
                />
              </div>
            </div>

            {/* Liste */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    width: '100%', padding: '12px 20px',
                    backgroundColor: c.code === country.code ? '#e3f2fd' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = c.code === country.code ? '#e3f2fd' : 'transparent'}
                >
                  <span style={{ fontSize: '24px', lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#111', textAlign: 'left' }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E88E5' }}>
                    +{c.dial}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

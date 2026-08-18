import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { X, Eye, EyeOff, User, Lock, Phone, Mail, Gift, ChevronDown } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import GoogleAuthButton from '../../components/ui/GoogleAuthButton'

// ─── Table indicatif → devise (même logique que le mobile) ─────────────────
const DIAL_TO_CURRENCY = {
  '228': 'XOF', '229': 'XOF', '225': 'XOF', '221': 'XOF',
  '223': 'XOF', '226': 'XOF', '227': 'XOF', '224': 'GNF',
  '237': 'XAF', '241': 'XAF', '242': 'XAF', '236': 'XAF',
  '235': 'XAF', '240': 'XAF', '243': 'CDF', '234': 'NGN',
  '233': 'GHS', '212': 'MAD', '213': 'DZD', '216': 'TND',
  '20':  'EGP', '251': 'ETB', '254': 'KES', '255': 'TZS',
  '256': 'UGX', '27':  'ZAR', '260': 'ZMW', '263': 'ZWL',
  '33':  'EUR', '32':  'EUR', '352': 'EUR', '41':  'CHF',
  '34':  'EUR', '39':  'EUR', '49':  'EUR', '31':  'EUR',
  '351': 'EUR', '30':  'EUR', '43':  'EUR', '358': 'EUR',
  '1':   'USD', '44':  'GBP', '61':  'AUD', '64':  'NZD',
  '81':  'JPY', '82':  'KRW', '86':  'CNY', '91':  'INR',
  '55':  'BRL', '52':  'MXN', '7':   'RUB', '966': 'SAR',
  '971': 'AED', '972': 'ILS', '90':  'TRY', '62':  'IDR',
  '60':  'MYR', '66':  'THB', '65':  'SGD', '63':  'PHP',
  '84':  'VND', '880': 'BDT', '92':  'PKR', '48':  'PLN',
  '46':  'SEK', '47':  'NOK', '45':  'DKK',
}

function getCurrencyFromPhone(phone) {
  // Extraire l'indicatif — supporte +228..., 00228..., 228...
  let digits = phone.replace(/\D/g, '')
  if (phone.startsWith('+')) digits = phone.slice(1).replace(/\D/g, '')
  else if (digits.startsWith('00')) digits = digits.slice(2)

  if (!digits) return 'XOF'

  // Trier par longueur décroissante pour matcher le plus précis en premier (ex: 228 avant 2)
  const keys = Object.keys(DIAL_TO_CURRENCY).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (digits.startsWith(key)) return DIAL_TO_CURRENCY[key]
  }
  return 'XOF' // Défaut Franc CFA
}

// ─── Table pays : drapeau + indicatif (ordre alphabétique, Afrique en premier) ─
const COUNTRIES = [
  // ── Afrique (BCEAO/XOF) ──
  { flag: '🇹🇬', name: 'Togo',               dial: '228' },
  { flag: '🇧🇯', name: 'Bénin',              dial: '229' },
  { flag: '🇨🇮', name: "Côte d'Ivoire",      dial: '225' },
  { flag: '🇸🇳', name: 'Sénégal',            dial: '221' },
  { flag: '🇲🇱', name: 'Mali',               dial: '223' },
  { flag: '🇧🇫', name: 'Burkina Faso',       dial: '226' },
  { flag: '🇳🇪', name: 'Niger',              dial: '227' },
  // ── Afrique (XAF) ──
  { flag: '🇨🇲', name: 'Cameroun',           dial: '237' },
  { flag: '🇬🇦', name: 'Gabon',              dial: '241' },
  { flag: '🇨🇬', name: 'Congo',              dial: '242' },
  { flag: '🇨🇫', name: 'Centrafrique',       dial: '236' },
  { flag: '🇹🇩', name: 'Tchad',              dial: '235' },
  { flag: '🇬🇶', name: 'Guinée Équatoriale', dial: '240' },
  // ── Afrique (autres) ──
  { flag: '🇬🇳', name: 'Guinée',             dial: '224' },
  { flag: '🇨🇩', name: 'RD Congo',           dial: '243' },
  { flag: '🇳🇬', name: 'Nigeria',            dial: '234' },
  { flag: '🇬🇭', name: 'Ghana',              dial: '233' },
  { flag: '🇲🇦', name: 'Maroc',              dial: '212' },
  { flag: '🇩🇿', name: 'Algérie',            dial: '213' },
  { flag: '🇹🇳', name: 'Tunisie',            dial: '216' },
  { flag: '🇪🇬', name: 'Égypte',             dial: '20'  },
  { flag: '🇪🇹', name: 'Éthiopie',           dial: '251' },
  { code: 'TG', name: 'Togo',               dial: '228' },
  { code: 'BJ', name: 'Bénin',              dial: '229' },
  { code: 'CI', name: "Côte d'Ivoire",      dial: '225' },
  { code: 'SN', name: 'Sénégal',            dial: '221' },
  { code: 'ML', name: 'Mali',               dial: '223' },
  { code: 'BF', name: 'Burkina Faso',       dial: '226' },
  { code: 'NE', name: 'Niger',              dial: '227' },
  // ── Afrique (XAF) ──
  { code: 'CM', name: 'Cameroun',           dial: '237' },
  { code: 'GA', name: 'Gabon',              dial: '241' },
  { code: 'CG', name: 'Congo',              dial: '242' },
  { code: 'CF', name: 'Centrafrique',       dial: '236' },
  { code: 'TD', name: 'Tchad',              dial: '235' },
  { code: 'GQ', name: 'Guinée Équatoriale', dial: '240' },
  // ── Afrique (autres) ──
  { code: 'GN', name: 'Guinée',             dial: '224' },
  { code: 'CD', name: 'RD Congo',           dial: '243' },
  { code: 'NG', name: 'Nigeria',            dial: '234' },
  { code: 'GH', name: 'Ghana',              dial: '233' },
  { code: 'MA', name: 'Maroc',              dial: '212' },
  { code: 'DZ', name: 'Algérie',            dial: '213' },
  { code: 'TN', name: 'Tunisie',            dial: '216' },
  { code: 'EG', name: 'Égypte',             dial: '20'  },
  { code: 'ET', name: 'Éthiopie',           dial: '251' },
  { code: 'KE', name: 'Kenya',              dial: '254' },
  { code: 'TZ', name: 'Tanzanie',           dial: '255' },
  { code: 'UG', name: 'Ouganda',            dial: '256' },
  { code: 'ZA', name: 'Afrique du Sud',     dial: '27'  },
  { code: 'ZM', name: 'Zambie',             dial: '260' },
  // ── Europe ──
  { code: 'FR', name: 'France',             dial: '33'  },
  { code: 'BE', name: 'Belgique',           dial: '32'  },
  { code: 'CH', name: 'Suisse',             dial: '41'  },
  { code: 'DE', name: 'Allemagne',          dial: '49'  },
  { code: 'GB', name: 'Royaume-Uni',        dial: '44'  },
  { code: 'PT', name: 'Portugal',           dial: '351' },
  { code: 'ES', name: 'Espagne',            dial: '34'  },
  { code: 'IT', name: 'Italie',             dial: '39'  },
  // ── Amériques ──
  { code: 'US', name: 'États-Unis',         dial: '1'   },
  { code: 'CA', name: 'Canada',             dial: '1'   },
  { code: 'BR', name: 'Brésil',             dial: '55'  },
  // ── Moyen-Orient ──
  { code: 'SA', name: 'Arabie Saoudite',    dial: '966' },
  { code: 'AE', name: 'Émirats Arabes',     dial: '971' },
]

// Couleurs de badge par code pays (fond + texte)
const COUNTRY_COLORS = {
  TG:'#006A4E',BJ:'#008751',CI:'#F77F00',SN:'#00853F',ML:'#009A00',BF:'#EF2B2D',NE:'#E05206',
  CM:'#007A5E',GA:'#009E60',CG:'#009543',CF:'#003082',TD:'#002664',GQ:'#3E9A00',
  GN:'#CE1126',CD:'#007FFF',NG:'#008751',GH:'#006B3F',MA:'#C1272D',DZ:'#006233',TN:'#E70013',
  EG:'#CE1126',ET:'#078930',KE:'#006600',TZ:'#1EB53A',UG:'#000000',ZA:'#007A4D',ZM:'#198A00',
  FR:'#002395',BE:'#000000',CH:'#FF0000',DE:'#000000',GB:'#012169',PT:'#006600',ES:'#AA151B',IT:'#009246',
  US:'#3C3B6E',CA:'#FF0000',BR:'#009C3B',SA:'#006C35',AE:'#00732F',
}

// ─── Devise avec symbole ──────────────────────────────────────────────────────
const CURRENCY_LIST = [
  { code: 'XOF', label: 'Franc CFA BCEAO', symbol: 'FCFA' },
  { code: 'XAF', label: 'Franc CFA BEAC',  symbol: 'FCFA' },
  { code: 'EUR', label: 'Euro',             symbol: '€'    },
  { code: 'USD', label: 'Dollar US',        symbol: '$'    },
  { code: 'GBP', label: 'Livre sterling',   symbol: '£'    },
  { code: 'GHS', label: 'Cedi ghanéen',     symbol: '₵'    },
  { code: 'NGN', label: 'Naira nigérian',   symbol: '₦'    },
  { code: 'MAD', label: 'Dirham marocain',  symbol: 'DH'   },
  { code: 'DZD', label: 'Dinar algérien',   symbol: 'DA'   },
  { code: 'TND', label: 'Dinar tunisien',   symbol: 'DT'   },
  { code: 'KES', label: 'Shilling kényan',  symbol: 'KSh'  },
  { code: 'ZAR', label: 'Rand sud-africain',symbol: 'R'    },
  { code: 'CHF', label: 'Franc suisse',     symbol: 'Fr'   },
  { code: 'CAD', label: 'Dollar canadien',  symbol: 'CA$'  },
  { code: 'GNF', label: 'Franc guinéen',    symbol: 'FG'   },
  { code: 'CDF', label: 'Franc congolais',  symbol: 'FC'   },
  { code: 'EGP', label: 'Livre égyptienne', symbol: 'E£'   },
  { code: 'ETB', label: 'Birr éthiopien',   symbol: 'Br'   },
  { code: 'SAR', label: 'Riyal saoudien',   symbol: '﷼'    },
  { code: 'AED', label: 'Dirham émirien',   symbol: 'AED'  },
]

// ─── Composants partagés ────────────────────────────────────────────────────

/** Badge code pays 2 lettres */
function CountryBadge({ code, size = 28 }) {
  const bg = COUNTRY_COLORS[code] || '#1E88E5'
  return (
    <div style={{
      width: size, height: size, borderRadius: '6px',
      backgroundColor: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.38, fontWeight: '700', color: '#fff', letterSpacing: '0.5px' }}>
        {code}
      </span>
    </div>
  )
}

/** Sélecteur de pays avec badge code + indicatif */
function CountryPicker({ dialCode, countryCode, onSelect }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Bouton */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          height: '100%', minHeight: '50px',
          padding: '0 16px',
          backgroundColor: '#fff', border: 'none',
          borderRadius: '25px', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <CountryBadge code={countryCode || 'TG'} />
        <ChevronDown size={14} color="#9e9e9e" />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: '270px', backgroundColor: '#fff',
          borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 200, overflow: 'hidden',
        }}>
          {/* Recherche */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pays ou indicatif..."
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #e0e0e0', borderRadius: '20px',
                padding: '8px 14px', fontSize: '13px', outline: 'none',
              }}
            />
          </div>
          {/* Liste */}
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {filtered.map((c, i) => {
              const selected = c.code === countryCode
              return (
                <div
                  key={i}
                  onClick={() => { onSelect(c.dial, c.code); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', cursor: 'pointer',
                    backgroundColor: selected ? '#f0f7ff' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = '#fafafa' }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <CountryBadge code={c.code} size={26} />
                  <span style={{ fontSize: '13px', color: '#111', flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: '12px', color: '#888', flexShrink: 0, fontWeight: '600' }}>+{c.dial}</span>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                Aucun résultat
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Sélecteur de devise — même style que CountryPicker */
function CurrencyPicker({ value, onChange: onChangeProp }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = CURRENCY_LIST.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  )

  const selected = CURRENCY_LIST.find(c => c.code === value) || CURRENCY_LIST[0]

  return (
    <div style={{ position: 'relative' }}>
      {/* Bouton */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          minHeight: '50px', padding: '0 20px',
          backgroundColor: '#fff', border: 'none',
          borderRadius: '25px', cursor: 'pointer',
        }}
      >
        {/* Badge symbole */}
        <div style={{
          width: 36, height: 28, borderRadius: '6px',
          backgroundColor: '#1E88E5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>
            {selected.symbol.slice(0, 4)}
          </span>
        </div>
        <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', color: '#111', fontWeight: '500' }}>
          {selected.label} ({selected.code})
        </span>
        <ChevronDown size={14} color="#9e9e9e" style={{ flexShrink: 0 }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          backgroundColor: '#fff',
          borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 200, overflow: 'hidden',
        }}>
          {/* Recherche */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Devise ou code..."
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #e0e0e0', borderRadius: '20px',
                padding: '8px 14px', fontSize: '13px', outline: 'none',
              }}
            />
          </div>
          {/* Liste */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.map((c) => {
              const isSelected = c.code === value
              return (
                <div
                  key={c.code}
                  onClick={() => { onChangeProp(c.code); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', cursor: 'pointer',
                    backgroundColor: isSelected ? '#f0f7ff' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#fafafa' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{
                    width: 36, height: 26, borderRadius: '6px',
                    backgroundColor: isSelected ? '#1E88E5' : '#e8f0fe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: isSelected ? '#fff' : '#1E88E5' }}>
                      {c.symbol.slice(0, 4)}
                    </span>
                  </div>
                  <span style={{ flex: 1, fontSize: '13px', color: '#111', fontWeight: isSelected ? '600' : '400' }}>
                    {c.label}
                  </span>
                  <span style={{ fontSize: '12px', color: '#888', flexShrink: 0, fontWeight: '600' }}>
                    {c.code}
                  </span>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                Aucun résultat
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Champ blanc arrondi avec icône, focus bleu, croix rouge */
function Field({ label, value, onChange, type = 'text', placeholder, error, icon: Icon }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '7px' }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `2px solid ${error ? '#FF1744' : focused ? '#1E88E5' : '#e0e0e0'}`,
        borderRadius: '25px', padding: '0 16px',
        backgroundColor: '#fff', transition: 'border-color 0.2s',
      }}>
        {/* Icône correspondante */}
        {Icon && <Icon size={16} color="#1E88E5" style={{ flexShrink: 0, marginRight: '10px' }} />}
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#111', fontWeight: '500', padding: '13px 0', backgroundColor: 'transparent' }}
        />
        {isPassword && value && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#90CAF9', display: 'flex', padding: '2px' }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {!isPassword && value && (
          <button type="button" onClick={() => onChange('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF1744', display: 'flex', padding: '2px' }}>
            <X size={16} />
          </button>
        )}
      </div>
      {error && <p style={{ color: '#FF1744', fontSize: '12px', marginTop: '5px', paddingLeft: '16px' }}>{error}</p>}
    </div>
  )
}

/** Champ blanc sur fond bleu avec icône */
function FieldBlue({ label, value, onChange, type = 'text', placeholder, error, icon: Icon }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '400', color: 'rgba(255,255,255,0.8)', marginBottom: '7px' }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `2px solid ${error ? '#FF1744' : 'transparent'}`,
        borderRadius: '25px', padding: '0 20px',
        backgroundColor: '#fff', transition: 'border-color 0.2s',
      }}>
        {Icon && <Icon size={16} color="#1E88E5" style={{ flexShrink: 0, marginRight: '10px' }} />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: '14px', color: '#111', fontWeight: '500',
            padding: '14px 0', backgroundColor: 'transparent',
          }}
        />
      </div>
      {error && <p style={{ color: '#FF8A65', fontSize: '12px', marginTop: '5px', paddingLeft: '16px' }}>{error}</p>}
    </div>
  )
}

/** Bouton principal bleu arrondi */
function BtnPrimary({ children, onClick, loading, type = 'button', fullWidth = true }) {
  return (
    <button type={type} onClick={onClick} disabled={loading}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '14px 32px', backgroundColor: loading ? '#90CAF9' : '#1E88E5',
        color: '#fff', border: 'none', borderRadius: '25px',
        fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s', letterSpacing: '0.3px',
      }}>
      {loading ? 'Chargement...' : children}
    </button>
  )
}

/** Bouton blanc semi-transparent (fond bleu) */
function BtnWhiteGhost({ children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: '14px 32px', backgroundColor: 'rgba(255,255,255,0.25)',
        color: '#fff', border: 'none', borderRadius: '25px',
        fontSize: '15px', fontWeight: '700', cursor: 'pointer',
      }}>
      {children}
    </button>
  )
}

/** Bouton outline blanc (fond bleu) */
function BtnOutlineWhite({ children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        flex: 1, padding: '14px', backgroundColor: 'transparent',
        color: '#fff', border: '2px solid #fff', borderRadius: '25px',
        fontSize: '15px', fontWeight: '700', cursor: 'pointer',
      }}>
      {children}
    </button>
  )
}

/** Séparateur "Ou alors" */
function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0' }}>
      <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
      <span style={{ padding: '0 14px', fontSize: '13px', color: '#9e9e9e' }}>Ou alors</span>
      <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
    </div>
  )
}

// ─── Étape 1 : Identifiant + MDP + Confirmation ──────────────────────────────

function Step1({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!data.name || data.name.length < 3) e.name = 'Minimum 3 caractères'
    if (!data.password || data.password.length < 6) e.password = 'Minimum 6 caractères'
    if (data.password !== data.password_confirmation) e.password_confirmation = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validate()) onNext() }

  return (
    /* Carte blanche sur fond bleu — même layout que l'image */
    <div style={{ padding: '4px 0' }}>
      <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '28px' }}>
        Inscrivez-vous
      </h2>

      <Field label="Identifiant" value={data.name} onChange={v => onChange('name', v)}
        placeholder="Nom de l'utilisateur" error={errors.name} icon={User} />
      <Field label="Mot de passe" value={data.password} onChange={v => onChange('password', v)}
        type="password" placeholder="Mot de passe" error={errors.password} icon={Lock} />
      <Field label="Confirmer le mot de passe" value={data.password_confirmation}
        onChange={v => onChange('password_confirmation', v)}
        type="password" placeholder="Confirmer mot de passe" error={errors.password_confirmation} icon={Lock} />

      <BtnPrimary onClick={handleNext}>Suivant</BtnPrimary>

      <Divider />

      {/* Bouton Google */}
      <GoogleAuthButton label="S'inscrire avec Google" style={{ marginBottom: '16px' }} />

      <p style={{ textAlign: 'center', fontSize: '13px', color: '#757575', marginTop: '8px' }}>
        Déjà un compte ?{' '}
        <Link to="/login" style={{ color: '#1E88E5', fontWeight: '600', textDecoration: 'none' }}>
          Se connecter
        </Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        <Link to="/terms" style={{ fontSize: '12px', color: '#9e9e9e', textDecoration: 'underline' }}>
          Termes & Conditions
        </Link>
      </p>
    </div>
  )
}

// ─── Étape 2 : Page complète fusionnée (avatar + infos + contacts + CGU) ─────

function Step2({ data, onChange, onBatchChange, onSubmit, onBack, loading }) {
  const [errors, setErrors] = useState({})
  const [acceptTerms, setAcceptTerms] = useState(false)

  const avatars = [
    { id: 'male1',   label: 'Homme', src: '/avatars/male_1.jpg' },
    { id: 'female1', label: 'Femme', src: '/avatars/female_1.jpg' },
  ]

  const validate = () => {
    const e = {}
    if (!data.lastName)  e.lastName  = 'Requis'
    if (!data.firstName) e.firstName = 'Requis'
    if (!data.localPhone || data.localPhone.length < 6) e.phone = 'Numéro requis (min 6 chiffres)'
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Email invalide'
    if (!acceptTerms)    e.terms     = 'Vous devez accepter les CGU'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => { if (validate()) onSubmit() }

  return (
    <div style={{ minHeight: '142.86vh', backgroundColor: '#1E88E5', position: 'relative', overflowX: 'hidden' }}>

      {/* ── Décorations SVG aux coins ── */}
      {/* Haut gauche */}
      <img src="/splash-illu-2.svg" alt="" style={{
        position: 'fixed', top: '80px', left: '-80px',
        width: '320px', opacity: 0.9, pointerEvents: 'none', zIndex: 0,
        transform: 'rotate(-80deg)',
      }} />
      {/* Haut droite */}
      <img src="/splash-illu-3.svg" alt="" style={{
        position: 'fixed', top: '30px', right: '40px',
        width: '170px', opacity: 1.55, pointerEvents: 'none', zIndex: 0,
        transform: 'rotate(10deg)',
      }} />
      {/* Bas droite */}
      <img src="/splash-illu-1.svg" alt="" style={{
        position: 'fixed', bottom: '-20px', right: '-20px',
        width: '140px', opacity: 1.55, pointerEvents: 'none', zIndex: 0,
        transform: 'rotate(-15deg)',
      }} />

      {/* ── Contenu scrollable centré ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '520px', margin: '0 auto',
        padding: '48px 32px 60px',
      }}>

        {/* ── Section Avatar ── */}
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', lineHeight: 1.2, marginBottom: '20px' }}>
          Choisissez<br />votre Avatar
        </h2>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          {avatars.map(av => {
            const selected = data.avatar_id === av.id
            return (
              <div key={av.id} onClick={() => onChange('avatar_id', av.id)}
                style={{
                  flex: 1, height: '280px', borderRadius: '18px',
                  border: `${selected ? 4 : 2}px solid ${selected ? '#fff' : 'rgba(255,255,255,0.35)'}`,
                  overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  boxShadow: selected ? '0 0 20px rgba(255,255,255,0.5)' : '0 2px 8px rgba(0,0,0,0.15)',
                  backgroundColor: '#fff',
                }}>
                <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#1E88E5' }}>
                  {av.label}
                </div>
                <img src={av.src} alt={av.label}
                  style={{ width: '100%', height: 'calc(100% - 32px)', objectFit: 'cover' }} />
                {selected && (
                  <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'rgba(30,136,229,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '20px', color: '#1E88E5' }}>✓</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Section Informations Générales ── */}
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', lineHeight: 1.2, marginBottom: '20px' }}>
          Informations<br />Générales
        </h2>

        <FieldBlue label="Nom" value={data.lastName} onChange={v => onChange('lastName', v)}
          placeholder="Votre nom" error={errors.lastName} icon={User} />
        <FieldBlue label="Prénom" value={data.firstName} onChange={v => onChange('firstName', v)}
          placeholder="Votre prénom" error={errors.firstName} icon={User} />

        {/* Téléphone avec sélecteur de pays */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '400', color: 'rgba(255,255,255,0.8)', marginBottom: '7px' }}>
            Téléphone
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            {/* Sélecteur pays */}
            <CountryPicker
              dialCode={data.dialCode || '228'}
              countryCode={data.countryCode || 'TG'}
              onSelect={(dial, code) => {
                const full = '+' + dial + (data.localPhone || '')
                onBatchChange({
                  dialCode: dial,
                  countryCode: code,
                  phone: full,
                  currency: DIAL_TO_CURRENCY[dial] || 'XOF',
                })
              }}
            />
            {/* Numéro local */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              borderRadius: '25px', padding: '0 20px',
              backgroundColor: '#fff',
            }}>
              <span style={{ fontSize: '14px', color: '#9e9e9e', marginRight: '6px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                +{data.dialCode || '228'}
              </span>
              <input
                type="tel"
                value={data.localPhone || ''}
                onChange={e => {
                  const local = e.target.value.replace(/\D/g, '')
                  onChange('localPhone', local)
                  const full = '+' + (data.dialCode || '228') + local
                  onChange('phone', full)
                }}
                placeholder="90123456"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: '14px', color: '#111', fontWeight: '500',
                  padding: '14px 0', backgroundColor: 'transparent',
                }}
              />
            </div>
          </div>
          {errors.phone && <p style={{ color: '#FF8A65', fontSize: '12px', marginTop: '5px', paddingLeft: '16px' }}>{errors.phone}</p>}
        </div>

        {/* Devise — détectée automatiquement depuis l'indicatif, modifiable */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '400', color: 'rgba(255,255,255,0.8)', marginBottom: '7px' }}>
            Devise <span style={{ fontSize: '11px', opacity: 0.7 }}>(détectée automatiquement)</span>
          </label>
          <CurrencyPicker
            value={data.currency || 'XOF'}
            onChange={v => onChange('currency', v)}
          />
        </div>

        <FieldBlue label="E-mail" value={data.email} onChange={v => onChange('email', v)}
          type="email" placeholder="Votre adresse mail" error={errors.email} icon={Mail} />

        {/* Code de parrainage (optionnel) */}
        <FieldBlue
          label="Code de parrainage (optionnel)"
          value={data.referral_code || ''}
          onChange={v => onChange('referral_code', v.toUpperCase().slice(0, 8))}
          placeholder="Ex : AB3K9XZ2"
          icon={Gift}
        />

        {/* ── Section CGU ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Conditions générales</span>
            <Link to="/terms" style={{ fontSize: '13px', color: '#f5f0eeff', fontWeight: '600', textDecoration: 'underline' }}>
              Lire les termes
            </Link>
          </div>
          <label onClick={() => setAcceptTerms(v => !v)} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <div
              style={{
                width: '20px', height: '20px', flexShrink: 0, marginTop: '2px',
                border: '2px solid rgba(255,255,255,0.8)', borderRadius: '4px',
                backgroundColor: acceptTerms ? '#fff' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {acceptTerms && <span style={{ color: '#1E88E5', fontSize: '13px', fontWeight: '700' }}>✓</span>}
            </div>
            <span style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5 }}>
              J'accepte les conditions générales d'utilisation
            </span>
          </label>
          {errors.terms && <p style={{ color: '#FF8A65', fontSize: '12px', marginTop: '6px' }}>{errors.terms}</p>}
        </div>

        {/* ── Bouton Terminer ── */}
        <button type="button" onClick={handleSubmit} disabled={loading}
          style={{
            width: '100%', padding: '15px',
            backgroundColor: 'rgba(255,255,255,0.25)',
            color: '#fff', border: 'none', borderRadius: '25px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.3px',
          }}>
          {loading ? 'Inscription...' : 'Terminer'}
        </button>
      </div>

      {/* ── Logo bas gauche ── */}
      <div style={{
        position: 'fixed', bottom: '24px', left: '28px',
        display: 'flex', alignItems: 'flex-end', gap: '10px', zIndex: 1,
      }}>
        <img src="/logo-b.svg" alt="Budget Pilot" style={{ width: '32px', height: '42px', opacity: 0.9 }} />
        <span style={{ color: '#fff', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: 1, paddingBottom: '2px', opacity: 0.9 }}>
          Pilot
        </span>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState(() => {
    // Pré-remplir le code depuis ?ref= dans l'URL
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get('ref') || ''
    return {
      name: '', password: '', password_confirmation: '',
      firstName: '', lastName: '',
      avatar_id: 'male1',
      phone: '', email: '', activity: '',
      currency: 'XOF',
      dialCode: '228',
      countryCode: 'TG',
      localPhone: '',
      referral_code: refCode.toUpperCase(),
      // Données Google (remplies si redirection depuis le bouton Google)
      google_id: null,
      avatar_url_google: null,
    }
  })

  // Pré-remplir les champs depuis les données Google si l'utilisateur vient du flux Google
  useEffect(() => {
    const googleData = location.state?.googleData
    if (!googleData) return

    const nameParts = (googleData.fullName || '').trim().split(' ')
    const username = (googleData.email || '').split('@')[0]
    const tempPassword = `Google@${Date.now()}`

    setForm(p => ({
      ...p,
      google_id: googleData.google_id || null,
      avatar_url_google: googleData.avatar_url || null,
      email: googleData.email || '',
      firstName: googleData.firstName || '',
      lastName: googleData.lastName || '',
      // Générer un identifiant depuis l'email et un mot de passe temporaire
      name: username,
      password: tempPassword,
      password_confirmation: tempPassword,
    }))

    // Passer directement à l'étape 2 (infos personnelles)
    setStep(2)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))
  const setBatch = (updates) => setForm(p => ({ ...p, ...updates }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const isFemalAvatar = form.avatar_id?.startsWith('female')
      const avatarFileName = isFemalAvatar ? 'female_1.jpg' : 'male_1.jpg'

      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
        activity: form.activity,
        avatar_id: form.avatar_id,
        gender: isFemalAvatar ? 'female' : 'male',
        avatar_url: form.avatar_url_google || `assets/images/avatars/${avatarFileName}`,
        currency: form.currency || 'XOF',
      }
      if (form.google_id) {
        payload.google_id = form.google_id
        payload.provider = 'google'
      }
      if (form.referral_code?.trim()) {
        payload.referral_code = form.referral_code.trim().toUpperCase()
      }
      await register(payload)
      toast.success('Compte créé ! 1 mois Pro offert 🎉')
      navigate('/dashboard')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const first = Object.values(apiErrors)[0]?.[0]
        toast.error(first || "Erreur lors de l'inscription")
      } else {
        toast.error(err.response?.data?.message || "Erreur lors de l'inscription")
      }
      // Revenir à l'étape concernée si erreur sur champs étape 1
      if (apiErrors?.name || apiErrors?.password) setStep(1)
      else if (apiErrors?.phone || apiErrors?.email) setStep(4)
    } finally {
      setLoading(false)
    }
  }

  // Étape 2 — page complète fusionnée (plein écran bleu)
  if (step === 2) return <Step2 data={form} onChange={set} onBatchChange={setBatch} onSubmit={handleSubmit} onBack={() => setStep(1)} loading={loading} />

  // Étape 1 — fond bleu + carte blanche centrée
  return (
    <div style={{
      minHeight: '142.86vh', backgroundColor: '#1E88E5',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '32px' }}>
        <img src="/logo-b.svg" alt="Budget Pilot" style={{ width: '44px', height: '58px' }} />
        <span style={{ color: '#fff', fontSize: '42px', fontWeight: '700', fontFamily: "'Inter', sans-serif", letterSpacing: '-1px', lineHeight: 1, paddingBottom: '3px' }}>
          Pilot
        </span>
      </div>
      {/* Carte blanche */}
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px', padding: '36px 32px 28px',
        width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <Step1 data={form} onChange={set} onNext={() => setStep(2)} />
      </div>
    </div>
  )
}

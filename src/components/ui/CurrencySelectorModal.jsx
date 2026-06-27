import { useState, useEffect, useRef } from 'react'
import { Search, X, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../config/api'
import useCurrencyStore, { ALL_CURRENCIES } from '../../store/currencyStore'

/**
 * Modal de sélection de devise.
 * Envoie POST /api/profile { currency: code } puis met à jour le store.
 */
export default function CurrencySelectorModal({ open, onClose }) {
  const { activeCurrency, setCurrency } = useCurrencyStore()
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const searchRef = useRef(null)

  // Focus auto sur le champ recherche à l'ouverture
  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const filtered = ALL_CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = async (currency) => {
    if (currency.code === activeCurrency) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await api.post('/profile', { currency: currency.code })
      setCurrency(currency.code)
      toast.success(`Devise mise à jour : ${currency.name} (${currency.symbol})`)
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.errors?.currency?.[0]
        || err?.response?.data?.message
        || 'Impossible de mettre à jour la devise'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 1000, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        backgroundColor: '#fff',
        borderRadius: '24px',
        width: '480px', maxWidth: '95vw',
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111' }}>
            Choisir une devise
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} color="#666" />
          </button>
        </div>

        {/* Recherche */}
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #f5f5f5' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            backgroundColor: '#f5f5f5', borderRadius: '12px',
            padding: '10px 14px',
          }}>
            <Search size={18} color="#999" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une devise (code, nom, symbole)…"
              style={{
                border: 'none', background: 'none', flex: 1,
                fontSize: '15px', outline: 'none', color: '#333',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={16} color="#999" />
              </button>
            )}
          </div>
        </div>

        {/* Liste des devises */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#aaa', fontSize: '15px' }}>
              Aucune devise trouvée
            </div>
          ) : (
            filtered.map(currency => {
              const isActive = currency.code === activeCurrency
              return (
                <button
                  key={currency.code}
                  onClick={() => !saving && handleSelect(currency)}
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '12px 24px',
                    background: isActive ? '#e8f4ff' : 'none',
                    border: 'none', cursor: saving ? 'wait' : 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f5f5f5' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    {/* Symbole */}
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      backgroundColor: isActive ? '#1E88E5' : '#f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: '700',
                      color: isActive ? '#fff' : '#555',
                      flexShrink: 0,
                    }}>
                      {currency.symbol.length <= 3 ? currency.symbol : currency.code}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: '16px', fontWeight: isActive ? '700' : '600',
                        color: isActive ? '#1E88E5' : '#111',
                      }}>
                        {currency.code}
                      </div>
                      <div style={{ fontSize: '13px', color: '#888', marginTop: '1px' }}>
                        {currency.name}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      backgroundColor: '#1E88E5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Check size={14} color="#fff" strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #f0f0f0',
          fontSize: '13px', color: '#aaa', textAlign: 'center',
        }}>
          Devise active : <strong style={{ color: '#1E88E5' }}>{activeCurrency}</strong>
          &nbsp;·&nbsp;{ALL_CURRENCIES.length} devises disponibles
        </div>
      </div>
    </>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ChevronDown } from 'lucide-react'
import { dashboardService } from '../services/dashboardService'
import UserBadge from '../components/ui/UserBadge'
import useAuthStore from '../store/authStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount) {
  if (!amount && amount !== 0) return '0'
  return Number(amount).toLocaleString('fr-FR').replace(/\s/g, '.')
}

const currentYear = new Date().getFullYear()

// ─── Carte statistique ────────────────────────────────────────────────────────

function StatCard({ count, label, icon, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered && onClick ? '#d0e8ff' : '#e8f4ff',
        borderRadius: '20px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        height: '200px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s, transform 0.15s, box-shadow 0.15s',
        transform: hovered && onClick ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && onClick ? '0 6px 20px rgba(30,136,229,0.18)' : 'none',
      }}
    >
      {/* Icône en haut à gauche */}
      <img src={icon} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />

      {/* Chiffre + label en bas à droite */}
      <div style={{ alignSelf: 'flex-end', textAlign: 'right' }}>
        <div style={{ fontSize: '64px', fontWeight: '800', color: '#111', lineHeight: 1 }}>
          {count}
        </div>
        <div style={{ fontSize: '22px', color: '#888', marginTop: '4px' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function StatsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [treasury, setTreasury] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('year')
  const [year] = useState(currentYear)
  const [periodOpen, setPeriodOpen] = useState(false)
  const periodRef = useRef(null)

  const PERIOD_OPTIONS = [
    { value: 'day',   label: "Aujourd'hui" },
    { value: 'month', label: 'Ce mois' },
    { value: 'year',  label: String(currentYear) },
  ]
  const currentPeriodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || 'Cette année'

  useEffect(() => {
    function handleClick(e) {
      if (periodRef.current && !periodRef.current.contains(e.target)) {
        setPeriodOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Calcul des jours depuis l'inscription
  const memberDays = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  useEffect(() => {
    loadData(period, year)
  }, [period, year])

  const loadData = async (currentPeriod, currentYear) => {
    setLoading(true)
    try {
      const periodParam = currentPeriod === 'year' ? 'year' : currentPeriod === 'month' ? 'month' : 'day'
      const [statsRes, treasuryRes] = await Promise.all([
        dashboardService.getStats(periodParam, currentPeriod === 'year' ? currentYear : null),
        dashboardService.getTreasury(periodParam),
      ])
      setStats(statsRes.data)
      setTreasury(treasuryRes.data)
    } catch {
      toast.error('Impossible de charger les statistiques')
    } finally {
      setLoading(false)
    }
  }

  const operations = stats?.operations ?? {}
  const topClients = stats?.top_clients ?? []
  const caisse     = treasury?.available_balance ?? 0
  const recettes   = treasury?.total_income ?? 0
  const depenses   = treasury?.total_expenses ?? 0



  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: 0 }}>
            Statistiques
          </h1>

          {/* Dropdown filtre période — même style que Dashboard */}
          <div ref={periodRef} style={{ position: 'relative', marginLeft: '8px' }}>
            <button
              onClick={() => setPeriodOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1.5px solid #e0e0e0',
                fontSize: '15px', fontWeight: '600', color: '#333',
                backgroundColor: '#fff',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {currentPeriodLabel}
              <ChevronDown size={15} color="#1E88E5" style={{ transition: 'transform 0.2s', transform: periodOpen ? 'rotate(180deg)' : 'none' }} />
            </button>

            {periodOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
                backgroundColor: '#fff', borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                padding: '8px', minWidth: '170px',
              }}>
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setPeriod(opt.value); setPeriodOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '10px 16px',
                      background: period === opt.value ? '#e8f4ff' : 'none',
                      border: 'none', borderRadius: '10px',
                      fontSize: '15px', fontWeight: period === opt.value ? '700' : '500',
                      color: period === opt.value ? '#1E88E5' : '#333',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {opt.label}
                    {period === opt.value && (
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        backgroundColor: '#1E88E5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Badge Pro + Avatar */}
        <UserBadge size={48} />
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid #e0e0e0',
              borderTopColor: '#1E88E5',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
            {/* ── Bannière fidélité ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}>
              <button style={{
                border: '1.5px solid #1E88E5',
                borderRadius: '20px',
                padding: '8px 20px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#1E88E5',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}>
                Fidélité
              </button>

              {memberDays !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#111' }}>
                    Vous êtes membre depuis
                  </span>
                  <span style={{ fontSize: '36px', fontWeight: '800', color: '#1E88E5' }}>
                    {memberDays}
                  </span>
                  <span style={{ fontSize: '28px', fontWeight: '700', color: '#1E88E5' }}>
                    jours
                  </span>
                </div>
              )}
            </div>

            {/* ── Ligne 1 : 4 cartes opérations ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <StatCard count={operations.invoices ?? 0}  label="Factures" icon="/operation2.svg"   onClick={() => navigate('/history?tab=invoices')} />
              <StatCard count={operations.quotes ?? 0}    label="Devis"    icon="/devisicone.svg"   onClick={() => navigate('/history?tab=quotes')} />
              <StatCard count={operations.expenses ?? 0}  label="Dépenses" icon="/depenseicone.svg" onClick={() => navigate('/history?tab=expenses')} />
              <StatCard count={operations.clients ?? 0}   label="Clients"  icon="/operation4.svg" />
            </div>

            {/* ── Grille principale : Recette + Impayées + Top Clients + Trésorerie ── */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1.6fr',
              gridTemplateRows: '1fr 1fr',
              gap: '16px',
              minHeight: 0,
              alignItems: 'stretch',
            }}>

              {/* Recette */}
              <div
                onClick={() => navigate('/history?tab=receipts')}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#d0e8ff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(30,136,229,0.18)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#e8f4ff'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                style={{
                  backgroundColor: '#e8f4ff',
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  minHeight: 0,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, transform 0.15s, box-shadow 0.15s',
                }}
              >
                <img src="/entreeicone.svg" alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />
                <div style={{ alignSelf: 'flex-end', textAlign: 'right' }}>
                  <div style={{ fontSize: '64px', fontWeight: '800', color: '#111', lineHeight: 1 }}>{operations.revenues ?? 0}</div>
                  <div style={{ fontSize: '22px', color: '#888', marginTop: '4px' }}>Recette</div>
                </div>
              </div>

              {/* Impayées */}
              <div
                onClick={() => navigate('/history?tab=invoices&filter=unpaid')}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#d0e8ff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(30,136,229,0.18)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#e8f4ff'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                style={{
                  backgroundColor: '#e8f4ff',
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  minHeight: 0,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, transform 0.15s, box-shadow 0.15s',
                }}
              >
                <img src="/operation3.svg" alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />
                <div style={{ alignSelf: 'flex-end', textAlign: 'right' }}>
                  <div style={{ fontSize: '64px', fontWeight: '800', color: '#111', lineHeight: 1 }}>{operations.unpaid ?? 0}</div>
                  <div style={{ fontSize: '22px', color: '#888', marginTop: '4px' }}>Impayées</div>
                </div>
              </div>

              {/* Top Clients — s'étend sur 2 lignes */}
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                border: '2px solid #1E88E5',
                padding: '20px',
                gridRow: 'span 2',
                overflow: 'auto',
              }}>
                <div style={{ marginBottom: '14px' }}>
                  <span style={{
                    backgroundColor: '#1E88E5',
                    color: '#fff',
                    borderRadius: '20px',
                    padding: '6px 18px',
                    fontSize: '15px',
                    fontWeight: '600',
                  }}>
                    Top Clients
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1.2fr',
                  padding: '0 4px 8px',
                  borderBottom: '1px solid #f0f0f0',
                  marginBottom: '4px',
                }}>
                  {['Nom', 'Nombre', 'Montant (XOF)'].map((h, i) => (
                    <span key={i} style={{ fontSize: '14px', color: '#aaa', fontWeight: '500' }}>{h}</span>
                  ))}
                </div>

                {topClients.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#bbb', fontSize: '16px' }}>
                    Aucun client pour cette période
                  </div>
                ) : (
                  topClients.map((client, i) => (
                    <div key={client.id ?? i} style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1.2fr',
                      alignItems: 'center',
                      padding: '12px 4px',
                      borderBottom: i < topClients.length - 1 ? '1px solid #f8f8f8' : 'none',
                    }}>
                      <span style={{ fontSize: '24px', fontWeight: '700', color: '#111' }}>{client.name}</span>
                      <span style={{ fontSize: '16px', color: '#666' }}>{client.invoices_count} Facture{client.invoices_count !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: '17px', fontWeight: '700', color: '#111' }}>{fmt(client.total_amount)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Trésorerie — 2e ligne, colonnes 1+2 */}
              <div style={{
                gridColumn: 'span 2',
                backgroundColor: '#1E88E5',
                borderRadius: '24px',
                padding: '24px 28px',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    backgroundColor: 'transparent',
                    border: '2px solid #fff',
                    borderRadius: '20px',
                    padding: '5px 16px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}>
                    Trésorerie
                  </span>
                  <span style={{ fontSize: '16px', opacity: 0.85 }}>XOF</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '52px', fontWeight: '800', letterSpacing: '-1px' }}>
                    {fmt(caisse)}
                  </span>
                  <span style={{ fontSize: '16px', opacity: 0.8 }}>Solde disponible</span>
                </div>

                <div style={{ display: 'flex', gap: '48px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff', display: 'inline-block' }} />
                      <span style={{ fontSize: '14px', opacity: 0.85 }}>Revenus</span>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>{fmt(recettes)}</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff', display: 'inline-block' }} />
                      <span style={{ fontSize: '14px', opacity: 0.85 }}>Dépenses</span>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>{fmt(depenses)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

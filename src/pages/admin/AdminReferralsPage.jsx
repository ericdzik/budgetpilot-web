import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { toast } from 'react-hot-toast'
import { ChevronRight, SlidersHorizontal, Search, Users, User, CreditCard, Calendar, Clock, DollarSign } from 'lucide-react'
import PeriodDropdown from '../../components/ui/PeriodDropdown'

// ── Composants utilitaires ────────────────────────────────────────────────────

function PlanBadge({ plan }) {
  const colors = { pro: '#1E88E5', basic: '#43A047', freemium: '#9E9E9E', welcome: '#FF9800' }
  const c = colors[plan] || '#9E9E9E'
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
      fontSize: '11px', fontWeight: '700', backgroundColor: c, color: '#fff',
      textTransform: 'capitalize',
    }}>
      {plan || 'free'}
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg = status === 'paid'
    ? { label: 'versé',    bg: '#43A047', color: '#fff' }
    : { label: 'en attente', bg: '#f0f0f0', color: '#888' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '600',
      backgroundColor: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

// ── Pill KPI ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value }) {
  return (
    <div style={{
      flex: 1,
      border: '1px solid #e0e0e0',
      borderRadius: '14px',
      padding: '24px 28px',
      backgroundColor: '#fff',
    }}>
      <p style={{ fontSize: '14px', color: '#888', margin: '0 0 16px', fontWeight: '500' }}>{label}</p>
      <p style={{ fontSize: '36px', fontWeight: '700', color: '#111', margin: 0, letterSpacing: '-1px' }}>
        {value}
      </p>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, lastPage, onChange }) {
  if (lastPage <= 1) return null
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 2)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
      acc.push(p)
      return acc
    }, [])

  const btnStyle = (active, disabled) => ({
    width: 32, height: 32, borderRadius: '8px',
    border: `1px solid ${active ? '#1E88E5' : '#e0e0e0'}`,
    backgroundColor: active ? '#1E88E5' : '#fff',
    color: disabled ? '#ccc' : active ? '#fff' : '#333',
    fontSize: '13px', fontWeight: active ? '600' : '400',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid #f0f0f0' }}>
      <button style={btnStyle(false, page === 1)} onClick={() => page > 1 && onChange(page - 1)}>‹</button>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} style={{ fontSize: '13px', color: '#aaa', padding: '0 4px' }}>…</span>
          : <button key={p} style={btnStyle(p === page, false)} onClick={() => onChange(p)}>{p}</button>
      )}
      <button style={btnStyle(false, page === lastPage)} onClick={() => page < lastPage && onChange(page + 1)}>›</button>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminReferralsPage() {
  const navigate = useNavigate()

  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [period, setPeriod]     = useState('all')
  const [customStart, setCustomStart] = useState(null)
  const [customEnd, setCustomEnd]     = useState(null)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)

  const load = useCallback((p = page, s = search, per = period, start = customStart, end = customEnd) => {
    setLoading(true)
    const fmtDate = (d) => d ? d.toISOString().split('T')[0] : undefined
    adminService.getReferrals({
      period:     per,
      search:     s || undefined,
      page:       p,
      per_page:   10,
      date_start: per === 'custom' ? fmtDate(start) : undefined,
      date_end:   per === 'custom' ? fmtDate(end)   : undefined,
    })
      .then((r) => setData(r.data))
      .catch(() => toast.error('Erreur lors du chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(1, '', 'all') }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search, period, customStart, customEnd) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const changePeriod = (p, start, end) => {
    setPeriod(p)
    setCustomStart(start ?? null)
    setCustomEnd(end ?? null)
    setPage(1)
    load(1, search, p, start ?? null, end ?? null)
  }

  const changePage = (p) => {
    setPage(p); load(p, search, period, customStart, customEnd)
  }

  const fmtN = (n) => n != null ? Number(n).toLocaleString('fr-FR') : '—'
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  // Calcul durée abonnement en mois
  const durationLabel = (sub) => {
    if (!sub) return '—'
    if (sub.billing_cycle === 'monthly') return '1 mois'
    if (sub.billing_cycle === 'yearly')  return '12 mois'
    if (sub.billing_cycle === 'welcome') return 'Welcome'
    return sub.billing_cycle || '—'
  }

  const referrals    = data?.referrals?.data || []
  const meta         = data?.referrals || {}

  return (
    <div>
      {/* Titre + filtre période */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: 0, letterSpacing: '-0.5px' }}>
          Parrainages
        </h1>

        {/* Dropdown période */}
        <PeriodDropdown
          period={period}
          options={[
            { value: 'all',    label: 'Tout' },
            { value: 'month',  label: 'Ce mois' },
            { value: 'year',   label: 'Cette année' },
            { value: 'custom', label: 'Personnaliser' },
          ]}
          customStart={customStart}
          customEnd={customEnd}
          onChange={(p, start, end) => changePeriod(p, start, end)}
          accentColor="#1E88E5"
        />
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
        <KpiCard label="Total versé"    value={fmtN(data?.total_paid)} />
        <KpiCard label="Total à versé"  value={fmtN(data?.total_pending)} />
      </div>

      {/* Barre filtre + recherche */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        {/* Bouton Filtre */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 18px', borderRadius: '50px',
          border: '1px solid #e0e0e0', backgroundColor: '#fff',
          fontSize: '13px', fontWeight: '500', color: '#333', cursor: 'pointer',
        }}>
          <SlidersHorizontal size={14} color="#555" />
          Filtre
        </button>

        {/* Recherche */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          flex: 1, maxWidth: '360px',
          padding: '9px 16px', borderRadius: '50px',
          border: '1px solid #e0e0e0', backgroundColor: '#fff',
        }}>
          <Search size={14} color="#aaa" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: '13px', color: '#333', width: '100%',
            }}
          />
        </div>
      </div>

      {/* Tableau Parrains */}
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px',
        border: '1px solid #e8e8e8', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} color="#111" />
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>Parrains</span>
          </div>
          <button style={{ background: 'none', border: 'none', fontSize: '13px', color: '#888', cursor: 'pointer' }}>
            Tout voir
          </button>
        </div>

        {/* Colonnes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1.8fr 1fr 0.8fr 1fr 1.2fr 80px 40px',
          padding: '10px 20px', backgroundColor: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
        }}>
          {[
            { label: 'Nom Prénom',   icon: <User size={12} /> },
            { label: 'Filleul',      icon: <User size={12} /> },
            { label: 'Abonnement',   icon: <CreditCard size={12} /> },
            { label: 'Durée',        icon: <Clock size={12} /> },
            { label: 'Date',         icon: <Calendar size={12} /> },
            { label: 'Montant dû',   icon: <DollarSign size={12} /> },
            { label: '',             icon: null },
            { label: '',             icon: null },
          ].map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: '600', color: '#555',
            }}>
              {h.icon && <span style={{ color: '#999', display: 'flex' }}>{h.icon}</span>}
              {h.label}
            </div>
          ))}
        </div>

        {/* Lignes */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>Chargement...</div>
        ) : referrals.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
            Aucun parrainage trouvé
          </div>
        ) : (
          referrals.map((ref, i) => {
            // Prendre la première commission si elle existe
            const commission = ref.commissions?.[0]
            const sub        = commission?.subscription

            return (
              <div
                key={ref.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 1.8fr 1fr 0.8fr 1fr 1.2fr 80px 40px',
                  padding: '13px 20px',
                  borderBottom: i < referrals.length - 1 ? '1px solid #f5f5f5' : 'none',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {/* Parrain */}
                <span
                  style={{ fontSize: '13px', color: '#111', fontWeight: '500', cursor: 'pointer' }}
                  onClick={() => ref.referrer_id && navigate(`/admin/users/${ref.referrer_id}`)}
                >
                  {ref.referrer?.name || '—'}
                </span>

                {/* Filleul */}
                <span
                  style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}
                  onClick={() => ref.referred_id && navigate(`/admin/users/${ref.referred_id}`)}
                >
                  {ref.referred?.name || '—'}
                </span>

                {/* Abonnement */}
                <div>
                  {ref.referred?.plan
                    ? <PlanBadge plan={ref.referred.plan} />
                    : <span style={{ color: '#aaa', fontSize: '12px' }}>—</span>
                  }
                </div>

                {/* Durée */}
                <span style={{ fontSize: '12px', color: '#888' }}>
                  {durationLabel(sub)}
                </span>

                {/* Date */}
                <span style={{ fontSize: '12px', color: '#888' }}>
                  {fmtD(ref.created_at)}
                </span>

                {/* Montant dû */}
                <span style={{ fontSize: '13px', color: '#111', fontWeight: '500' }}>
                  {commission ? fmtN(commission.amount) : '—'}
                </span>

                {/* Statut versement */}
                <div>
                  {commission
                    ? <StatusBadge status={commission.status} />
                    : <span style={{ color: '#ccc', fontSize: '12px' }}>—</span>
                  }
                </div>

                {/* Bouton action → fiche parrain */}
                <div
                  onClick={(e) => { e.stopPropagation(); navigate(`/admin/referrals/${ref.referrer_id}`) }}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginLeft: 'auto', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0' }}
                >
                  <ChevronRight size={14} color="#666" />
                </div>
              </div>
            )
          })
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          lastPage={meta.last_page || 1}
          onChange={changePage}
        />
      </div>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { toast } from 'react-hot-toast'
import { Users, Search, SlidersHorizontal, ChevronRight, User, CreditCard, Calendar, Clock, DollarSign } from 'lucide-react'

// ── Sous-composants ───────────────────────────────────────────────────────────

function PlanBadge({ plan }) {
  const colors = { pro: '#1E88E5', basic: '#43A047', freemium: '#9E9E9E', welcome: '#FF9800' }
  const c = colors[plan] || '#9E9E9E'
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
      fontSize: '11px', fontWeight: '700', backgroundColor: c, color: '#fff', textTransform: 'capitalize',
    }}>
      {plan || 'free'}
    </span>
  )
}

function Pagination({ page, lastPage, onChange }) {
  if (lastPage <= 1) return null
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 2)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push('…'); acc.push(p); return acc }, [])

  const btn = (active, disabled) => ({
    width: 30, height: 30, borderRadius: '8px',
    border: `1px solid ${active ? '#1E88E5' : '#e0e0e0'}`,
    backgroundColor: active ? '#1E88E5' : '#fff',
    color: disabled ? '#ccc' : active ? '#fff' : '#333',
    fontSize: '13px', fontWeight: active ? '600' : '400',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid #f0f0f0' }}>
      <button style={btn(false, page === 1)} onClick={() => page > 1 && onChange(page - 1)}>‹</button>
      {pages.map((p, i) => p === '…'
        ? <span key={`e${i}`} style={{ fontSize: '12px', color: '#aaa', padding: '0 3px' }}>…</span>
        : <button key={p} style={btn(p === page, false)} onClick={() => onChange(p)}>{p}</button>
      )}
      <button style={btn(false, page === lastPage)} onClick={() => page < lastPage && onChange(page + 1)}>›</button>
    </div>
  )
}

// ── Modal ajout versement ─────────────────────────────────────────────────────
function VersementModal({ referrerId, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Montant invalide')
      return
    }
    setSaving(true)
    try {
      await adminService.addVersement(referrerId, { amount: Number(amount), note })
      toast.success('Versement ajouté')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 24px' }}>
          Ajouter un versement
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '8px' }}>
              Montant (XOF)
            </label>
            <input
              type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex : 5000"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                border: '1.5px solid #e0e0e0', borderRadius: '10px',
                fontSize: '15px', color: '#111', outline: 'none',
              }}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '8px' }}>
              Note (optionnel)
            </label>
            <input
              type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Remarque interne..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                border: '1.5px solid #e0e0e0', borderRadius: '10px',
                fontSize: '14px', color: '#333', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px',
              border: '1.5px solid #e0e0e0', borderRadius: '10px',
              backgroundColor: '#fff', color: '#555', fontSize: '14px', cursor: 'pointer',
            }}>
              Annuler
            </button>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: '12px',
              border: 'none', borderRadius: '10px',
              backgroundColor: '#111', color: '#fff',
              fontSize: '14px', fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Envoi...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminReferrerDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)

  const load = useCallback((p = 1, s = '') => {
    setLoading(true)
    adminService.getReferrerDetail(id, { page: p, per_page: 10, search: s || undefined })
      .then((r) => setData(r.data))
      .catch(() => toast.error('Fiche introuvable'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const changePage = (p) => { setPage(p); load(p, search) }

  const fmtN = (n) => n != null ? Number(n).toLocaleString('fr-FR') : '—'
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  const durationLabel = (sub) => {
    if (!sub) return '—'
    if (sub.billing_cycle === 'monthly') return '1 mois'
    if (sub.billing_cycle === 'yearly')  return '12 mois'
    if (sub.billing_cycle === 'welcome') return 'Welcome'
    return sub.billing_cycle || '—'
  }

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: '#aaa', fontSize: '14px' }}>Chargement...</p>
      </div>
    )
  }

  const referrer = data?.referrer
  const filleuls = data?.filleuls?.data || []
  const meta     = data?.filleuls || {}
  const versements = data?.versements || []

  return (
    <div>
      {/* Modal versement */}
      {showModal && (
        <VersementModal
          referrerId={id}
          onClose={() => setShowModal(false)}
          onSuccess={() => load(page, search)}
        />
      )}

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: 0, letterSpacing: '-0.5px' }}>
            Fiche parrain
          </h1>
          {/* Bouton Ajouter un versement */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 18px',
              backgroundColor: '#111', color: '#fff',
              border: 'none', borderRadius: '50px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Ajouter un versement
          </button>
        </div>
        {/* Voir la fiche utilisateur */}
        <button
          onClick={() => navigate(`/admin/users/${id}`)}
          style={{
            padding: '8px 18px',
            backgroundColor: '#fff', color: '#333',
            border: '1px solid #e0e0e0', borderRadius: '50px',
            fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}
        >
          Voir la fiche utilisateur
        </button>
      </div>

      {/* Lien retour */}
      <button
        onClick={() => navigate('/admin/referrals')}
        style={{ background: 'none', border: 'none', fontSize: '13px', color: '#aaa', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
      >
        ← Voir son parrain
      </button>

      {/* ── Corps — 2 colonnes ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Colonne gauche — infos + historique + filleuls */}
        <div style={{ flex: 1 }}>

          {/* Informations personnelles */}
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111', margin: '0 0 16px' }}>
              Information personnel
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              {[
                { label: 'Nom complet',         value: referrer?.name },
                { label: "Date d'inscription",  value: fmtD(referrer?.created_at) },
                { label: 'Numéro de téléphone', value: referrer?.phone },
                { label: 'Adresse email',       value: referrer?.email },
              ].map((row) => (
                <div key={row.label}>
                  <p style={{ fontSize: '11px', color: '#aaa', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {row.label}
                  </p>
                  <p style={{ fontSize: '14px', color: '#111', fontWeight: '500', margin: 0 }}>
                    {row.value || '—'}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Historique des versements */}
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111', margin: '0 0 16px' }}>
              Historique des versements
            </h2>
            {versements.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '13px' }}>Aucun versement enregistré</p>
            ) : (
              <div>
                {/* Header colonnes */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr',
                  marginBottom: '8px',
                }}>
                  {['Date versement', 'Montant versé', 'Moyen de versement', 'Nombre de filleuls'].map((h) => (
                    <span key={h} style={{ fontSize: '11px', color: '#aaa', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      {h}
                    </span>
                  ))}
                </div>
                {versements.map((v, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr',
                    padding: '10px 0',
                    borderBottom: '1px solid #f5f5f5',
                  }}>
                    <span style={{ fontSize: '14px', color: '#111', fontWeight: '500' }}>{v.date || '—'}</span>
                    <span style={{ fontSize: '14px', color: '#111', fontWeight: '500' }}>{fmtN(v.montant)}</span>
                    <span style={{ fontSize: '14px', color: '#555' }}>{v.moyen}</span>
                    <span style={{ fontSize: '14px', color: '#555' }}>{v.nb_filleuls}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Filtre + recherche */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '50px',
              border: '1px solid #e0e0e0', backgroundColor: '#fff',
              fontSize: '13px', fontWeight: '500', color: '#333', cursor: 'pointer',
            }}>
              <SlidersHorizontal size={13} color="#555" />
              Filtre
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              flex: 1, maxWidth: '320px',
              padding: '8px 16px', borderRadius: '50px',
              border: '1px solid #e0e0e0', backgroundColor: '#fff',
            }}>
              <Search size={13} color="#aaa" style={{ flexShrink: 0 }} />
              <input
                type="text" placeholder="Rechercher..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#333', width: '100%' }}
              />
            </div>
          </div>

          {/* Tableau Filleuls */}
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px',
            border: '1px solid #e8e8e8', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={16} color="#111" />
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>Filleuls</span>
                <span style={{ fontSize: '13px', color: '#888' }}>
                  Nombre de filleuls &nbsp;
                  <strong style={{ color: '#111' }}>{data?.nb_filleuls ?? '—'}</strong>
                </span>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: '13px', color: '#888', cursor: 'pointer' }}>
                Tout voir
              </button>
            </div>

            {/* Colonnes header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 0.8fr 0.7fr 1fr 1fr 1.2fr 40px',
              padding: '9px 20px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0',
            }}>
              {[
                { label: 'Filleul',      icon: <User size={11} color="#555" /> },
                { label: 'Abonnement',   icon: <CreditCard size={11} color="#555" /> },
                { label: 'Durée',        icon: <Clock size={11} color="#555" /> },
                { label: 'Date',         icon: <Calendar size={11} color="#555" /> },
                { label: 'Expiration',   icon: <Calendar size={11} color="#555" /> },
                { label: 'Montant dû',   icon: <DollarSign size={11} color="#555" /> },
                { label: '',             icon: null },
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '600', color: '#555' }}>
                  {h.label && h.icon}
                  {h.label}
                </div>
              ))}
            </div>

            {/* Lignes */}
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>Chargement...</div>
            ) : filleuls.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>Aucun filleul</div>
            ) : (
              filleuls.map((ref, i) => {
                const commission = ref.commissions?.[0]
                const sub        = commission?.subscription
                return (
                  <div
                    key={ref.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.8fr 0.8fr 0.7fr 1fr 1fr 1.2fr 40px',
                      padding: '11px 20px',
                      borderBottom: i < filleuls.length - 1 ? '1px solid #f5f5f5' : 'none',
                      alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    onClick={() => ref.referred_id && navigate(`/admin/users/${ref.referred_id}`)}
                  >
                    <span style={{ fontSize: '13px', color: '#111', fontWeight: '500' }}>{ref.referred?.name || '—'}</span>
                    <div>{ref.referred?.plan ? <PlanBadge plan={ref.referred.plan} /> : '—'}</div>
                    <span style={{ fontSize: '12px', color: '#888' }}>{durationLabel(sub)}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{fmtD(ref.created_at)}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{fmtD(sub?.next_billing_at)}</span>
                    <span style={{ fontSize: '13px', color: '#111', fontWeight: '500' }}>{commission ? fmtN(commission.amount) : '—'}</span>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', backgroundColor: '#f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto',
                      cursor: 'pointer',
                    }}>
                      <ChevronRight size={13} color="#666" />
                    </div>
                  </div>
                )
              })
            )}

            {/* Pagination */}
            <Pagination page={page} lastPage={meta.last_page || 1} onChange={changePage} />
          </div>
        </div>

        {/* Colonne droite — KPI cards */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            border: '1px solid #e0e0e0', borderRadius: '14px',
            padding: '20px 24px', backgroundColor: '#fff',
          }}>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px', fontWeight: '500' }}>Total à versé</p>
            <p style={{ fontSize: '34px', fontWeight: '700', color: '#111', margin: 0, letterSpacing: '-1px' }}>
              {fmtN(data?.total_pending)}
            </p>
          </div>
          <div style={{
            border: '1px solid #e0e0e0', borderRadius: '14px',
            padding: '20px 24px', backgroundColor: '#fff',
          }}>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px', fontWeight: '500' }}>Total versé</p>
            <p style={{ fontSize: '34px', fontWeight: '700', color: '#111', margin: 0, letterSpacing: '-1px' }}>
              {fmtN(data?.total_paid)}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { toast } from 'react-hot-toast'
import {
  User, Megaphone, Handshake,
  Users, HeadphonesIcon, StickyNote, Settings,
  Download, TrendingUp, DollarSign,
  UserRound, Clock, CreditCard, Phone, ChevronRight,
  Wallet, Share2,
} from 'lucide-react'

// Formate un montant XOF
const fmtXof = (val) => {
  const n = Number(val ?? 0)
  if (n === 0) return '—'
  return n.toLocaleString('fr-FR') + ' XOF'
}

// ── Actions courantes ─────────────────────────────────────────────────────────
const ACTIONS = [
  { label: 'Fiche utilisateur',      color: '#FF6B35', icon: User,             to: '/admin/users' },
  { label: 'Modifier une publicité', color: '#F5C842', icon: Megaphone,        to: '/admin/banners' },
  { label: 'Information parrainage', color: '#4FC3F7', icon: Handshake,        to: '/admin/referrals' },
  { label: 'Liste des abonnés',      color: '#1E88E5', icon: Users,            to: '/admin/users?plan=pro' },
  { label: 'Historique du support',  color: '#AB47BC', icon: HeadphonesIcon,   to: '/admin/users' },
  { label: 'Notes internes',         color: '#C6E23A', icon: StickyNote,       to: '/admin/users' },
  { label: 'Paramètres',             color: '#4CAF50', icon: Settings,         to: '/admin/settings' },
]

function ActionButton({ label, color, icon: Icon, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 18px',
        border: '1px solid #e8e8e8',
        borderRadius: '50px',
        backgroundColor: hovered ? '#f9f9f9' : '#fff',
        cursor: 'pointer',
        fontSize: '13px', fontWeight: '500', color: '#222',
        transition: 'background 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={14} color={color} strokeWidth={2.2} style={{ flexShrink: 0 }} />
      {label}
    </button>
  )
}

// ── KPI pill ──────────────────────────────────────────────────────────────────
function KpiPill({ value, label, icon: Icon, iconColor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 20px',
      border: '1px solid #e0e0e0',
      borderRadius: '50px',
      backgroundColor: '#fff',
    }}>
      <Icon size={16} color={iconColor || '#111'} strokeWidth={2} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '18px', fontWeight: '700', color: '#111' }}>{value}</span>
      <span style={{ fontSize: '13px', color: '#888' }}>{label}</span>
    </div>
  )
}

// ── Badge plan ────────────────────────────────────────────────────────────────
function PlanBadge({ plan }) {
  const colors = {
    pro:      '#1E88E5',
    basic:    '#43A047',
    freemium: '#9E9E9E',
    welcome:  '#FF9800',
  }
  const c = colors[plan] || '#9E9E9E'
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px', borderRadius: '6px',
      fontSize: '11px', fontWeight: '700',
      backgroundColor: c, color: '#fff',
      textTransform: 'capitalize', marginRight: '6px',
    }}>
      {plan || 'free'}
    </span>
  )
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [data, setData]               = useState(null)
  const [users, setUsers]             = useState([])
  const [meta, setMeta]               = useState({ total: 0, last_page: 1, current_page: 1 })
  const [page, setPage]               = useState(1)
  const [loading, setLoading]         = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Chargement initial — dashboard + première page users
  useEffect(() => {
    Promise.all([
      adminService.getDashboard(),
      adminService.getUsers({ per_page: 10, page: 1 }),
    ])
      .then(([dashRes, usersRes]) => {
        setData(dashRes.data)
        setUsers(usersRes.data.data || [])
        setMeta({
          total:        usersRes.data.total,
          last_page:    usersRes.data.last_page,
          current_page: usersRes.data.current_page,
        })
      })
      .catch(() => toast.error('Erreur lors du chargement'))
      .finally(() => setLoading(false))
  }, [])

  // Rechargement users quand la page change (skip page 1 déjà chargée)
  useEffect(() => {
    if (loading) return
    setLoadingUsers(true)
    adminService.getUsers({ per_page: 10, page })
      .then((r) => {
        setUsers(r.data.data || [])
        setMeta({
          total:        r.data.total,
          last_page:    r.data.last_page,
          current_page: r.data.current_page,
        })
      })
      .catch(() => toast.error('Erreur pagination'))
      .finally(() => setLoadingUsers(false))
  }, [page])

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  const totalUsers        = data?.total_users ?? '—'
  const activeSubscribers = data?.active_subscribers ?? '—'
  const subscriptionRevenue = fmtXof(data?.subscription_revenue)
  const totalReferrers    = data?.total_referrers ?? '—'
  const avgValue = (() => {
    const revenue = Number(data?.total_revenue ?? 0)
    const subs    = Number(data?.active_subscribers ?? 0)
    if (!subs || subs === 0) return '—'
    return Math.round(revenue / subs).toLocaleString('fr-FR')
  })()

  return (
    <div>
      {/* Date + Titre */}
      <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 4px' }}>{today}</p>
      <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: '0 0 24px', letterSpacing: '-0.5px' }}>
        Dashboard
      </h1>

      {/* KPI Pills */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <KpiPill value={totalUsers}           label="Utilisateurs"                   icon={Download}   iconColor="#1E88E5" />
        <KpiPill value={activeSubscribers}    label="Abonnés actifs"                 icon={Users}      iconColor="#43A047" />
        <KpiPill value={subscriptionRevenue}  label="Revenus abonnements"            icon={Wallet}     iconColor="#8E24AA" />
        <KpiPill value={totalReferrers}       label="Parrains"                       icon={Share2}     iconColor="#F4511E" />
        <KpiPill value={`${avgValue}`}        label="Valeur moyenne par utilisateur" icon={TrendingUp} iconColor="#FF9800" />
      </div>

      {/* Actions courantes */}
      <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: '0 0 16px' }}>
        Actions courantes
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, auto)',
        justifyContent: 'start',
        gap: '10px',
        marginBottom: '32px',
      }}>
        {ACTIONS.map((a) => (
          <ActionButton
            key={a.label}
            label={a.label}
            color={a.color}
            icon={a.icon}
            onClick={() => navigate(a.to)}
          />
        ))}
      </div>

      {/* Tableau Utilisateurs */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #e8e8e8',
        overflow: 'hidden',
      }}>
        {/* Header tableau */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} color="#111" strokeWidth={2.2} />
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>Utilisateurs</span>
          </div>
          <button
            onClick={() => navigate('/admin/users')}
            style={{
              background: 'none', border: 'none',
              fontSize: '13px', color: '#888',
              cursor: 'pointer', fontWeight: '500',
            }}
          >
            Tout voir
          </button>
        </div>

        {/* Colonnes header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.5fr 2.5fr 1.5fr 40px',
          padding: '10px 20px',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
        }}>
        {[
            { label: 'Nom Prénom',          icon: <UserRound size={13} color="#555" /> },
            { label: 'Dernière utilisation', icon: <Clock size={13} color="#555" /> },
            { label: 'Abonnement',           icon: <CreditCard size={13} color="#555" /> },
            { label: 'N° Téléphone',         icon: <Phone size={13} color="#555" /> },
            { label: '',                     icon: null },
          ].map((h) => (
            <div key={h.label} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: '600', color: '#111',
            }}>
              {h.icon}
              {h.label}
            </div>
          ))}
        </div>

        {/* Lignes */}
        {loading || loadingUsers ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
            Chargement...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
            Aucun utilisateur
          </div>
        ) : (
          users.map((u, i) => {
            // Trouver la date d'expiration de l'abonnement
            const subExpiry = u.subscription?.next_billing_at
            const lastActivity = u.last_activity_at || u.updated_at

            return (
              <div
                key={u.id}
                onClick={() => navigate(`/admin/users/${u.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 2.5fr 1.5fr 40px',
                  padding: '13px 20px',
                  borderBottom: i < users.length - 1 ? '1px solid #f5f5f5' : 'none',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {/* Nom */}
                <span style={{ fontSize: '14px', color: '#111', fontWeight: '500' }}>
                  {u.name || '—'}
                </span>

                {/* Dernière utilisation */}
                <span style={{ fontSize: '13px', color: '#555' }}>
                  {formatDate(lastActivity)}
                </span>

                {/* Abonnement */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PlanBadge plan={u.plan} />
                  {subExpiry && (
                    <span style={{ fontSize: '11px', color: '#aaa' }}>
                      Expire le {formatDate(subExpiry)}
                    </span>
                  )}
                </div>

                {/* Téléphone */}
                <span style={{ fontSize: '13px', color: '#555' }}>
                  {u.phone || '—'}
                </span>

                {/* Bouton action */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                  <ChevronRight size={14} color="#888" />
                </div>
              </div>
            )
          })
        )}

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {meta.last_page > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid #f0f0f0',
          }}>
            {/* Infos */}
            <span style={{ fontSize: '13px', color: '#aaa' }}>
              Page {meta.current_page} / {meta.last_page} — {meta.total} utilisateurs
            </span>

            {/* Boutons numérotés */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {/* Précédent */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: 32, height: 32,
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fff',
                  fontSize: '14px', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? '#ccc' : '#333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ‹
              </button>

              {/* Numéros de page */}
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.last_page || Math.abs(p - page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} style={{ fontSize: '13px', color: '#aaa', padding: '0 4px' }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 32, height: 32,
                        borderRadius: '8px',
                        border: '1px solid ' + (p === page ? '#1E88E5' : '#e0e0e0'),
                        backgroundColor: p === page ? '#1E88E5' : '#fff',
                        color: p === page ? '#fff' : '#333',
                        fontSize: '13px', fontWeight: p === page ? '600' : '400',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      {p}
                    </button>
                  )
                )
              }

              {/* Suivant */}
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                style={{
                  width: 32, height: 32,
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fff',
                  fontSize: '14px', cursor: page === meta.last_page ? 'not-allowed' : 'pointer',
                  color: page === meta.last_page ? '#ccc' : '#333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

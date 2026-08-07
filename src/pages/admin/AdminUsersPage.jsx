import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { toast } from 'react-hot-toast'

const PLAN_COLORS = {
  pro:      { bg: '#E3F2FD', color: '#1E88E5' },
  basic:    { bg: '#E8F5E9', color: '#43A047' },
  freemium: { bg: '#F5F5F5', color: '#9E9E9E' },
  welcome:  { bg: '#FFF3E0', color: '#FF9800' },
}

const CHURN_CONFIG = {
  low:     { label: 'Faible',  color: '#43A047', bg: '#E8F5E9' },
  medium:  { label: 'Moyen',   color: '#FF9800', bg: '#FFF3E0' },
  high:    { label: 'Élevé',   color: '#FF1744', bg: '#FFEBEE' },
  churned: { label: 'Churné',  color: '#757575', bg: '#F5F5F5' },
}

function ChurnBadge({ risk }) {
  const cfg = CHURN_CONFIG[risk] || CHURN_CONFIG.medium
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: '600',
      backgroundColor: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

function PlanBadge({ plan }) {
  const cfg = PLAN_COLORS[plan] || PLAN_COLORS.freemium
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: '600',
      backgroundColor: cfg.bg, color: cfg.color, textTransform: 'capitalize',
    }}>
      {plan || 'freemium'}
    </span>
  )
}

export default function AdminUsersPage() {
  const navigate = useNavigate()

  const [users, setUsers]     = useState([])
  const [meta, setMeta]       = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [page, setPage]       = useState(1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminService.getUsers({
        search: search || undefined,
        plan:   planFilter || undefined,
        page,
        per_page: 20,
      })
      setUsers(r.data.data || [])
      setMeta({
        total:        r.data.total,
        current_page: r.data.current_page,
        last_page:    r.data.last_page,
      })
    } catch {
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }, [search, planFilter, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300)
    return () => clearTimeout(t)
  }, [search])

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111', margin: 0 }}>Utilisateurs</h1>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
            {meta.total != null ? `${meta.total} utilisateurs au total` : ''}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="Rechercher nom, email, téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1', minWidth: '240px',
            padding: '10px 16px',
            border: '1.5px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '14px', color: '#333', outline: 'none',
            backgroundColor: '#fff',
          }}
        />
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
          style={{
            padding: '10px 16px',
            border: '1.5px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '14px', color: '#333', outline: 'none',
            backgroundColor: '#fff', cursor: 'pointer',
          }}
        >
          <option value="">Tous les plans</option>
          <option value="pro">Pro</option>
          <option value="basic">Basic</option>
          <option value="freemium">Freemium</option>
          <option value="welcome">Welcome</option>
        </select>
      </div>

      {/* Tableau */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fb' }}>
              {['Utilisateur', 'Plan', 'Inscription', 'Clients', 'Docs', 'Dépenses', 'Risque churn', ''].map((h) => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: '12px', fontWeight: '600', color: '#888',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                  borderBottom: '1px solid #f0f0f0',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#aaa' }}>
                  Chargement...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#aaa' }}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafbfc' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {/* Utilisateur */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        backgroundColor: '#1E88E520',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: '#1E88E5', flexShrink: 0,
                      }}>
                        {(u.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', color: '#111', fontSize: '14px' }}>
                          {u.name || '—'}
                        </p>
                        <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}><PlanBadge plan={u.plan} /></td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>{formatDate(u.created_at)}</td>
                  <td style={{ padding: '14px 16px', color: '#555', textAlign: 'center' }}>{u.clients_count ?? 0}</td>
                  <td style={{ padding: '14px 16px', color: '#555', textAlign: 'center' }}>{u.documents_count ?? 0}</td>
                  <td style={{ padding: '14px 16px', color: '#555', textAlign: 'center' }}>{u.expenses_count ?? 0}</td>
                  <td style={{ padding: '14px 16px' }}><ChurnBadge risk={u.churn_risk} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#1E88E510',
                        color: '#1E88E5',
                        border: 'none',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: '8px', padding: '16px',
            borderTop: '1px solid #f0f0f0',
          }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 16px', borderRadius: '8px',
                border: '1.5px solid #e0e0e0', backgroundColor: '#fff',
                fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: page === 1 ? '#ccc' : '#333',
              }}
            >
              ← Précédent
            </button>
            <span style={{ fontSize: '13px', color: '#888' }}>
              Page {meta.current_page} / {meta.last_page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              style={{
                padding: '6px 16px', borderRadius: '8px',
                border: '1.5px solid #e0e0e0', backgroundColor: '#fff',
                fontSize: '13px', cursor: page === meta.last_page ? 'not-allowed' : 'pointer',
                color: page === meta.last_page ? '#ccc' : '#333',
              }}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

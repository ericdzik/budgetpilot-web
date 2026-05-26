import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Download, Eye, Plus } from 'lucide-react'
import { dashboardService } from '../services/dashboardService'
import PdfPreviewModal from '../components/ui/PdfPreviewModal'
import UserBadge from '../components/ui/UserBadge'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount) {
  if (!amount && amount !== 0) return '0'
  return Number(amount).toLocaleString('fr-FR').replace(/\s/g, '.')
}

const currentYear = new Date().getFullYear()

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [treasury, setTreasury] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [pdfPreview, setPdfPreview] = useState(null)

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, treasuryRes] = await Promise.all([
        dashboardService.getStats(period),
        dashboardService.getTreasury(period),
      ])
      setStats(statsRes.data)
      setTreasury(treasuryRes.data)
    } catch {
      toast.error('Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPreview = (docId, clientName) => {
    setPdfPreview({ docId, clientName })
  }

  const caisse   = treasury?.available_balance ?? 0
  const recettes = treasury?.total_income ?? 0
  const depenses = treasury?.total_expenses ?? 0

  const operations    = stats?.operations ?? {}
  const recentInvoices = stats?.recent_invoices ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: 0 }}>Dashboard</h1>

          {/* Dropdown filtre période */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              padding: '7px 36px 7px 14px',
              borderRadius: '20px',
              border: '1.5px solid #e0e0e0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              backgroundColor: '#fff',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231E88E5' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              marginLeft: '8px',
            }}
          >
            <option value="day">Aujourd'hui</option>
            <option value="month">Ce mois</option>
            <option value="year">{currentYear}</option>
          </select>
        </div>

        {/* Droite : badge Pro + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserBadge size={48} />
        </div>
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e0e0e0', borderTopColor: '#1E88E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* ── Ligne 1 : Caisse + Recettes + Dépenses ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '16px' }}>

              {/* Caisse */}
              <div style={{
                backgroundColor: '#1E88E5', borderRadius: '28px',
                padding: '16px', color: '#fff', position: 'relative', overflow: 'hidden',
                minHeight: '120px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px',
                    padding: '4px 14px', fontSize: '24px', fontWeight: '600',
                  }}>
                    Caisse
                  </div>
                  <span style={{ fontSize: '25px', opacity: 0.85 }}>XOF</span>
                </div>
                <div style={{ fontSize: '42px', fontWeight: '700', letterSpacing: '-1px' }}>
                  {fmt(caisse)}
                </div>

                {/* Boutons superposés à droite, centrés verticalement */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '20px',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  <button
                    onClick={() => navigate('/documents/new?type=invoice')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff',
                      border: 'none', borderRadius: '20px', padding: '10px 20px',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Plus size={14} /> Créer une facture
                  </button>
                  <button
                    onClick={() => navigate('/stats')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff',
                      border: 'none', borderRadius: '20px', padding: '10px 20px',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Voir Statistiques
                  </button>
                </div>
              </div>

              {/* Recettes */}
              <div style={{
                backgroundColor: '#e8f4ff', borderRadius: '18px', padding: '12px 16px',
                border: '1px solid #d0e8ff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  border: '1.5px solid #1E88E5', borderRadius: '20px',
                  padding: '5px 16px', fontSize: '16px', fontWeight: '600', color: '#1E88E5',
                  alignSelf: 'flex-start',
                }}>
                  Recettes
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <div style={{ fontSize: '42px', fontWeight: '700', color: '#111', letterSpacing: '-0.5px' }}>
                      {fmt(recettes)}
                    </div>
                    <span style={{ fontSize: '14px', color: '#888', fontWeight: '500' }}>XOF</span>
                  </div>
                </div>
              </div>

              {/* Dépenses */}
              <div style={{
                backgroundColor: '#f5f5f5', borderRadius: '18px', padding: '12px 16px',
                border: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  border: '1.5px solid #1E88E5', borderRadius: '20px',
                  padding: '5px 16px', fontSize: '16px', fontWeight: '600', color: '#1E88E5',
                  alignSelf: 'flex-start',
                }}>
                  Dépenses
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <div style={{ fontSize: '42px', fontWeight: '700', color: '#111', letterSpacing: '-0.5px' }}>
                      {fmt(depenses)}
                    </div>
                    <span style={{ fontSize: '14px', color: '#888', fontWeight: '500' }}>XOF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Ligne 2 : Historique + Opérations ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', alignItems: 'start' }}>

              {/* Historique */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  backgroundColor: '#fff', borderRadius: '18px', padding: '20px',
                  border: '2px solid #1E88E5', minHeight: '400px', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                      backgroundColor: '#1E88E5', color: '#fff',
                      borderRadius: '20px', padding: '5px 16px',
                      fontSize: '16px', fontWeight: '500',
                    }}>
                      Historique
                    </div>
                    <button
                      onClick={() => navigate('/history')}
                      style={{ fontSize: '17px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Tout voir
                    </button>
                  </div>

                  {/* En-têtes */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 80px',
                    padding: '0 8px 10px', borderBottom: '1px solid #f0f0f0',
                  }}>
                    {['Nom', 'Date', 'Montant', ''].map((h, i) => (
                      <span key={i} style={{ fontSize: '13px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</span>
                    ))}
                  </div>

                  {/* Lignes */}
                  {recentInvoices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#bbb', fontSize: '15px' }}>
                      Aucune facture récente
                    </div>
                  ) : (
                    recentInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 80px',
                          alignItems: 'center', padding: '16px 8px',
                          borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                        }}
                        onClick={() => navigate('/history')}
                      >
                        <span style={{ fontSize: '17px', fontWeight: '700', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inv.client_name}
                        </span>
                        <span style={{ fontSize: '15px', color: '#555' }}>
                          {inv.created_at}
                        </span>
                        <span style={{ fontSize: '17px', fontWeight: '600', color: '#111' }}>
                          {fmt(inv.amount)}
                        </span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <Download size={22} color="#aaa" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleOpenPreview(inv.id, inv.client_name) }} />
                          <Eye size={22} color="#aaa" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate('/history') }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Boutons bas — en dehors du conteneur bordé */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={() => navigate('/stats')}
                    style={{
                      padding: '14px 32px',
                      backgroundColor: '#1E88E5', color: '#fff',
                      border: 'none', borderRadius: '20px',
                      fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Accès Statistiques
                  </button>
                  <button
                    style={{
                      padding: '14px 32px',
                      backgroundColor: '#fff', color: '#333',
                      border: '1.5px solid #e0e0e0', borderRadius: '20px',
                      fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Support Client
                  </button>
                </div>
              </div>

              {/* Colonne droite : Opérations + Promo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Opérations */}
                <div style={{
                  backgroundColor: '#fff', borderRadius: '18px', padding: '20px',
                  border: '2px solid #1E88E5',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                      border: '1.5px solid #1E88E5', color: '#1E88E5',
                      borderRadius: '20px', padding: '5px 16px',
                      fontSize: '16px', fontWeight: '500',
                    }}>
                      Opérations
                    </div>
                    <button
                      onClick={() => navigate('/documents')}
                      style={{ fontSize: '17px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Tout voir
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { icon: '/devisicone.svg',  count: operations.quotes ?? 0,   label: 'Devis' },
                      { icon: '/operation2.svg',  count: operations.invoices ?? 0, label: 'Factures' },
                      { icon: '/operation3.svg',  count: operations.unpaid ?? 0,   label: 'Impayés' },
                      { icon: '/operation4.svg',  count: operations.clients ?? 0,  label: 'Clients' },
                    ].map((op, i) => (
                      <div key={i} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        backgroundColor: '#e8f4ff', borderRadius: '16px', padding: '14px 12px 16px',
                        minHeight: '150px', justifyContent: 'space-between',
                      }}>
                        <img src={op.icon} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                        <div>
                          <div style={{ fontSize: '25px', fontWeight: '800', color: '#111', lineHeight: 1.1 }}>{op.count}</div>
                          <div style={{ fontSize: '16px', color: '#888', marginTop: '2px' }}>{op.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bannière promo */}
                <div style={{
                  borderRadius: '18px', overflow: 'hidden',
                  minHeight: '100px',
                }}>
                  <img
                    src="/pub5.png"
                    alt="Promotion"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Modal aperçu PDF */}
      {pdfPreview && (
        <PdfPreviewModal
          docId={pdfPreview.docId}
          clientName={pdfPreview.clientName}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  )
}

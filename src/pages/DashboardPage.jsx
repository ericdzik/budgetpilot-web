import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Download, Eye, Plus, ChevronDown } from 'lucide-react'
import { dashboardService } from '../services/dashboardService'
import { subscriptionService } from '../services/subscriptionService'
import useAuthStore from '../store/authStore'
import useCurrencyStore, { formatAmount, CURRENCY_SYMBOLS } from '../store/currencyStore'
import PdfPreviewModal from '../components/ui/PdfPreviewModal'
import UserBadge from '../components/ui/UserBadge'
import WelcomeProModal from '../components/ui/WelcomeProModal'
import RenewalReminderModal from '../components/ui/RenewalReminderModal'
import FreemiumLimitModal from '../components/ui/FreemiumLimitModal'
import WelcomeProfileModal from '../components/ui/WelcomeProfileModal'

// ─── Flags de session (hors React, persistants pendant la session) ────────────
const _session = {
  hasShownWelcomePro:    false,
  hasShownRenewal:       false,
  hasShownFreemiumLimit: false,
  hasShownProfileModal:  false,
  visitCount:            0,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount) {
  if (!amount && amount !== 0) return '0'
  return Number(amount).toLocaleString('fr-FR').replace(/\s/g, '.')
}

const currentYear = new Date().getFullYear()

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user: authUser } = useAuthStore()
  const { activeCurrency, initFromUser } = useCurrencyStore()
  const [stats, setStats] = useState(null)
  const [treasury, setTreasury] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [pdfPreview, setPdfPreview] = useState(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const periodRef = useRef(null)

  // ── État des modales ───────────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState(null) // 'welcomePro' | 'renewal' | 'freemium' | 'profile'
  const [subscriptionData, setSubscriptionData] = useState(null)
  const modalQueue = useRef([])
  const modalProcessing = useRef(false)

  // Vérification abonnement — une seule fois par montage
  const subscriptionChecked = useRef(false)

  const PERIOD_OPTIONS = [
    { value: 'day',   label: "Aujourd'hui" },
    { value: 'month', label: 'Ce mois' },
    { value: 'year',  label: String(currentYear) },
  ]
  const currentPeriodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || 'Ce mois'

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClick(e) {
      if (periodRef.current && !periodRef.current.contains(e.target)) {
        setPeriodOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── File d'attente des modales ─────────────────────────────────────────────
  const processModalQueue = useCallback(() => {
    if (modalProcessing.current || modalQueue.current.length === 0) return
    modalProcessing.current = true
    const next = modalQueue.current.shift()
    setTimeout(() => setActiveModal(next), 800)
  }, [])

  const enqueueModal = useCallback((modalName) => {
    modalQueue.current.push(modalName)
    if (!modalProcessing.current) processModalQueue()
  }, [processModalQueue])

  const closeModal = useCallback(() => {
    setActiveModal(null)
    modalProcessing.current = false
    processModalQueue()
  }, [processModalQueue])

  // ── Vérification des modales après chargement du statut abonnement ─────────
  useEffect(() => {
    if (subscriptionChecked.current) return
    subscriptionChecked.current = true

    subscriptionService.getStatus()
      .then(res => {
        const data = res.data
        setSubscriptionData(data)

        // 1. WelcomePro — billing_cycle === 'welcome' + status === 'active'
        if (
          !_session.hasShownWelcomePro &&
          data?.billing_cycle === 'welcome' &&
          data?.status === 'active'
        ) {
          _session.hasShownWelcomePro = true
          enqueueModal('welcomePro')
        }

        // 2. Rappel renouvellement — actif + payant + pas welcome + ≤5 jours
        if (
          !_session.hasShownRenewal &&
          data?.status === 'active' &&
          data?.plan !== 'freemium' &&
          data?.billing_cycle !== 'welcome' &&
          data?.next_billing_at
        ) {
          const daysLeft = Math.ceil((new Date(data.next_billing_at) - new Date()) / (1000 * 60 * 60 * 24))
          if (daysLeft >= 0 && daysLeft <= 5) {
            _session.hasShownRenewal = true
            enqueueModal('renewal')
          }
        }

        // 3. Limite freemium — plan freemium + 2ème visite ou plus
        _session.visitCount++
        if (
          !_session.hasShownFreemiumLimit &&
          (data?.plan === 'freemium' || !data?.plan) &&
          _session.visitCount >= 2
        ) {
          _session.hasShownFreemiumLimit = true
          enqueueModal('freemium')
        }
      })
      .catch(() => {
        // Fallback : incrémenter le compteur de visite même sans API
        _session.visitCount++
      })
  }, [enqueueModal])

  // ── Vérification profil incomplet (après chargement des stats) ────────────
  const profileChecked = useRef(false)

  useEffect(() => {
    if (profileChecked.current || loading) return
    if (_session.hasShownProfileModal) return
    profileChecked.current = true

    const user = stats?.user ?? authUser
    if (user && user.profile_completed !== true) {
      _session.hasShownProfileModal = true
      enqueueModal('profile')
    }
  }, [loading, stats, authUser, enqueueModal])

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
      // Synchroniser la devise depuis le profil utilisateur
      if (statsRes.data?.user?.currency) {
        initFromUser(statsRes.data.user)
      }
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

          {/* Dropdown filtre période — custom stylisé */}
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
                  <span style={{ fontSize: '25px', opacity: 0.85 }}>{activeCurrency}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '42px', fontWeight: '700', letterSpacing: '-1px' }}>
                    {formatAmount(caisse, activeCurrency)}
                  </div>
                </div>
                <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px', marginBottom: '6px' }}>
                  Solde disponible
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
                      {formatAmount(recettes, activeCurrency)}
                    </div>
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
                      {formatAmount(depenses, activeCurrency)}
                    </div>
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
                          {formatAmount(inv.amount, activeCurrency)}
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
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
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
                      { icon: '/devisicone.svg',  count: operations.quotes ?? 0,   label: 'Devis',     href: '/history?tab=quotes',              clickable: true },
                      { icon: '/operation2.svg',  count: operations.invoices ?? 0, label: 'Factures',  href: '/history?tab=invoices',            clickable: true },
                      { icon: '/operation3.svg',  count: operations.unpaid ?? 0,   label: 'Impayés',   href: '/history?tab=invoices&filter=unpaid', clickable: true },
                      { icon: '/operation4.svg',  count: operations.clients ?? 0,  label: 'Clients',   href: '/clients',                         clickable: false },
                    ].map((op, i) => (
                      <div
                        key={i}
                        onClick={() => op.clickable && navigate(op.href)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                          backgroundColor: '#e8f4ff', borderRadius: '16px', padding: '14px 12px 16px',
                          minHeight: '150px', justifyContent: 'space-between',
                          cursor: op.clickable ? 'pointer' : 'default',
                          transition: 'background-color 0.15s, transform 0.15s',
                        }}
                        onMouseEnter={e => { if (op.clickable) { e.currentTarget.style.backgroundColor = '#d0e8ff'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                        onMouseLeave={e => { if (op.clickable) { e.currentTarget.style.backgroundColor = '#e8f4ff'; e.currentTarget.style.transform = 'none' } }}
                      >
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
                  height: '200px',
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

      {/* ── Modales de notification (file d'attente) ── */}

      <WelcomeProModal
        open={activeModal === 'welcomePro'}
        onClose={closeModal}
      />

      <RenewalReminderModal
        open={activeModal === 'renewal'}
        daysLeft={
          subscriptionData?.next_billing_at
            ? Math.max(0, Math.ceil((new Date(subscriptionData.next_billing_at) - new Date()) / (1000 * 60 * 60 * 24)))
            : 0
        }
        plan={subscriptionData?.plan ?? 'pro'}
        onClose={closeModal}
        onRenew={() => { closeModal(); navigate('/subscription') }}
      />

      <FreemiumLimitModal
        open={activeModal === 'freemium'}
        onClose={closeModal}
        onUpgrade={() => { closeModal(); navigate('/subscription') }}
      />

      <WelcomeProfileModal
        open={activeModal === 'profile'}
        user={stats?.user ?? authUser}
        onComplete={() => { closeModal(); navigate('/profile/company') }}
        onSkip={closeModal}
      />
    </div>
  )
}

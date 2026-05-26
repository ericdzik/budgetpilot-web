import { useState, useEffect } from 'react'
import { Zap, Check, Circle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { subscriptionService } from '../services/subscriptionService'
import UserBadge from '../components/ui/UserBadge'
import useAuthStore from '../store/authStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CheckItem({ text, light = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      {light ? (
        <Circle size={16} color="rgba(255,255,255,0.7)" />
      ) : (
        <Check size={16} color="#1E88E5" strokeWidth={3} />
      )}
      <span style={{ fontSize: '14px', color: light ? 'rgba(255,255,255,0.9)' : '#333' }}>{text}</span>
    </div>
  )
}

function CheckItemBlue({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <Check size={16} color="#1E88E5" strokeWidth={3} />
      <span style={{ fontSize: '14px', color: '#333' }}>{text}</span>
    </div>
  )
}

// ─── Bouton cycle ─────────────────────────────────────────────────────────────

function CycleButton({ label, price, perMonth, selected, onSelect }) {
  const headerBg = selected ? '#FFC107' : '#1E88E5'
  const headerText = selected ? '#111' : '#fff'
  const borderColor = selected ? '#FFC107' : '#90CAF9'

  return (
    <button
      onClick={onSelect}
      style={{
        flex: 1,
        border: `1.5px solid ${borderColor}`,
        borderRadius: '18px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      {/* Header coloré avec coins arrondis en bas */}
      <div style={{
        backgroundColor: headerBg,
        padding: '10px 4px 22px',
        textAlign: 'center',
        borderRadius: '0 0 8px 8px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: headerText }}>
          {label}
        </span>
      </div>

      {/* Corps blanc qui remonte sur le header */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '14px 14px 0 0',
        padding: '14px 8px 10px',
        marginTop: '-15px',
        position: 'relative',
        textAlign: 'left',
      }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '12px' }}>
          {price}
        </div>
        {/* Ligne séparatrice */}
        <div style={{
          height: '1px',
          backgroundColor: selected ? '#FFC107' : 'rgba(0,0,0,0.1)',
          marginBottom: '12px',
        }} />
        <div style={{ height: '28px', fontSize: '9px', color: 'rgba(0,0,0,0.45)', lineHeight: 1.4 }}>
          {perMonth || ''}
        </div>
      </div>
    </button>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { user, setUser } = useAuthStore()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPro, setSelectedPro]     = useState('trimestrial')
  const [selectedBasic, setSelectedBasic] = useState('annual')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    subscriptionService.getStatus()
      .then(res => {
        setStatus(res.data)
        // Synchroniser le plan dans le store si différent
        if (user && res.data?.plan && res.data.plan !== user.plan) {
          setUser({ ...user, plan: res.data.plan })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const daysLeft = (() => {
    if (!status?.next_billing_at) return null
    const diff = Math.ceil((new Date(status.next_billing_at) - new Date()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  })()
  const currentPlan = status?.plan ?? user?.plan ?? 'freemium'
  const isPro = currentPlan === 'pro' || currentPlan === 'basic'
  const planLabel = isPro ? currentPlan : 'gratuit'

  const handleSubscribe = async (plan, billing) => {
    setPaying(true)
    try {
      const res = await subscriptionService.initiate({ plan, billing_cycle: billing })
      if (res.data?.payment_url) {
        window.location.href = res.data.payment_url
      } else {
        toast.success('Abonnement initié avec succès')
      }
    } catch {
      toast.error("Impossible d'initier le paiement")
    } finally {
      setPaying(false)
    }
  }

  // Calcul économie trimestrielle
  const proTrimSavings  = (5000 * 3) - 13500  // 1500
  const basicTrimSavings = (3000 * 3) - 8000  // 1000

  const savingsMessage = {
    pro: {
      monthly:    'Débloque toutes les fonctionnalités',
      annual:     'Économise 10.000F\n2 mois offerts',
      trimestrial:`Économise ${proTrimSavings.toLocaleString('fr-FR')}F immédiatement`,
    },
    basic: {
      monthly:    'Débloque toutes les fonctionnalités',
      annual:     'Économise 6.000F\n2 mois offerts',
      trimestrial:`Économise ${basicTrimSavings.toLocaleString('fr-FR')}F immédiatement`,
    },
  }
  const proPrices = [
    { key: 'monthly',    label: 'Mensuel',     price: '5.000 F',  sub: null },
    { key: 'annual',     label: 'Annuel',      price: '50.000 F', sub: '4.200 F par mois' },
    { key: 'trimestrial',label: 'Trimestriel', price: '13.500 F', sub: '4.500 F par mois' },
  ]

  // Plans Basic
  const basicPrices = [
    { key: 'monthly',    label: 'Mensuel',     price: '3.000 F',  sub: null },
    { key: 'annual',     label: 'Annuel',      price: '30.000 F', sub: '2.500 F par mois' },
    { key: 'trimestrial',label: 'Trimestriel', price: '8.000 F',  sub: '2.667 F par mois' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px',
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: 0 }}>
          Abonnements
        </h1>
        <UserBadge size={48} />
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Votre abonnement actuel ── */}
        <div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 12px' }}>
            Votre Abonnement
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '24px',
            backgroundColor: '#fff', borderRadius: '20px',
            border: '1.5px solid #e0e0e0', padding: '20px 24px',
          }}>
            {/* Badge Pro */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#1E88E5', color: '#fff',
              borderRadius: '20px', padding: '10px 22px',
              fontSize: '18px', fontWeight: '700', flexShrink: 0,
            }}>
              <Zap size={18} fill="#fff" /> {planLabel}
            </div>

            {/* Jours restants — seulement en mode pro */}
            {isPro && daysLeft !== null && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexShrink: 0 }}>
                <span style={{ fontSize: '40px', fontWeight: '800', color: '#1E88E5', lineHeight: 1 }}>
                  {daysLeft}
                </span>
                <span style={{ fontSize: '14px', color: '#888', lineHeight: 1.3 }}>
                  jours<br />restants
                </span>
              </div>
            )}

            {/* Séparateur supprimé */}

            {/* Features — centrées */}
            <div style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isPro ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 48px' }}>
                  {[
                    'Opérations illimitées',
                    'Supprime les publicités',
                    'Données stockées 10ans',
                    'Support prioritaire VIP',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} color="#1E88E5" strokeWidth={3} />
                      <span style={{ fontSize: '13px', color: '#333' }}>{f}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 48px' }}>
                  {[
                    { text: '5 factures / mois', limit: true },
                    { text: 'Publicités affichées', limit: true },
                    { text: '5 devis / mois', limit: true },
                    { text: 'Données stockées 1 an', limit: true },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid #f59e0b', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ width: 6, height: 2, backgroundColor: '#f59e0b', borderRadius: 1 }} />
                      </div>
                      <span style={{ fontSize: '13px', color: '#666' }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Pack de démarrage — visible seulement si jamais abonné ── */}
        {!loading && !status?.started_at && (
        <div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 12px' }}>
            Pack de démarrage
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#fff', borderRadius: '16px',
            border: '1.5px solid #1E88E5', padding: '18px 24px',
          }}>
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#1E88E5' }}>Welcome</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="#1E88E5" fill="#1E88E5" />
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>Offre pro</span>
              <span style={{ fontSize: '15px', color: '#555' }}>1 mois offert</span>
            </div>
            <button style={{
              backgroundColor: 'transparent', border: 'none',
              fontSize: '15px', fontWeight: '700', color: '#1E88E5',
              cursor: 'pointer', letterSpacing: '0.5px',
            }}>
              GRATUIT
            </button>
          </div>
        </div>
        )}

        {/* ── Passer à l'offre premium ── */}
        <div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 16px' }}>
            Passer à l'offre premium
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start', maxWidth: '860px', margin: '0 auto' }}>

            {/* ── Offre Pro ── */}
            <div style={{ borderRadius: '24px' }}>
              {/* Zone "Recommandé" — bleu clair, coins arrondis seulement en haut */}
              <div style={{
                backgroundColor: '#E3F2FD',
                borderRadius: '24px 24px 0 0',
                padding: '8px 16px 20px',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E88E5' }}>
                  Recommandé
                </span>
              </div>

              {/* Carte bleue qui remonte de 15px — coins haut: 18, bas: 24 */}
              <div style={{
                backgroundColor: '#1E88E5',
                borderRadius: '18px 18px 24px 24px',
                padding: '20px 24px 24px',
                color: '#fff',
                marginTop: '-15px',
              }}>
                {/* Titre + badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>Offre Pro</span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    backgroundColor: '#fff', borderRadius: '20px',
                    padding: '6px 14px', fontSize: '13px', fontWeight: '600', color: '#1E88E5',
                  }}>
                    <Zap size={13} color="#1E88E5" fill="#1E88E5" /> premium
                  </div>
                </div>

                {/* Slogan */}
                <h2 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.2 }}>
                  Je pilote mon<br />business
                </h2>

                {/* Features */}
                <div style={{ marginBottom: '20px' }}>
                  <CheckItem text="Opérations illimitées" light />
                  <CheckItem text="Données stockées 10 ans" light />
                  <CheckItem text="Supprime les publicités" light />
                  <CheckItem text="Support prioritaire VIP" light />
                </div>

                {/* Bientôt disponibles */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', opacity: 0.7, margin: '0 0 8px' }}>
                    Bientôt disponibles
                  </p>
                  <CheckItem text="Relances automatiques" light />
                  <CheckItem text="Dashboard avancé" light />
                  <CheckItem text="Statistiques détaillées" light />
                </div>

                {/* Sélecteur de prix */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {proPrices.map(({ key, label, price, sub }) => (
                    <CycleButton
                      key={key}
                      label={label}
                      price={price}
                      perMonth={sub}
                      selected={selectedPro === key}
                      onSelect={() => setSelectedPro(key)}
                    />
                  ))}
                </div>

                {/* Économie */}
                <p style={{ textAlign: 'center', fontSize: '13px', opacity: 0.85, margin: '0 0 16px', whiteSpace: 'pre-line' }}>
                  {savingsMessage.pro[selectedPro]}
                </p>

                {/* Bouton */}
                <button
                  onClick={() => handleSubscribe('pro', selectedPro)}
                  disabled={paying}
                  style={{
                    width: '100%', padding: '14px',
                    backgroundColor: '#fff', color: '#1E88E5',
                    border: 'none', borderRadius: '14px',
                    fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                  }}
                >
                  {paying ? 'Chargement...' : 'Continuer'}
                </button>
              </div>
            </div>

            {/* ── Offre Basic ── */}
            <div style={{
              backgroundColor: '#fff', borderRadius: '20px',
              border: '1.5px solid #e0e0e0', padding: '24px',
              marginTop: '45px',
            }}>
              {/* Titre + badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111' }}>Offre Basic</span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  border: '1.5px solid #1E88E5', borderRadius: '20px',
                  padding: '4px 12px', fontSize: '13px', fontWeight: '600', color: '#1E88E5',
                }}>
                  <Zap size={13} color="#1E88E5" fill="#1E88E5" /> premium
                </div>
              </div>

              {/* Slogan */}
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#111', margin: '0 0 20px', lineHeight: 1.2 }}>
                Je gère mon<br />business
              </h2>

              {/* Features */}
              <div style={{ marginBottom: '24px' }}>
                <CheckItemBlue text="30 opérations par mois" />
                <CheckItemBlue text="Données stockées 1 an" />
                <CheckItemBlue text="Supprime les publicités" />
                <CheckItemBlue text="Support prioritaire VIP" />
              </div>

              {/* Sélecteur de prix */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {basicPrices.map(({ key, label, price, sub }) => (
                  <CycleButton
                    key={key}
                    label={label}
                    price={price}
                    perMonth={sub}
                    selected={selectedBasic === key}
                    onSelect={() => setSelectedBasic(key)}
                  />
                ))}
              </div>

              {/* Économie */}
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#555', margin: '0 0 16px', whiteSpace: 'pre-line' }}>
                {savingsMessage.basic[selectedBasic]}
              </p>

              {/* Bouton */}
              <button
                onClick={() => handleSubscribe('basic', selectedBasic)}
                disabled={paying}
                style={{
                  width: '100%', padding: '14px',
                  backgroundColor: '#1E88E5', color: '#fff',
                  border: 'none', borderRadius: '14px',
                  fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                {paying ? 'Chargement...' : 'Continuer'}
              </button>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

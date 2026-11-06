import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft, ArrowRight, CreditCard, Smartphone, Lock, RefreshCw, Check, AlertTriangle, Crown,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { subscriptionService } from '../services/subscriptionService'
import { getSubscriptionPrice } from '../data/subscriptionPrices'

// ── Parcours de paiement d'un abonnement (KKiaPay), même design que le mobile
//
// 1. Paiement : récapitulatif de l'offre et informations de facturation
// 2. Méthode de paiement : Mobile Money (pays, opérateur, numéro) ou carte
// 3. Widget KKiaPay, ouvert déjà réglé sur ce choix
// 4. Paiement en cours : vérification par le serveur
// 5. Paiement confirmé, ou échec avec « Réessayer » / « Changer de méthode »

const BLUE = '#2563EB'
const BG = '#F6F7F9'
const TEXT = '#111827'
const MUTED = '#6B7280'
const BORDER = '#E5E7EB'
const GREEN = '#16A34A'
const RED = '#DC2626'

// Pays et opérateurs couverts par KKiaPay
const COUNTRIES = [
  { code: 'TG', name: 'Togo', flag: '🇹🇬', dial: '228', operators: [
    { label: 'Moov', badge: 'MV', color: '#0066B3', provider: 'moov-tg' },
    { label: 'Mixx', badge: 'MX', color: '#FFD100', text: TEXT, provider: 'mixx-tg' },
  ] },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', dial: '229', operators: [
    { label: 'MTN', badge: 'MTN', color: '#FFCC00', text: TEXT, provider: 'mtn-bj' },
    { label: 'Moov', badge: 'MV', color: '#0066B3', provider: 'moov-bj' },
    { label: 'Celtiis', badge: 'CE', color: '#00A3E0', provider: 'celtiis-bj' },
  ] },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dial: '225', operators: [
    { label: 'MTN', badge: 'MTN', color: '#FFCC00', text: TEXT, provider: 'mtn-ci' },
    { label: 'Moov', badge: 'MV', color: '#0066B3', provider: 'moov-ci' },
    { label: 'Orange', badge: 'OM', color: '#FF7900', provider: 'orange-ci' },
    { label: 'Wave', badge: 'WV', color: '#1DC8F2', provider: 'wave-ci' },
  ] },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dial: '221', operators: [
    { label: 'Orange', badge: 'OM', color: '#FF7900', provider: 'orange-sn' },
    { label: 'Wave', badge: 'WV', color: '#1DC8F2', provider: 'wave-sn' },
    { label: 'Mixx', badge: 'MX', color: '#FFD100', text: TEXT, provider: 'mixx-sn' },
  ] },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', dial: '227', operators: [
    { label: 'Airtel', badge: 'AT', color: '#E40000', provider: 'airtel-ne' },
  ] },
]

const CYCLES = { monthly: '1 mois', '3months': '3 mois', yearly: '1 an' }

const formatXof = (n) => `${Math.round(n).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} XOF`

/** Retire l'indicatif pays du numéro, s'il y est. */
function localNumber(phone) {
  let digits = (phone || '').replace(/\D/g, '')
  for (const c of COUNTRIES) {
    if (digits.startsWith(c.dial) && digits.length > c.dial.length + 6) {
      digits = digits.slice(c.dial.length)
      break
    }
  }
  return digits
}

// ── Éléments communs ─────────────────────────────────────────────────────────

const card = (selected = false) => ({
  backgroundColor: '#fff',
  borderRadius: 16,
  border: `${selected ? 1.5 : 1}px solid ${selected ? BLUE : BORDER}`,
  padding: 16,
})

const inputStyle = {
  width: '100%', boxSizing: 'border-box', height: 46, padding: '0 14px', fontSize: 15, color: TEXT,
  backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, outline: 'none',
}

const label = { display: 'block', fontSize: 13, color: MUTED, fontWeight: 500, marginBottom: 6 }

function Screen({ title, onBack, children, footer }) {
  return (
    <div style={{ backgroundColor: BG, minHeight: '100%', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', minHeight: 640 }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            {onBack ? (
              <button onClick={onBack} aria-label="Retour" style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <ChevronLeft size={20} color={TEXT} />
              </button>
            ) : <span style={{ width: 36 }} />}
            <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 600, color: TEXT, margin: 0 }}>{title}</h1>
            <span style={{ width: 36 }} />
          </div>
        )}
        <div style={{ flex: 1 }}>{children}</div>
        {footer && <div style={{ marginTop: 24 }}>{footer}</div>}
      </div>
    </div>
  )
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', height: 52, border: 'none', borderRadius: 14, backgroundColor: BLUE, color: '#fff',
      fontSize: 16, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      {children}
    </button>
  )
}

function StatusCircle({ color, children }) {
  return (
    <div style={{
      width: 76, height: 76, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: `${color}14`, border: `1.5px solid ${color}59`,
    }}>
      {children}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, setUser, refreshUser } = useAuthStore()

  const plan = params.get('plan') === 'pro' ? 'pro' : 'basic'
  const cycle = CYCLES[params.get('cycle')] ? params.get('cycle') : 'monthly'
  const amount = getSubscriptionPrice('XOF', plan, cycle)
  const offerTitle = `Offre ${plan === 'pro' ? 'Pro' : 'Basic'} - ${CYCLES[cycle]}`

  const [step, setStep] = useState('info') // info | method | processing | success | failed
  // null = champ pas encore modifié : on affiche la valeur du compte, qui
  // peut arriver après l'ouverture de la page
  const userPhone = user?.phone ?? user?.professional_phone ?? ''
  const [nameInput, setName] = useState(null)
  const [emailInput, setEmail] = useState(null)
  const [phoneInput, setPhone] = useState(null)
  const name = nameInput ?? user?.name ?? ''
  const email = emailInput ?? user?.email ?? ''
  const phone = phoneInput ?? userPhone

  const [momo, setMomo] = useState(true)
  const [country, setCountry] = useState(COUNTRIES[0])
  const [operator, setOperator] = useState(COUNTRIES[0].operators[0])
  const [numberInput, setNumber] = useState(null)
  const number = numberInput ?? localNumber(phone)
  const [paying, setPaying] = useState(false)

  const [reference, setReference] = useState(null)
  const [failure, setFailure] = useState('')

  // Profil incomplet dans le store (ex. session ancienne) : le recharger
  useEffect(() => {
    if (!user?.name) refreshUser?.().catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const methodLabel = momo ? `${operator.label} Mobile Money · ${country.name}` : 'Carte bancaire'

  const goMethod = () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Renseignez votre nom et votre numéro de téléphone')
      return
    }
    setStep('method')
  }

  const fail = (message) => {
    setFailure(message ?? 'La transaction a été refusée par votre opérateur. '
      + 'Veuillez réessayer ou choisir un autre moyen de paiement.')
    setStep('failed')
  }

  // On ne confirme qu'après la vérification de la transaction par le serveur
  const verify = async (transactionId) => {
    setStep('processing')
    setReference(transactionId)
    try {
      await subscriptionService.kkiapayVerify(transactionId, plan, cycle)
      const { data } = await subscriptionService.getStatus()
      // Le badge du site (UserBadge) suit le plan du store
      if (user && data?.plan) setUser({ ...user, plan: data.plan })
      setStep('success')
    } catch {
      fail("Votre paiement n'a pas pu être vérifié. Si vous avez été débité, "
        + `contactez le support avec la référence ${transactionId}.`)
    }
  }

  const pay = () => {
    const digits = number.replace(/\D/g, '')
    if (momo && digits.length < 8) {
      toast.error('Saisissez votre numéro Mobile Money')
      return
    }
    const key = import.meta.env.VITE_KKIAPAY_PUBLIC_KEY
    if (!key || typeof window.openKkiapayWidget !== 'function') {
      toast.error('Paiement indisponible pour le moment, réessayez dans un instant')
      return
    }

    setPaying(true)
    // Les écouteurs du SDK JS sont uniques : les redéfinir remplace les précédents
    window.addSuccessListener?.((response) => {
      setPaying(false)
      window.closeKkiapayWidget?.()
      if (response?.transactionId) verify(response.transactionId)
      else fail()
    })
    window.addFailedListener?.(() => {
      setPaying(false)
      window.closeKkiapayWidget?.()
      fail()
    })
    window.addKkiapayCloseListener?.(() => setPaying(false))

    window.openKkiapayWidget({
      amount,
      key,
      sandbox: import.meta.env.VITE_KKIAPAY_SANDBOX === 'true',
      name,
      email,
      phone: momo ? `${country.dial}${digits}` : undefined,
      reason: `Abonnement BudgetPilot ${offerTitle}`,
      data: JSON.stringify({ plan, cycle }),
      theme: BLUE,
      // Widget pré-réglé sur le choix fait dans notre écran
      paymentmethod: momo ? 'momo' : 'card',
      countries: momo ? [country.code] : undefined,
      providers: momo ? { accept: [operator.provider] } : undefined,
    })
  }

  // ── 1. Paiement ──
  if (step === 'info') {
    return (
      <Screen
        title="Paiement"
        onBack={() => navigate('/subscription')}
        footer={<PrimaryButton onClick={goMethod}>Continuer <ArrowRight size={18} /></PrimaryButton>}
      >
        <div style={card()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={22} color={BLUE} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, color: TEXT }}>{offerTitle}</span>
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}`, margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Total</span>
            <span style={{ fontSize: 19, fontWeight: 700, color: BLUE }}>{formatXof(amount)}</span>
          </div>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 600, color: TEXT, margin: '24px 0 12px' }}>Informations de facturation</h2>
        {[
          ['Nom complet', name, setName, 'text'],
          ['Adresse email', email, setEmail, 'email'],
          ['Numéro de téléphone', phone, setPhone, 'tel'],
        ].map(([text, value, set, type]) => (
          <div key={text} style={{ marginBottom: 14 }}>
            <label style={label}>{text}</label>
            <input type={type} value={value} onChange={(e) => set(e.target.value)} style={inputStyle} />
          </div>
        ))}
      </Screen>
    )
  }

  // ── 2. Méthode de paiement ──
  if (step === 'method') {
    const header = (Icon, title, selected, extra) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={20} color={BLUE} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: TEXT }}>{title}</span>
        {extra}
        {selected && <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: BLUE }} />}
      </div>
    )
    const brand = (text, color) => (
      <span style={{ fontSize: 10, fontWeight: 800, color, backgroundColor: `${color}1A`, padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>{text}</span>
    )

    return (
      <Screen
        title="Méthode de paiement"
        onBack={() => setStep('info')}
        footer={(
          <PrimaryButton onClick={pay} disabled={paying}>
            {paying ? 'Ouverture du paiement...' : <>Payer maintenant <CreditCard size={18} /></>}
          </PrimaryButton>
        )}
      >
        <div style={{ ...card(!momo), cursor: 'pointer' }} onClick={() => setMomo(false)}>
          {header(CreditCard, 'Carte bancaire', !momo, <>{brand('VISA', '#1A1F71')}{brand('MC', '#EB001B')}</>)}
          {!momo && (
            <p style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: MUTED, margin: '12px 0 0' }}>
              <Lock size={16} /> Vous saisirez votre carte sur la page sécurisée KKiaPay.
            </p>
          )}
        </div>

        <div style={{ ...card(momo), marginTop: 16, cursor: momo ? 'default' : 'pointer' }} onClick={() => !momo && setMomo(true)}>
          {header(Smartphone, 'Mobile Money', momo)}
          {momo && (
            <>
              <label style={{ ...label, marginTop: 16 }}>Pays</label>
              <select
                value={country.code}
                onChange={(e) => {
                  const c = COUNTRIES.find((x) => x.code === e.target.value)
                  setCountry(c)
                  setOperator(c.operators[0])
                }}
                style={{ ...inputStyle, backgroundColor: BG, border: 'none', cursor: 'pointer' }}
              >
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag}  {c.name}</option>)}
              </select>

              <label style={{ ...label, marginTop: 16 }}>Opérateurs</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {country.operators.map((op) => {
                  const selected = op.provider === operator.provider
                  return (
                    <button key={op.provider} onClick={() => setOperator(op)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer',
                      borderRadius: 10, backgroundColor: selected ? '#FFF7E6' : '#fff',
                      border: `${selected ? 1.5 : 1}px solid ${selected ? '#F5A623' : BORDER}`,
                    }}>
                      <span style={{
                        width: 28, height: 22, borderRadius: 5, backgroundColor: op.color, color: op.text ?? '#fff',
                        fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{op.badge}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{op.label}</span>
                    </button>
                  )
                })}
              </div>

              <label style={{ ...label, marginTop: 16 }}>Numéro Mobile Money (+{country.dial})</label>
              <input
                type="tel"
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^\d ]/g, ''))}
                style={inputStyle}
              />
            </>
          )}
        </div>
      </Screen>
    )
  }

  // ── 4. Paiement en cours ──
  if (step === 'processing') {
    return (
      <Screen>
        <div style={{ textAlign: 'center', paddingTop: 160 }}>
          <StatusCircle color={BLUE}>
            <RefreshCw size={32} color={BLUE} style={{ animation: 'bp-spin 1s linear infinite' }} />
          </StatusCircle>
          <style>{'@keyframes bp-spin { to { transform: rotate(360deg) } }'}</style>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: TEXT, margin: '20px 0 8px' }}>Paiement en cours...</h2>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>Veuillez patienter, ne fermez pas la page.</p>
        </div>
      </Screen>
    )
  }

  // ── 5a. Paiement confirmé ──
  if (step === 'success') {
    const row = (text, value, color = TEXT) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', fontSize: 13 }}>
        <span style={{ color: MUTED }}>{text}</span>
        <span style={{ fontWeight: 600, color, textAlign: 'right' }}>{value}</span>
      </div>
    )
    return (
      <Screen footer={<PrimaryButton onClick={() => navigate('/dashboard')}>Retour à l'accueil</PrimaryButton>}>
        <div style={{ textAlign: 'center', paddingTop: 120 }}>
          <StatusCircle color={GREEN}><Check size={36} color={GREEN} /></StatusCircle>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: TEXT, margin: '20px 0 8px' }}>Paiement confirmé !</h2>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>Votre abonnement {plan === 'pro' ? 'Pro' : 'Basic'} est activé.</p>
          <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '8px 16px', marginTop: 24, textAlign: 'left' }}>
            {row('Référence', reference ?? '-')}
            {row('Moyen de paiement', methodLabel)}
            {row('Montant payé', formatXof(amount), BLUE)}
          </div>
        </div>
      </Screen>
    )
  }

  // ── 5b. Échec du paiement ──
  return (
    <Screen
      footer={(
        <>
          <PrimaryButton onClick={pay} disabled={paying}>Réessayer <RefreshCw size={18} /></PrimaryButton>
          <button onClick={() => setStep('method')} style={{
            display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: BLUE,
            textDecoration: 'underline', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            Changer de méthode
          </button>
        </>
      )}
    >
      <div style={{ textAlign: 'center', paddingTop: 140 }}>
        <StatusCircle color={RED}><AlertTriangle size={34} color={RED} /></StatusCircle>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: TEXT, margin: '20px 0 8px' }}>Échec du paiement</h2>
        <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.5 }}>{failure}</p>
      </div>
    </Screen>
  )
}

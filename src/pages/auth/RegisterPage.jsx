import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { X, Eye, EyeOff, User, Lock, Phone, Mail } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import GoogleAuthButton from '../../components/ui/GoogleAuthButton'

// ─── Composants partagés ────────────────────────────────────────────────────

/** Champ blanc arrondi avec icône, focus bleu, croix rouge */
function Field({ label, value, onChange, type = 'text', placeholder, error, icon: Icon }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '7px' }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `2px solid ${error ? '#FF1744' : focused ? '#1E88E5' : '#e0e0e0'}`,
        borderRadius: '25px', padding: '0 16px',
        backgroundColor: '#fff', transition: 'border-color 0.2s',
      }}>
        {/* Icône correspondante */}
        {Icon && <Icon size={16} color="#1E88E5" style={{ flexShrink: 0, marginRight: '10px' }} />}
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#111', fontWeight: '500', padding: '13px 0', backgroundColor: 'transparent' }}
        />
        {isPassword && value && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#90CAF9', display: 'flex', padding: '2px' }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {!isPassword && value && (
          <button type="button" onClick={() => onChange('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF1744', display: 'flex', padding: '2px' }}>
            <X size={16} />
          </button>
        )}
      </div>
      {error && <p style={{ color: '#FF1744', fontSize: '12px', marginTop: '5px', paddingLeft: '16px' }}>{error}</p>}
    </div>
  )
}

/** Champ blanc sur fond bleu avec icône */
function FieldBlue({ label, value, onChange, type = 'text', placeholder, error, icon: Icon }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '400', color: 'rgba(255,255,255,0.8)', marginBottom: '7px' }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `2px solid ${error ? '#FF1744' : 'transparent'}`,
        borderRadius: '25px', padding: '0 20px',
        backgroundColor: '#fff', transition: 'border-color 0.2s',
      }}>
        {Icon && <Icon size={16} color="#1E88E5" style={{ flexShrink: 0, marginRight: '10px' }} />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: '14px', color: '#111', fontWeight: '500',
            padding: '14px 0', backgroundColor: 'transparent',
          }}
        />
      </div>
      {error && <p style={{ color: '#FF8A65', fontSize: '12px', marginTop: '5px', paddingLeft: '16px' }}>{error}</p>}
    </div>
  )
}

/** Bouton principal bleu arrondi */
function BtnPrimary({ children, onClick, loading, type = 'button', fullWidth = true }) {
  return (
    <button type={type} onClick={onClick} disabled={loading}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '14px 32px', backgroundColor: loading ? '#90CAF9' : '#1E88E5',
        color: '#fff', border: 'none', borderRadius: '25px',
        fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s', letterSpacing: '0.3px',
      }}>
      {loading ? 'Chargement...' : children}
    </button>
  )
}

/** Bouton blanc semi-transparent (fond bleu) */
function BtnWhiteGhost({ children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: '14px 32px', backgroundColor: 'rgba(255,255,255,0.25)',
        color: '#fff', border: 'none', borderRadius: '25px',
        fontSize: '15px', fontWeight: '700', cursor: 'pointer',
      }}>
      {children}
    </button>
  )
}

/** Bouton outline blanc (fond bleu) */
function BtnOutlineWhite({ children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        flex: 1, padding: '14px', backgroundColor: 'transparent',
        color: '#fff', border: '2px solid #fff', borderRadius: '25px',
        fontSize: '15px', fontWeight: '700', cursor: 'pointer',
      }}>
      {children}
    </button>
  )
}

/** Séparateur "Ou alors" */
function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0' }}>
      <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
      <span style={{ padding: '0 14px', fontSize: '13px', color: '#9e9e9e' }}>Ou alors</span>
      <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
    </div>
  )
}

// ─── Étape 1 : Identifiant + MDP + Confirmation ──────────────────────────────

function Step1({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!data.name || data.name.length < 3) e.name = 'Minimum 3 caractères'
    if (!data.password || data.password.length < 6) e.password = 'Minimum 6 caractères'
    if (data.password !== data.password_confirmation) e.password_confirmation = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validate()) onNext() }

  return (
    /* Carte blanche sur fond bleu — même layout que l'image */
    <div style={{ padding: '4px 0' }}>
      <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '28px' }}>
        Inscrivez-vous
      </h2>

      <Field label="Identifiant" value={data.name} onChange={v => onChange('name', v)}
        placeholder="Nom de l'utilisateur" error={errors.name} icon={User} />
      <Field label="Mot de passe" value={data.password} onChange={v => onChange('password', v)}
        type="password" placeholder="Mot de passe" error={errors.password} icon={Lock} />
      <Field label="Confirmer le mot de passe" value={data.password_confirmation}
        onChange={v => onChange('password_confirmation', v)}
        type="password" placeholder="Confirmer mot de passe" error={errors.password_confirmation} icon={Lock} />

      <BtnPrimary onClick={handleNext}>Suivant</BtnPrimary>

      <Divider />

      {/* Bouton Google */}
      <GoogleAuthButton label="S'inscrire avec Google" style={{ marginBottom: '16px' }} />

      <p style={{ textAlign: 'center', fontSize: '13px', color: '#757575', marginTop: '8px' }}>
        Déjà un compte ?{' '}
        <Link to="/login" style={{ color: '#1E88E5', fontWeight: '600', textDecoration: 'none' }}>
          Se connecter
        </Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        <Link to="/terms" style={{ fontSize: '12px', color: '#9e9e9e', textDecoration: 'underline' }}>
          Termes & Conditions
        </Link>
      </p>
    </div>
  )
}

// ─── Étape 2 : Page complète fusionnée (avatar + infos + contacts + CGU) ─────

function Step2({ data, onChange, onSubmit, onBack, loading }) {
  const [errors, setErrors] = useState({})
  const [acceptTerms, setAcceptTerms] = useState(false)

  const avatars = [
    { id: 'male1',   label: 'Homme', src: '/avatars/male_1.jpg' },
    { id: 'female1', label: 'Femme', src: '/avatars/female_1.jpg' },
  ]

  const validate = () => {
    const e = {}
    if (!data.lastName)  e.lastName  = 'Requis'
    if (!data.firstName) e.firstName = 'Requis'
    if (!data.phone)     e.phone     = 'Téléphone requis'
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Email invalide'
    if (!acceptTerms)    e.terms     = 'Vous devez accepter les CGU'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => { if (validate()) onSubmit() }

  return (
    <div style={{ minHeight: '142.86vh', backgroundColor: '#1E88E5', position: 'relative', overflowX: 'hidden' }}>

      {/* ── Décorations SVG aux coins ── */}
      {/* Haut gauche */}
      <img src="/splash-illu-2.svg" alt="" style={{
        position: 'fixed', top: '80px', left: '-80px',
        width: '320px', opacity: 0.9, pointerEvents: 'none', zIndex: 0,
        transform: 'rotate(-80deg)',
      }} />
      {/* Haut droite */}
      <img src="/splash-illu-3.svg" alt="" style={{
        position: 'fixed', top: '30px', right: '40px',
        width: '170px', opacity: 1.55, pointerEvents: 'none', zIndex: 0,
        transform: 'rotate(10deg)',
      }} />
      {/* Bas droite */}
      <img src="/splash-illu-1.svg" alt="" style={{
        position: 'fixed', bottom: '-20px', right: '-20px',
        width: '140px', opacity: 1.55, pointerEvents: 'none', zIndex: 0,
        transform: 'rotate(-15deg)',
      }} />

      {/* ── Contenu scrollable centré ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '520px', margin: '0 auto',
        padding: '48px 32px 60px',
      }}>

        {/* ── Section Avatar ── */}
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', lineHeight: 1.2, marginBottom: '20px' }}>
          Choisissez<br />votre Avatar
        </h2>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          {avatars.map(av => {
            const selected = data.avatar_id === av.id
            return (
              <div key={av.id} onClick={() => onChange('avatar_id', av.id)}
                style={{
                  flex: 1, height: '280px', borderRadius: '18px',
                  border: `${selected ? 4 : 2}px solid ${selected ? '#fff' : 'rgba(255,255,255,0.35)'}`,
                  overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  boxShadow: selected ? '0 0 20px rgba(255,255,255,0.5)' : '0 2px 8px rgba(0,0,0,0.15)',
                  backgroundColor: '#fff',
                }}>
                <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#1E88E5' }}>
                  {av.label}
                </div>
                <img src={av.src} alt={av.label}
                  style={{ width: '100%', height: 'calc(100% - 32px)', objectFit: 'cover' }} />
                {selected && (
                  <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'rgba(30,136,229,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '20px', color: '#1E88E5' }}>✓</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Section Informations Générales ── */}
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', lineHeight: 1.2, marginBottom: '20px' }}>
          Informations<br />Générales
        </h2>

        <FieldBlue label="Nom" value={data.lastName} onChange={v => onChange('lastName', v)}
          placeholder="Votre nom" error={errors.lastName} icon={User} />
        <FieldBlue label="Prénom" value={data.firstName} onChange={v => onChange('firstName', v)}
          placeholder="Votre prénom" error={errors.firstName} icon={User} />
        <FieldBlue label="Téléphone" value={data.phone} onChange={v => onChange('phone', v)}
          type="tel" placeholder="Votre numéro de téléphone" error={errors.phone} icon={Phone} />
        <FieldBlue label="E-mail" value={data.email} onChange={v => onChange('email', v)}
          type="email" placeholder="Votre adresse mail" error={errors.email} icon={Mail} />



        {/* ── Section CGU ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Conditions générales</span>
            <Link to="/terms" style={{ fontSize: '13px', color: '#f5f0eeff', fontWeight: '600', textDecoration: 'underline' }}>
              Lire les termes
            </Link>
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <div onClick={() => setAcceptTerms(v => !v)}
              style={{
                width: '20px', height: '20px', flexShrink: 0, marginTop: '2px',
                border: '2px solid rgba(255,255,255,0.8)', borderRadius: '4px',
                backgroundColor: acceptTerms ? '#fff' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {acceptTerms && <span style={{ color: '#1E88E5', fontSize: '13px', fontWeight: '700' }}>✓</span>}
            </div>
            <span style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5 }}>
              J'accepte les conditions générales d'utilisation
            </span>
          </label>
          {errors.terms && <p style={{ color: '#FF8A65', fontSize: '12px', marginTop: '6px' }}>{errors.terms}</p>}
        </div>

        {/* ── Bouton Terminer ── */}
        <button type="button" onClick={handleSubmit} disabled={loading}
          style={{
            width: '100%', padding: '15px',
            backgroundColor: 'rgba(255,255,255,0.25)',
            color: '#fff', border: 'none', borderRadius: '25px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.3px',
          }}>
          {loading ? 'Inscription...' : 'Terminer'}
        </button>
      </div>

      {/* ── Logo bas gauche ── */}
      <div style={{
        position: 'fixed', bottom: '24px', left: '28px',
        display: 'flex', alignItems: 'flex-end', gap: '10px', zIndex: 1,
      }}>
        <img src="/logo-b.svg" alt="Budget Pilot" style={{ width: '32px', height: '42px', opacity: 0.9 }} />
        <span style={{ color: '#fff', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: 1, paddingBottom: '2px', opacity: 0.9 }}>
          Pilot
        </span>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', password: '', password_confirmation: '',
    firstName: '', lastName: '',
    avatar_id: 'male1',
    phone: '', email: '', activity: '',
  })

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
        activity: form.activity,
        avatar_id: form.avatar_id,
        gender: form.avatar_id?.startsWith('female') ? 'female' : 'male',
      }
      await register(payload)
      toast.success('Compte créé ! 1 mois Pro offert 🎉')
      navigate('/dashboard')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const first = Object.values(apiErrors)[0]?.[0]
        toast.error(first || "Erreur lors de l'inscription")
      } else {
        toast.error(err.response?.data?.message || "Erreur lors de l'inscription")
      }
      // Revenir à l'étape concernée si erreur sur champs étape 1
      if (apiErrors?.name || apiErrors?.password) setStep(1)
      else if (apiErrors?.phone || apiErrors?.email) setStep(4)
    } finally {
      setLoading(false)
    }
  }

  // Étape 2 — page complète fusionnée (plein écran bleu)
  if (step === 2) return <Step2 data={form} onChange={set} onSubmit={handleSubmit} onBack={() => setStep(1)} loading={loading} />

  // Étape 1 — fond bleu + carte blanche centrée
  return (
    <div style={{
      minHeight: '142.86vh', backgroundColor: '#1E88E5',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '32px' }}>
        <img src="/logo-b.svg" alt="Budget Pilot" style={{ width: '44px', height: '58px' }} />
        <span style={{ color: '#fff', fontSize: '42px', fontWeight: '700', fontFamily: "'Inter', sans-serif", letterSpacing: '-1px', lineHeight: 1, paddingBottom: '3px' }}>
          Pilot
        </span>
      </div>
      {/* Carte blanche */}
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px', padding: '36px 32px 28px',
        width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <Step1 data={form} onChange={set} onNext={() => setStep(2)} />
      </div>
    </div>
  )
}

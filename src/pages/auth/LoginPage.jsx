import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { User, Lock, Eye, EyeOff, Mail } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import GoogleAuthButton from '../../components/ui/GoogleAuthButton'

// ─── Champ de saisie stylisé ─────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, error, icon: Icon }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', color: '#222', marginBottom: '8px' }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `2px solid ${error ? '#FF1744' : focused ? '#1E88E5' : '#e0e0e0'}`,
        borderRadius: '25px', padding: '0 16px',
        backgroundColor: '#fff', transition: 'border-color 0.2s',
      }}>
        {Icon && <Icon size={18} color="#1E88E5" style={{ flexShrink: 0, marginRight: '10px' }} />}
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: '15px', color: '#333', padding: '14px 0',
            backgroundColor: 'transparent',
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9e9e9e', display: 'flex', padding: '2px' }}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p style={{ color: '#FF1744', fontSize: '12px', marginTop: '5px', paddingLeft: '16px' }}>{error}</p>}
    </div>
  )
}

// ─── Page Login ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({ identifier: '', password: '' })

  const set = (field) => (val) => setForm(p => ({ ...p, [field]: val }))

  // Détection auto du type d'identifiant
  const getIdentifierType = (val) => {
    if (/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val)) return 'email'
    if (/^[\+]?[0-9\s\-\(\)]{8,}$/.test(val.replace(' ', ''))) return 'phone'
    return 'username'
  }

  const getPlaceholder = () => {
    const t = getIdentifierType(form.identifier)
    if (t === 'email') return 'Adresse e-mail'
    if (t === 'phone') return 'Numéro de téléphone'
    return "Nom de l'utilisateur"
  }

  const validate = () => {
    const e = {}
    if (!form.identifier) e.identifier = 'Identifiant requis'
    if (!form.password) e.password = 'Mot de passe requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(form.identifier, getIdentifierType(form.identifier), form.password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.errors?.identifier?.[0]
        || err.response?.data?.message
        || 'Identifiants incorrects'
      toast.error(msg)
      setErrors({ identifier: ' ', password: ' ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '133.33vh', backgroundColor: '#1E88E5',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 16px',
    }}>
      {/* Logo B Pilot centré en haut */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '32px' }}>
        <img src="/logo-b.svg" alt="Budget Pilot" style={{ width: '44px', height: '58px' }} />
        <span style={{
          color: '#fff', fontSize: '42px', fontWeight: '700',
          fontFamily: "'Inter', sans-serif", letterSpacing: '-1px',
          lineHeight: 1, paddingBottom: '3px',
        }}>
          Pilot
        </span>
      </div>

      {/* Carte blanche centrée */}
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px',
        padding: '36px 32px 28px', width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <form onSubmit={handleSubmit}>
          {/* Titre */}
          <h2 style={{
            textAlign: 'center', fontSize: '26px', fontWeight: '600',
            color: '#111', marginBottom: '32px', marginTop: '8px',
          }}>
            Connectez-vous
          </h2>

          {/* Bouton "Se connecter par Email" */}
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            style={{
              width: '100%', padding: '15px', marginBottom: '4px',
              backgroundColor: '#1E88E5', color: '#fff',
              border: 'none', borderRadius: '25px',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Mail size={18} />
            {showForm ? 'Masquer le formulaire' : 'Se connecter par Email'}
          </button>

          {/* Champs — visibles si showForm */}
          {showForm && (
            <div style={{ marginTop: '20px' }}>
              <Field
                label="Identifiant"
                value={form.identifier}
                onChange={set('identifier')}
                placeholder={getPlaceholder()}
                error={errors.identifier}
                icon={User}
              />
              <Field
                label="Mot de passe"
                value={form.password}
                onChange={set('password')}
                type="password"
                placeholder="Mot de passe"
                error={errors.password}
                icon={Lock}
              />

              {/* Mot de passe oublié */}
              <div style={{ marginBottom: '24px' }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '14px', color: '#757575', textDecoration: 'underline' }}
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Bouton Se connecter */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '15px',
                  background: 'linear-gradient(to right, #1E88E5, #1976D2)',
                  color: '#fff', border: 'none', borderRadius: '25px',
                  fontSize: '15px', fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(30,136,229,0.3)',
                  marginBottom: '8px',
                }}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          )}

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
            <span style={{ padding: '0 16px', fontSize: '13px', color: '#9e9e9e' }}>Ou alors</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
          </div>

          {/* Bouton Google */}
          <GoogleAuthButton style={{ marginBottom: '32px' }} />

          {/* Lien inscription */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#757575' }}>
            Vous n'avez pas de compte ?{' '}
            <Link to="/register" style={{ color: '#1E88E5', fontWeight: '600', textDecoration: 'none' }}>
              S'inscrire
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

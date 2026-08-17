import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import useAdminAuthStore from '../../store/adminAuthStore'

// Image mockup phones — utilise l'asset existant du projet
const HERO_IMG = '/admin_hero.png' // à placer dans public/ — fallback si absent

export default function AdminLoginPage() {
  const navigate  = useNavigate()
  const { adminLogin } = useAdminAuthStore()

  const [form, setForm]               = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [errors, setErrors]           = useState({})

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Identifiant requis'
    if (!form.password) e.password = 'Mot de passe requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await adminLogin(form.email, form.password)
      navigate('/admin/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Identifiants incorrects'
      toast.error(msg)
      setErrors({ email: ' ', password: ' ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      position: 'fixed',
      inset: 0,
      fontFamily: "'Inter', sans-serif",
      backgroundColor: '#fff',
      overflow: 'hidden',
      zoom: 1 / 0.70,  // neutralise le zoom: 0.70 du body global
    }}>

      {/* ── Colonne gauche — formulaire ───────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 64px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        backgroundColor: '#fff',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
          <img
            src="/Logo_app2.png"
            alt="Budget Pilot"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#111', letterSpacing: '-0.3px' }}>
            Budget Pilot
          </span>
        </div>

        {/* Titre */}
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', marginBottom: '4px', lineHeight: 1.2 }}>
          Espace admin
        </h1>
        <p style={{ fontSize: '15px', color: '#888', marginBottom: '40px' }}>
          Se connecter
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>

          {/* Identifiant */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
              Identifiant
            </label>
            <input
              type="text"
              value={form.email}
              onChange={set('email')}
              placeholder=""
              autoComplete="username"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 16px',
                border: `1.5px solid ${errors.email ? '#FF1744' : '#e0e0e0'}`,
                borderRadius: '10px',
                fontSize: '15px',
                color: '#333',
                outline: 'none',
                backgroundColor: '#fff',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = errors.email ? '#FF1744' : '#1E88E5' }}
              onBlur={(e)  => { e.target.style.borderColor = errors.email ? '#FF1744' : '#e0e0e0' }}
            />
            {errors.email && errors.email.trim() && (
              <p style={{ color: '#FF1744', fontSize: '12px', marginTop: '5px', paddingLeft: '4px' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '13px 48px 13px 16px',
                  border: `1.5px solid ${errors.password ? '#FF1744' : '#e0e0e0'}`,
                  borderRadius: '10px',
                  fontSize: '15px',
                  color: '#333',
                  outline: 'none',
                  backgroundColor: '#fff',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = errors.password ? '#FF1744' : '#1E88E5' }}
                onBlur={(e)  => { e.target.style.borderColor = errors.password ? '#FF1744' : '#e0e0e0' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff size={18} color="#aaa" />
                  : <Eye    size={18} color="#aaa" />
                }
              </button>
            </div>
            {errors.password && errors.password.trim() && (
              <p style={{ color: '#FF1744', fontSize: '12px', marginTop: '5px', paddingLeft: '4px' }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Bouton Valider */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '160px',
              padding: '14px 32px',
              backgroundColor: '#1E88E5',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              transition: 'opacity 0.2s',
              letterSpacing: '0.2px',
            }}
          >
            {loading ? 'Connexion...' : 'Valider'}
          </button>

        </form>
      </div>

      {/* ── Colonne droite — image hero ───────────────────────────────────── */}
      <div style={{
        flex: 1,
        backgroundColor: '#e8ecf0',
        overflow: 'hidden',
        minHeight: '100vh',
        position: 'relative',
      }}>
        <img
          src={HERO_IMG}
          alt="Budget Pilot App"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      </div>

    </div>
  )
}

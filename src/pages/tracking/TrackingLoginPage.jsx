import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import useTrackingAuthStore from '../../store/trackingAuthStore'

export default function TrackingLoginPage() {
  const navigate = useNavigate()
  const { trackingLogin } = useTrackingAuthStore()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.identifier || !form.password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    try {
      await trackingLogin(form.identifier, form.password)
      navigate('/tracking/analyses')
    } catch {
      toast.error('Identifiant ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#f0f0f0',
      overflowY: 'auto',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '80px',
      paddingBottom: '40px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '480px', padding: '0 16px' }}>

        {/* Logo + nom + mascotte */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '10px',
              backgroundColor: '#555',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: '700', color: '#fff',
            }}>
              G
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600', color: '#222' }}>
              getdenis
            </span>
          </div>
          {/* Mascotte denis_hi */}
          <img
            src="/denis_hi.png"
            alt="Denis"
            style={{ width: 110, height: 110, objectFit: 'contain' }}
          />
        </div>

        {/* Carte */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '40px 36px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>
            Se connecter
          </h1>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '32px' }}>
            En vous connectant vous acceptez nos{' '}
            <span style={{ color: '#E65100', fontWeight: '500', cursor: 'pointer' }}>
              Termes &amp; Conditions
            </span>
          </p>

          <form onSubmit={handleSubmit}>
            {/* Votre ID */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '15px', fontWeight: '500', color: '#222', display: 'block', marginBottom: '8px' }}>
                Votre ID
              </label>
              <input
                type="text"
                value={form.identifier}
                onChange={(e) => setForm(p => ({ ...p, identifier: e.target.value }))}
                placeholder="XDU-8919"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 16px',
                  border: '2px solid #E65100',
                  borderRadius: '10px',
                  fontSize: '15px', color: '#333',
                  outline: 'none', backgroundColor: '#fff',
                }}
              />
              <p style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>
                Le code vous a été envoyé par mail
              </p>
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '15px', fontWeight: '500', color: '#222', display: 'block', marginBottom: '8px' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Entrez votre mot de passe"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '14px 48px 14px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '15px', color: '#333',
                    outline: 'none', backgroundColor: '#fff',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    width: '28px', height: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'transparent',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  {showPassword
                    ? <EyeOff size={20} color="#888" />
                    : <Eye size={20} color="#888" />
                  }
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>
                Un mot de passe provisoire vous a été envoyé par mail
              </p>
              <p style={{ fontSize: '13px', color: '#222', fontWeight: '600', marginTop: '4px', cursor: 'pointer' }}>
                Mot de passe oublié ?
              </p>
            </div>

            {/* Bouton valider */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '32px',
                padding: '16px',
                backgroundColor: '#E65100',
                color: '#fff',
                border: 'none',
                borderRadius: '50px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Connexion...' : 'Valider'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

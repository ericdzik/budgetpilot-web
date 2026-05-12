import { useGoogleLogin } from '@react-oauth/google'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * Bouton "Continuer avec Google" réutilisable
 * Utilise le flux OAuth popup de Google, récupère le profil via l'API Google,
 * puis envoie les infos au backend /auth/google
 */
export default function GoogleAuthButton({ label = 'Continuer avec Google', style = {} }) {
  const navigate = useNavigate()
  const { googleLogin } = useAuthStore()

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Récupérer le profil Google avec l'access_token
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const profile = await res.json()

        // Envoyer au backend
        await googleLogin({
          google_id: profile.sub,
          email: profile.email,
          name: profile.name,
          avatar_url: profile.picture,
        })

        toast.success('Connexion réussie 🎉')
        navigate('/dashboard')
      } catch (err) {
        const msg = err.response?.data?.message || 'Erreur lors de la connexion Google'
        toast.error(msg)
      }
    },
    onError: () => {
      toast.error('Connexion Google annulée ou échouée')
    },
  })

  return (
    <button
      type="button"
      onClick={() => login()}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '14px 20px',
        border: '1.5px solid #e0e0e0',
        borderRadius: '25px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        color: '#222',
        transition: 'background 0.15s',
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
    >
      <img src="/google-logo.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
      {label}
    </button>
  )
}

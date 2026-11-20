import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import useCompanyStore from '../store/companyStore'
import { teamService } from '../services/teamService'
import { PillButton } from '../components/team/teamUi'
import { BLUE, ICON_BG, ICON_GREY, ROLE_LABELS } from '../components/team/teamConstants'
import { pendingInvite } from '../utils/pendingInvite'

const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.budget.budgetpilot'
const APP_STORE = 'https://apps.apple.com/app/b-pilote/id6760863629'

/**
 * Page ouverte par le lien d'invitation (/join?code=…). Publique : on voit l'invitation avant de se connecter.
 * Connecté : on confirme puis on rejoint. Sinon : connexion ou inscription, puis retour ici.
 */
export default function JoinInvitationPage() {
  const [params] = useSearchParams()
  const code = (params.get('code') || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { load, switchTo } = useCompanyStore()
  const [invite, setInvite] = useState(null)
  const [state, setState] = useState(code ? 'loading' : 'invalid')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!code) return
    teamService.preview(code)
      .then(({ data }) => { setInvite(data); setState('ready') })
      .catch(() => setState('invalid'))
  }, [code])

  // Le code est gardé le temps de se connecter ou de créer un compte
  useEffect(() => {
    if (state === 'ready' && !isAuthenticated) pendingInvite.set(code)
  }, [state, isAuthenticated, code])

  const join = async () => {
    setBusy(true)
    setError(null)
    try {
      const { data } = await teamService.accept(code)
      pendingInvite.clear()
      await load()
      await switchTo(data.company.id)
      toast.success(`Vous avez rejoint ${data.company.name}. Profil : ${ROLE_LABELS[data.company.role] ?? data.company.role}.`)
      navigate('/dashboard')
    } catch (e) {
      if (e.response?.data?.code === 'already_member') pendingInvite.clear()
      setError(e.response?.data?.message || "Impossible de rejoindre l'entreprise. Vérifiez votre connexion.")
    } finally {
      setBusy(false)
    }
  }

  const shell = (children) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#F5F8FD', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 28, border: '1px solid #E8EFFA', padding: 32, boxSizing: 'border-box', boxShadow: '0 6px 18px rgba(30,111,224,0.07)' }}>
        {children}
      </div>
    </div>
  )

  if (state === 'loading') return shell(<p style={{ margin: 0, color: '#757575' }}>Chargement de l'invitation…</p>)

  if (state === 'invalid') {
    return shell(
      <>
        <p style={{ margin: '0 0 10px', fontSize: 24, fontWeight: '700', color: '#111' }}>Invitation introuvable</p>
        <p style={{ margin: '0 0 24px', fontSize: 17, color: '#757575', lineHeight: 1.5 }}>
          Ce lien est invalide, expiré ou a déjà été utilisé. Demandez à la personne qui vous a invité de vous en envoyer un nouveau.
        </p>
        <Link to={isAuthenticated ? '/dashboard' : '/login'} style={{ textDecoration: 'none' }}>
          <PillButton style={{ width: '100%' }}>{isAuthenticated ? 'Retour au tableau de bord' : 'Se connecter'}</PillButton>
        </Link>
      </>,
    )
  }

  return shell(
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: ICON_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={30} color={ICON_GREY} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, color: '#757575' }}>{invite.inviter} vous invite à rejoindre</p>
          <p style={{ margin: '2px 0 0', fontSize: 26, fontWeight: '700', color: '#111', wordBreak: 'break-word' }}>{invite.company}</p>
        </div>
      </div>
      <p style={{ margin: '0 0 24px', fontSize: 18, color: '#444' }}>
        Profil proposé : <strong>{invite.role_label}</strong>
      </p>
      {invite.email_hint && (
        <p style={{ margin: '0 0 20px', fontSize: 15, color: '#757575', lineHeight: 1.4 }}>
          Cette invitation est réservée à l'adresse {invite.email_hint}. Connectez-vous avec cette adresse.
        </p>
      )}
      {error && <p style={{ margin: '0 0 16px', fontSize: 16, color: '#c62828' }}>{error}</p>}

      {isAuthenticated ? (
        <PillButton onClick={join} disabled={busy} style={{ width: '100%', backgroundColor: BLUE }}>
          {busy ? 'Un instant…' : "Rejoindre l'entreprise"}
        </PillButton>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/login" style={{ textDecoration: 'none' }}><PillButton style={{ width: '100%' }}>Se connecter</PillButton></Link>
          <Link to="/register" style={{ textDecoration: 'none' }}><PillButton outline style={{ width: '100%' }}>Créer un compte</PillButton></Link>
        </div>
      )}

      <div style={{ marginTop: 26, paddingTop: 20, borderTop: '1px solid #EEF1F6', fontSize: 15, color: '#757575', lineHeight: 1.7 }}>
        <a href={`budgetpilot://join/${code}`} style={{ color: BLUE, fontWeight: '600' }}>Ouvrir dans l'application</a>
        <span> · </span>
        <a href={PLAY_STORE} style={{ color: BLUE }}>Android</a>
        <span> · </span>
        <a href={APP_STORE} style={{ color: BLUE }}>iPhone</a>
        <br />
        Code d'invitation : <strong style={{ letterSpacing: 2, color: '#111' }}>{code}</strong>
      </div>
    </>,
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { toast } from 'react-hot-toast'
import UserBadge from '../components/ui/UserBadge'
import useCompanyStore from '../store/companyStore'
import { teamService } from '../services/teamService'
import { BackButton, PillButton } from '../components/team/teamUi'
import { BLUE, GUTTER, ICON_BG, ICON_GREY, ROLE_LABELS } from '../components/team/teamConstants'

/** Rejoindre une entreprise avec le code d'invitation reçu par e-mail. */
export default function JoinCompanyPage() {
  const navigate = useNavigate()
  const { load, switchTo } = useCompanyStore()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const join = async () => {
    if (code.trim().length < 6) return setError('Entrez le code reçu par e-mail')
    setBusy(true)
    setError(null)
    try {
      const { data } = await teamService.accept(code.trim())
      await load()
      await switchTo(data.company.id)
      toast.success(`Vous avez rejoint ${data.company.name}. Profil : ${ROLE_LABELS[data.company.role] ?? data.company.role}.`)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Impossible de valider le code. Vérifiez votre connexion.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: `18px ${GUTTER}` }}>
        <BackButton onClick={() => navigate('/companies')} />
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: '700', color: '#111', margin: 0, flex: 1 }}>Rejoindre une entreprise</h1>
        <UserBadge size={48} />
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '56vh', padding: `8px ${GUTTER} 48px` }}>
        <div style={{
          width: '100%', maxWidth: 680, backgroundColor: '#fff', borderRadius: 30, border: '1px solid #E8EFFA',
          padding: 36, boxSizing: 'border-box', boxShadow: '0 6px 18px rgba(30,111,224,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', backgroundColor: ICON_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={34} color={ICON_GREY} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 26, fontWeight: '700', color: '#111' }}>Code d'invitation</p>
              <p style={{ margin: '4px 0 0', fontSize: 18, color: '#757575' }}>Reçu par e-mail, valable 7 jours</p>
            </div>
          </div>
          <p style={{ margin: '0 0 22px', fontSize: 19, lineHeight: 1.5, color: '#757575' }}>
            Il ne fonctionne qu'avec l'adresse e-mail de votre compte.
          </p>
          <input
            value={code} autoFocus maxLength={8} placeholder="Code d'invitation"
            onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && join()}
            style={{
              width: '100%', boxSizing: 'border-box', height: 74, borderRadius: 40, border: '1px solid #D6E4F7', padding: '0 26px',
              fontSize: 30, fontWeight: '600', letterSpacing: 8, textAlign: 'center', outline: 'none',
            }}
          />
          {error && <p style={{ margin: '16px 4px 0', fontSize: 18, color: '#c62828' }}>{error}</p>}
          <PillButton onClick={join} disabled={busy} style={{ width: '100%', marginTop: 28, backgroundColor: BLUE, fontSize: 21, padding: '19px 28px' }}>
            {busy ? 'Vérification…' : 'Rejoindre'}
          </PillButton>
        </div>
      </div>
    </div>
  )
}

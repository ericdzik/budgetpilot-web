import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, Info, Mail, Send, ShieldCheck, User, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import UserBadge from '../components/ui/UserBadge'
import useCompanyStore from '../store/companyStore'
import { teamService } from '../services/teamService'
import { BackButton, PillButton } from '../components/team/teamUi'
import { BLUE, GUTTER, ICON_BG, ICON_GREY, ROLE_LABELS, SOFT_BLUE } from '../components/team/teamConstants'

const FIELD_BORDER = '#D6E4F7'
const LABELS = ['Informations', 'Rôle', 'Confirmation']

/** Nouvel utilisateur en trois étapes : e-mail, rôle, confirmation. */
export default function InviteTeamPage() {
  const { id } = useParams()
  const companyId = Number(id)
  const navigate = useNavigate()
  const company = useCompanyStore((s) => s.companies.find((c) => c.id === companyId))
  const [roles, setRoles] = useState(null)
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('employee')
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  // Profils proposés par l'offre, l'employé d'abord
  useEffect(() => {
    teamService.members(companyId)
      .then(({ data }) => {
        const available = data.roles_available
        const ordered = [...available.filter((r) => r === 'employee'), ...available.filter((r) => r !== 'employee')]
        setRoles(ordered)
        if (ordered.length) setRole(ordered[0])
      })
      .catch((e) => setError(e.response?.data?.message || "Impossible de charger l'équipe."))
  }, [companyId])

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  const next = () => {
    if (step === 0 && !emailValid) return setError('Entrez une adresse e-mail valide')
    setError(null)
    setStep(step + 1)
  }

  const back = () => {
    setError(null)
    if (step === 0) navigate(`/team/${companyId}`)
    else setStep(step - 1)
  }

  const send = async () => {
    setSending(true)
    setError(null)
    try {
      await teamService.invite(companyId, { email: email.trim(), role })
      toast.success(`Invitation envoyée. Un code a été envoyé à ${email.trim()}.`)
      navigate(`/team/${companyId}`)
    } catch (e) {
      setError(e.response?.data?.message || "Impossible d'envoyer l'invitation. Vérifiez votre connexion.")
    } finally {
      setSending(false)
    }
  }

  const stepper = (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {LABELS.map((label, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, fontWeight: '600', backgroundColor: done || active ? BLUE : SOFT_BLUE, color: done || active ? '#fff' : BLUE,
                boxShadow: active ? '0 0 0 4px #BBD6FF' : 'none',
              }}>
                {done ? <Check size={18} /> : i + 1}
              </div>
              {i < 2 && <div style={{ flex: 1, height: 2, margin: '0 8px', backgroundColor: i < step ? BLUE : FIELD_BORDER }} />}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {LABELS.map((label, i) => (
          <span key={label} style={{ fontSize: 16, fontWeight: i === step ? '600' : '400', color: i === step ? BLUE : '#757575' }}>{label}</span>
        ))}
      </div>
    </div>
  )

  const box = (icon, title, subtitle, children) => (
    <div style={{
      backgroundColor: '#fff', borderRadius: 28, border: '1px solid #E8EFFA', padding: 30, width: '100%', boxSizing: 'border-box',
      boxShadow: '0 6px 18px rgba(30,111,224,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: ICON_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <p style={{ margin: 0, fontSize: 24, fontWeight: '700', color: '#111' }}>{title}</p>
          {subtitle && <p style={{ margin: '4px 0 0', fontSize: 17, color: '#757575' }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )

  const stepEmail = box(<User size={26} color={ICON_GREY} />, 'Adresse e-mail', null, (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', height: 68, borderRadius: 36,
      border: `1px solid ${FIELD_BORDER}`, backgroundColor: '#fff', marginBottom: 8,
    }}>
      <Mail size={22} color={ICON_GREY} />
      <input
        type="email" value={email} autoFocus placeholder="Adresse e-mail *"
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && next()}
        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 20, backgroundColor: 'transparent' }}
      />
    </label>
  ))

  const roleCard = (r) => {
    const on = r === role
    const manager = r === 'manager'
    return (
      <button key={r} onClick={() => setRole(r)} style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: 12, marginBottom: 14, borderRadius: 22, backgroundColor: on ? '#EAF2FF' : '#fff',
        border: on ? `1.6px solid ${BLUE}` : '1px solid #E3EAF5',
      }}>
        <div style={{ position: 'relative', width: 92, height: 84, flexShrink: 0 }}>
          <img
            src={manager ? '/avatars/female_1.jpg' : '/avatars/male_1.jpg'} alt=""
            style={{ position: 'absolute', left: 0, bottom: 0, width: 78, height: 78, borderRadius: '50%', objectFit: 'cover', backgroundColor: '#fff' }}
          />
          <span style={{
            position: 'absolute', right: 0, top: 0, width: 34, height: 34, borderRadius: '50%', backgroundColor: ICON_BG,
            border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {manager ? <ShieldCheck size={18} color={ICON_GREY} /> : <Users size={18} color={ICON_GREY} />}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 23, fontWeight: '700', color: '#111' }}>{ROLE_LABELS[r]}</p>
          <p style={{ margin: '6px 0 0', fontSize: 17, lineHeight: 1.4, color: '#757575' }}>
            {manager ? "Voit toutes les opérations et gère les employés de l'entreprise." : 'Accès limité : saisit et suit ses propres opérations.'}
          </p>
        </div>
        <span style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: on ? BLUE : 'transparent', border: on ? 'none' : '1.5px solid #C9D6EA',
        }}>
          {on && <Check size={18} color="#fff" />}
        </span>
      </button>
    )
  }

  const infoBanner = (text, bold) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: '#EEF4FF' }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: ICON_GREY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Info size={18} color="#fff" />
      </span>
      <span style={{ fontSize: 17, color: '#555', lineHeight: 1.4 }}>
        {bold && <strong style={{ color: '#1E5BB8', fontWeight: '500' }}>{bold}</strong>}{text}
      </span>
    </div>
  )

  const stepRole = box(<ShieldCheck size={28} color={ICON_GREY} />, "Rôle dans l'entreprise", 'Choisissez le rôle de ce nouvel utilisateur', (
    <>
      {/* Le responsable d'abord, comme sur la maquette */}
      {[...(roles ?? []).filter((r) => r === 'manager'), ...(roles ?? []).filter((r) => r !== 'manager')].map(roleCard)}
      {infoBanner(" plus tard, depuis l'équipe.", 'Vous pourrez modifier ce rôle')}
    </>
  ))

  const info = (label, value) => (
    <div style={{ marginBottom: 20 }}>
      <p style={{ margin: 0, fontSize: 16, color: '#757575' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: '500', color: '#111', wordBreak: 'break-all' }}>{value}</p>
    </div>
  )

  const stepConfirm = (
    <div style={{ textAlign: 'center' }}>
      {/* Carte d'identité inclinée avec une coche */}
      <div style={{ position: 'relative', width: 150, height: 96, margin: '0 auto 22px', transform: 'rotate(-6deg)', backgroundColor: '#fff', borderRadius: 18, border: '3px solid #BBD6FF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#E3EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={28} color={BLUE} /></div>
        <div>{[46, 36, 24].map((w) => <div key={w} style={{ width: w, height: 6, borderRadius: 3, backgroundColor: '#BBD6FF', margin: '5px 0' }} />)}</div>
        <div style={{ position: 'absolute', right: -16, bottom: -16, width: 46, height: 46, borderRadius: '50%', backgroundColor: BLUE, border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={26} color="#fff" /></div>
      </div>
      <p style={{ margin: 0, fontSize: 34, fontWeight: '700', color: '#111' }}>Confirmation</p>
      <p style={{ margin: '10px auto 28px', fontSize: 18, lineHeight: 1.45, color: '#757575', maxWidth: 440 }}>
        Vérifiez les informations avant d'envoyer l'invitation à cet utilisateur.
      </p>
      <div style={{ textAlign: 'left', backgroundColor: '#fff', borderRadius: 26, border: '1px solid #E8EFFA', padding: 18, boxShadow: '0 6px 18px rgba(30,111,224,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
          <img src={role === 'manager' ? '/avatars/female_1.jpg' : '/avatars/male_1.jpg'} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', backgroundColor: '#D6E8FF', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {info('E-mail', email.trim())}
            <div style={{ marginBottom: 0 }}>{info('Profil', `${ROLE_LABELS[role]} · ${company?.name ?? ''}`)}</div>
          </div>
        </div>
        {infoBanner('Un code valable 7 jours est envoyé par e-mail.')}
      </div>
    </div>
  )

  const last = step === 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: `18px ${GUTTER}` }}>
        <BackButton onClick={back} />
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: '700', color: '#111', margin: 0, flex: 1 }}>Nouvel utilisateur</h1>
        <UserBadge size={48} />
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: `8px ${GUTTER} 32px` }}>
        <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column' }}>
          {stepper}
          <div style={{ flex: 1, display: 'flex', alignItems: step === 0 ? 'center' : 'flex-start', minHeight: step === 0 ? '46vh' : 0 }}>
            <div style={{ width: '100%' }}>
              {roles === null && !error && <p style={{ color: '#757575' }}>Chargement…</p>}
              {roles !== null && (step === 0 ? stepEmail : step === 1 ? stepRole : stepConfirm)}
              {error && <p style={{ margin: '16px 4px 0', fontSize: 18, color: '#c62828' }}>{error}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
            {step > 0 && <PillButton outline onClick={back} disabled={sending} style={{ flex: 1 }}>Retour</PillButton>}
            <PillButton onClick={last ? send : next} disabled={sending || roles === null} style={{ flex: step > 0 ? 2 : 1 }}>
              {last ? <><Send size={18} /> {sending ? 'Envoi…' : "Envoyer l'invitation"}</> : 'Suivant'}
            </PillButton>
          </div>
        </div>
      </div>
    </div>
  )
}

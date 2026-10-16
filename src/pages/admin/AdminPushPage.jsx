import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Send, Clock, X } from 'lucide-react'
import { adminService } from '../../services/adminService'

// Espace « Notifications push » du compte dev : rédiger, cibler, envoyer tout
// de suite ou programmer, et suivre l'historique. Ces envois ne comptent pas
// dans les plafonds hebdomadaires des push automatiques.

const BLUE = '#1E88E5'

const TARGETS = [
  { key: 'all', label: 'Tous' },
  { key: 'plan', label: 'Abonnement' },
  { key: 'platform', label: 'Plateforme' },
  { key: 'user', label: 'Un utilisateur' },
]
const PLANS = [
  { key: 'freemium', label: 'Gratuit' },
  { key: 'basic', label: 'Basic' },
  { key: 'pro', label: 'Pro' },
]
const PLATFORMS = [
  { key: 'android', label: 'Android' },
  { key: 'ios', label: 'iPhone' },
]
// Écran ouvert au toucher de la notification (mêmes chemins sur mobile et web)
const ROUTES = [
  { key: '', label: 'Aucun (ouvre l\'app)' },
  { key: '/dashboard', label: 'Tableau de bord' },
  { key: '/history', label: 'Suivi' },
  { key: '/stats', label: 'Statistiques' },
  { key: '/clients', label: 'Clients' },
  { key: '/subscription', label: 'Abonnements' },
  { key: '/progress', label: 'Mes progrès' },
  { key: '/referral', label: 'Parrainage' },
]
const STATUS = {
  scheduled: { label: 'Programmée', color: '#B98500', bg: '#FBF1D6' },
  sending: { label: 'En cours', color: '#185FA5', bg: '#E6F1FB' },
  sent: { label: 'Envoyée', color: '#0F6E56', bg: '#E1F5EE' },
  cancelled: { label: 'Annulée', color: '#888780', bg: '#F1EFE8' },
}

const card = { backgroundColor: '#fff', borderRadius: 16, border: '1px solid #ebebeb', padding: 20 }
const label = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }
const input = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 14, borderRadius: 10,
  border: '1px solid #dcdcdc', outline: 'none', fontFamily: 'inherit',
}

function Chips({ items, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((item) => {
        const active = item.key === value
        return (
          <button key={item.key} type="button" onClick={() => onChange(item.key)} style={{
            padding: '7px 14px', borderRadius: 50, fontSize: 13, cursor: 'pointer',
            border: `1px solid ${active ? BLUE : '#dcdcdc'}`, backgroundColor: active ? '#E3F2FD' : '#fff',
            color: active ? BLUE : '#555', fontWeight: active ? 600 : 400,
          }}>
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

function targetLabel(campaign) {
  const { target_type: type, target_value: value } = campaign
  if (type === 'all') return 'Tous'
  if (type === 'plan') return `Abonnement ${PLANS.find((p) => p.key === value)?.label ?? value}`
  if (type === 'platform') return PLATFORMS.find((p) => p.key === value)?.label ?? value
  return value
}

const fmt = (iso) => iso
  ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—'

export default function AdminPushPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [route, setRoute] = useState('/dashboard')
  const [targetType, setTargetType] = useState('all')
  const [plan, setPlan] = useState('pro')
  const [platform, setPlatform] = useState('android')
  const [email, setEmail] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  const [recipients, setRecipients] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)

  const targetValue = { plan, platform, user: email.trim() }[targetType] ?? null
  const target = { target_type: targetType, target_value: targetType === 'all' ? null : targetValue }

  const loadCampaigns = () => adminService.getPushCampaigns()
    .then(({ data }) => setCampaigns(data.campaigns || []))
    .catch(() => toast.error('Impossible de charger l\'historique'))

  useEffect(() => { loadCampaigns() }, [])

  // Nombre de destinataires, recalculé quand la cible change
  useEffect(() => {
    if (targetType === 'user' && !/^\S+@\S+\.\S+$/.test(email.trim())) return undefined
    const timer = setTimeout(() => {
      adminService.previewPush({ target_type: targetType, target_value: targetType === 'all' ? null : targetValue })
        .then(({ data }) => setRecipients(data.recipients))
        .catch(() => setRecipients(null))
    }, 300)
    return () => clearTimeout(timer)
  }, [targetType, targetValue, email])

  const shownRecipients = targetType === 'user' && !/^\S+@\S+\.\S+$/.test(email.trim()) ? null : recipients

  const validate = () => {
    if (!title.trim() || !body.trim()) return 'Renseignez le titre et le message'
    if (targetType === 'user' && !/^\S+@\S+\.\S+$/.test(email.trim())) return 'Saisissez l\'e-mail de l\'utilisateur'
    if (scheduled && (!scheduledAt || new Date(scheduledAt) <= new Date())) return 'Choisissez une date à venir'
    if (shownRecipients === 0) return 'Aucun destinataire avec un appareil enregistré'
    return null
  }

  const askConfirm = () => {
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }
    setConfirming(true)
  }

  const send = async () => {
    setSending(true)
    try {
      await adminService.sendPush({
        title: title.trim(),
        body: body.trim(),
        route: route || null,
        ...target,
        scheduled_at: scheduled ? new Date(scheduledAt).toISOString() : null,
      })
      toast.success(scheduled ? 'Notification programmée' : 'Notification en cours d\'envoi')
      setConfirming(false)
      setTitle('')
      setBody('')
      setScheduled(false)
      setScheduledAt('')
      loadCampaigns()
      // L'envoi immédiat se fait juste après la réponse : on rafraîchit le bilan
      if (!scheduled) setTimeout(loadCampaigns, 4000)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Envoi impossible')
    } finally {
      setSending(false)
    }
  }

  const cancel = async (id) => {
    try {
      await adminService.cancelPush(id)
      toast.success('Envoi programmé annulé')
      loadCampaigns()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Annulation impossible')
    }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Notifications push</h1>
      <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>
        Envoyez une notification aux utilisateurs de l'app, tout de suite ou à une date programmée.
      </p>

      {/* Formulaire et aperçu côte à côte, l'un sous l'autre sur écran étroit */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* ── Formulaire ── */}
        <div style={{ ...card, flex: '1 1 380px', minWidth: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Titre <span style={{ color: '#aaa', fontWeight: 400 }}>({title.length}/120)</span></label>
            <input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} style={input} placeholder="Nouveauté dans BudgetPilot" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Message <span style={{ color: '#aaa', fontWeight: 400 }}>({body.length}/500)</span></label>
            <textarea value={body} maxLength={500} rows={3} onChange={(e) => setBody(e.target.value)} style={{ ...input, resize: 'vertical' }} placeholder="Découvrez vos badges dans Mes progrès." />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Destinataires</label>
            <Chips items={TARGETS} value={targetType} onChange={setTargetType} />
            <div style={{ marginTop: 10 }}>
              {targetType === 'plan' && <Chips items={PLANS} value={plan} onChange={setPlan} />}
              {targetType === 'platform' && <Chips items={PLATFORMS} value={platform} onChange={setPlatform} />}
              {targetType === 'user' && (
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} placeholder="e-mail de l'utilisateur" />
              )}
            </div>
            <div style={{ fontSize: 13, color: shownRecipients === 0 ? '#C62828' : '#666', marginTop: 8 }}>
              {shownRecipients == null ? '…' : `${shownRecipients} destinataire${shownRecipients > 1 ? 's' : ''} avec un appareil enregistré`}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Écran ouvert au toucher</label>
            <select value={route} onChange={(e) => setRoute(e.target.value)} style={{ ...input, backgroundColor: '#fff' }}>
              {ROUTES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Envoi</label>
            <Chips
              items={[{ key: 'now', label: 'Maintenant' }, { key: 'later', label: 'Programmer' }]}
              value={scheduled ? 'later' : 'now'}
              onChange={(key) => setScheduled(key === 'later')}
            />
            {scheduled && (
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={{ ...input, marginTop: 10, maxWidth: 260 }} />
            )}
          </div>

          <button onClick={askConfirm} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 50,
            border: 'none', backgroundColor: BLUE, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
            {scheduled ? <Clock size={17} /> : <Send size={17} />}
            {scheduled ? 'Programmer l\'envoi' : 'Envoyer'}
          </button>
        </div>

        {/* ── Aperçu sur téléphone ── */}
        <div style={{ flex: '0 1 300px', minWidth: 240 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 }}>Aperçu</div>
          <div style={{ backgroundColor: '#1f2937', borderRadius: 28, padding: '40px 12px 60px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#666', marginBottom: 4 }}>
                <img src="/Logo_app2.png" alt="" style={{ width: 14, height: 14 }} /> BudgetPilot · maintenant
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111' }}>{title || 'Titre de la notification'}</div>
              <div style={{ fontSize: 12.5, color: '#444', marginTop: 2, whiteSpace: 'pre-line' }}>{body || 'Votre message apparaîtra ici.'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Historique ── */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '32px 0 12px' }}>Historique</h2>
      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        {campaigns.length === 0 ? (
          <div style={{ padding: 24, color: '#888', fontSize: 14 }}>Aucune notification envoyée pour l'instant.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa', color: '#888', textAlign: 'left' }}>
                {['Date', 'Notification', 'Cible', 'Statut', 'Résultat', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const status = STATUS[c.status] || STATUS.sent
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#555' }}>{fmt(c.sent_at || c.scheduled_at)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#111' }}>{c.title}</div>
                      <div style={{ color: '#888', maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.body}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#555' }}>{targetLabel(c)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ backgroundColor: status.bg, color: status.color, borderRadius: 50, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#555', whiteSpace: 'nowrap' }}>
                      {c.status === 'sent'
                        ? `${c.success_count} envoyée${c.success_count > 1 ? 's' : ''}${c.failure_count ? ` · ${c.failure_count} échec${c.failure_count > 1 ? 's' : ''}` : ''}`
                        : `${c.recipients_count} destinataire${c.recipients_count > 1 ? 's' : ''}`}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {c.status === 'scheduled' && (
                        <button onClick={() => cancel(c.id)} style={{ background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontWeight: 600 }}>
                          Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Confirmation ── */}
      {confirming && (
        <div onClick={() => !sending && setConfirming(false)} style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <h3 style={{ flex: 1, margin: 0, fontSize: 18, color: '#111' }}>
                {scheduled ? 'Programmer cette notification ?' : 'Envoyer cette notification ?'}
              </h3>
              <button onClick={() => setConfirming(false)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#888" />
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5 }}>
              « {title} » sera {scheduled ? `envoyée le ${fmt(new Date(scheduledAt).toISOString())}` : 'envoyée tout de suite'} à{' '}
              <strong>{shownRecipients ?? '?'} utilisateur{shownRecipients > 1 ? 's' : ''}</strong> ({targetLabel(target)}).
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setConfirming(false)} disabled={sending} style={{ padding: '10px 18px', borderRadius: 50, border: '1px solid #dcdcdc', background: '#fff', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={send} disabled={sending} style={{ padding: '10px 18px', borderRadius: 50, border: 'none', backgroundColor: BLUE, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                {sending ? 'Envoi…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

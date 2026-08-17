import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { toast } from 'react-hot-toast'

// ── Constantes ────────────────────────────────────────────────────────────────

const CHURN_CONFIG = {
  low:     { label: 'Faible',  color: '#43A047', bg: '#E8F5E9' },
  medium:  { label: 'Moyen',   color: '#FF9800', bg: '#FFF3E0' },
  high:    { label: 'Élevé',   color: '#FF1744', bg: '#FFEBEE' },
  churned: { label: 'Churné',  color: '#757575', bg: '#F5F5F5' },
}

const CHURN_OPTIONS = [
  { value: '',        label: 'Automatique (calculé)' },
  { value: 'low',     label: '🟢 Faible' },
  { value: 'medium',  label: '🟠 Moyen' },
  { value: 'high',    label: '🔴 Élevé' },
  { value: 'churned', label: '⚫ Churné' },
]

const PLAN_COLORS = {
  pro:      { bg: '#E3F2FD', color: '#1E88E5' },
  basic:    { bg: '#E8F5E9', color: '#43A047' },
  freemium: { bg: '#F5F5F5', color: '#9E9E9E' },
  welcome:  { bg: '#FFF3E0', color: '#FF9800' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt  = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.') : '—'
const fmtN = (n) => n != null ? Number(n).toLocaleString('fr-FR') : '—'

function cycleDuration(cycle) {
  if (!cycle) return '—'
  if (cycle === 'monthly' || cycle === '1_month') return '1 mois'
  if (cycle === 'quarterly' || cycle === '3_months' || cycle === '3months') return '3 mois'
  if (cycle === 'yearly' || cycle === '12_months') return '1 an'
  if (cycle === 'welcome') return 'Welcome'
  return cycle
}

function paymentSource(source) {
  if (!source) return '—'
  if (source === 'semoa') return 'Carte Bleue'
  if (source === 'apple_iap') return 'Apple Pay'
  if (source === 'google_iap') return 'Google Pay'
  return source
}

// ── Composants ────────────────────────────────────────────────────────────────

function Avatar({ name, size = 48, fontSize = 18 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: '#1E88E520',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: '700', color: '#1E88E5', flexShrink: 0,
    }}>
      {(name || 'U')[0].toUpperCase()}
    </div>
  )
}

function CompanyAvatar({ name, size = 48, fontSize = 18 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: '#7C3AED20',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: '700', color: '#7C3AED', flexShrink: 0,
    }}>
      {(name || 'E')[0].toUpperCase()}
    </div>
  )
}

function SectionTitle({ title }) {
  return (
    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 16px' }}>
      {title}
    </h2>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      marginBottom: '20px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function FieldGroup({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
      <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '500', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: '#111', fontWeight: '500', wordBreak: 'break-word' }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '500' }}>{label}</span>
      <span style={{ fontSize: '16px', color: '#111', fontWeight: '700' }}>{value ?? '—'}</span>
    </div>
  )
}

function SubRow({ sub }) {
  // started_at peut être null sur les anciennes données — fallback sur created_at
  const startedAt = sub.started_at || sub.created_at
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1.5fr 1.5fr 1.5fr 1fr',
      gap: '24px',
      padding: '16px 0',
      borderBottom: '1px solid #f5f5f5',
      alignItems: 'center',
    }}>
      <FieldGroup label="Type d'abonnement" value={sub.plan || sub.name} />
      <FieldGroup label="Durée" value={cycleDuration(sub.billing_cycle)} />
      <FieldGroup label="Date de souscription" value={fmt(startedAt)} />
      <FieldGroup label="Date d'expiration" value={fmt(sub.next_billing_at || sub.ends_at)} />
      <FieldGroup label="Moyen de paiement" value={paymentSource(sub.source)} />
      <FieldGroup label="Pays" value={sub.country || '—'} />
    </div>
  )
}

function NoteReadModal({ note, onClose }) {
  const isSupport = note.type === 'support'
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: '#fff', borderRadius: '20px',
        padding: '28px 32px', width: '560px', maxWidth: '95vw',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              backgroundColor: isSupport ? '#FF9800' : '#7C3AED', color: '#fff',
            }}>
              {isSupport ? 'Support' : 'Notes'}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>{fmt(note.created_at)}</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          <p style={{ fontSize: '14px', color: '#333', margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
            {note.content}
          </p>
        </div>
      </div>
    </div>
  )
}

// Titre d'une note (dérivé du contenu structuré)
function noteTitle(note) {
  const c = note.content || ''
  // Support : ligne "Titre : ..."
  const t = c.split('\n').find(l => /^Titre\s*:/i.test(l))
  if (t) return t.replace(/^Titre\s*:\s*/i, '').trim()
  // Note interne : "Titre\n\nContenu"
  const [first, second] = c.split('\n\n')
  if (second && first.trim()) return first.trim()
  // Sans titre explicite : première ligne du contenu
  const firstLine = c.split('\n').find(l => l.trim())
  return firstLine ? firstLine.trim() : '—'
}

// Corps de la note (sans les lignes méta déjà affichées en colonnes)
function noteBody(note) {
  const c = note.content || ''
  const lines = c.split('\n').filter(l => !/^Titre\s*:/i.test(l))
  // Support : afficher seulement la description (retirer Intervenant/Date)
  if (note.type === 'support') {
    return lines.filter(l => !/^(Intervenant|Date)\s*:/i.test(l)).join('\n').trim()
  }
  return lines.join('\n').trim()
}

function NoteEntry({ note }) {
  const [open, setOpen] = useState(false)
  const isSupport = note.type === 'support'
  const isLong = note.content?.length > 200
  const title = noteTitle(note)
  const body = noteBody(note)

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          display: 'grid',
          gridTemplateColumns: '150px 220px 120px 1fr',
          gap: '32px',
          alignItems: 'start',
          padding: '24px 0',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        {/* Col 1 : badge + date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: '50px',
            fontSize: '12px', fontWeight: '600',
            backgroundColor: isSupport ? '#F28C28' : '#6C3EB8', color: '#fff',
            whiteSpace: 'nowrap', alignSelf: 'flex-start',
          }}>
            {isSupport ? 'Support' : 'Notes'}
          </span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>
            {fmt(note.created_at)}
          </span>
        </div>

        {/* Col 2 : titre de l'action */}
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#8A8A8A', paddingTop: '2px' }}>
          Titre : {title}
        </div>

        {/* Col 3 : libellé */}
        <div style={{ fontSize: '13px', color: '#8A8A8A', paddingTop: '2px' }}>
          Informations :
        </div>

        {/* Col 4 : paragraphe descriptif */}
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: '13px', color: '#555', margin: 0, lineHeight: '1.7',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}>
            {body}
          </p>
          {isLong && (
            <span style={{ fontSize: '12px', color: '#1E88E5', marginTop: '6px', display: 'inline-block' }}>
              Voir plus
            </span>
          )}
        </div>
      </div>

      {open && <NoteReadModal note={note} onClose={() => setOpen(false)} />}
    </>
  )
}

// ── Modal ajout de note ───────────────────────────────────────────────────────

function AddNoteModal({ onClose, onAdd }) {
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10))
  const [title, setTitle]     = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving]   = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onAdd({ type: 'note', content: title ? `${title}\n\n${content}` : content })
      onClose() // ferme seulement si succès
    } catch {
      // erreur déjà toastée par le parent — ne pas fermer
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px',
        padding: '32px 36px', width: '520px', maxWidth: '95vw',
        boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
      }}>
        <h3 style={{ margin: '0 0 28px', fontSize: '20px', fontWeight: '700', color: '#111', textAlign: 'center' }}>
          Ajouter une note interne
        </h3>

        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '18px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', width: '60px' }}>Dates</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              border: '1.5px solid #e0e0e0', borderRadius: '50px',
              padding: '8px 16px', fontSize: '14px', outline: 'none',
              backgroundColor: '#f8f8f8', color: '#333',
            }}
          />
        </div>

        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '18px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', width: '60px' }}>Titre</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la note..."
            style={{
              flex: 1, border: 'none', borderBottom: '1.5px dashed #1E88E5',
              padding: '6px 0', fontSize: '14px', outline: 'none',
              backgroundColor: 'transparent', color: '#333',
            }}
          />
        </div>

        {/* Notes */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '28px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', width: '60px', paddingTop: '10px' }}>Notes</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Saisissez votre note..."
            style={{
              flex: 1, padding: '14px', border: '1.5px solid #e8e8e8', borderRadius: '12px',
              fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', outline: 'none',
              backgroundColor: '#f8f8f8', color: '#333',
            }}
          />
        </div>

        {/* Valider */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={saving || !content.trim()}
            style={{
              padding: '13px 52px', borderRadius: '50px', border: 'none',
              backgroundColor: '#1E88E5', color: '#fff',
              fontSize: '16px', fontWeight: '600',
              cursor: saving || !content.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !content.trim() ? 0.6 : 1,
            }}
          >
            {saving ? 'Envoi...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal action support ──────────────────────────────────────────────────────

function ActionSupportModal({ userId, churnManual, onClose, onSave }) {
  const [who, setWho]       = useState('')
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10))
  const [title, setTitle]   = useState('')
  const [besoin, setBesoin] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!besoin.trim()) return
    setSaving(true)
    // Construire le contenu structuré
    const parts = []
    if (who.trim())   parts.push(`Intervenant : ${who.trim()}`)
    if (date)         parts.push(`Date : ${date}`)
    if (title.trim()) parts.push(`Titre : ${title.trim()}`)
    parts.push(besoin.trim())
    const content = parts.join('\n')
    try {
      await onSave({ type: 'support', content })
      onClose()
    } catch {
      // erreur déjà toastée par le parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px',
        padding: '32px 36px', width: '520px', maxWidth: '95vw',
        boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
      }}>
        <h3 style={{ margin: '0 0 28px', fontSize: '20px', fontWeight: '700', color: '#111', textAlign: 'center' }}>
          Ajouter une action support
        </h3>

        {/* Qui */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '18px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', width: '90px' }}>Nom</span>
          <input
            type="text"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="Nom de l'intervenant..."
            style={{
              flex: 1, border: '1.5px solid #e0e0e0', borderRadius: '50px',
              padding: '8px 16px', fontSize: '14px', outline: 'none',
              backgroundColor: '#f8f8f8', color: '#333',
            }}
          />
        </div>

        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '18px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', width: '90px' }}>Dates</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              border: '1.5px solid #e0e0e0', borderRadius: '50px',
              padding: '8px 16px', fontSize: '14px', outline: 'none',
              backgroundColor: '#f8f8f8', color: '#333',
            }}
          />
        </div>

        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '18px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', width: '90px' }}>Titre</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Objet de l'action..."
            style={{
              flex: 1, border: 'none', borderBottom: '1.5px dashed #1E88E5',
              padding: '6px 0', fontSize: '14px', outline: 'none',
              backgroundColor: 'transparent', color: '#333',
            }}
          />
        </div>

        {/* Description */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '28px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', width: '90px', paddingTop: '10px' }}>Description</span>
          <textarea
            value={besoin}
            onChange={(e) => setBesoin(e.target.value)}
            rows={6}
            placeholder="Décrivez l'action effectuée..."
            style={{
              flex: 1, padding: '14px', border: '1.5px solid #e8e8e8', borderRadius: '12px',
              fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', outline: 'none',
              backgroundColor: '#f8f8f8', color: '#333',
            }}
          />
        </div>

        {/* Valider */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '13px 52px', borderRadius: '50px', border: 'none',
              backgroundColor: '#1E88E5', color: '#fff',
              fontSize: '16px', fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Enregistrement...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Score Bpilot ─────────────────────────────────────────────────────────────
// scoreAuto  : calculé par le système (churn → %)  — lecture seule, vert
// scoreManual: saisi par l'admin (0-100)           — cliquable, orange

function BpilotScore({ scoreAuto, scoreManual, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue]     = useState(scoreManual ?? '')
  const inputRef              = useRef(null)
  const [saving, setSaving]   = useState(false)

  // Couleur auto (système)
  const autoNum   = scoreAuto !== null && scoreAuto !== undefined ? Number(scoreAuto) : null
  const autoColor = autoNum === null ? '#9E9E9E'
    : autoNum >= 70 ? '#4CAF50'
    : autoNum >= 40 ? '#FF9800'
    : '#f44336'

  // Badge manuel (orange fixe = bouton d'édition)
  const manualNum = scoreManual !== null && scoreManual !== undefined ? Number(scoreManual) : null

  const openEdit = () => {
    setValue(manualNum ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const save = async () => {
    const n = parseInt(value, 10)
    if (value === '' || isNaN(n) || n < 0 || n > 100) {
      setEditing(false)
      return
    }
    setSaving(true)
    await onSave(n)
    setSaving(false)
    setEditing(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <>
      {/* Badge vert — score système (lecture seule) */}
      <span
        title="Score calculé automatiquement par le système"
        style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '5px 14px', borderRadius: '20px',
          backgroundColor: autoColor, color: '#fff',
          fontSize: '13px', fontWeight: '700', userSelect: 'none',
        }}
      >
        {autoNum !== null ? `${autoNum}%` : '—'}
      </span>

      {/* Badge orange — note admin (cliquable) */}
      {editing ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <input
            ref={inputRef}
            type="number"
            min={0} max={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            onBlur={save}
            disabled={saving}
            style={{
              width: '64px', padding: '4px 10px',
              border: '2px solid #FF9800', borderRadius: '20px',
              fontSize: '13px', fontWeight: '700', textAlign: 'center',
              outline: 'none', color: '#111',
            }}
          />
          <span style={{ fontSize: '11px', color: '#aaa' }}>/100</span>
        </div>
      ) : (
        <button
          onClick={openEdit}
          title="Cliquer pour donner une note (0–100)"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 14px', borderRadius: '20px',
            border: 'none', cursor: 'pointer',
            backgroundColor: '#FF9800', color: '#fff',
            fontSize: '13px', fontWeight: '700',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          {manualNum !== null ? `${manualNum}` : '✎'}
        </button>
      )}
    </>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [user, setUser]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showNoteModal, setShowNoteModal]           = useState(false)
  const [showActionModal, setShowActionModal]       = useState(false)

  const reload = () => {
    setLoading(true)
    adminService.getUserDetail(id)
      .then((r) => setUser(r.data))
      .catch(() => toast.error('Utilisateur introuvable'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [id])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddNote = async (data) => {
    try {
      const r = await adminService.addSupportNote(id, data)
      // Protéger contre un retour inattendu
      if (Array.isArray(r.data.notes)) {
        setUser((u) => ({ ...u, support_notes: r.data.notes }))
      }
      toast.success('Note ajoutée')
    } catch {
      toast.error('Erreur lors de l\'ajout de la note')
      throw new Error('failed') // remonte au modal pour ne pas fermer
    }
  }

  const handleSaveAction = async (data) => {
    try {
      await adminService.updateUser(id, data)
      setUser((u) => ({ ...u, churn_risk_manual: data.churn_risk_manual, churn_risk: data.churn_risk_manual || u.churn_risk }))
      toast.success('Sauvegardé')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
      throw new Error('failed')
    }
  }

  const handleUpdateScore = async (score) => {
    try {
      await adminService.updateUser(id, { bpilot_score_manual: score })
      setUser((u) => ({ ...u, bpilot_score_manual: score }))
      toast.success('Note mise à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour de la note')
    }
  }

  // ── Rendu chargement / erreur ────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <p style={{ color: '#888' }}>Utilisateur introuvable.</p>
        <button onClick={() => navigate('/admin/users')} style={{ marginTop: 16, color: '#1E88E5', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}>
          ← Retour
        </button>
      </div>
    )
  }

  const churnCfg         = CHURN_CONFIG[user.churn_risk] || CHURN_CONFIG.medium
  const planCfg          = PLAN_COLORS[user.plan] || PLAN_COLORS.freemium
  const sub              = user.subscription
  const subHistory       = user.subscription_history || (sub ? [sub] : [])
  const currentSub       = subHistory[0] || null
  const historySubs      = subHistory.slice(1)
  const supportNotes     = Array.isArray(user.support_notes) ? user.support_notes : []
  const referrer         = user.referred_by?.referrer

  // Durée totale abonnement en mois
  const totalMonths      = user.total_subscription_months || subHistory.length
  const totalDuration    = totalMonths > 11
    ? `${Math.round(totalMonths / 12)} an${Math.round(totalMonths / 12) > 1 ? 's' : ''}`
    : totalMonths > 0 ? `${totalMonths} mois` : '—'

  return (
    <div style={{ width: '100%' }}>

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/admin/users')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '20px', padding: 0, lineHeight: 1 }}
        >
          ←
        </button>

        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111', margin: 0 }}>
          Fiche utilisateur
        </h1>

        {/* Score Bpilot — badge lecture (calculé par le système, vert/orange/rouge) */}
        <BpilotScore
          scoreAuto={user.bpilot_score}
          scoreManual={user.bpilot_score_manual}
          onSave={handleUpdateScore}
        />

        {/* Bouton parrain — seulement si l'utilisateur a un parrain */}
        {referrer && (
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => navigate(`/admin/users/${referrer.id}`)}
              style={{
                padding: '9px 20px', border: '1.5px solid #e0e0e0',
                borderRadius: '50px', background: '#fff',
                fontSize: '13px', color: '#555', cursor: 'pointer', fontWeight: '500',
                whiteSpace: 'nowrap', transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1E88E5'; e.currentTarget.style.color = '#1E88E5' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#555' }}
            >
              Voir le parrain
            </button>
            <button
              onClick={() => navigate(`/admin/referrals/${referrer.id}`)}
              style={{
                padding: '9px 20px', border: '1.5px solid #e0e0e0',
                borderRadius: '50px', background: '#fff',
                fontSize: '13px', color: '#555', cursor: 'pointer', fontWeight: '500',
                whiteSpace: 'nowrap', transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1E88E5'; e.currentTarget.style.color = '#1E88E5' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#555' }}
            >
              Fiche parrain
            </button>
          </div>
        )}
      </div>

      {/* ── Information personnel ─────────────────────────────────────────── */}
      <SectionTitle title="Information personnel" />
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Avatar name={user.name} size={52} fontSize={20} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            flex: 1,
          }}>
            <FieldGroup label="Nom complet"          value={user.name} />
            <FieldGroup label="Date d'inscription"   value={fmt(user.created_at)} />
            <FieldGroup label="Numéro de téléphone"  value={user.phone} />
            <FieldGroup label="Adresse email"        value={user.email} />
          </div>
        </div>
      </Card>

      {/* ── Information entreprise ────────────────────────────────────────── */}
      <SectionTitle title="Information entreprise" />
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <CompanyAvatar name={user.company_name} size={52} fontSize={20} />
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              marginBottom: '20px',
            }}>
              <FieldGroup label="Nom complet"          value={user.company_name} />
              <FieldGroup label="Forme juridique"      value={user.legal_form || '—'} />
              <FieldGroup label="Secteur d'activité"   value={user.activity} />
              <FieldGroup label="Adresse professionnelle" value={user.company_address} />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
            }}>
              <FieldGroup label="Numéro fiscal" value={user.nif} />
              <FieldGroup label="Ville et pays"  value={[user.company_city, user.company_country].filter(Boolean).join(', ')} />
              <FieldGroup label="Devise"         value={user.currency} />
              <div />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Abonnement actuel ─────────────────────────────────────────────── */}
      <SectionTitle title="Abonnement actuel" />
      <Card>
        {currentSub ? (
          <SubRow sub={currentSub} />
        ) : (
          <p style={{ color: '#aaa', fontSize: '14px', margin: 0 }}>Aucun abonnement actif</p>
        )}
      </Card>

      {/* ── Historique abonnement ─────────────────────────────────────────── */}
      {historySubs.length > 0 && (
        <>
          <SectionTitle title="Historique abonnement" />
          <Card>
            {historySubs.map((s) => (
              <SubRow key={s.id} sub={s} />
            ))}
          </Card>
        </>
      )}

      {/* ── Utilisation de la plateforme ──────────────────────────────────── */}
      <SectionTitle title="Utilisation de la plateforme" />
      <Card>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '24px',
          marginBottom: '24px',
        }}>
          <StatBox label="Somme dépenses totales"   value={user.total_expenses ? `${fmtN(user.total_expenses)}` : fmtN(user.expenses_count)} />
          <StatBox label="Nombre d'abonnement"      value={fmtN(subHistory.length)} />
          <StatBox label="Durée totale abonnement"  value={totalDuration} />
          <div />
          <div />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '24px',
          marginBottom: '24px',
        }}>
          <StatBox label="Nombre de clients"    value={fmtN(user.clients_count)} />
          <StatBox label="Nombre de devis"      value={fmtN(user.documents_count)} />
          <StatBox label="Nombre de factures"   value={fmtN(user.documents_count)} />
          <StatBox label="Nombre de dépenses"   value={fmtN(user.expenses_count)} />
          <StatBox label="Nombre de recettes"   value={fmtN(user.revenues_count)} />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '24px',
        }}>
          <StatBox label="Chiffre d'affaires total cumulé" value={user.total_revenue_generated ? `${fmtN(user.total_revenue_generated)}` : '—'} />
          <StatBox label="Dernière activité effectuée"     value={fmt(user.last_activity_at)} />
          <div />
          <div />
          <div />
        </div>
      </Card>

      {/* ── Suivi et Notes ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111' }}>
              Suivi et Notes
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#8A8A8A' }}>
              Historique support &amp; Notes
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowNoteModal(true)}
              style={{
                padding: '10px 24px', borderRadius: '50px',
                border: '1.5px solid #000', background: '#fff',
                fontSize: '13px', color: '#111', cursor: 'pointer', fontWeight: '600',
              }}
            >
              Ajouter une note
            </button>
            <button
              onClick={() => setShowActionModal(true)}
              style={{
                padding: '10px 24px', borderRadius: '50px',
                border: 'none', backgroundColor: '#000',
                fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: '600',
              }}
            >
              Action support
            </button>
          </div>
        </div>

        {/* Liste chronologique — grille sans cartes ni ombres */}
        <div style={{ marginTop: '8px' }}>
          {supportNotes.length === 0 ? (
            <p style={{ color: '#ccc', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>
              Aucune note pour l'instant.
            </p>
          ) : (
            [...supportNotes].reverse().map((note, idx) => (
              <NoteEntry key={note.id ?? idx} note={note} />
            ))
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showNoteModal && (
        <AddNoteModal
          onClose={() => setShowNoteModal(false)}
          onAdd={handleAddNote}
        />
      )}
      {showActionModal && (
        <ActionSupportModal
          userId={id}
          churnManual={user.churn_risk_manual || ''}
          onClose={() => setShowActionModal(false)}
          onSave={handleAddNote}
        />
      )}
    </div>
  )
}

import { Copy, Link2, MessageCircle, Share2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PillButton } from './teamUi'
import { BLUE, ICON_BG, ICON_GREY } from './teamConstants'

const copy = async (text, done) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Navigateurs sans accès au presse-papiers : copie par un champ temporaire
    const area = document.createElement('textarea')
    area.value = text
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
  toast.success(done)
}

/**
 * Lien et code d'une invitation, prêts à partager (WhatsApp, SMS, e-mail…).
 * `data` = { code, link, share_message } renvoyé par l'API à la création ou au re-partage.
 */
export default function ShareInvitationDialog({ data, title = 'Invitation prête à partager', onClose }) {
  if (!data) return null
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const share = async () => {
    try {
      await navigator.share({ title: 'Invitation Budget Pilot', text: data.share_message })
    } catch { /* l'utilisateur a fermé le menu de partage */ }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 28, padding: 28, boxSizing: 'border-box', position: 'relative' }}
      >
        <button onClick={onClose} aria-label="Fermer" style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', cursor: 'pointer', padding: 6 }}>
          <X size={22} color={ICON_GREY} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: ICON_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Link2 size={26} color={ICON_GREY} />
          </div>
          <p style={{ margin: 0, fontSize: 22, fontWeight: '700', color: '#111', paddingRight: 28 }}>{title}</p>
        </div>

        <p style={{ margin: '0 0 6px', fontSize: 15, color: '#757575' }}>Lien d'invitation</p>
        <p style={{ margin: 0, padding: '12px 14px', borderRadius: 14, backgroundColor: ICON_BG, fontSize: 15, color: '#222', wordBreak: 'break-all' }}>{data.link}</p>

        <p style={{ margin: '16px 0 6px', fontSize: 15, color: '#757575' }}>Code (si le lien ne s'ouvre pas)</p>
        <p style={{ margin: 0, fontSize: 30, fontWeight: '700', letterSpacing: 6, color: '#111' }}>{data.code}</p>
        <p style={{ margin: '10px 0 22px', fontSize: 14, color: '#757575', lineHeight: 1.4 }}>
          Valable 7 jours. Si vous partagez de nouveau cette invitation, l'ancien lien ne fonctionne plus.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(data.share_message)}`} target="_blank" rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <PillButton style={{ width: '100%', backgroundColor: '#25D366' }}><MessageCircle size={20} /> Envoyer sur WhatsApp</PillButton>
          </a>
          {canShare && <PillButton onClick={share} style={{ width: '100%' }}><Share2 size={20} /> Partager…</PillButton>}
          <PillButton outline onClick={() => copy(data.link, 'Lien copié')} style={{ width: '100%' }}><Copy size={20} /> Copier le lien</PillButton>
          <PillButton outline onClick={() => copy(data.share_message, 'Message copié')} style={{ width: '100%', color: BLUE }}>Copier le message complet</PillButton>
        </div>
      </div>
    </div>
  )
}

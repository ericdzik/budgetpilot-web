import { ArrowLeft } from 'lucide-react'
import { BLUE, SOFT_BLUE, ROLE_LABELS } from './teamConstants'

/** Bouton retour rond de l'application : fond blanc, fine bordure grise, flèche grise. */
export function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Retour"
      style={{
        width: 36, height: 36, borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #9E9E9E',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0,
      }}
    >
      <ArrowLeft size={18} color="#9E9E9E" />
    </button>
  )
}

/** Médaillon rond : initiales ou icône. */
export function Avatar({ text, icon, size = 44, background = '#D0E9FF', color = '#1E88E5' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, backgroundColor: background, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: size * 0.32,
    }}>
      {icon ?? text}
    </div>
  )
}

/** Pastille du profil. */
export function RoleTag({ role }) {
  return (
    <span style={{
      padding: '5px 14px', borderRadius: 16, backgroundColor: SOFT_BLUE, color: BLUE, fontSize: 16,
      fontWeight: '500', whiteSpace: 'nowrap',
    }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

/** Bouton bleu en pilule. */
export function PillButton({ children, onClick, outline = false, disabled = false, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: outline ? `1.5px solid ${BLUE}` : 'none', borderRadius: 50, padding: '13px 28px',
        backgroundColor: outline ? '#fff' : BLUE, color: outline ? BLUE : '#fff',
        fontSize: 18, fontWeight: '600', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.7 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...style,
      }}
    >
      {children}
    </button>
  )
}


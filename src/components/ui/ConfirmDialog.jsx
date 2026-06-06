import { CircleDollarSign, Trash2, AlertTriangle } from 'lucide-react'

const PRIMARY = '#1E88E5'

/**
 * Dialog de confirmation custom
 * Props:
 *  - open: bool
 *  - title: string
 *  - message: string
 *  - confirmLabel: string (défaut: 'Confirmer')
 *  - cancelLabel: string (défaut: 'Annuler')
 *  - confirmColor: string (défaut: '#1E88E5')
 *  - icon: 'pay' | 'delete' | 'warning' (optionnel)
 *  - onConfirm: () => void
 *  - onCancel: () => void
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmColor = PRIMARY,
  icon = 'warning',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const IconComp = icon === 'pay'
    ? <CircleDollarSign size={28} color="#1E88E5" />
    : icon === 'delete'
      ? <Trash2 size={28} color="#e53935" />
      : <AlertTriangle size={28} color="#FF9800" />

  const iconBg = icon === 'pay' ? '#E3F2FD'
    : icon === 'delete' ? '#FFEBEE'
    : '#FFF3E0'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.45)',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '20px',
        padding: '32px 28px', maxWidth: '380px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'fadeInScale 0.15s ease',
      }}>
        {/* Icône */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          {IconComp}
        </div>

        {/* Titre */}
        <h3 style={{
          textAlign: 'center', fontSize: '18px', fontWeight: '700',
          color: '#111', margin: '0 0 10px',
        }}>
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p style={{
            textAlign: 'center', fontSize: '14px', color: '#666',
            margin: '0 0 24px', lineHeight: 1.5,
          }}>
            {message}
          </p>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '12px',
              backgroundColor: '#f5f5f5', color: '#333',
              border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '12px',
              backgroundColor: confirmColor, color: '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

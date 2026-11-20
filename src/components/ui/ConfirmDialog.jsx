import { useState } from 'react'
import { CircleDollarSign, Trash2, AlertTriangle, Store, Download } from 'lucide-react'

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
 *  - icon: 'pay' | 'delete' | 'warning' | 'store' (optionnel)
 *  - requiredText: string (optionnel) — champ de saisie : la confirmation reste grisée
 *    tant que le texte saisi n'est pas identique (suppression d'une entreprise)
 *  - hideCancel: bool (optionnel) — un seul bouton
 *  - extraAction: { label, onClick, busy } (optionnel) — action secondaire au-dessus des boutons
 *    (ex. exporter les données avant une suppression)
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
  requiredText,
  hideCancel = false,
  extraAction,
  onConfirm,
  onCancel,
}) {
  const [typed, setTyped] = useState('')
  if (!open) return null

  const canConfirm = !requiredText || typed.trim() === requiredText
  const close = (callback) => () => { setTyped(''); callback?.() }

  const IconComp = icon === 'pay'
    ? <CircleDollarSign size={36} color="#1E88E5" />
    : icon === 'delete'
      ? <Trash2 size={36} color="#1E88E5" />
      : icon === 'store'
        ? <Store size={36} color="#1E88E5" />
        : <AlertTriangle size={36} color="#FF9800" />

  const iconBg = icon === 'pay' || icon === 'store' ? '#E3F2FD'
    : icon === 'delete' ? '#E3F2FD'
    : '#FFF3E0'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.45)',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '20px',
        padding: '44px 40px', maxWidth: '540px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'fadeInScale 0.15s ease',
      }}>
        {/* Icône */}
        <div style={{
          width: 76, height: 76, borderRadius: '50%',
          backgroundColor: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 22px',
        }}>
          {IconComp}
        </div>

        {/* Titre */}
        <h3 style={{
          textAlign: 'center', fontSize: '27px', fontWeight: '700',
          color: '#111', margin: '0 0 14px',
        }}>
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p style={{
            textAlign: 'center', fontSize: '19px', color: '#666',
            margin: '0 0 32px', lineHeight: 1.5,
          }}>
            {message}
          </p>
        )}

        {requiredText && (
          <div style={{ margin: '0 0 26px' }}>
            <p style={{ fontSize: '17px', color: '#333', margin: '0 0 10px' }}>
              Saisissez « {requiredText} » pour confirmer
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Nom de l'entreprise"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box', padding: '16px 18px',
                border: '1.5px solid #e0e0e0', borderRadius: '14px',
                fontSize: '19px', outline: 'none',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#1E88E5' }}
              onBlur={(e) => { e.target.style.borderColor = '#e0e0e0' }}
            />
          </div>
        )}

        {extraAction && (
          <button
            onClick={extraAction.onClick}
            disabled={extraAction.busy}
            style={{
              width: '100%', margin: '0 0 16px', padding: '15px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, backgroundColor: '#fff', color: '#1E88E5',
              border: '1.5px solid #1E88E5', borderRadius: '14px', fontSize: '18px', fontWeight: '600',
              cursor: extraAction.busy ? 'default' : 'pointer', opacity: extraAction.busy ? 0.6 : 1,
            }}
          >
            <Download size={20} />
            {extraAction.busy ? 'Préparation…' : extraAction.label}
          </button>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {!hideCancel && (
            <button
              onClick={close(onCancel)}
              style={{
                flex: 1, padding: '17px',
                backgroundColor: '#f5f5f5', color: '#333',
                border: 'none', borderRadius: '14px',
                fontSize: '20px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={canConfirm ? close(onConfirm) : undefined}
            disabled={!canConfirm}
            style={{
              flex: 1, padding: '17px',
              backgroundColor: canConfirm ? confirmColor : '#e0e0e0',
              color: canConfirm ? '#fff' : '#9e9e9e',
              border: 'none', borderRadius: '14px',
              fontSize: '20px', fontWeight: '600',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
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

import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer',
  message = 'Êtes-vous sûr de vouloir continuer ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

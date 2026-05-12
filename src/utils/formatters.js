import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Formater un montant en FCFA
 */
export function formatCurrency(amount, currency = 'FCFA') {
  if (amount === null || amount === undefined) return `0 ${currency}`
  return `${Number(amount).toLocaleString('fr-FR')} ${currency}`
}

/**
 * Formater une date ISO en format lisible
 */
export function formatDate(dateStr, pattern = 'dd/MM/yyyy') {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), pattern, { locale: fr })
  } catch {
    return dateStr
  }
}

/**
 * Formater une date relative (ex: "il y a 2 jours")
 */
export function formatDateRelative(dateStr) {
  if (!dateStr) return '—'
  try {
    const date = parseISO(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    return format(date, 'dd MMM yyyy', { locale: fr })
  } catch {
    return dateStr
  }
}

/**
 * Retourner les classes CSS du badge selon le statut
 */
export function getStatusBadgeClass(status) {
  const map = {
    paid: 'badge-paid',
    sent: 'badge-pending',
    draft: 'badge-draft',
    overdue: 'badge-overdue',
    partially_paid: 'badge-pending',
  }
  return map[status] || 'badge-draft'
}

/**
 * Retourner le libellé du statut
 */
export function getStatusLabel(status) {
  const map = {
    paid: 'Payée',
    sent: 'Envoyée',
    draft: 'Brouillon',
    overdue: 'En retard',
    partially_paid: 'Part. payée',
  }
  return map[status] || status
}

/**
 * Tronquer un texte
 */
export function truncate(str, maxLength = 30) {
  if (!str) return ''
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str
}

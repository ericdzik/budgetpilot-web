/**
 * Temps d'abonnement restant en mois civils et en jours (ex. 1 mois 10 jours).
 * Même calcul que l'app mobile (lib/utils/subscription_time.dart).
 */
function addMonths(d, months) {
  const total = d.getMonth() + months
  const year = d.getFullYear() + Math.floor(total / 12)
  const month = ((total % 12) + 12) % 12
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(d.getDate(), lastDay), d.getHours(), d.getMinutes(), d.getSeconds())
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function remainingTime(nextBilling, nowDate = new Date()) {
  const rawEnd = nextBilling ? new Date(nextBilling) : null
  // Comparaison par jour calendaire (sans l'heure), pour éviter « 1 mois 30 jours » à quelques heures près
  const end = rawEnd && !isNaN(rawEnd) ? startOfDay(rawEnd) : null
  const now = startOfDay(nowDate)
  if (!end || end <= now) return { months: 0, days: 0, parts: [], label: '', isEmpty: true }
  let months = (end.getFullYear() - now.getFullYear()) * 12 + end.getMonth() - now.getMonth()
  let anchor = addMonths(now, months)
  if (anchor > end) { months--; anchor = addMonths(now, months) }
  const days = Math.floor((end - anchor) / 86400000)
  const parts = [
    ...(months > 0 ? [{ value: months, unit: 'mois' }] : []),
    ...(days > 0 ? [{ value: days, unit: days > 1 ? 'jours' : 'jour' }] : []),
  ]
  const last = parts.length ? parts[parts.length - 1].value : 0
  return { months, days, parts, isEmpty: parts.length === 0, label: `${parts.map(p => `${p.value} ${p.unit}`).join(' ')} restant${last > 1 ? 's' : ''}` }
}

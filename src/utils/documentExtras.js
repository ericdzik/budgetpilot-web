/**
 * Textes libres imprimés sur un document : description de l'utilisateur et RIB de l'entreprise.
 * - description : champ « Ajouter une description » du formulaire (doc.notes)
 * - rib : RIB de l'entreprise, imprimé seulement si la case « Afficher le RIB » est cochée (doc.show_rib)
 * `reserve` = nombre de lignes d'articles à retirer de la dernière page pour laisser la place.
 */
const CHARS_PER_LINE = 85

const countLines = (text) =>
  text.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0)

export function documentExtras(doc, profile) {
  const note = String(doc?.notes || '').trim()
  const rib = doc?.show_rib ? String(profile?.rib || '').trim() : ''
  // ~11 px par ligne de texte + ~18 px pour le titre et les marges de chaque bloc ; ~24 px par ligne d'article
  const px = (note ? countLines(note) * 11 + 18 : 0) + (rib ? countLines(rib) * 11 + 18 : 0)
  // Paiements enregistrés sur une facture : déjà payé, reste à payer et statut
  const paid = Number(doc?.total_paid) || 0
  let payment = null
  if (doc?.type === 'invoice' && paid > 0.009) {
    const remaining = Math.max(0, doc.remaining_amount != null ? Number(doc.remaining_amount) : Number(doc.total_amount || 0) - paid)
    payment = { paid, remaining, label: remaining <= 0.01 ? 'Payée' : 'En-cours de paiement' }
  }
  const total = px + (payment ? 36 : 0)
  return { note, rib, payment, px: total, reserve: total ? Math.ceil(total / 24) : 0 }
}

/**
 * Libère la place de la note / du RIB sur la dernière page : si elle porte trop de lignes,
 * les dernières passent sur une page de plus. Sans note ni RIB (reserve = 0), rien ne change.
 */
export function fitLastPage(pages, maxLast, reserve) {
  if (!reserve || pages.length === 0) return pages
  const cap = Math.max(3, maxLast - reserve)
  const last = pages[pages.length - 1]
  if (last.length <= cap) return pages
  return [...pages.slice(0, -1), last.slice(0, -cap), last.slice(-cap)]
}

/** Statut affiché dans l'en-tête : « En-cours de paiement » dès qu'une facture a un paiement partiel. */
export function displayStatus(doc) {
  const paid = Number(doc?.total_paid) || 0
  if (doc?.type !== 'invoice' || paid <= 0.009) return doc?.status
  const remaining = doc.remaining_amount != null ? Number(doc.remaining_amount) : Number(doc.total_amount || 0) - paid
  return remaining <= 0.01 ? 'paid' : 'partially_paid'
}

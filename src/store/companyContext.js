/**
 * Entreprise active du compte connecté. Envoyée au serveur dans l'en-tête
 * X-Company-Id ; sans elle, le serveur utilise l'entreprise principale.
 * Module sans dépendance : le client HTTP peut le lire sans cycle d'import.
 */
const KEY = 'active-company'

let activeId = null
let initialised = false

function currentUserId() {
  try {
    return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user?.id ?? null
  } catch {
    return null
  }
}

/** Retrouve l'entreprise mémorisée pour ce compte (pas celle d'une autre personne). */
export function restoreActiveCompany(userId = currentUserId()) {
  initialised = true
  activeId = null
  if (userId == null) return null
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && String(saved.user) === String(userId)) activeId = Number(saved.company) || null
  } catch { /* stockage indisponible */ }
  return activeId
}

export function getActiveCompanyId() {
  if (!initialised) restoreActiveCompany()
  return activeId
}

export function setActiveCompany(userId, companyId) {
  initialised = true
  activeId = companyId ?? null
  try {
    if (userId == null || companyId == null) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify({ user: userId, company: companyId }))
  } catch { /* stockage indisponible */ }
}

/** À la déconnexion : l'entreprise mémorisée reste pour le même compte. */
export function clearActiveCompanyInMemory() {
  initialised = true
  activeId = null
}

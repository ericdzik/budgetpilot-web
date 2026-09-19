/**
 * pdfColorUtils.js — Utilitaires de couleur pour les templates PDF
 *
 * Fournit des helpers pour dériver des couleurs à partir d'une couleur accent :
 * - Texte blanc ou noir automatique selon la luminosité du fond
 * - Version "light" pour les fonds de boxes (8% opacité simulée)
 * - Version "subtotal" pour les fonds de lignes sous-total (15% opacité simulée)
 */

/**
 * Convertit un hex (#RRGGBB ou #RGB) en { r, g, b }
 */
export function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * Calcule la luminance relative (WCAG) d'une couleur hex
 * Valeur entre 0 (noir pur) et 1 (blanc pur)
 */
export function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const toLinear = c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * Retourne '#ffffff' ou '#000000' selon la lisibilité sur le fond donné
 * Seuil : luminance > 0.35 → texte noir, sinon blanc
 */
export function getTextColor(bgHex) {
  try {
    return getLuminance(bgHex) > 0.35 ? '#000000' : '#ffffff'
  } catch {
    return '#ffffff'
  }
}

/**
 * Mélange un hex avec du blanc pour obtenir une teinte légère.
 * @param {string} hex   — couleur accent (#RRGGBB)
 * @param {number} alpha — ratio 0..1 (ex: 0.10 = 10% accent + 90% blanc)
 * @returns {string} — hex résultant
 */
export function mixWithWhite(hex, alpha = 0.10) {
  try {
    const { r, g, b } = hexToRgb(hex)
    const mix = c => Math.round(c * alpha + 255 * (1 - alpha))
    const toHex = n => n.toString(16).padStart(2, '0')
    return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
  } catch {
    return '#f5f5f5'
  }
}

/**
 * Fond très clair pour boxes / cartes — 8% accent + 92% blanc
 */
export function accentToBoxBg(hex) {
  return mixWithWhite(hex, 0.08)
}

/**
 * Fond léger pour lignes sous-total — 15% accent + 85% blanc
 */
export function accentToSubtotalBg(hex) {
  return mixWithWhite(hex, 0.15)
}

/**
 * Fond moyen pour lignes sous-total global / total HT — 22% accent + 78% blanc
 */
export function accentToMediumBg(hex) {
  return mixWithWhite(hex, 0.22)
}

/**
 * Convertit un hex en { h, s, l } (h en degrés 0-360, s et l en 0-1)
 */
export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const delta = max - min
  if (delta === 0) return { h: 0, s: 0, l }
  const s = delta / (1 - Math.abs(2 * l - 1))
  let h
  if (max === rn) h = 60 * (((gn - bn) / delta) % 6)
  else if (max === gn) h = 60 * ((bn - rn) / delta + 2)
  else h = 60 * ((rn - gn) / delta + 4)
  if (h < 0) h += 360
  return { h, s, l }
}

/**
 * Convertit { h, s, l } en hex (h en degrés 0-360, s et l en 0-1)
 */
export function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let rp = 0, gp = 0, bp = 0
  if (h < 60)       { rp = c; gp = x; bp = 0 }
  else if (h < 120) { rp = x; gp = c; bp = 0 }
  else if (h < 180) { rp = 0; gp = c; bp = x }
  else if (h < 240) { rp = 0; gp = x; bp = c }
  else if (h < 300) { rp = x; gp = 0; bp = c }
  else              { rp = c; gp = 0; bp = x }
  const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(rp)}${toHex(gp)}${toHex(bp)}`
}

/**
 * Teinte secondaire dérivée de la couleur d'accent, comme dans l'application
 * mobile. Une seule couleur choisie pilote donc l'ensemble du document : la
 * teinte secondaire contient 55 % de l'accent et 45 % de blanc.
 */
export function getSecondaryColor(accentHex) {
  return mixWithWhite(accentHex, 0.55)
}

/**
 * Couleur du texte posé SUR un fond en couleur principale, pour les éléments
 * de mise en avant (référence dans une boîte colorée, total final dans une barre
 * colorée). La teinte secondaire étant dérivée de l'accent, on l'utilise seulement
 * si elle garde un contraste suffisant ; sinon on bascule sur noir ou blanc.
 * Seuil de contraste WCAG-like : ratio >= 2.5.
 */
export function getSecondaryTextColor(accentHex, secondaryHex) {
  try {
    const lAccent = getLuminance(accentHex)
    const lSecondary = getLuminance(secondaryHex)
    const lighter = Math.max(lAccent, lSecondary)
    const darker  = Math.min(lAccent, lSecondary)
    const ratio = (lighter + 0.05) / (darker + 0.05)
    return ratio >= 2.5 ? secondaryHex : getTextColor(accentHex)
  } catch {
    return getTextColor(accentHex)
  }
}

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

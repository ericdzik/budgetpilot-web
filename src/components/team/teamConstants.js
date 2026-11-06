// Mêmes couleurs que l'application mobile : bleu profond, icônes grises
export const BLUE = '#1E6FE0'
export const SOFT_BLUE = '#EAF2FF'
export const ICON_GREY = '#7F8C8D'
export const ICON_BG = '#F0F2F5'

export const ROLE_LABELS = { owner: 'Dirigeant', manager: 'Responsable', employee: 'Employé' }

export function initials(text = '') {
  const words = text.trim().split(/[\s@._-]+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export const GUTTER = 'clamp(14px, 3vw, 28px)'

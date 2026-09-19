import { Font } from '@react-pdf/renderer'
import InterRegular from '../../assets/fonts/Inter-Regular.ttf'
import InterBold from '../../assets/fonts/Inter-Bold.ttf'
import RobotoSerifRegular from '../../assets/fonts/RobotoSerif-Regular.ttf'
import RobotoSerifBold from '../../assets/fonts/RobotoSerif-Bold.ttf'

// Chaque police est enregistrée sous deux noms de famille distincts (normal /
// gras), exactement comme les polices standard 'Helvetica' / 'Helvetica-Bold'
// déjà utilisées partout dans les templates — ça permet à withFont() de faire
// un simple remplacement de chaîne, sans toucher aux dizaines de styles
// existants qui référencent 'Helvetica-Bold' en dur.
Font.register({ family: 'Inter', src: InterRegular })
Font.register({ family: 'Inter-Bold', src: InterBold })
Font.register({ family: 'RobotoSerif', src: RobotoSerifRegular })
Font.register({ family: 'RobotoSerif-Bold', src: RobotoSerifBold })

export const FONT_CHOICES = [
  { id: 'helvetica', label: 'Helvetica' },
  { id: 'inter', label: 'Inter' },
  { id: 'robotoSerif', label: 'Roboto Serif' },
]

const FONT_FAMILIES = {
  inter: { regular: 'Inter', bold: 'Inter-Bold' },
  robotoSerif: { regular: 'RobotoSerif', bold: 'RobotoSerif-Bold' },
}

// Pour les styles inline (hors StyleSheet.create) qui référencent directement
// 'Helvetica-Bold' en dur : résout le nom de famille correspondant à la
// police choisie, à utiliser tel quel dans un fontFamily.
export function resolveFontFamily(fontChoice, weight = 'regular') {
  const family = FONT_FAMILIES[fontChoice]
  if (!family) return weight === 'bold' ? 'Helvetica-Bold' : 'Helvetica'
  return weight === 'bold' ? family.bold : family.regular
}

// Applique la police choisie à tout le contenu du PDF : parcourt récursivement
// un objet de styles react-pdf et remplace 'Helvetica' / 'Helvetica-Bold' par
// la police choisie. 'helvetica' (par défaut) ne touche à rien. Les variantes
// italiques ('Helvetica-Oblique'/'-BoldOblique', rares dans ces templates)
// restent en Helvetica : aucune police custom ici n'a d'instance italique.
export function withFont(styles, fontChoice) {
  const family = FONT_FAMILIES[fontChoice]
  if (!family) return styles
  const swap = value => (value === 'Helvetica' ? family.regular : value === 'Helvetica-Bold' ? family.bold : value)
  const walk = node => {
    if (Array.isArray(node)) return node.map(walk)
    if (node && typeof node === 'object') {
      const out = {}
      for (const key of Object.keys(node)) out[key] = key === 'fontFamily' ? swap(node[key]) : walk(node[key])
      return out
    }
    return node
  }
  return walk(styles)
}

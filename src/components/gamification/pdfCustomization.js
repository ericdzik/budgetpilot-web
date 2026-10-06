import { toast } from 'react-hot-toast'

const KEY = 'bp_has_customized_pdf'

/**
 * #10 : à appeler après un logo, une signature ou un modèle PDF enregistré.
 * Félicite l'utilisateur la toute première fois seulement (flag local,
 * comme PDFPreferencesService.markPdfCustomizedIfFirstTime côté mobile).
 */
export function celebrateFirstPdfCustomization() {
  try {
    if (localStorage.getItem(KEY)) return
    localStorage.setItem(KEY, '1')
  } catch {
    return
  }
  toast.success('Bravo ! Vos documents sont maintenant personnalisés à votre image.', { duration: 5000 })
}

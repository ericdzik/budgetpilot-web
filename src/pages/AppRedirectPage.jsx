import { useEffect } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.budget.budgetpilot'
const APP_STORE_URL  = 'https://apps.apple.com/app/b-pilot/id6760863629'
const WEBSITE_URL    = 'https://www.getbudgetpilot-web.com'

/**
 * Page de redirection universelle
 *
 * Supporte deux formats :
 *   - /app?ref=CODE        (format actuel)
 *   - /app/ref/CODE        (ancien format, rétrocompatibilité)
 *
 * Détecte la plateforme via User-Agent et redirige vers :
 *   - Play Store  (Android)
 *   - App Store   (iOS)
 *   - Site web    (Desktop / autres)
 */
export default function AppRedirectPage() {
  const [searchParams] = useSearchParams()
  const params = useParams()

  // Priorité : query param ?ref=CODE, sinon path param /app/ref/:code
  const refCode = searchParams.get('ref') || params.code || ''

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()

    if (/iphone|ipad|ipod/.test(ua)) {
      // iOS : tenter d'ouvrir l'app via deep link, fallback App Store après 2s
      const deepLink = refCode
        ? `budgetpilot://ref/${encodeURIComponent(refCode)}`
        : 'budgetpilot://home'

      const appStoreUrl = APP_STORE_URL +
        (refCode ? `?ct=${encodeURIComponent('ref_' + refCode)}&pt=referral` : '')

      // Ouvrir le deep link — si l'app est installée, iOS switche vers elle
      window.location.href = deepLink

      // Fallback App Store si l'app n'est pas installée (après 2.2s)
      const timer = setTimeout(() => {
        // Si on arrive ici, l'app n'a pas intercepté le deep link
        window.location.replace(appStoreUrl)
      }, 2200)

      // Annuler le fallback si l'app a bien été ouverte (la page perd le focus)
      const cancelFallback = () => {
        if (document.hidden) clearTimeout(timer)
      }
      document.addEventListener('visibilitychange', cancelFallback, { once: true })

      return () => {
        clearTimeout(timer)
        document.removeEventListener('visibilitychange', cancelFallback)
      }

    } else if (/android/.test(ua)) {
      // Android → Play Store avec referrer
      let targetUrl = PLAY_STORE_URL
      if (refCode) targetUrl += `&referrer=${encodeURIComponent('ref=' + refCode)}`
      window.location.replace(targetUrl)

    } else {
      // Desktop → site web
      let targetUrl = WEBSITE_URL
      if (refCode) targetUrl += `?ref=${encodeURIComponent(refCode)}`
      window.location.replace(targetUrl)
    }
  }, [refCode])

  // Affichage pendant la redirection (généralement < 1 seconde)
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      background: '#fff',
      gap: 16,
    }}>
      <img
        src="/logo_bb.svg"
        alt="Budget Pilot"
        style={{ width: 56, height: 56 }}
        onError={e => { e.target.style.display = 'none' }}
      />
      <p style={{ fontSize: 16, color: '#444', margin: 0 }}>
        Redirection en cours…
      </p>
    </div>
  )
}

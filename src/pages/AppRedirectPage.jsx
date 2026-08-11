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

    let targetUrl

    if (/iphone|ipad|ipod/.test(ua)) {
      // iOS → App Store
      targetUrl = APP_STORE_URL
      if (refCode) {
        targetUrl += `?ct=${encodeURIComponent('ref_' + refCode)}&pt=referral`
      }
    } else if (/android/.test(ua)) {
      // Android → Play Store
      targetUrl = PLAY_STORE_URL
      if (refCode) {
        targetUrl += `&referrer=${encodeURIComponent('ref=' + refCode)}`
      }
    } else {
      // Desktop → site web
      targetUrl = WEBSITE_URL
      if (refCode) {
        targetUrl += `?ref=${encodeURIComponent(refCode)}`
      }
    }

    window.location.replace(targetUrl)
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

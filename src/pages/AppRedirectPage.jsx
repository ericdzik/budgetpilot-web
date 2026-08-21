import { useState, useEffect } from 'react'
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
 * Android  → Play Store direct (referrer transmis automatiquement)
 * Desktop  → Site web
 * iOS      → Page intermédiaire avec bouton "Ouvrir l'app"
 *            (window.location.href vers custom scheme doit être déclenché par un tap)
 */
export default function AppRedirectPage() {
  const [searchParams] = useSearchParams()
  const params = useParams()
  const [iosReady, setIosReady] = useState(false)
  const [appOpened, setAppOpened] = useState(false)

  // Priorité : query param ?ref=CODE, sinon path param /app/ref/:code
  const refCode = searchParams.get('ref') || params.code || ''

  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
  const isAndroid = /android/.test(navigator.userAgent.toLowerCase())

  const deepLink = refCode
    ? `budgetpilot://ref/${encodeURIComponent(refCode)}`
    : 'budgetpilot://home'

  const appStoreUrl = APP_STORE_URL +
    (refCode ? `?ct=${encodeURIComponent('ref_' + refCode)}&pt=referral` : '')

  useEffect(() => {
    if (isAndroid) {
      // Android → Play Store direct avec referrer
      let url = PLAY_STORE_URL
      if (refCode) url += `&referrer=${encodeURIComponent('ref=' + refCode)}`
      window.location.replace(url)
    } else if (!isIOS) {
      // Desktop → site web
      let url = WEBSITE_URL
      if (refCode) url += `?ref=${encodeURIComponent(refCode)}`
      window.location.replace(url)
    } else {
      // iOS → afficher la page intermédiaire
      setIosReady(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handler du bouton principal — déclenché par un vrai tap (iOS l'autorise)
  const handleOpenApp = () => {
    setAppOpened(true)
    window.location.href = deepLink

    // Si l'app ne répond pas après 2.5s → fallback App Store
    setTimeout(() => {
      if (!document.hidden) {
        window.location.replace(appStoreUrl)
      }
    }, 2500)
  }

  // Android et Desktop sont redirigés dans useEffect — rien à afficher
  if (!isIOS) {
    return (
      <div style={styles.container}>
        <img src="/logo_bb.svg" alt="Budget Pilot" style={styles.logo}
          onError={e => { e.target.style.display = 'none' }} />
        <p style={styles.subtitle}>Redirection en cours…</p>
      </div>
    )
  }

  // iOS — page intermédiaire
  return (
    <div style={styles.container}>
      <img src="/logo_bb.svg" alt="Budget Pilot" style={styles.logo}
        onError={e => { e.target.style.display = 'none' }} />

      <h1 style={styles.title}>Budget Pilot</h1>
      <p style={styles.subtitle}>
        {refCode
          ? 'Tu as été invité à rejoindre Budget Pilot !'
          : 'Ouvre l\'application Budget Pilot'}
      </p>

      {refCode && (
        <div style={styles.codeBox}>
          <span style={styles.codeLabel}>Code de parrainage</span>
          <span style={styles.codeValue}>{refCode}</span>
        </div>
      )}

      {!appOpened ? (
        <button style={styles.btnPrimary} onClick={handleOpenApp}>
          Ouvrir l'application
        </button>
      ) : (
        <p style={styles.openingText}>Ouverture en cours…</p>
      )}

      <a href={appStoreUrl} style={styles.btnSecondary}>
        Télécharger sur l'App Store
      </a>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '32px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: '#ffffff',
    gap: 0,
    boxSizing: 'border-box',
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    margin: '0 0 28px 0',
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: 280,
  },
  codeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#F0F7FF',
    border: '1.5px solid #2196F3',
    borderRadius: 14,
    padding: '14px 32px',
    marginBottom: 28,
    gap: 4,
  },
  codeLabel: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  btnPrimary: {
    background: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: 30,
    padding: '16px 40px',
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
  },
  openingText: {
    fontSize: 15,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 16,
  },
  btnSecondary: {
    color: '#2196F3',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: '500',
    padding: '10px 20px',
    borderRadius: 20,
    border: '1px solid #2196F3',
    marginTop: 4,
    display: 'inline-block',
  },
}

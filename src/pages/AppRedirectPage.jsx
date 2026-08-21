import { useState } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.budget.budgetpilot'
const APP_STORE_URL  = 'https://apps.apple.com/app/b-pilot/id6760863629'
const WEBSITE_URL    = 'https://www.getbudgetpilot-web.com'

const ua = navigator.userAgent.toLowerCase()
const isIOS     = /iphone|ipad|ipod/.test(ua)
const isAndroid = /android/.test(ua)

/**
 * Page de redirection universelle
 *
 * iOS      → Page intermédiaire affichée immédiatement (rendu synchrone, pas de useEffect)
 *            Bouton tap → deep link budgetpilot:// → fallback App Store après 2.5s
 * Android  → Play Store direct avec referrer (redirect immédiate)
 * Desktop  → Site web
 */
export default function AppRedirectPage() {
  const [searchParams] = useSearchParams()
  const params         = useParams()
  const [appOpened, setAppOpened] = useState(false)

  const refCode = searchParams.get('ref') || params.code || ''

  const deepLink   = refCode
    ? `budgetpilot://ref/${encodeURIComponent(refCode)}`
    : 'budgetpilot://home'

  const appStoreUrl = APP_STORE_URL +
    (refCode ? `?ct=${encodeURIComponent('ref_' + refCode)}&pt=referral` : '')

  // ── Android → redirect immédiate côté rendu (pas de useEffect) ──────────────
  if (isAndroid) {
    let url = PLAY_STORE_URL
    if (refCode) url += `&referrer=${encodeURIComponent('ref=' + refCode)}`
    window.location.replace(url)
    return <div style={styles.container}><p style={styles.subtitle}>Redirection…</p></div>
  }

  // ── Desktop → redirect immédiate ────────────────────────────────────────────
  if (!isIOS) {
    let url = WEBSITE_URL
    if (refCode) url += `?ref=${encodeURIComponent(refCode)}`
    window.location.replace(url)
    return <div style={styles.container}><p style={styles.subtitle}>Redirection…</p></div>
  }

  // ── iOS → page intermédiaire, rendu immédiat sans aucun useEffect ────────────
  const handleOpenApp = () => {
    setAppOpened(true)
    window.location.href = deepLink
    setTimeout(() => {
      if (!document.hidden) window.location.replace(appStoreUrl)
    }, 2500)
  }

  return (
    <div style={styles.container}>
      <img
        src="/logo_bb.svg"
        alt="Budget Pilot"
        style={styles.logo}
        onError={e => { e.target.style.display = 'none' }}
      />

      <h1 style={styles.title}>Budget Pilot</h1>
      <p style={styles.subtitle}>
        {refCode
          ? 'Tu as été invité à rejoindre Budget Pilot !'
          : "Ouvre l'application Budget Pilot"}
      </p>

      {refCode && (
        <div style={styles.codeBox}>
          <span style={styles.codeLabel}>Code de parrainage</span>
          <span style={styles.codeValue}>{refCode}</span>
        </div>
      )}

      {appOpened ? (
        <p style={styles.openingText}>Ouverture en cours…</p>
      ) : (
        <button style={styles.btnPrimary} onClick={handleOpenApp}>
          Ouvrir l'application
        </button>
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

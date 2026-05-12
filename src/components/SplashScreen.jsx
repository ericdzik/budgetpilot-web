import { useEffect, useState } from 'react'

/**
 * Page de chargement initiale — reproduit fidèlement le splash screen mobile :
 * fond bleu #1a86d0, logo B blanc + texte "Pilot", spinner blanc en bas
 */
export default function SplashScreen({ onFinish }) {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Minimum 1.8s d'affichage, puis fade out
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => {
        setVisible(false)
        onFinish?.()
      }, 400) // durée du fade
    }, 1800)

    return () => clearTimeout(timer)
  }, [onFinish])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#1a86d0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.4s ease',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Logo : icône B alignée par le bas avec le texte "Pilot" */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: '16px',
        }}
      >
        {/* Icône B SVG */}
        <img
          src="/logo-b.svg"
          alt="Budget Pilot logo"
          style={{ width: '64px', height: '84px' }}
        />

        {/* Texte "Pilot" aligné sur le pied du B */}
        <span
          style={{
            color: '#ffffff',
            fontSize: '64px',
            fontWeight: '700',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            letterSpacing: '-1px',
            lineHeight: 1,
            paddingBottom: '4px',
          }}
        >
          Pilot
        </span>
      </div>

      {/* Spinner blanc en bas */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
        }}
      >
        <SpinnerWhite />
      </div>
    </div>
  )
}

function SpinnerWhite() {
  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        border: '2.5px solid rgba(255,255,255,0.3)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}

import { Outlet } from 'react-router-dom'

/**
 * Layout auth — fond bleu #1E88E5 sur toute la page,
 * logo B + Pilot en haut centré, carte blanche arrondie au centre
 */
export default function AuthLayout() {
  return (
    <div
      style={{
        minHeight: '142.86vh',
        backgroundColor: '#1E88E5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      {/* Logo B Pilot en haut */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        <img
          src="/logo-b.svg"
          alt="Budget Pilot"
          style={{ width: '44px', height: '58px' }}
        />
        <span
          style={{
            color: '#ffffff',
            fontSize: '42px',
            fontWeight: '700',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            letterSpacing: '-1px',
            lineHeight: 1,
            paddingBottom: '3px',
          }}
        >
          Pilot
        </span>
      </div>

      {/* Carte blanche */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px 28px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}

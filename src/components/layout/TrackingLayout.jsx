import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useTrackingAuthStore from '../../store/trackingAuthStore'
import useTrackingSettingsStore from '../../store/trackingSettingsStore'

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: isActive ? '600' : '400',
        color: isActive ? '#E65100' : '#555',
        backgroundColor: 'transparent',
        textDecoration: 'none',
        marginBottom: '4px',
        transition: 'color 0.15s',
      })}
    >
      {({ isActive }) => (
        <>
          {/* Pastille couleur */}
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: isActive ? '#E65100' : '#555',
            flexShrink: 0,
          }} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function TrackingLayout() {
  const { trackingLogout, trackingUser } = useTrackingAuthStore()
  const { clientLogoUrl, clientName }    = useTrackingSettingsStore()
  const navigate = useNavigate()
  const isAdmin = trackingUser?.role === 'admin'

  // Pas de guard ici — géré par TrackingPublicRoute dans router.jsx

  const handleLogout = () => {
    trackingLogout()
    navigate('/tracking/login')
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      backgroundColor: '#f5f5f5',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '200px',
        flexShrink: 0,
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #e8e8e8',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 8px', marginBottom: '40px',
        }}>
          <img
            src={clientLogoUrl}
            alt={clientName}
            style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: '8px' }}
          />
          <span style={{ fontSize: '17px', fontWeight: '600', color: '#222' }}>
            {clientName}
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <SidebarLink to="/tracking/analyses"   label="Analyses" />
          <SidebarLink to="/tracking/historique" label="Historique" />
          {/* <SidebarLink to="/tracking/calendrier" label="Calendrier" /> */}
          {isAdmin && (
            <SidebarLink to="/tracking/qrcodes"    label="QR Codes" />
          )}
          {isAdmin && (
            <SidebarLink to="/tracking/parametres" label="Paramètres" />
          )}
        </nav>

        {/* Support + Déconnexion */}
        <div style={{
          backgroundColor: '#fff8f0',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          marginBottom: '12px',
        }}>
          <img
            src="/denistest.png"
            alt="Denis"
            style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto 10px', display: 'block' }}
          />
          <p style={{ fontSize: '13px', color: '#444', marginBottom: '10px', lineHeight: 1.4 }}>
            Besoin d'aide ou d'informations ?
          </p>
          <button style={{
            backgroundColor: '#E65100',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            Contactez le support
          </button>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none',
            color: '#999', fontSize: '13px',
            cursor: 'pointer', textAlign: 'left',
            padding: '8px 8px',
          }}
        >
          Se déconnecter
        </button>
      </aside>

      {/* Contenu principal */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

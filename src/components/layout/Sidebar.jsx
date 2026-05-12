import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import useAuthStore from '../../store/authStore'

function SvgIcon({ src, size = 20, active = false, colored = false }) {
  return (
    <img
      src={src}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: colored ? 'none' : (active ? 'brightness(0) invert(1)' : 'brightness(0)'),
        flexShrink: 0,
      }}
    />
  )
}

// NavItem standard — utilise NavLink (pathname uniquement)
function NavItem({ to, svgSrc, label, end = false, colored = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '50px',
        fontSize: '15px',
        fontWeight: isActive ? '600' : '400',
        color: isActive ? '#fff' : '#333',
        backgroundColor: isActive ? '#1E88E5' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
        marginBottom: '2px',
      })}
    >
      {({ isActive }) => (
        <>
          <SvgIcon src={svgSrc} size={20} active={isActive} colored={colored} />
          {label}
        </>
      )}
    </NavLink>
  )
}

// NavItemExact — compare pathname ET query param (pour Devis vs Facture)
function NavItemExact({ to, svgSrc, label, colored = false }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const [path, search] = to.split('?')
  const isActive =
    location.pathname === path &&
    (!search || location.search === '?' + search)

  return (
    <button
      onClick={() => navigate(to)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '50px',
        fontSize: '15px',
        fontWeight: isActive ? '600' : '400',
        color: isActive ? '#fff' : '#333',
        backgroundColor: isActive ? '#1E88E5' : 'transparent',
        textDecoration: 'none',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.15s',
        marginBottom: '2px',
      }}
    >
      <SvgIcon src={svgSrc} size={20} active={isActive} colored={colored} />
      {label}
    </button>
  )
}

export default function Sidebar() {
  const { logout } = useAuthStore()

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      backgroundColor: '#f4f6f8',
      borderRight: 'none',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '20px 20px',
      }}>
        <img src="/Logo_app2.png" alt="B" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <span style={{ fontSize: '22px', fontWeight: '700', color: '#111', letterSpacing: '-0.5px' }}>
          Pilot
        </span>
      </div>

      {/* Contenu scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>

        {/* Section Bonjour */}
        <p style={{
          fontSize: '16px', fontWeight: '700', color: '#111',
          padding: '0 8px', margin: '20px 0 10px',
        }}>
          Bonjour
        </p>

        {/* navbar_icon1 = Home/Dashboard */}
        <NavItem to="/dashboard"    svgSrc="/navbar_icon1.svg" label="Dashboard" />
        {/* navbar_icon2 = Suivi/Historique */}
        <NavItem to="/history"      svgSrc="/navbar_icon2.svg" label="Suivi" />
        {/* navbar_icon3 = Statistiques */}
        <NavItem to="/stats"        svgSrc="/navbar_icon3.svg" label="Statistiques" />
        {/* payblue = Abonnements */}
        <NavItem to="/subscription" svgSrc="/payblue.svg"      label="Abonnements" />

        {/* Séparateur */}
        <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '14px 8px' }} />

        {/* Section Création */}
        <p style={{
          fontSize: '16px', fontWeight: '700', color: '#111',
          padding: '0 8px', margin: '0 0 10px',
        }}>
          Création
        </p>

        {/* devisicone = Devis */}
        <NavItemExact to="/documents/new?type=quote"   svgSrc="/devisicone.svg"   label="Devis"    colored />
        {/* operation2 = Facture */}
        <NavItemExact to="/documents/new?type=invoice" svgSrc="/operation2.svg"   label="Facture"  colored />
        {/* depenseicone = Dépense */}
        <NavItem to="/expenses/new"               svgSrc="/depenseicone.svg" label="Dépense"  colored />
        {/* entreeicone = Recette/Entrée */}
        <NavItem to="/revenues/new"               svgSrc="/entreeicone.svg"  label="Entrée"   colored />

      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #e8eaed',
        padding: '12px',
      }}>
        {/* navbar_icon4 = Profil */}
        <NavItem to="/profile"  svgSrc="/navbar_icon4.svg"   label="Profil" />
        {/* SERVICESICONE7 = Paramètres */}
        <NavItem to="/settings" svgSrc="/SERVICESICONE7.svg" label="Paramètres" colored />
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 16px', borderRadius: '50px',
            fontSize: '15px', fontWeight: '400', color: '#ef4444',
            backgroundColor: 'transparent', border: 'none',
            cursor: 'pointer', transition: 'background 0.15s',
            marginBottom: '2px',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAdminAuthStore from '../../store/adminAuthStore'

// ── Icônes SVG inline ────────────────────────────────────────────────────────

const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  referrals: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  banners: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard',    icon: Icons.dashboard  },
  { to: '/admin/referrals', label: 'Parrainages',  icon: Icons.referrals  },
  { to: '/admin/users',     label: 'Utilisateurs', icon: Icons.users      },
  { to: '/admin/banners',   label: 'Publicités',   icon: Icons.banners    },
]

function SidebarLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '11px 16px',
        borderRadius: '50px',
        fontSize: '15px',
        fontWeight: isActive ? '600' : '400',
        color: isActive ? '#fff' : '#555',
        backgroundColor: isActive ? '#1E88E5' : 'transparent',
        textDecoration: 'none',
        marginBottom: '4px',
        transition: 'all 0.15s',
      })}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      {label}
    </NavLink>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const { adminLogout, adminUser } = useAdminAuthStore()

  const handleLogout = async () => {
    await adminLogout()
    toast.success('Déconnecté')
    navigate('/admin/login')
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      backgroundColor: '#f7f8fa',
      zoom: 1 / 0.70,
    }}>

      {/* ── Sidebar fixe ─────────────────────────────────────────────────── */}
      <aside style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '220px',
        height: '100vh',
        backgroundColor: '#fff',
        borderRight: '1px solid #ebebeb',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 16px',
        zIndex: 100,
        overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 8px', marginBottom: '36px',
        }}>
          <img src="/Logo_app2.png" alt="B" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span style={{ fontSize: '22px', fontWeight: '700', color: '#111', letterSpacing: '-0.5px' }}>
            Pilot
          </span>
          <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '400', marginLeft: '2px', marginTop: '4px' }}>
            Admin
          </span>
        </div>

        {/* Label Menu */}
        <p style={{
          fontSize: '11px', fontWeight: '600', color: '#aaa',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          padding: '0 8px', marginBottom: '8px',
        }}>
          Menu
        </p>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>

        {/* Paramètres en bas */}
        <SidebarLink to="/admin/settings" label="Paramètres" icon={Icons.settings} />
      </aside>

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <div style={{
        marginLeft: '220px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        overflow: 'auto',
      }}>

        {/* Header top-right */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          gap: '12px', padding: '16px 32px',
        }}>
          <div style={{
            padding: '6px 18px',
            backgroundColor: '#1E88E5',
            color: '#fff',
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: '500',
          }}>
            Admin
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: '#1E88E5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '700', color: '#fff',
            cursor: 'pointer',
          }}
            onClick={handleLogout}
            title="Se déconnecter"
          >
            {(adminUser?.name || 'A')[0].toUpperCase()}
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '0 32px 32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

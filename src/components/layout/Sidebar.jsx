import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Award, Users } from 'lucide-react'
import CompanySwitcher from '../company/CompanySwitcher'
import useCompanyStore, { useActiveCompany } from '../../store/companyStore'
import useCan from '../../hooks/useCan'

function SvgIcon({ src, size = 20, active = false, colored = false }) {
  return (
    <img
      src={src}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: colored
          ? 'none'
          : active
            ? 'brightness(0) invert(1)'          // blanc quand actif
            : 'brightness(0) invert(0.5)',        // gris quand inactif
        flexShrink: 0,
      }}
    />
  )
}

/** Immeuble de « Mes entreprises » : trait gris et intérieur gris clair (blanc translucide sur la pastille active). */
function BuildingIcon({ size = 20, color = '#808080', style }) {
  const active = color === '#fff'
  const stroke = active ? '#fff' : '#7F8C8D'
  const fill = active ? 'rgba(255,255,255,0.35)' : '#E3E7EB'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true">
      <path d="M15.01 21.9898L3.01001 22.0099L3 7.06986C3 6.39986 3.34001 5.77983 3.89001 5.40983L7.89001 2.73984C8.56001 2.28984 9.43999 2.28984 10.11 2.73984L14.11 5.40983C14.67 5.77983 15 6.39986 15 7.06986L15.01 21.9898Z" fill={fill} />
      <path d="M20 12C18.9 12 18 12.9 18 14V16C18 17.1 18.9 18 20 18C21.1 18 22 17.1 22 16V14C22 12.9 21.1 12 20 12Z" fill={fill} />
      <g stroke={stroke} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 22H22" />
        <path d="M15.01 21.9898L3.01001 22.0099L3 7.06986C3 6.39986 3.34001 5.77983 3.89001 5.40983L7.89001 2.73984C8.56001 2.28984 9.43999 2.28984 10.11 2.73984L14.11 5.40983C14.67 5.77983 15 6.39986 15 7.06986L15.01 21.9898Z" />
        <path d="M19.98 22.01V18" />
        <path d="M20 12C18.9 12 18 12.9 18 14V16C18 17.1 18.9 18 20 18C21.1 18 22 17.1 22 16V14C22 12.9 21.1 12 20 12Z" />
        <path d="M3 14H15" />
        <path d="M9 22V18.25" />
        <path d="M9 10.5C9.82843 10.5 10.5 9.82843 10.5 9C10.5 8.17157 9.82843 7.5 9 7.5C8.17157 7.5 7.5 8.17157 7.5 9C7.5 9.82843 8.17157 10.5 9 10.5Z" />
      </g>
    </svg>
  )
}

// NavItem standard — utilise NavLink (pathname uniquement)
function NavItem({ to, svgSrc, Icon, label, end = false, colored = false }) {
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
          {Icon
            ? <Icon size={Icon === BuildingIcon ? 26 : 20} color={isActive ? '#fff' : '#808080'} style={{ flexShrink: 0, margin: Icon === BuildingIcon ? '-3px' : 0 }} />
            : <SvgIcon src={svgSrc} size={20} active={isActive} colored={colored} />}
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

/**
 * Menu latéral. Sur petit écran (`drawer`), il devient un tiroir qui glisse depuis
 * la gauche et se ferme à la navigation.
 */
export default function Sidebar({ drawer = false, open = false }) {
  // Le menu « Mes entreprises » n'apparaît que si le serveur gère le multi-compte
  const multiCompany = useCompanyStore((s) => s.available)
  const activeCompany = useActiveCompany()
  const can = useCan()

  const placement = drawer
    ? {
        position: 'fixed', left: 0, top: 0, zIndex: 60,
        transform: open ? 'translateX(0)' : 'translateX(-105%)',
        transition: 'transform 0.2s ease',
        boxShadow: open ? '0 0 40px rgba(0,0,0,0.25)' : 'none',
      }
    : { position: 'sticky', top: 0 }

  return (
    <aside style={{
      width: '240px',
      flexShrink: 0,
      backgroundColor: '#f4f6f8',
      borderRight: 'none',
      display: 'flex',
      flexDirection: 'column',
      // Le site est affiché à 70 % : la hauteur est compensée
      height: '142.86vh',
      ...placement,
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '12px',
        padding: '20px 20px',
      }}>
        <img src="/Logo_app2.png" alt="B" style={{ width: 60, height: 60, objectFit: 'contain' }} />
        <span style={{ fontSize: '40px', fontWeight: '700', color: '#111', letterSpacing: '-0.5px' }}>
          Pilot
        </span>
      </div>

      {/* Entreprises du compte (si plusieurs) */}
      <CompanySwitcher />

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
        {/* Parrainage */}
        <NavItem to="/referral"     svgSrc="/navbar_icon4.svg"  label="Parrainage" />
        {/* ICONE_clients = Mes clients */}
        <NavItem to="/clients"      svgSrc="/ICONE_clients.svg"  label="Mes clients" />
        {/* Badges et notifications reçues */}
        <NavItem to="/progress"     Icon={Award}                 label="Mes progrès" />
        {/* Équipe de l'entreprise active : dirigeant et responsable */}
        {multiCompany && activeCompany && can('members.view') && (
          <NavItem to={`/team/${activeCompany.id}`} Icon={Users} label="Équipe" />
        )}

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
        <NavItem to="/revenues/new"               svgSrc="/entreeicone.svg"  label="Recette"   colored />

      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #e8eaed',
        padding: '12px',
      }}>
        {/* navbar_icon4 = Profil */}
        <NavItem to="/profile"  svgSrc="/navbar_icon4.svg"   label="Profil" />
        {/* Entreprises du compte */}
        {multiCompany && <NavItem to="/companies" Icon={BuildingIcon} label="Mes entreprises" />}
        {/* SERVICESICONE10 = Paramètres */}
        <NavItem to="/settings" svgSrc="/SERVICESICONE10.svg" label="Paramètres" />
      </div>
    </aside>
  )
}

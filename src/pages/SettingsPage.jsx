import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useCurrencyStore, { CURRENCY_SYMBOLS } from '../store/currencyStore'
import UserBadge from '../components/ui/UserBadge'
import CurrencySelectorModal from '../components/ui/CurrencySelectorModal'
import { authService } from '../services/authService'
import ConfirmDialog from '../components/ui/ConfirmDialog'

// ─── Avatar utilisateur ───────────────────────────────────────────────────────

function Avatar({ user, size = 52 }) {
  const avatarUrl = (() => {
    const url = user?.avatar_url
    if (!url) return null
    if (url.startsWith('http')) return url
    return `/avatars/${url.split('/').pop()}`
  })()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={user?.name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: '700', color: '#fff',
      border: '2px solid rgba(255,255,255,0.4)',
      flexShrink: 0,
    }}>
      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
    </div>
  )
}

// ─── Tuile simple (fond bleu clair + icône SVG mobile) ───────────────────────

function Tile({ iconSrc, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: '#e3f2fd',
        borderRadius: '20px',
        border: 'none',
        padding: '40px 32px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        minHeight: '220px',
        width: '100%',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#bbdefb'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e3f2fd'}
    >
      <div style={{
        width: 68, height: 68, borderRadius: '50%',
        backgroundColor: '#1E88E5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img src={iconSrc} alt="" style={{ width: 34, height: 34, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      </div>
      <span style={{ fontSize: '22px', fontWeight: '700', color: '#111', textAlign: 'left', lineHeight: 1.3, whiteSpace: 'pre-line' }}>
        {label}
      </span>
    </button>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, setUser, logout } = useAuthStore()
  const { activeCurrency, initFromUser } = useCurrencyStore()
  const [profile, setProfile] = useState(user)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)

  // Charger les données fraîches du profil
  useEffect(() => {
    authService.getProfile()
      .then(res => {
        const freshUser = res.data?.user ?? res.data
        setProfile(freshUser)
        if (freshUser) {
          setUser(freshUser)
          initFromUser(freshUser)
        }
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    setConfirmLogout(true)
  }

  const doLogout = async () => {
    setConfirmLogout(false)
    await logout()
    navigate('/login')
  }

  const handleContact = () => {
    window.location.href = 'mailto:admin@getbudgetpilot.com?subject=Support Budget Pilot'
  }

  const handleRate = () => {
    window.open('https://play.google.com/store/apps/details?id=com.budget.budgetpilot', '_blank')
  }

  const displayUser = profile || user

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px',
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: 0 }}>
          Paramètres
        </h1>
        <UserBadge size={48} />
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, padding: '0 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', alignItems: 'start' }}>

          {/* ── Carte Mon compte — grande, bleue ── */}
          <button
            onClick={() => navigate('/profile')}
            style={{
              backgroundColor: '#1E88E5',
              borderRadius: '20px',
              border: 'none',
              padding: '40px 40px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
              width: '100%',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <div style={{
              alignSelf: 'flex-start',
              border: '1.5px solid #fff',
              borderRadius: '20px',
              padding: '8px 24px',
              fontSize: '18px', fontWeight: '600', color: '#fff',
            }}>
              Profil
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Avatar user={displayUser} size={80} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '26px', fontWeight: '700', color: '#fff' }}>
                  Mon compte
                </div>
                <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', marginTop: '6px' }}>
                  {displayUser?.phone || displayUser?.professional_phone || displayUser?.email || '—'}
                </div>
              </div>
              <ChevronRight size={34} color="#fff" />
            </div>
          </button>

          {/* Termes & Conditions */}
          <Tile
            iconSrc="/iconeinfo.svg"
            label={'Termes &\nConditions'}
            onClick={() => navigate('/terms')}
          />

          {/* Contactez Nous */}
          <Tile
            iconSrc="/iconecontact.svg"
            label="Contactez Nous"
            onClick={() => navigate('/contact')}
          />

          {/* Abonnement */}
          <Tile
            iconSrc="/iconepay.svg"
            label="Abonnement"
            onClick={() => navigate('/subscription')}
          />

          {/* Devise — temporairement masqué */}
          {false && (
          <button
            onClick={() => setCurrencyOpen(true)}
            style={{
              backgroundColor: '#e3f2fd',
              borderRadius: '20px',
              border: 'none',
              padding: '40px 32px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              minHeight: '220px',
              width: '100%',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#bbdefb'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e3f2fd'}
          >
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              backgroundColor: '#1E88E5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#fff' }}>
                {(CURRENCY_SYMBOLS[activeCurrency] || activeCurrency).slice(0, 3)}
              </span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#111' }}>
                Devise
              </span>
              <div style={{ fontSize: '14px', color: '#1E88E5', marginTop: '4px', fontWeight: '600' }}>
                Active : {activeCurrency}
              </div>
            </div>
          </button>
          )}

          {/* FAQ */}
          <Tile
            iconSrc="/iconefaq.svg"
            label="FAQ"
            onClick={() => navigate('/faq')}
          />

          {/* Colonne droite : Noter + Déconnecter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Noter l'application */}
            <button
              onClick={handleRate}
              style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                border: '1.5px solid #e0e0e0',
                padding: '28px 28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>
                Noter l'application
              </span>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                backgroundColor: '#1E88E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/iconenote.svg" alt="" style={{ width: 28, height: 28, filter: 'brightness(0) invert(1)' }} />
              </div>
            </button>

            {/* Se déconnecter */}
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#1E88E5',
                borderRadius: '20px',
                border: 'none',
                padding: '28px 28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
                Se déconnecter
              </span>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogOut size={28} color="#1E88E5" />
              </div>
            </button>

          </div>

        </div>
      </div>

      {/* Dialog déconnexion */}
      <ConfirmDialog
        open={confirmLogout}
        title="Se déconnecter ?"
        message="Vous serez redirigé vers la page de connexion."
        icon="warning"
        confirmLabel="Se déconnecter"
        confirmColor="#1E88E5"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />

      {/* Modal sélection devise */}
      <CurrencySelectorModal
        open={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
      />
    </div>
  )
}

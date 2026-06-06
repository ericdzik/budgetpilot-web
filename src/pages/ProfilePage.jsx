import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import useAuthStore from '../store/authStore'
import UserBadge from '../components/ui/UserBadge'
import { authService } from '../services/authService'

const STORAGE_BASE = (import.meta.env.VITE_API_URL || 'http://147.93.95.204/api').replace('/api', '/storage')
function storageUrl(path) {
  if (!path || path === '0') return null
  if (path.startsWith('http')) return path
  return `${STORAGE_BASE}/${path}`
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [profile, setProfile] = useState(user)

  useEffect(() => {
    authService.getProfile()
      .then(res => {
        const u = res.data?.user ?? res.data
        setProfile(u)
        if (u) setUser(u)
      })
      .catch(() => {})
  }, [])

  const displayUser = profile || user

  // Avatar personnel
  const avatarUrl = (() => {
    const url = displayUser?.avatar_url
    if (!url) return null
    if (url.startsWith('http')) return url
    const filename = url.split('/').pop()
    return `/avatars/${filename}`
  })()
  const avatarInitial = displayUser?.name?.charAt(0)?.toUpperCase() || 'U'

  // Logo entreprise
  const logoPath = storageUrl(displayUser?.logo_path)
  const companyInitial = displayUser?.company_name?.charAt(0)?.toUpperCase() || 'B'
  const username = displayUser?.email ? '@' + displayUser.email.split('@')[0] : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px',
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: 0 }}>
          Profil
        </h1>
        <UserBadge size={48} />
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Ligne 1 : Profil perso + Entreprise ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '16px' }}>

          {/* Carte Profil personnel — fond gris clair */}
          <button
            onClick={() => navigate('/profile/personal')}
            style={{
              backgroundColor: '#f4f6f8',
              borderRadius: '20px',
              border: 'none',
              padding: '40px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
              width: '100%',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8eaed'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f4f6f8'}
          >
            <div style={{
              alignSelf: 'flex-start',
              border: '1.5px solid #1E88E5',
              borderRadius: '20px',
              padding: '8px 24px',
              fontSize: '18px', fontWeight: '600', color: '#1E88E5',
              backgroundColor: '#fff',
            }}>
              Profil
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayUser?.name}
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  backgroundColor: '#1E88E5', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: '700', flexShrink: 0,
                }}>
                  {avatarInitial}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '26px', fontWeight: '700', color: '#111' }}>
                  {displayUser?.name || 'Utilisateur'}
                </div>
                <div style={{ fontSize: '18px', color: '#666', marginTop: '6px' }}>
                  {username}
                </div>
              </div>
              <ChevronRight size={32} color="#1E88E5" />
            </div>
          </button>

          {/* Carte Entreprise — fond bleu */}
          <button
            onClick={() => navigate('/profile/company')}
            style={{
              backgroundColor: '#1E88E5',
              borderRadius: '20px',
              border: 'none',
              padding: '40px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
              width: '100%',
              textAlign: 'left',
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
              Entreprise
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
              }}>
                {logoPath ? (
                  <img src={logoPath} alt="logo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none' }} />
                ) : (
                  <span style={{ fontSize: 32, fontWeight: '700', color: '#1E88E5' }}>
                    {companyInitial}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '26px', fontWeight: '700', color: '#fff' }}>
                  {displayUser?.company_name || 'Mon Entreprise'}
                </div>
              </div>
              <ChevronRight size={32} color="#fff" />
            </div>
          </button>
        </div>

        {/* ── Ligne 2 : 3 tuiles ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>

          {/* Abonnement */}
          <MenuTile
            iconSrc="/iconepay.svg"
            label="Abonnement"
            onClick={() => navigate('/subscription')}
          />

          {/* Mon Historique */}
          <MenuTile
            iconSrc="/navbar_icon2.svg"
            label={'Mon\nHistorique'}
            onClick={() => navigate('/history')}
          />

          {/* Mes Statistiques */}
          <MenuTile
            iconSrc="/navbar_icon3.svg"
            label={'Mes\nStatistiques'}
            onClick={() => navigate('/stats')}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Tuile menu ───────────────────────────────────────────────────────────────

function MenuTile({ iconSrc, label, onClick }) {
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
      }}>
        <img src={iconSrc} alt=""
          style={{ width: 34, height: 34, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      </div>
      <span style={{
        fontSize: '22px', fontWeight: '700', color: '#111',
        textAlign: 'left', lineHeight: 1.3, whiteSpace: 'pre-line',
      }}>
        {label}
      </span>
    </button>
  )
}

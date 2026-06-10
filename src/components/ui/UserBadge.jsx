import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { subscriptionService } from '../../services/subscriptionService'

// ─── Helper URL avatar ────────────────────────────────────────────────────────

function resolveAvatarUrl(avatar_url) {
  if (!avatar_url) return null
  if (avatar_url.startsWith('http')) return avatar_url
  // Chemin relatif type "assets/images/avatars/female_1.jpg" → /avatars/female_1.jpg
  const filename = avatar_url.split('/').pop()
  return `/avatars/${filename}`
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 48, onClick }) {
  const avatarUrl = resolveAvatarUrl(user?.avatar_url)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={user?.name || 'avatar'}
        onClick={onClick}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '2px solid #fff',
          flexShrink: 0, cursor: onClick ? 'pointer' : 'default',
        }}
        onError={e => { e.target.style.display = 'none' }}
      />
    )
  }
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%',
        backgroundColor: '#1E88E5', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', fontSize: size * 0.4,
        border: '2px solid #fff', flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
    </div>
  )
}

// ─── UserBadge ────────────────────────────────────────────────────────────────

export default function UserBadge({ size = 48 }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [daysLeft, setDaysLeft] = useState(null)
  const [plan, setPlan] = useState(user?.plan ?? 'freemium')

  const isPremium = plan === 'pro' || plan === 'basic'

  const badgeBg = plan === 'pro'
    ? '#1E88E5'
    : plan === 'basic'
      ? '#E3F2FD'
      : '#f5f5f5'
  const badgeTextColor = plan === 'pro'
    ? '#fff'
    : plan === 'basic'
      ? '#1E88E5'
      : '#9e9e9e'

  const label = plan === 'pro' ? 'pro' : plan === 'basic' ? 'basic' : 'gratuit'

  const daysDisplay = daysLeft !== null
    ? daysLeft > 30
      ? `${Math.floor(daysLeft / 30)} mois restants`
      : `${daysLeft} jour${daysLeft !== 1 ? 's' : ''} restant${daysLeft !== 1 ? 's' : ''}`
    : null

  useEffect(() => {
    subscriptionService.getStatus()
      .then((res) => {
        const data = res.data
        setPlan(data.plan ?? 'freemium')
        if (data.next_billing_at && data.status === 'active') {
          const end  = new Date(data.next_billing_at)
          const now  = new Date()
          const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
          setDaysLeft(diff > 0 ? diff : 0)
        }
      })
      .catch(() => {
        setPlan(user?.plan ?? 'freemium')
      })
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
      <div
        onClick={() => navigate('/subscription')}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: badgeBg, color: badgeTextColor,
          borderRadius: '20px', padding: '8px 20px',
          fontSize: '16px', fontWeight: '700',
        }}>
          <Zap size={16} fill={badgeTextColor} color={badgeTextColor} />
          {label}
        </div>
        {isPremium && daysDisplay !== null && (
          <span style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
            {daysDisplay}
          </span>
        )}
      </div>
      <Avatar user={user} size={size} onClick={() => navigate('/profile')} />
    </div>
  )
}

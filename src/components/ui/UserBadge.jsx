import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { subscriptionService } from '../../services/subscriptionService'

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 48 }) {
  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '2px solid #fff',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: '#1E88E5', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '700', fontSize: size * 0.4,
      border: '2px solid #fff', flexShrink: 0,
    }}>
      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
    </div>
  )
}

// ─── UserBadge ────────────────────────────────────────────────────────────────

export default function UserBadge({ size = 48 }) {
  const { user } = useAuthStore()
  const [daysLeft, setDaysLeft] = useState(null)
  const [isPro, setIsPro] = useState(user?.plan === 'pro')

  useEffect(() => {
    subscriptionService.getStatus()
      .then((res) => {
        const data = res.data
        setIsPro(data.plan === 'pro' || data.plan === 'basic')

        // Calculer les jours restants depuis next_billing_at
        if (data.next_billing_at) {
          const end  = new Date(data.next_billing_at)
          const now  = new Date()
          const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
          setDaysLeft(diff > 0 ? diff : 0)
        }
      })
      .catch(() => {
        // Fallback sur les données du store
        setIsPro(user?.plan === 'pro')
      })
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#1E88E5', color: '#fff',
          borderRadius: '20px', padding: '8px 20px',
          fontSize: '16px', fontWeight: '700',
        }}>
          <Zap size={16} fill="#fff" />
          {isPro ? 'pro' : 'gratuit'}
        </div>
        {isPro && daysLeft !== null && (
          <span style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
            {daysLeft} jour{daysLeft !== 1 ? 's' : ''} restant{daysLeft !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <Avatar user={user} size={size} />
    </div>
  )
}

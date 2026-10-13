import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { gamificationService } from '../../services/gamificationService'

/**
 * Cloche du dashboard : ouvre « Mes progrès » sur l'onglet Notifications,
 * avec une pastille du nombre de notifications push non lues.
 */
export default function NotificationBell() {
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    gamificationService.getNotifications()
      .then(({ data }) => { if (!cancelled) setUnread(data.unread_count || 0) })
      .catch(() => {}) // non bloquant : la cloche reste affichée sans pastille
    return () => { cancelled = true }
  }, [])

  return (
    <button
      onClick={() => navigate('/progress?tab=notifications')}
      aria-label={unread ? `${unread} notifications non lues` : 'Notifications'}
      style={{
        position: 'relative', width: 46, height: 46, borderRadius: '50%', border: 'none',
        backgroundColor: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}
    >
      <Bell size={22} color="#0079D2" />
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: -3, right: -3, minWidth: 20, padding: '1px 5px', borderRadius: 10,
          backgroundColor: '#D64545', border: '2px solid #fff', color: '#fff', fontSize: 11, fontWeight: 700,
        }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}

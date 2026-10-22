import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { gamificationService } from '../../services/gamificationService'
import Sidebar from './Sidebar'
import CelebrationHost from '../gamification/CelebrationHost'
import useCelebrationDemo from '../gamification/useCelebrationDemo'
import { badgePageCelebrations } from '../gamification/celebrations'
import useCelebrationStore from '../../store/celebrationStore'
import useAuthStore from '../../store/authStore'

// Compte dont les badges ont déjà été vérifiés depuis l'ouverture de l'onglet
let badgesCheckedFor = null

export default function AppLayout() {
  useCelebrationDemo()
  const show = useCelebrationStore((s) => s.show)
  const accountKey = useAuthStore((s) => s.user?.id) ?? null

  // Fête dès l'ouverture les badges et le grade obtenus depuis la dernière
  // visite (dont Akpé, déjà fêté sur le mobile mais pas sur ce navigateur)
  useEffect(() => {
    if (!accountKey || badgesCheckedFor === accountKey) return
    badgesCheckedFor = accountKey
    gamificationService.getBadges()
      .then(({ data }) => badgePageCelebrations(data, accountKey).forEach(show))
      .catch(() => {})
  }, [accountKey, show])

  // Visites pour les badges « Visites de la semaine » et « Semaines assidues »
  useEffect(() => {
    const record = () => gamificationService.recordVisit().catch(() => {})
    const onVisible = () => { if (document.visibilityState === 'visible') record() }
    record()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return (
    <div className="flex overflow-hidden" style={{ backgroundColor: '#f4f6f8', height: '142.86vh' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px 0 0 0',
        margin: '28px 0 0 0',
      }}>
        <Outlet />
      </main>
      <CelebrationHost />
    </div>
  )
}

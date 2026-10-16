import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { gamificationService } from '../../services/gamificationService'
import Sidebar from './Sidebar'
import CelebrationHost from '../gamification/CelebrationHost'
import useCelebrationDemo from '../gamification/useCelebrationDemo'

export default function AppLayout() {
  useCelebrationDemo()

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

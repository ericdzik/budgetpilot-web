import { useEffect } from 'react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import useMediaQuery from '../../hooks/useMediaQuery'
import { gamificationService } from '../../services/gamificationService'
import Sidebar from './Sidebar'
import CelebrationHost from '../gamification/CelebrationHost'
import useCelebrationDemo from '../gamification/useCelebrationDemo'
import { badgePageCelebrations } from '../gamification/celebrations'
import useCelebrationStore from '../../store/celebrationStore'
import useAuthStore from '../../store/authStore'
import useCompanyStore from '../../store/companyStore'
import ReadOnlyBanner from '../company/ReadOnlyBanner'

// Compte dont les badges ont déjà été vérifiés depuis l'ouverture de l'onglet
let badgesCheckedFor = null

export default function AppLayout() {
  useCelebrationDemo()
  const show = useCelebrationStore((s) => s.show)
  const accountKey = useAuthStore((s) => s.user?.id) ?? null
  const narrow = useMediaQuery('(max-width: 900px)')
  // Le tiroir est ouvert pour la page où on l'a ouvert : il se referme tout seul à la navigation
  const [openFor, setOpenFor] = useState(null)
  const { pathname } = useLocation()
  const menuOpen = openFor === pathname
  const loadCompanies = useCompanyStore((s) => s.load)
  const switchCount = useCompanyStore((s) => s.switchCount)

  // Entreprises du compte : liste et entreprise active
  useEffect(() => {
    if (accountKey) loadCompanies()
  }, [accountKey, loadCompanies])

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
      {narrow && menuOpen && (
        <div
          onClick={() => setOpenFor(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.4)', height: '142.86vh' }}
        />
      )}
      <Sidebar drawer={narrow} open={menuOpen} />
      <main className="flex-1 overflow-y-auto" style={{
        backgroundColor: '#ffffff',
        borderRadius: narrow ? 0 : '20px 0 0 0',
        margin: narrow ? 0 : '28px 0 0 0',
        minWidth: 0,
      }}>
        {narrow && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #eef0f2',
          }}>
            <button
              onClick={() => setOpenFor(pathname)}
              aria-label="Ouvrir le menu"
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}
            >
              <Menu size={26} color="#111" />
            </button>
            <img src="/Logo_app2.png" alt="B" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#111' }}>Pilot</span>
          </div>
        )}
        <ReadOnlyBanner />
        {/* Les pages repartent de zéro à chaque changement d'entreprise */}
        <div key={switchCount}>
          <Outlet />
        </div>
      </main>
      <CelebrationHost />
    </div>
  )
}

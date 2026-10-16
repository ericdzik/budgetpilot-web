import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, Shield, Trash2, X } from 'lucide-react'
import UserBadge from '../components/ui/UserBadge'
import BadgeShield from '../components/gamification/BadgeShield'
import LevelMedal from '../components/gamification/LevelMedal'
import { BADGE_TIERS, badgesCelebration, gradeCelebration } from '../components/gamification/celebrations'
import { gamificationService } from '../services/gamificationService'
import useCelebrationStore from '../store/celebrationStore'

const TEXT_DARK = '#2C3E50'
const TEXT_MUTED = '#7F8C8D'
const BLUE = '#0079D2'

// Marges latérales : 14 px sur téléphone, jusqu'à 28 px sur grand écran
const GUTTER = 'clamp(14px, 3vw, 28px)'
const ELLIPSIS = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

// Traits de progression entre les niveaux
const LEVEL_COLOR = '#378ADD'
const LEVEL_DARK = '#185FA5'

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Seuils compacts sous les blasons : 500 000 → 500 k, 5 000 000 → 5 M */
function compact(value) {
  if (value >= 1000000) return `${(value / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`
  if (value >= 1000) return `${Math.round(value / 1000)} k`
  return String(value)
}

function formatValue(category) {
  const value = category.key === 'collected_amount'
    ? Number(category.value).toLocaleString('fr-FR')
    : category.value
  return `${value} ${category.unit}`
}

/** Carte du grade : blason, réduction en cours et badges à obtenir pour le suivant. */
function GradeCard({ page }) {
  const grade = page.grade || {}
  const { current, active, next } = grade
  const tierKey = current || next?.grade || 'silver'
  const tier = BADGE_TIERS[tierKey]
  const badges = `${page.earned_count} badges sur ${page.total}`
  const nextText = current === 'platinum'
    ? `Membre Platinum jusqu'au ${formatDate(grade.platinum_until)}`
    : !next ? 'Grade maximum atteint' : `encore ${next.needed} pour ${BADGE_TIERS[next.grade].label}`
  const subtitle = !current
    ? `Obtenez ${next?.needed ?? 0} badge${next?.needed > 1 ? 's' : ''} pour devenir Silver`
    : active ? `-${grade.discount} % sur votre abonnement` : 'En attente : passez Basic ou Pro'

  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #E6EEF6', borderRadius: 20, padding: 'clamp(16px, 3vw, 22px)',
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
    }}>
      <BadgeShield tier={tierKey} status={current && active ? 'earned' : 'locked'} size={84} />
      <div>
        <div style={{ fontSize: 12, letterSpacing: 1, color: TEXT_MUTED }}>VOTRE GRADE</div>
        <div style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 700, color: TEXT_DARK }}>{current ? tier.label : 'Aucun grade'}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: current && active ? tier.color : TEXT_MUTED, marginTop: 2 }}>{subtitle}</div>
        <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 2 }}>{current ? `${badges} · ${nextText}` : badges}</div>
      </div>
    </div>
  )
}

/** Badge Akpé des premiers utilisateurs */
function AkpeCard({ akpe }) {
  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #EFEFEF', borderRadius: 16, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <LevelMedal category="akpe" size={46} />
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>{akpe.name}</div>
        <div style={{ fontSize: 13, color: TEXT_MUTED }}>Vous faites partie des 5 000 premiers utilisateurs</div>
      </div>
    </div>
  )
}

/** Compte gratuit ou abonnement expiré : grade obtenu mais en attente. */
function UpgradeBanner({ page, onUpgrade }) {
  const tier = BADGE_TIERS[page.grade.current]
  return (
    <div style={{
      backgroundColor: tier.light, borderRadius: 16, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <BadgeShield tier={page.grade.current} size={36} />
      <div style={{ flex: '1 1 220px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>Passez Basic ou Pro pour obtenir votre grade</div>
        <div style={{ fontSize: 13, color: tier.color }}>Grade {tier.label} : -{page.grade.rate} % sur votre abonnement</div>
      </div>
      <button onClick={onUpgrade} style={{
        backgroundColor: BLUE, color: '#fff', border: 'none', borderRadius: 12,
        padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}>
        Voir les offres
      </button>
    </div>
  )
}

/** Remplissage du trait entre le niveau i et le suivant (0 à 1). */
function lineProgress(category, i) {
  const { levels, value } = category
  if (levels[i + 1].status === 'earned') return 1
  if (levels[i].status !== 'earned') return 0
  const ratio = (value - levels[i].threshold) / (levels[i + 1].threshold - levels[i].threshold)
  return Math.max(0, Math.min(1, ratio))
}

function CategoryRow({ category, onOpen }) {
  return (
    <button onClick={() => onOpen(category)} style={{
      display: 'flex', alignItems: 'center', width: '100%', gap: 8, padding: '12px 16px',
      background: 'none', border: 'none', borderTop: '1px solid #F2F2F2', cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK, ...ELLIPSIS }}>{category.name}</div>
        <div style={{ fontSize: 13, color: TEXT_MUTED, ...ELLIPSIS }}>{formatValue(category)}</div>
      </div>
      {/* Les 3 niveaux, reliés par un trait de progression */}
      <div style={{ display: 'flex', alignItems: 'flex-start', width: 'clamp(200px, 36vw, 240px)', flexShrink: 0 }}>
        {category.levels.map((level, i) => (
          <div key={level.level} style={{ display: 'contents' }}>
            {i > 0 && (
              <div style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: '#E5E7EB', marginTop: 28.5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${lineProgress(category, i - 1) * 100}%`, backgroundColor: LEVEL_COLOR }} />
              </div>
            )}
            <div style={{ width: 56, flexShrink: 0, textAlign: 'center' }}>
              <LevelMedal category={category.key} level={level.level} earned={level.status === 'earned'} size={54} />
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: level.status === 'earned' ? LEVEL_DARK : '#B0B0B0' }}>
                {compact(level.threshold)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </button>
  )
}

function Section({ title, categories, onOpen }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK, margin: '0 4px 8px' }}>{title}</div>
      <div style={{ backgroundColor: '#fff', border: '1px solid #EFEFEF', borderRadius: 16, overflow: 'hidden' }}>
        {categories.map((category) => (
          <CategoryRow key={category.key} category={category} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

/** Détail d'une catégorie : nom, quota et statut de chaque badge. */
function CategoryDetail({ category, onClose }) {
  const statusText = (level) => level.status === 'earned'
    ? `Obtenu le ${formatDate(level.earned_at)}`
    : `Plus que ${compact(level.threshold - category.value)} ${category.unit}`

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={category.name} style={{
        width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 20, padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_DARK }}>{category.name}</div>
            <div style={{ fontSize: 14, color: TEXT_MUTED }}>Actuellement : {formatValue(category)}</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color={TEXT_MUTED} />
          </button>
        </div>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {category.levels.map((level) => (
            <div key={level.level} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <LevelMedal category={category.key} level={level.level} earned={level.status === 'earned'} size={48} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>
                  {level.name} · {compact(level.threshold)} {category.unit}
                </div>
                <div style={{ fontSize: 13, color: TEXT_MUTED }}>{statusText(level)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Libellé de l'action selon le type de notification. */
function notificationAction(type = '') {
  if (type === 'unpaid_invoices') return 'Voir les factures'
  if (type === 'monthly_recap') return 'Voir le bilan'
  if (type === 'resume_reminder') return 'Reprendre'
  if (type.startsWith('referral_reminder')) return 'Parrainer'
  if (type.startsWith('badge') || type.startsWith('grade')) return 'Voir mes progrès'
  return 'Voir'
}

/** Aujourd'hui, Hier, puis la date (regroupement des notifications). */
function dayLabel(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  const diff = Math.round((today - day) / 86400000)
  if (diff === 0) return "AUJOURD'HUI"
  if (diff === 1) return 'HIER'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()
}

/** « il y a 2 h », « hier, 09:00 », « 12 oct. » */
function relativeTime(date) {
  const minutes = Math.round((Date.now() - date) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  if (minutes < 24 * 60 && new Date().getDate() === date.getDate()) return `il y a ${Math.round(minutes / 60)} h`
  if (minutes < 48 * 60) return `hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/**
 * Glisser vers la gauche (doigt ou souris) pour supprimer : au-delà de 35 %
 * de la largeur, la carte part et la notification est retirée.
 */
function SwipeToDismiss({ onDismiss, children }) {
  const [dx, setDx] = useState(0)
  const [start, setStart] = useState(null)
  const [leaving, setLeaving] = useState(false)

  const end = (e) => {
    if (start === null) return
    const width = e.currentTarget.offsetWidth
    setStart(null)
    if (-dx > width * 0.35) {
      setLeaving(true)
      setDx(-width)
      setTimeout(onDismiss, 180)
    } else {
      setDx(0)
    }
  }

  return (
    <div style={{ position: 'relative', marginBottom: 10, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0, backgroundColor: BLUE, color: '#fff', fontWeight: 700, fontSize: 14,
        display: dx < 0 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingRight: 20,
      }}>
        <Trash2 size={20} strokeWidth={2.6} /> Supprimer
      </div>
      <div
        onPointerDown={(e) => { if (e.pointerType !== 'mouse' || e.button === 0) setStart(e.clientX) }}
        onPointerMove={(e) => { if (start !== null) setDx(Math.min(0, e.clientX - start)) }}
        onPointerUp={end}
        onPointerLeave={end}
        style={{
          transform: `translateX(${dx}px)`, touchAction: 'pan-y',
          transition: start === null ? 'transform .18s ease-out' : 'none', opacity: leaving ? 0.6 : 1,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function NotificationsTab({ notifications, onOpen, onDismiss, onMarkAllRead }) {
  if (!notifications.length) {
    return (
      <div style={{ textAlign: 'center', color: TEXT_MUTED, padding: 48 }}>
        Vos notifications des 30 derniers jours apparaîtront ici.
      </div>
    )
  }

  const hasUnread = notifications.some((n) => !n.read_at)
  // Titre du jour affiché au-dessus de la première notification de chaque jour
  const days = notifications.map((n) => dayLabel(new Date(n.sent_at)))

  return (
    <div style={{ maxWidth: 760, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', margin: '0 4px 4px' }}>
        <span style={{ flex: 1, fontSize: 13.5, color: TEXT_MUTED }}>
          {notifications.length} notification{notifications.length > 1 ? 's' : ''}
        </span>
        {hasUnread && (
          <button onClick={onMarkAllRead} style={{ background: 'none', border: 'none', color: BLUE, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.map((notification, i) => {
        const unread = !notification.read_at
        const sent = new Date(notification.sent_at)
        const day = days[i]
        const header = i === 0 || days[i - 1] !== day

        return (
          <div key={notification.id}>
            {header && (
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.6, color: TEXT_MUTED, margin: '16px 4px 8px' }}>{day}</div>
            )}
            <SwipeToDismiss onDismiss={() => onDismiss(notification)}>
            <div style={{
              display: 'flex', backgroundColor: '#fff', border: '1px solid #EEF0F3', borderRadius: 14,
              overflow: 'hidden',
            }}>
              {unread && <span style={{ width: 3, backgroundColor: BLUE, flexShrink: 0 }} />}
              <div style={{ flex: 1, padding: '14px 12px 8px 16px', minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: unread ? 700 : 500, color: TEXT_DARK }}>{notification.title}</span>
                      <span style={{ fontSize: 12, color: '#A0A4A8', whiteSpace: 'nowrap' }}>{relativeTime(sent)}</span>
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.4, color: TEXT_MUTED, marginTop: 3 }}>{notification.body}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
                  {notification.route && (
                    <button onClick={() => onOpen(notification.route)} style={{
                      background: 'none', border: 'none', padding: '6px 0', color: BLUE, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    }}>
                      {notificationAction(notification.type)} →
                    </button>
                  )}
                  <span style={{ flex: 1 }} />
                  {/* Corbeille : retire la notification de l'historique */}
                  <button onClick={() => onDismiss(notification)} aria-label="Supprimer la notification" title="Supprimer" style={{
                    backgroundColor: '#E6F1FB', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex',
                  }}>
                    <Trash2 size={19} color={BLUE} strokeWidth={2.6} />
                  </button>
                </div>
              </div>
            </div>
            </SwipeToDismiss>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Bouton segmenté Badges / Notifications : pilule grise, onglet actif en blanc
 * qui glisse ; compteur rouge des notifications non lues.
 */
function SegmentedControl({ value, onChange, unread }) {
  const segments = [
    { key: 'badges', label: 'Badges', Icon: Shield },
    { key: 'notifications', label: 'Notifications', Icon: Bell, count: unread },
  ]
  const index = value === 'notifications' ? 1 : 0

  return (
    <div role="tablist" style={{
      position: 'relative', display: 'flex', width: 420, maxWidth: '100%', height: 46, padding: 4,
      backgroundColor: '#EEF1F4', borderRadius: 14, boxSizing: 'border-box',
    }}>
      <div style={{
        position: 'absolute', top: 4, bottom: 4, left: 4, width: 'calc(50% - 4px)',
        backgroundColor: '#fff', borderRadius: 11, boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        transform: `translateX(${index * 100}%)`, transition: 'transform 0.22s ease-out',
      }} />
      {segments.map(({ key, label, Icon, count }) => {
        const active = value === key
        return (
          <button key={key} role="tab" aria-selected={active} onClick={() => onChange(key)} style={{
            position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 15,
            fontWeight: active ? 600 : 500, color: active ? BLUE : TEXT_MUTED,
          }}>
            <Icon size={18} />
            {label}
            {count > 0 && (
              <span style={{
                minWidth: 20, padding: '1px 6px', borderRadius: 10, backgroundColor: '#D64545',
                color: '#fff', fontSize: 11, fontWeight: 700, boxSizing: 'border-box',
              }}>
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Page « Mes progrès » : badges Silver / Gold / Diamond (Gold et Diamond
 * réservés aux abonnés Basic / Pro) et historique des notifications push.
 */
export default function ProgressPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'notifications' ? 'notifications' : 'badges'
  const show = useCelebrationStore((s) => s.show)

  const [page, setPage] = useState(null)
  const [notifications, setNotifications] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    let cancelled = false

    gamificationService.getBadges()
      .then(({ data }) => {
        if (cancelled) return
        setPage(data)
        // Badges et grade obtenus depuis la dernière visite (ex. après un abonnement)
        if (data.newly_earned?.length) show(badgesCelebration(data.newly_earned))
        if (data.grade?.new) show(gradeCelebration(data.grade.new, data.grade.discount))
      })
      .catch(() => { if (!cancelled) setPage({ categories: [] }) })

    return () => { cancelled = true }
  }, [show])

  // Recharge la liste à chaque ouverture de l'onglet et à chaque retour sur la
  // fenêtre : une notification arrivée entre-temps apparaît sans recharger la page.
  const [focusCount, setFocusCount] = useState(0)
  useEffect(() => {
    const onFocus = () => setFocusCount((n) => n + 1)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const [unread, setUnread] = useState(0)
  useEffect(() => {
    let cancelled = false

    gamificationService.getNotifications()
      .then(({ data }) => {
        if (cancelled) return
        // Marquées lues seulement à l'ouverture de l'onglet Notifications : le
        // compteur du bouton segmenté reste visible tant qu'on est sur les
        // badges. Les points bleus restent affichés pendant la visite.
        const onTab = tab === 'notifications'
        setNotifications(data.notifications || [])
        setUnread(onTab ? 0 : data.unread_count || 0)
        if (onTab && data.unread_count > 0) gamificationService.markNotificationsRead()
      })
      .catch(() => { if (!cancelled) setNotifications([]) })

    return () => { cancelled = true }
  }, [tab, focusCount])

  const categories = page?.categories || []

  // Corbeille : retrait immédiat, remis en place si le serveur refuse
  const dismissNotification = (notification) => {
    setNotifications((list) => list.filter((n) => n.id !== notification.id))
    gamificationService.dismissNotification(notification.id).catch(() => {
      setNotifications((list) => [...list, notification].sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at)))
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 12, padding: `18px ${GUTTER}`,
      }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '700', color: '#111', margin: 0 }}>Mes progrès</h1>
        <UserBadge size={48} />
      </div>

      <div style={{ padding: `0 ${GUTTER} 4px` }}>
        <SegmentedControl
          value={tab}
          onChange={(value) => setSearchParams(value === 'notifications' ? { tab: 'notifications' } : {})}
          unread={unread}
        />
      </div>

      <div style={{ flex: 1, padding: `24px ${GUTTER}`, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
        {tab === 'badges' && (
          !page ? <div style={{ color: TEXT_MUTED }}>Chargement…</div>
            : !categories.length ? <div style={{ color: TEXT_MUTED }}>Impossible de charger vos badges.</div>
              : (
                <>
                  <GradeCard page={page} />
                  {page.grade?.current && !page.grade.active && (
                    <UpgradeBanner page={page} onUpgrade={() => navigate('/subscription')} />
                  )}
                  {page.akpe && <AkpeCard akpe={page.akpe} />}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: 20, alignItems: 'start' }}>
                    <Section title="Actions" categories={categories.filter((c) => c.type === 'action')} onOpen={setDetail} />
                    <Section title="Utilisation de l'app" categories={categories.filter((c) => c.type === 'usage')} onOpen={setDetail} />
                  </div>
                  {/* Licence CC BY 3.0 des icônes : citer les auteurs */}
                  <div style={{ fontSize: 12, color: '#A0A4A8', textAlign: 'center' }}>
                    Icônes des badges : Lorc, Delapouite, Skoll et Carl Olsen,{' '}
                    <a href="https://game-icons.net" target="_blank" rel="noreferrer" style={{ color: '#A0A4A8' }}>game-icons.net</a> (CC BY 3.0)
                  </div>
                </>
              )
        )}

        {tab === 'notifications' && (
          notifications === null
            ? <div style={{ color: TEXT_MUTED }}>Chargement…</div>
            : (
              <NotificationsTab
                notifications={notifications}
                onOpen={(route) => navigate(route)}
                onDismiss={dismissNotification}
                onMarkAllRead={() => setNotifications((list) => list.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))}
              />
            )
        )}
      </div>

      {detail && <CategoryDetail category={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

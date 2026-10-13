import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart3, Bell, Gift, History, Receipt, Shield, X } from 'lucide-react'
import UserBadge from '../components/ui/UserBadge'
import BadgeShield from '../components/gamification/BadgeShield'
import { BADGE_TIERS, badgesCelebration } from '../components/gamification/celebrations'
import { gamificationService } from '../services/gamificationService'
import useCelebrationStore from '../store/celebrationStore'

const TEXT_DARK = '#2C3E50'
const TEXT_MUTED = '#7F8C8D'
const BLUE = '#0079D2'

// Marges latérales : 14 px sur téléphone, jusqu'à 28 px sur grand écran
const GUTTER = 'clamp(14px, 3vw, 28px)'
const ELLIPSIS = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

const RANK_LABELS = { beginner: 'Débutant', silver: 'Silver', gold: 'Gold', diamond: 'Diamond' }

const STATUS_TEXT = {
  pending: 'Seuil atteint : passez Basic ou Pro pour le débloquer',
  paused: 'En pause : réabonnez-vous pour le réactiver',
  locked: 'À obtenir',
}

const NOTIFICATION_ICONS = {
  monthly_recap: BarChart3,
  unpaid_invoices: Receipt,
  resume_reminder: History,
}

function notificationIcon(type) {
  if (type?.startsWith('referral_reminder')) return Gift
  return NOTIFICATION_ICONS[type] || Bell
}

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

function RankCard({ page }) {
  const { current = 'beginner', next, needed = 0 } = page.rank || {}
  const isBeginner = current === 'beginner'
  const nextText = !next
    ? 'Niveau maximum atteint'
    : !page.premium && next !== 'silver'
      ? 'Le niveau Gold demande un abonnement Basic ou Pro'
      : next === 'silver'
      ? 'Obtenez votre premier badge pour devenir Silver'
      : `Encore ${needed} badge${needed > 1 ? 's' : ''} ${BADGE_TIERS[next].label} pour passer ${BADGE_TIERS[next].label}`

  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #E6EEF6', borderRadius: 20, padding: 'clamp(16px, 3vw, 22px)',
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
    }}>
      <BadgeShield tier={isBeginner ? 'silver' : current} status={isBeginner ? 'locked' : 'earned'} size={84} />
      <div>
        <div style={{ fontSize: 12, letterSpacing: 1, color: TEXT_MUTED }}>VOTRE NIVEAU</div>
        <div style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 700, color: TEXT_DARK }}>{RANK_LABELS[current]}</div>
        <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 2 }}>
          {page.earned_count} badges sur {page.total} · {nextText}
        </div>
      </div>
    </div>
  )
}

/** Comptes gratuits ou abonnement expiré : Gold et Diamond réservés à Basic / Pro. */
function UpgradeBanner({ page, onUpgrade }) {
  const pending = page.pending_count || 0
  const paused = page.paused_count || 0
  const details = [
    pending > 0 && `${pending} badge${pending > 1 ? 's' : ''} en attente`,
    paused > 0 && `${paused} badge${paused > 1 ? 's' : ''} en pause`,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{
      backgroundColor: BADGE_TIERS.gold.light, borderRadius: 16, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <BadgeShield tier="gold" size={36} />
      <div style={{ flex: '1 1 220px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>
          {paused > 0 ? 'Réabonnez-vous pour réactiver vos badges' : 'Gold et Diamond sont réservés aux abonnés Basic et Pro'}
        </div>
        {details && <div style={{ fontSize: 13, color: BADGE_TIERS.gold.color }}>{details}</div>}
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
      {category.tiers.map((tier) => (
        <div key={tier.tier} style={{ width: 'clamp(42px, 9vw, 54px)', flexShrink: 0, textAlign: 'center' }}>
          <BadgeShield tier={tier.tier} status={tier.status} size={34} />
          <div style={{
            fontSize: 11, fontWeight: 600, marginTop: 2,
            color: tier.status === 'earned' ? BADGE_TIERS[tier.tier].color : '#B0B0B0',
          }}>
            {compact(tier.threshold)}
          </div>
        </div>
      ))}
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

/** Détail d'une catégorie : statut et seuil de chaque palier. */
function CategoryDetail({ category, onClose }) {
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
          {category.tiers.map((tier) => (
            <div key={tier.tier} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <BadgeShield tier={tier.tier} status={tier.status} size={40} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>
                  {BADGE_TIERS[tier.tier].label} · {compact(tier.threshold)} {category.unit}
                </div>
                <div style={{ fontSize: 13, color: TEXT_MUTED }}>
                  {tier.status === 'earned' ? `Obtenu le ${formatDate(tier.earned_at)}` : STATUS_TEXT[tier.status]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NotificationsTab({ notifications, onOpen }) {
  if (!notifications.length) {
    return (
      <div style={{ textAlign: 'center', color: TEXT_MUTED, padding: 48 }}>
        Vos notifications des 30 derniers jours apparaîtront ici.
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #EFEFEF', borderRadius: 16, overflow: 'hidden' }}>
      {notifications.map((notification, i) => {
        const Icon = notificationIcon(notification.type)
        const unread = !notification.read_at
        return (
          <button
            key={notification.id}
            onClick={() => notification.route && onOpen(notification.route)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%', padding: '14px 18px',
              background: 'none', border: 'none', borderTop: i ? '1px solid #F2F2F2' : 'none',
              cursor: notification.route ? 'pointer' : 'default', textAlign: 'left',
            }}
          >
            <span style={{
              width: 42, height: 42, borderRadius: '50%', backgroundColor: '#E6F1FB', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={20} color={BLUE} />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'flex', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 15, fontWeight: unread ? 700 : 500, color: TEXT_DARK }}>{notification.title}</span>
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>{formatDate(notification.sent_at)}</span>
              </span>
              <span style={{ display: 'block', fontSize: 13.5, lineHeight: 1.4, color: TEXT_MUTED, marginTop: 3 }}>
                {notification.body}
              </span>
            </span>
            {unread && <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: BLUE, marginTop: 6 }} />}
          </button>
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
        // Paliers obtenus depuis la dernière visite (ex. après un abonnement)
        if (data.newly_earned?.length) show(badgesCelebration(data.newly_earned))
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
                  <RankCard page={page} />
                  {(!page.premium || page.paused_count > 0) && (
                    <UpgradeBanner page={page} onUpgrade={() => navigate('/subscription')} />
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: 20, alignItems: 'start' }}>
                    <Section title="Actions" categories={categories.filter((c) => c.type === 'action')} onOpen={setDetail} />
                    <Section title="Utilisation de l'app" categories={categories.filter((c) => c.type === 'usage')} onOpen={setDetail} />
                  </div>
                </>
              )
        )}

        {tab === 'notifications' && (
          notifications === null
            ? <div style={{ color: TEXT_MUTED }}>Chargement…</div>
            : <NotificationsTab notifications={notifications} onOpen={(route) => navigate(route)} />
        )}
      </div>

      {detail && <CategoryDetail category={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

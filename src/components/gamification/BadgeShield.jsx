import { Hourglass, Pause, Lock } from 'lucide-react'
import { BADGE_TIERS } from './celebrations'

const FILLS = {
  silver: '#A9B4C2',
  gold: '#E0A800',
  diamond: '#3FB6E3',
}

const CORNER = { pending: Hourglass, paused: Pause, locked: Lock }

/**
 * Blason en forme de bouclier, en deux tons (même dessin que le mobile) :
 * cercle (Silver), étoile (Gold), losange (Diamond). Gris s'il n'est pas
 * obtenu, avec sablier (en attente d'abonnement), pause ou cadenas.
 */
export default function BadgeShield({ tier = 'silver', status = 'earned', size = 40 }) {
  const colored = status === 'earned' || status === 'pending'
  const fill = colored ? FILLS[tier] : '#E3E3E3'
  const dark = colored ? BADGE_TIERS[tier].color : '#CFCFCF'
  const mark = colored ? '#FFFFFF' : '#B5B5B5'
  const Corner = CORNER[status]

  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ opacity: status === 'pending' ? 0.4 : 1 }} aria-hidden="true">
        <path d="M20 3 L34 8 V19 C34 28 27 34 20 37 C13 34 6 28 6 19 V8 Z" fill={fill} />
        <path d="M20 3 L34 8 V19 C34 28 27 34 20 37 Z" fill={dark} />
        {tier === 'diamond' && <polygon points="20,12 26,17 20,27 14,17" fill={mark} />}
        {tier === 'gold' && (
          <polygon points="20,11 22.2,16.2 27.5,16.5 23.4,19.9 24.8,25.2 20,22.2 15.2,25.2 16.6,19.9 12.5,16.5 17.8,16.2" fill={mark} />
        )}
        {tier === 'silver' && <circle cx="20" cy="19" r="5.5" fill="none" stroke={mark} strokeWidth="2.2" />}
      </svg>
      {Corner && size >= 24 && (
        <span style={{
          position: 'absolute', right: -size * 0.06, bottom: -size * 0.04, backgroundColor: '#fff',
          borderRadius: '50%', padding: size * 0.05, display: 'flex',
        }}>
          <Corner size={size * 0.3} color={status === 'pending' ? BADGE_TIERS[tier].color : '#AAAAAA'} strokeWidth={2.5} />
        </span>
      )}
    </span>
  )
}

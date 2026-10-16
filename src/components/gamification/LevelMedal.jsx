import { BADGE_ICON_PATHS } from './badgeIcons'

const BLUE = '#378ADD'
const BLUE_DARK = '#185FA5'
const LAUREL = '#85B7EB'
const CROWN = '#E0A800'
const AKPE = '#D85A30'
const AKPE_DARK = '#993C1D'

/** Icône game-icons.net placée sur la grille 64 × 64 du médaillon. */
function Icon({ name, x, y, size, height = size, fill }) {
  const paths = BADGE_ICON_PATHS[name] || []
  return (
    <svg x={x} y={y} width={size} height={height} viewBox="0 0 512 512">
      {paths.map((d, i) => <path key={i} d={d} fill={fill} />)}
    </svg>
  )
}

/**
 * Médaillon d'un niveau de badge (même dessin que le mobile) : icône de la
 * catégorie, puis lauriers au niveau 2 et couronne au niveau 3. Verrouillé :
 * icône en filigrane et cadenas.
 */
export default function LevelMedal({ category, level = 1, earned = true, size = 40 }) {
  const akpe = category === 'akpe'

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ flexShrink: 0, overflow: 'visible' }} aria-hidden="true">
      {earned ? (
        <>
          {level >= 2 && <Icon name="laurels" x={2} y={8} size={60} fill={LAUREL} />}
          <circle cx="32" cy="36" r="17" fill={akpe ? AKPE : BLUE} stroke={akpe ? AKPE_DARK : BLUE_DARK} strokeWidth="3" />
          <circle cx="32" cy="36" r="12.5" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" />
          <Icon name={category} x={22} y={26} size={20} fill="#fff" />
          {level >= 3 && <Icon name="crown" x={15} y={-2} size={34} height={24} fill={CROWN} />}
        </>
      ) : (
        <>
          <circle cx="32" cy="36" r="17" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="2" strokeDasharray="4 3" />
          <Icon name={category} x={22} y={26} size={20} fill="#DDDAD2" />
          <circle cx="45" cy="49" r="8" fill="#fff" />
          <Icon name="padlock" x={39.5} y={43.5} size={11} fill="#9C9A92" />
        </>
      )}
    </svg>
  )
}

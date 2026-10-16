import { Star } from 'lucide-react'

/**
 * Repère « Client fidèle » (#9) : étoile seule dans les listes, pastille
 * avec libellé sur la fiche client.
 */
export default function LoyalClientBadge({ compact = false }) {
  if (compact) {
    return <Star size={15} color="#C98A00" fill="#C98A00" aria-label="Client fidèle" style={{ flexShrink: 0 }} />
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E1',
      color: '#B07800', borderRadius: 12, padding: '5px 12px', fontSize: 13, fontWeight: 600,
    }}>
      <Star size={14} color="#C98A00" fill="#C98A00" /> Client fidèle
    </span>
  )
}

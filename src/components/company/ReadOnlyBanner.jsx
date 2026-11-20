import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useActiveCompany } from '../../store/companyStore'

/**
 * Bandeau affiché quand l'entreprise active est en lecture seule : l'offre du
 * compte ne permet plus de la modifier. Consultation et export restent possibles.
 */
export default function ReadOnlyBanner() {
  const navigate = useNavigate()
  const company = useActiveCompany()
  if (!company || company.editable) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      margin: '16px clamp(14px, 3vw, 28px) 0', padding: '12px 16px',
      backgroundColor: '#FFF3E0', border: '1px solid #FFCC80', borderRadius: '14px',
    }}>
      <Lock size={18} color="#E65100" style={{ flexShrink: 0 }} />
      <p style={{ flex: 1, margin: 0, fontSize: '14px', color: '#E65100' }}>
        {company.name} est en lecture seule avec votre offre actuelle. Consultation et export restent possibles.
      </p>
      <button
        onClick={() => navigate('/subscription')}
        style={{
          border: 'none', background: 'none', cursor: 'pointer',
          fontSize: '14px', fontWeight: '600', color: '#1E88E5', padding: '4px 8px',
        }}
      >
        Voir les offres
      </button>
    </div>
  )
}

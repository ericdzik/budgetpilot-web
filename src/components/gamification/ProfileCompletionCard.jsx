import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { gamificationService } from '../../services/gamificationService'

// Le téléphone se renseigne dans le profil personnel, le reste côté entreprise
const PERSONAL_FIELDS = ['phone']

/**
 * Barre de complétion du profil (#2), masquée à 100 % : les champs
 * manquants sont cliquables et mènent à l'écran qui permet de les remplir.
 */
export default function ProfileCompletionCard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    gamificationService.getProfileCompletion()
      .then(({ data: completion }) => { if (!cancelled) setData(completion) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!data || data.percent >= 100) return null

  return (
    <div style={{ backgroundColor: '#e8f4ff', borderRadius: 18, padding: 18, border: '1px solid #d0e8ff' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 10 }}>
        Profil complété à {data.percent} %
      </div>
      <div style={{ height: 8, borderRadius: 8, backgroundColor: 'rgba(30,136,229,0.15)', overflow: 'hidden' }}>
        <div style={{ width: `${data.percent}%`, height: '100%', borderRadius: 8, backgroundColor: '#1E88E5' }} />
      </div>
      {data.missing_fields?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {data.missing_fields.map(({ field, label }) => (
            <button
              key={field}
              onClick={() => navigate(PERSONAL_FIELDS.includes(field) ? '/profile/personal' : '/profile/company')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, backgroundColor: '#fff',
                border: '1px solid #d0e8ff', borderRadius: 20, padding: '6px 12px',
                fontSize: 13, color: '#1E88E5', cursor: 'pointer',
              }}
            >
              <Plus size={14} /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, ShoppingBag, IdCard, UserPlus, BadgeCheck } from 'lucide-react'
import { gamificationService } from '../../services/gamificationService'
import useCelebrationStore from '../../store/celebrationStore'

const BLUE = '#0079D2'
const BLUE_LIGHT = '#E6F1FB'

// Vrai tant que l'utilisateur a vu la checklist incomplète : la fin n'est
// fêtée qu'une fois, et jamais pour un compte qui avait déjà tout fait.
const PENDING_KEY = 'bp_start_checklist_pending'

const STEPS = {
  first_invoice:    { Icon: Receipt,     route: '/documents/new?type=invoice', cta: 'Créer une facture' },
  first_expense:    { Icon: ShoppingBag, route: '/expenses/new',               cta: 'Ajouter une dépense' },
  complete_profile: { Icon: IdCard,      route: '/profile/company',            cta: 'Compléter mon profil' },
  first_client:     { Icon: UserPlus,    route: '/clients',                    cta: 'Ajouter un client' },
}

/**
 * Checklist de démarrage (#7) : une seule étape visible à la fois, la carte
 * disparaît quand les 4 étapes sont faites (même logique que le mobile).
 */
export default function StartChecklistCard() {
  const navigate = useNavigate()
  const show = useCelebrationStore((s) => s.show)
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false

    gamificationService.getChecklist()
      .then(({ data: checklist }) => {
        if (cancelled) return
        if (!checklist.completed) {
          localStorage.setItem(PENDING_KEY, '1')
        } else if (localStorage.getItem(PENDING_KEY) === '1') {
          localStorage.removeItem(PENDING_KEY)
          show({
            color: BLUE, light: BLUE_LIGHT, Icon: BadgeCheck, title: 'Vous êtes prêt !',
            message: 'Votre espace BudgetPilot est configuré. Place à la croissance de votre activité.',
          })
        }
        setData(checklist)
      })
      .catch(() => {}) // non bloquant : sans réponse, pas de carte

    return () => { cancelled = true }
  }, [show])

  if (!data || data.completed) return null

  const steps = data.steps || []
  const current = steps.find((s) => s.key === data.current)
  if (!current) return null

  const { Icon, route, cta } = STEPS[current.key] || STEPS.first_invoice
  const stepNumber = steps.indexOf(current) + 1

  return (
    <div style={{
      flex: '1 1 380px', backgroundColor: '#fff', borderRadius: 18, padding: 18,
      border: `2px solid ${BLUE_LIGHT}`, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: BLUE }}>Bien démarrer</span>
          <span style={{ fontSize: 13, color: '#7F8C8D' }}>Étape {stepNumber} sur {steps.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((step) => (
            <div key={step.key} style={{
              flex: 1, height: 5, borderRadius: 3,
              backgroundColor: step.done ? BLUE : step.key === current.key ? 'rgba(0,121,210,0.35)' : BLUE_LIGHT,
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', backgroundColor: BLUE_LIGHT, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={26} color={BLUE} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#2C3E50' }}>{current.title}</div>
          <div style={{ fontSize: 13, color: '#7F8C8D', marginTop: 2 }}>{current.description}</div>
        </div>
        <button
          onClick={() => navigate(route)}
          style={{
            backgroundColor: BLUE, color: '#fff', border: 'none', borderRadius: 12,
            padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {cta}
        </button>
      </div>
    </div>
  )
}

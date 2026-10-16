import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, TriangleAlert, ChevronRight } from 'lucide-react'
import { gamificationService } from '../../services/gamificationService'

const STYLES = {
  good:  { color: '#1D9E75', light: '#E1F5EE', Icon: Heart },
  watch: { color: '#C98A00', light: '#FAEEDA', Icon: Eye },
  alert: { color: '#D64545', light: '#FCEBEB', Icon: TriangleAlert },
}

// Où agir selon le point faible signalé par le backend
const ISSUE_ROUTES = {
  unpaid: '/history?tab=invoices&filter=unpaid_and_pending',
  profit: '/history?tab=expenses',
}

/**
 * Indicateur simplifié de santé financière (#6) : Bonne santé / À surveiller /
 * Attention, avec un conseil. Masqué sans opération récente.
 */
export default function FinancialHealthCard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    gamificationService.getFinancialHealth()
      .then(({ data: health }) => { if (!cancelled) setData(health) })
      .catch(() => {}) // non bloquant : la carte reste masquée
    return () => { cancelled = true }
  }, [])

  const style = STYLES[data?.status]
  if (!style) return null

  const { color, light, Icon } = style
  const hasIssue = Boolean(ISSUE_ROUTES[data.issue])

  // Recharge avant de naviguer : si le point faible a disparu entre-temps
  // (dernier impayé encaissé), on ouvre la liste complète des factures.
  const openIssue = async () => {
    try {
      const { data: fresh } = await gamificationService.getFinancialHealth()
      navigate(ISSUE_ROUTES[fresh.issue] || '/history?tab=invoices')
    } catch {
      navigate(ISSUE_ROUTES[data.issue])
    }
  }

  return (
    <div
      onClick={hasIssue ? openIssue : undefined}
      role={hasIssue ? 'button' : undefined}
      style={{
        flex: '1 1 380px', backgroundColor: light, borderRadius: 18, padding: 18,
        display: 'flex', alignItems: 'center', gap: 14, cursor: hasIssue ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '50%', backgroundColor: '#fff', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#7F8C8D' }}>
          Santé financière · <span style={{ fontSize: 15, fontWeight: 700, color }}>{data.label}</span>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.4, color: '#2C3E50', marginTop: 3 }}>{data.message}</div>
      </div>
      {hasIssue && <ChevronRight size={22} color={color} />}
    </div>
  )
}

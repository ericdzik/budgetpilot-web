import { Receipt, FileText, Trophy, Banknote, Star, Rocket } from 'lucide-react'
import { formatAmount } from '../../store/currencyStore'

// Mêmes paliers et couleurs que le mobile (milestone_messages.dart)
const VOLUME_MILESTONES = [10, 50, 100]

const BLUE   = { color: '#0079D2', light: '#E6F1FB' }
const GREEN  = { color: '#1D9E75', light: '#E1F5EE' }
const PURPLE = { color: '#7F77DD', light: '#EEEDFE' }
const AMBER  = { color: '#C98A00', light: '#FAEEDA' }

const TROPHIES = {
  100: { name: 'or', color: '#C98A00', light: '#FAEEDA' },
  50:  { name: 'argent', color: '#6B7A8C', light: '#EDF0F3' },
  10:  { name: 'bronze', color: '#B0662E', light: '#F7E9DE' },
}

/**
 * Convertit la clé `milestones` d'une réponse API en liste de célébrations,
 * dans le même ordre que le mobile.
 */
export function milestonesToCelebrations(milestones) {
  if (!milestones || typeof milestones !== 'object') return []

  const stats = milestones.stats || {}
  const amount = stats.amount != null ? formatAmount(stats.amount, stats.currency) : null
  const list = []

  if (milestones.first_invoice) {
    list.push({ ...BLUE, Icon: Receipt, title: 'Première facture !',
      message: 'Votre activité décolle sur BudgetPilot.', stat: amount, statLabel: 'facturés' })
  }

  if (milestones.first_quote) {
    list.push({ ...PURPLE, Icon: FileText, title: 'Premier devis !',
      message: "Un devis clair, c'est déjà une vente à moitié faite.", stat: amount, statLabel: 'proposés' })
  }

  if (milestones.volume_milestone) {
    const n = Number(milestones.volume_milestone)
    const trophy = n >= 100 ? TROPHIES[100] : n >= 50 ? TROPHIES[50] : TROPHIES[10]
    const isLast = n >= VOLUME_MILESTONES[VOLUME_MILESTONES.length - 1]
    list.push({ color: trophy.color, light: trophy.light, Icon: Trophy, title: `${n} factures !`,
      message: isLast
        ? `Trophée ${trophy.name} débloqué. Vous faites partie des meilleurs.`
        : `Trophée ${trophy.name} débloqué. Belle progression !`,
      stat: String(n), statLabel: 'factures émises' })
  }

  if (milestones.first_paid_invoice) {
    list.push({ ...GREEN, Icon: Banknote, title: 'Premier encaissement !',
      message: "L'argent rentre. C'est le meilleur moment du métier.", stat: amount, statLabel: 'encaissés' })
  }

  if (milestones.loyal_client) {
    const { client_name: name, threshold = 5 } = milestones.loyal_client
    list.push({ ...AMBER, Icon: Star, title: 'Client fidèle !',
      message: `${name || 'Ce client'} a payé ${threshold} factures. Un client régulier à chouchouter.` })
  }

  if (milestones.usage_milestone) {
    const days = Number(milestones.usage_milestone.days || 28)
    const duration = days >= 365 ? '1 an' : days >= 182 ? '6 mois' : days >= 91 ? '3 mois' : '4 semaines'
    const ops = milestones.usage_milestone.operations_count
    list.push({ ...BLUE, Icon: Rocket, title: `${duration} avec BudgetPilot !`,
      message: `Vous utilisez BudgetPilot depuis ${duration}. Merci pour votre confiance.`,
      stat: ops != null ? String(ops) : null, statLabel: 'opérations enregistrées' })
  }

  return list
}

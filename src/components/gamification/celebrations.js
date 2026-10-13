import { Receipt, FileText, Banknote, Star, Rocket, Shield } from 'lucide-react'
import { formatAmount } from '../../store/currencyStore'

// Mêmes couleurs et mêmes tampons que le mobile (milestone_messages.dart)
const BLUE   = { color: '#0079D2', light: '#E6F1FB' }
const GREEN  = { color: '#1D9E75', light: '#E1F5EE' }
const PURPLE = { color: '#7F77DD', light: '#EEEDFE' }
const AMBER  = { color: '#C98A00', light: '#FAEEDA' }

export const BADGE_TIERS = {
  silver:  { label: 'Silver',  color: '#8E99A8', light: '#EEF1F4' },
  gold:    { label: 'Gold',    color: '#B98500', light: '#FBF1D6' },
  diamond: { label: 'Diamond', color: '#1E8FBF', light: '#E0F4FB' },
}
const TIER_ORDER = ['silver', 'gold', 'diamond']

/**
 * Célébration d'un ou plusieurs badges débloqués d'un coup : un certificat
 * tamponné au nom du badge, ou du meilleur palier s'ils sont plusieurs.
 */
export function badgesCelebration(badges) {
  const best = [...TIER_ORDER].reverse().find((t) => badges.some((b) => b.tier === t)) || 'silver'
  const tier = BADGE_TIERS[best]
  const single = badges.length === 1

  return {
    color: tier.color, light: tier.light, Icon: Shield,
    title: single ? `${badges[0].name} ${tier.label} !` : `${badges.length} nouveaux badges !`,
    message: single
      ? 'Nouveau badge débloqué.'
      : badges.map((b) => `${b.name} ${BADGE_TIERS[b.tier]?.label ?? ''}`).join(' · '),
    stampText: tier.label.toUpperCase(),
    kind: 'certificate',
    docTitle: single ? badges[0].name : 'Nouveaux badges',
    docSubtitle: single ? `Badge ${tier.label}` : `${badges.length} badges débloqués`,
  }
}

/**
 * Convertit la clé `milestones` d'une réponse API en liste de célébrations
 * « tampon », dans le même ordre que le mobile.
 */
export function milestonesToCelebrations(milestones) {
  if (!milestones || typeof milestones !== 'object') return []

  const stats = milestones.stats || {}
  const amount = stats.amount != null ? formatAmount(stats.amount, stats.currency) : null
  const client = stats.client_name || null
  const list = []

  if (milestones.first_invoice) {
    list.push({ ...BLUE, Icon: Receipt, title: 'Première facture !',
      message: 'Votre activité décolle sur BudgetPilot.',
      stampText: 'ÉMISE', kind: 'invoice', docTitle: client, docAmount: amount })
  }

  if (milestones.first_quote) {
    list.push({ ...PURPLE, Icon: FileText, title: 'Premier devis !',
      message: "Un devis clair, c'est déjà une vente à moitié faite.",
      stampText: 'ENVOYÉ', kind: 'quote', docTitle: client, docAmount: amount })
  }

  if (milestones.first_paid_invoice) {
    list.push({ ...GREEN, Icon: Banknote, title: 'Premier encaissement !',
      message: "L'argent rentre. C'est le meilleur moment du métier.",
      stampText: 'PAYÉ', kind: 'invoice', docTitle: client, docAmount: amount })
  }

  if (milestones.loyal_client) {
    const { client_name: name, threshold = 5 } = milestones.loyal_client
    list.push({ ...AMBER, Icon: Star, title: 'Client fidèle !',
      message: `${name || 'Ce client'} a payé ${threshold} factures. Un client régulier à chouchouter.`,
      stampText: 'FIDÈLE', kind: 'certificate', docTitle: name || 'Client fidèle',
      docSubtitle: `${threshold} factures payées` })
  }

  if (milestones.usage_milestone) {
    const days = Number(milestones.usage_milestone.days || 28)
    const duration = days >= 365 ? '1 an' : days >= 182 ? '6 mois' : days >= 91 ? '3 mois' : '4 semaines'
    const ops = milestones.usage_milestone.operations_count
    list.push({ ...BLUE, Icon: Rocket, title: `${duration} avec BudgetPilot !`,
      message: `Vous utilisez BudgetPilot depuis ${duration}. Merci pour votre confiance.`,
      stat: ops != null ? String(ops) : null, statLabel: 'opérations enregistrées',
      stampText: duration.toUpperCase(), kind: 'certificate',
      docTitle: 'Ancienneté', docSubtitle: `Membre depuis ${duration}` })
  }

  // Badges Silver / Gold / Diamond débloqués par cette action (remplacent les
  // anciens paliers 10 / 50 / 100). Le client fidèle est déjà fêté au-dessus.
  const badges = (milestones.badges || []).filter(
    (b) => !(b.category === 'loyal_clients' && milestones.loyal_client),
  )
  if (badges.length) list.push(badgesCelebration(badges))

  return list
}

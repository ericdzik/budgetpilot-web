import { Receipt, FileText, Banknote, Star, Rocket, Shield, Award } from 'lucide-react'
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
  platinum: { label: 'Platinum', color: '#6A57A8', light: '#EFEBF8' },
}

// Badges à niveaux (Facturier, Pro de la facture…) et badge Akpé
const LEVEL = { color: '#185FA5', light: '#E6F1FB' }
const AKPE = { color: '#993C1D', light: '#FAECE7' }

/**
 * Célébration d'un ou plusieurs badges débloqués d'un coup : un certificat
 * tamponné au nom du badge, ou un récapitulatif s'ils sont plusieurs.
 */
export function badgesCelebration(badges) {
  const single = badges.length === 1
  const first = badges[0]
  const akpe = single && first.category === 'akpe'

  return {
    ...(akpe ? AKPE : LEVEL), Icon: Award,
    title: single ? `${first.name} !` : `${badges.length} nouveaux badges !`,
    message: akpe
      ? 'Vous faites partie des 5 000 premiers utilisateurs de BudgetPilot. Merci !'
      : single
        ? `Nouveau badge débloqué : ${first.category_name}, niveau ${first.level}.`
        : badges.map((b) => b.name).join(' · '),
    stampText: 'BRAVO',
    kind: 'certificate',
    medal: single ? { category: first.category, level: first.level } : null,
    docTitle: single ? first.name : 'Nouveaux badges',
    docSubtitle: akpe
      ? '5 000 premiers utilisateurs'
      : single ? `${first.category_name} · niveau ${first.level}` : `${badges.length} badges débloqués`,
  }
}

/**
 * Nouveau grade : certificat tamponné SILVER, GOLD, DIAMOND ou PLATINUM,
 * avec la réduction obtenue sur l'abonnement.
 */
export function gradeCelebration(grade, discount = 0) {
  const tier = BADGE_TIERS[grade] || BADGE_TIERS.silver
  return {
    color: tier.color, light: tier.light, Icon: Shield,
    title: `Grade ${tier.label} !`,
    message: `Vous bénéficiez désormais de -${Math.round(discount)} % sur votre abonnement.`,
    stampText: tier.label.toUpperCase(),
    kind: 'certificate',
    shield: grade,
    docTitle: `Grade ${tier.label}`,
    docSubtitle: `-${Math.round(discount)} % sur l'abonnement`,
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

  // Badges débloqués par cette action. Le client fidèle est déjà fêté au-dessus.
  const badges = (milestones.badges || []).filter(
    (b) => !(b.category === 'loyal_clients' && milestones.loyal_client),
  )
  if (badges.length) list.push(badgesCelebration(badges))

  // Nouveau grade atteint grâce à ces badges (abonnés Basic / Pro)
  if (milestones.grade?.grade) list.push(gradeCelebration(milestones.grade.grade, milestones.grade.discount))

  return list
}

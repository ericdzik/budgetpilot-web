import { useEffect } from 'react'
import useCelebrationStore from '../../store/celebrationStore'

// Mêmes exemples que la démo debug du mobile (debug_celebrations_screen.dart)
const SAMPLES = [
  { first_invoice: true, stats: { amount: 350000, currency: 'XOF', client_name: 'Boutique Akwaba' } },
  { first_quote: true, stats: { amount: 125000, currency: 'XOF', client_name: 'Pharmacie du Port' } },
  { first_paid_invoice: true, stats: { amount: 350000, currency: 'XOF', client_name: 'Boutique Akwaba' } },
  { badges: [{ category: 'invoices', name: 'Facturation', tier: 'silver' }] },
  { badges: [
    { category: 'invoices', name: 'Facturation', tier: 'gold' },
    { category: 'paid_invoices', name: 'Encaissement', tier: 'silver' },
    { category: 'seniority', name: 'Ancienneté', tier: 'diamond' },
  ] },
  { loyal_client: { client_id: 1, client_name: 'Boutique Akwaba', threshold: 5 } },
  { usage_milestone: { days: 28, operations_count: 12 } },
]

/**
 * Développement uniquement : ouvrir une page avec ?demo-celebrations rejoue
 * toutes les célébrations à la suite. Absent du build de production.
 */
export default function useCelebrationDemo() {
  const showMilestones = useCelebrationStore((s) => s.showMilestones)

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (!new URLSearchParams(window.location.search).has('demo-celebrations')) return
    SAMPLES.forEach((sample) => showMilestones(sample))
  }, [showMilestones])
}

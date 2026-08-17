import { useState, useCallback } from 'react'
import useAuthStore from '../store/authStore'
import PremiumFeatureModal from '../components/ui/PremiumFeatureModal'

const PREMIUM_PLANS = ['basic', 'pro', 'welcome']

/**
 * Vrai si le plan utilisateur donne accès aux fonctionnalités premium.
 */
export function isPremiumPlan(plan) {
  return PREMIUM_PLANS.includes(plan)
}

/**
 * Gate premium réutilisable.
 *  - requirePremium('nom de la fonctionnalité') → false + ouvre la popup
 *    si l'utilisateur est gratuit.
 *  - modal : à rendre dans la page pour afficher la popup.
 */
export default function usePremiumGate() {
  const user = useAuthStore((s) => s.user)
  const [feature, setFeature] = useState(null)
  const [blocking, setBlocking] = useState(false)

  const isPremium = isPremiumPlan(user?.plan)

  const requirePremium = useCallback((featureName, isBlocking = false) => {
    if (isPremium) return true
    setFeature(featureName || '')
    setBlocking(isBlocking)
    return false
  }, [isPremium])

  const close = useCallback(() => setFeature(null), [])

  const modal = feature !== null && (
    <PremiumFeatureModal
      open
      feature={feature}
      blocking={blocking}
      onClose={close}
    />
  )

  return { isPremium, requirePremium, modal }
}
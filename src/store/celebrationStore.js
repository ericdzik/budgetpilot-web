import { create } from 'zustand'
import { milestonesToCelebrations } from '../components/gamification/celebrations'

/**
 * File d'attente des célébrations plein écran : plusieurs jalons d'une même
 * action (ex. première facture + ancienneté) s'affichent l'un après l'autre.
 */
let nextId = 0
const withId = (celebration) => ({ ...celebration, id: ++nextId })

const useCelebrationStore = create((set) => ({
  queue: [],

  show: (celebration) => set((state) => ({ queue: [...state.queue, withId(celebration)] })),

  /** Jalons renvoyés par l'API (clé `milestones`) → célébrations */
  showMilestones: (milestones) => {
    const items = milestonesToCelebrations(milestones)
    if (items.length) set((state) => ({ queue: [...state.queue, ...items.map(withId)] }))
  },

  next: () => set((state) => ({ queue: state.queue.slice(1) })),
}))

export default useCelebrationStore

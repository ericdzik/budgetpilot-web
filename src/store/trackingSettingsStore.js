/**
 * Store des paramètres du tracking (logo client, nom, logo Budget Pilot)
 * Persisté en localStorage — visible pour tous les utilisateurs du même navigateur.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useTrackingSettingsStore = create(
  persist(
    (set) => ({
      // Logo sidebar gauche (getdenis)
      clientLogoUrl: '/denistest.png',
      clientName:    'getdenis',

      // Logo header droite (Budget Pilot)
      partnerLogoUrl: '/Logo_app2.png',
      partnerName:    'Budget pilot',

      setClientLogo:  (url)  => set({ clientLogoUrl: url }),
      setClientName:  (name) => set({ clientName: name }),
      setPartnerLogo: (url)  => set({ partnerLogoUrl: url }),
      setPartnerName: (name) => set({ partnerName: name }),

      resetToDefaults: () => set({
        clientLogoUrl:  '/denistest.png',
        clientName:     'getdenis',
        partnerLogoUrl: '/Logo_app2.png',
        partnerName:    'Budget pilot',
      }),
    }),
    { name: 'tracking-settings-storage' }
  )
)

export default useTrackingSettingsStore

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../config/api'

const useTrackingAuthStore = create(
  persist(
    (set) => ({
      trackingUser: null,
      trackingToken: null,
      isTrackingAuthenticated: false,

      trackingLogin: async (trackingId, password) => {
        const response = await api.post('/tracking/auth/login', {
          tracking_id: trackingId,
          password,
        })
        const { user, token } = response.data
        set({ trackingUser: user, trackingToken: token, isTrackingAuthenticated: true })
        return response.data
      },

      trackingLogout: async () => {
        try {
          await api.post('/tracking/auth/logout')
        } catch (_) {}
        set({ trackingUser: null, trackingToken: null, isTrackingAuthenticated: false })
      },

      // Nettoyage synchrone sans appel réseau — utilisé par l'intercepteur 401
      trackingClearSession: () => {
        set({ trackingUser: null, trackingToken: null, isTrackingAuthenticated: false })
      },
    }),
    {
      name: 'tracking-auth-storage',
      partialize: (state) => ({
        trackingUser:             state.trackingUser,
        trackingToken:            state.trackingToken,
        isTrackingAuthenticated:  state.isTrackingAuthenticated,
      }),
    }
  )
)

export default useTrackingAuthStore

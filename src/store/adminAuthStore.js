import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../config/api'

const useAdminAuthStore = create(
  persist(
    (set) => ({
      adminUser:            null,
      adminToken:           null,
      isAdminAuthenticated: false,

      adminLogin: async (email, password) => {
        const response = await api.post('/admin/auth/login', { email, password })
        const { token, admin } = response.data
        set({ adminUser: admin, adminToken: token, isAdminAuthenticated: true })
        return response.data
      },

      adminLogout: async () => {
        try {
          await api.post('/admin/auth/logout')
        } catch (_) {}
        set({ adminUser: null, adminToken: null, isAdminAuthenticated: false })
      },

      // Nettoyage synchrone — utilisé par l'intercepteur 401
      adminClearSession: () => {
        set({ adminUser: null, adminToken: null, isAdminAuthenticated: false })
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        adminUser:            state.adminUser,
        adminToken:           state.adminToken,
        isAdminAuthenticated: state.isAdminAuthenticated,
      }),
    }
  )
)

export default useAdminAuthStore

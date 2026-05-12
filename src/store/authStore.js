import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../config/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (identifier, identifierType, password) => {
        const response = await api.post('/login', {
          identifier,
          identifier_type: identifierType,
          password,
        })
        const { user, token } = response.data
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
        return response.data
      },

      register: async (data) => {
        const response = await api.post('/register', data)
        const { user, token } = response.data
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
        return response.data
      },

      googleLogin: async ({ google_id, email, name, avatar_url }) => {
        const response = await api.post('/auth/google', { google_id, email, name, avatar_url })
        const { user, token } = response.data
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
        return response.data
      },

      logout: async () => {
        try {
          await api.post('/logout')
        } catch (_) {
          // ignorer les erreurs réseau au logout
        }
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      refreshUser: async () => {
        const response = await api.get('/profile')
        set({ user: response.data.user })
        return response.data.user
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore

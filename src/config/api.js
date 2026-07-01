import axios from 'axios'
import useTrackingAuthStore from '../store/trackingAuthStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://147.93.95.204/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Flag anti-boucle — évite que deux 401 simultanés déclenchent deux redirections
let isRedirectingTracking = false
let isRedirectingApp = false

// Injecter le token automatiquement sur chaque requête
// Priorité : token tracking si on est sur /tracking, sinon token Budget Pilot
api.interceptors.request.use((config) => {
  const isTrackingRoute = config.url?.startsWith('/tracking/')

  if (isTrackingRoute) {
    try {
      const trackingStorage = JSON.parse(localStorage.getItem('tracking-auth-storage') || '{}')
      const trackingToken = trackingStorage?.state?.trackingToken
      if (trackingToken) {
        config.headers.Authorization = `Bearer ${trackingToken}`
        return config
      }
    } catch (_) {}
  }

  // Token Budget Pilot standard
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gérer les erreurs globalement (401 → déconnexion)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isTracking = window.location.pathname.startsWith('/tracking')

      if (isTracking && !isRedirectingTracking) {
        isRedirectingTracking = true
        // Vider l'état Zustand EN MÉMOIRE immédiatement (pas juste localStorage)
        useTrackingAuthStore.getState().trackingClearSession()
        window.location.href = '/tracking/login'
      } else if (!isTracking && !isRedirectingApp) {
        isRedirectingApp = true
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

import axios from 'axios'
import useTrackingAuthStore from '../store/trackingAuthStore'
import useAdminAuthStore from '../store/adminAuthStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.69:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Flag anti-boucle — évite que deux 401 simultanés déclenchent deux redirections
let isRedirectingTracking = false
let isRedirectingApp      = false
let isRedirectingAdmin    = false

// Injecter le token automatiquement sur chaque requête
// Priorité : admin si /admin/, tracking si /tracking/, sinon Budget Pilot
api.interceptors.request.use((config) => {
  const isAdminRoute   = config.url?.startsWith('/admin/')
  const isTrackingRoute = config.url?.startsWith('/tracking/')

  if (isAdminRoute) {
    try {
      const adminStorage = JSON.parse(localStorage.getItem('admin-auth-storage') || '{}')
      const adminToken   = adminStorage?.state?.adminToken
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`
        return config
      }
    } catch (_) {}
  }

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
      const path = window.location.pathname

      if (path.startsWith('/admin') && !isRedirectingAdmin) {
        isRedirectingAdmin = true
        useAdminAuthStore.getState().adminClearSession()
        window.location.href = '/admin/login'
      } else if (path.startsWith('/tracking') && !isRedirectingTracking) {
        isRedirectingTracking = true
        useTrackingAuthStore.getState().trackingClearSession()
        window.location.href = '/tracking/login'
      } else if (!path.startsWith('/admin') && !path.startsWith('/tracking') && !isRedirectingApp) {
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

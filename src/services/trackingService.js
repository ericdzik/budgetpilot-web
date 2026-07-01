import api from '../config/api'

export const trackingService = {
  // Stats globales + par commercial + graphique journalier
  getStats: async (from, to) => {
    const params = {}
    if (from) params.from = from
    if (to)   params.to   = to
    const response = await api.get('/tracking/stats', { params })
    return response.data
  },

  // Historique paginé des scans
  getScans: async ({ group, code, from, to, page = 1 } = {}) => {
    const params = { page }
    if (group) params.group = group
    if (code)  params.code  = code
    if (from)  params.from  = from
    if (to)    params.to    = to
    const response = await api.get('/tracking/scans', { params })
    return response.data
  },

  // Liste des liens avec leurs stats
  getLinks: async () => {
    const response = await api.get('/tracking/links')
    return response.data
  },

  // Créer un lien
  createLink: async (data) => {
    const response = await api.post('/tracking/links', data)
    return response.data
  },

  // Activer / désactiver un lien
  toggleLink: async (id) => {
    const response = await api.patch(`/tracking/links/${id}/toggle`)
    return response.data
  },

  // Supprimer un lien
  deleteLink: async (id) => {
    await api.delete(`/tracking/links/${id}`)
  },
}

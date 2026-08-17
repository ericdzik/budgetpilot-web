import api from '../config/api'

const fmtDate = (d) => {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const dashboardService = {
  getStats: (periodParam = 'month', startDate = null, endDate = null) => {
    const params = new URLSearchParams({ period: periodParam })
    if (periodParam === 'custom' && startDate && endDate) {
      params.append('start_date', fmtDate(startDate))
      params.append('end_date',   fmtDate(endDate))
    }
    return api.get(`/dashboard/stats?${params.toString()}`)
  },

  getTreasury: (periodParam = 'month', startDate = null, endDate = null) => {
    const params = new URLSearchParams({ period: periodParam })
    if (periodParam === 'custom' && startDate && endDate) {
      params.append('start_date', fmtDate(startDate))
      params.append('end_date',   fmtDate(endDate))
    }
    return api.get(`/dashboard/treasury?${params.toString()}`)
  },

  // Bannière publicitaire pour le slot 'web'
  getWebBanner: () => api.get('/banners/web'),
}

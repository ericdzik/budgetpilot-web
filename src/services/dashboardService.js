import api from '../config/api'

export const dashboardService = {
  getStats: (periodParam = 'month', year = null) => {
    const params = new URLSearchParams({ period: periodParam })
    if (year) params.append('year', year)
    return api.get(`/dashboard/stats?${params.toString()}`)
  },

  getTreasury: (periodParam = 'month') =>
    api.get(`/dashboard/treasury?period=${periodParam}`),
}

import api from '../config/api'

export const dashboardService = {
  getStats: (period = 'month') =>
    api.get(`/dashboard/stats?period=${period}`),

  getTreasury: () => api.get('/dashboard/treasury'),
}

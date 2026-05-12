import api from '../config/api'

export const revenueService = {
  getAll: (page = 1) => api.get(`/revenues?page=${page}`),

  getOne: (id) => api.get(`/revenues/${id}`),

  create: (data) => api.post('/revenues', data),

  update: (id, data) => api.put(`/revenues/${id}`, data),

  delete: (id) => api.delete(`/revenues/${id}`),

  getStats: () => api.get('/revenues/stats'),
}

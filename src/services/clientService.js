import api from '../config/api'

export const clientService = {
  getAll: (page = 1) => api.get(`/clients?page=${page}`),

  getOne: (id) => api.get(`/clients/${id}`),

  create: (data) => api.post('/clients', data),

  update: (id, data) => api.put(`/clients/${id}`, data),

  delete: (id) => api.delete(`/clients/${id}`),

  search: (query) => api.get(`/clients/search?q=${encodeURIComponent(query)}`),
}

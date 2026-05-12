import api from '../config/api'

export const expenseService = {
  getAll: (page = 1) => api.get(`/expenses?page=${page}`),

  getOne: (id) => api.get(`/expenses/${id}`),

  create: (data) => api.post('/expenses', data),

  update: (id, data) => api.put(`/expenses/${id}`, data),

  delete: (id) => api.delete(`/expenses/${id}`),

  getStats: () => api.get('/expenses/stats'),

  getPayments: (id) => api.get(`/expenses/${id}/payments`),

  addPayment: (id, data) => api.post(`/expenses/${id}/payments`, data),

  deletePayment: (expId, paymentId) =>
    api.delete(`/expenses/${expId}/payments/${paymentId}`),

  markAsPaid: (id) => api.post(`/expenses/${id}/mark-as-paid`),

  markAsUnpaid: (id) => api.post(`/expenses/${id}/mark-as-unpaid`),

  exportCsv: (id) =>
    api.get(`/expenses/${id}/csv`, { responseType: 'blob' }),
}

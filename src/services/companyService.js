import api from '../config/api'

export const companyService = {
  list: () => api.get('/companies'),

  // Cumul des chiffres de toutes les entreprises (lecture seule)
  consolidated: (params) => api.get('/dashboard/consolidated', { params }),

  create: (data) => api.post('/companies', data),

  // Archive ZIP (fichiers CSV) de toutes les données d'une entreprise
  exportZip: (id) => api.get(`/companies/${id}/export`, { responseType: 'blob' }),

  remove: (id, confirmName) => api.delete(`/companies/${id}`, { data: { confirm_name: confirmName } }),
}

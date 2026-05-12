import api from '../config/api'

export const documentService = {
  getDocument: (id) => api.get(`/documents/${id}`),
  getProfile:  ()  => api.get('/profile'),
}

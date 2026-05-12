import api from '../config/api'

export const subscriptionService = {
  getStatus: () => api.get('/subscription/status'),

  initiate: (data) => api.post('/subscription/initiate', data),

  cancel: () => api.post('/subscription/cancel'),
}

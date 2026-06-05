import api from '../config/api'

export const subscriptionService = {
  getStatus: () => api.get('/subscription/status'),

  initiate: (data) => api.post('/subscription/initiate', {
    plan: data.plan,
    cycle: data.billing_cycle,
  }),

  cancel: () => api.post('/subscription/cancel'),
}

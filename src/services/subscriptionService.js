import api from '../config/api'

export const subscriptionService = {
  getStatus: () => api.get('/subscription/status'),

  initiate: (data) => api.post('/subscription/initiate', {
    plan: data.plan,
    cycle: data.billing_cycle,
  }),

  cancel: () => api.post('/subscription/cancel'),

  /**
   * Vérification côté serveur d'une transaction KKiaPay.
   * Appelé après le callback succès du SDK JS KKiaPay.
   *
   * @param {string} transactionId  — ID retourné par le widget KKiaPay
   * @param {string} plan           — 'basic' | 'pro'
   * @param {string} cycle          — 'monthly' | '3months' | 'yearly'
   */
  kkiapayVerify: (transactionId, plan, cycle) =>
    api.post('/subscription/kkiapay/verify', {
      transaction_id: transactionId,
      plan,
      cycle,
    }),
}

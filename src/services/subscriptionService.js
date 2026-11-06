import api from '../config/api'

export const subscriptionService = {
  getStatus: () => api.get('/subscription/status'),

  initiate: (data) => api.post('/subscription/initiate', {
    plan: data.plan,
    cycle: data.billing_cycle,
    platform: 'web',
  }),

  /**
   * Passerelles à essayer dans l'ordre (KKiaPay d'abord, SEMOA en relais)
   * et montant à payer, remise de grade comprise.
   */
  gateways: (plan, cycle) => api.get('/subscription/gateways', { params: { plan, cycle } }),

  /** La passerelle n'a pas pu être utilisée avant tout débit : le serveur la saute pour cet utilisateur. */
  reportGatewayFailure: (gateway, plan, cycle) =>
    api.post('/subscription/gateways/failure', { gateway, plan, cycle }),

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
      transaction_id: String(transactionId),
      plan,
      cycle,
    }),
}

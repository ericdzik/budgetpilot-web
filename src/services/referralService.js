import api from '../config/api'

export const referralService = {
  /**
   * GET /api/referral/info
   * Retourne code, lien, stats, filleuls et top filleuls.
   */
  getInfo: () => api.get('/referral/info'),

  /**
   * POST /api/referral/validate-code
   * Vérifie un code de parrainage pendant l'inscription.
   */
  validateCode: (code) =>
    api.post('/referral/validate-code', { code: code.toUpperCase().trim() }),
}

import api from '../config/api'

export const gamificationService = {
  getChecklist:         () => api.get('/gamification/checklist'),
  getFinancialHealth:   () => api.get('/gamification/financial-health'),
  getProfileCompletion: () => api.get('/profile/completion'),
}

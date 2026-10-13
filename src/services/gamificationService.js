import api from '../config/api'

export const gamificationService = {
  getChecklist:         () => api.get('/gamification/checklist'),
  getFinancialHealth:   () => api.get('/gamification/financial-health'),
  getProfileCompletion: () => api.get('/profile/completion'),
  getBadges:            () => api.get('/gamification/badges'),
  getNotifications:     () => api.get('/notifications'),
  markNotificationsRead: () => api.post('/notifications/read'),
  recordVisit:          () => api.post('/activity/visit', { platform: 'web' }),
}

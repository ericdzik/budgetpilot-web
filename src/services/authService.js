import api from '../config/api'

export const authService = {
  login: (identifier, identifierType, password) =>
    api.post('/login', { identifier, identifier_type: identifierType, password }),

  register: (data) => api.post('/register', data),

  logout: () => api.post('/logout'),

  getProfile: () => api.get('/profile'),

  updateProfile: (data) => api.post('/profile', data),

  updateCompanyProfile: (data) => api.post('/profile/company', data),

  uploadLogo: (formData) =>
    api.post('/profile/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadSignature: (formData) =>
    api.post('/profile/signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteLogo: () => api.delete('/profile/logo'),

  deleteSignature: () => api.delete('/profile/signature'),

  changePassword: (data) => api.post('/profile/change-password', data),

  forgotPassword: (email) => api.post('/password/forgot', { email }),

  resetPassword: (data) => api.post('/password/reset', data),
}

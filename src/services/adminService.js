import api from '../config/api'

// Helper — injecte le token admin dans chaque requête admin
const adminHeaders = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('admin-auth-storage') || '{}')
    const token  = stored?.state?.adminToken
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  } catch (_) {
    return {}
  }
}

export const adminService = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login:  (email, password) => api.post('/admin/auth/login', { email, password }),
  logout: ()                => api.post('/admin/auth/logout', {}, adminHeaders()),
  me:     ()                => api.get('/admin/auth/me', adminHeaders()),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboard: () => api.get('/admin/dashboard', adminHeaders()),

  // ── Utilisateurs ──────────────────────────────────────────────────────────
  getUsers: (params = {}) => api.get('/admin/users', { ...adminHeaders(), params }),
  getUserDetail: (id)     => api.get(`/admin/users/${id}`, adminHeaders()),
  updateUser: (id, data)  => api.patch(`/admin/users/${id}`, data, adminHeaders()),
  addSupportNote: (id, data) => api.post(`/admin/users/${id}/notes`, data, adminHeaders()),

  // ── Parrainage ────────────────────────────────────────────────────────────
  getReferrals:      (params = {}) => api.get('/admin/referrals', { ...adminHeaders(), params }),
  getReferrerDetail: (id, params = {}) => api.get(`/admin/referrals/${id}`, { ...adminHeaders(), params }),
  addVersement:      (id, data)    => api.post(`/admin/referrals/${id}/versement`, data, adminHeaders()),

  // ── Bannières ─────────────────────────────────────────────────────────────
  getBanners:        ()            => api.get('/banners', adminHeaders()),
  updateBanner:      (slot, formData) => api.post(`/admin/banners/${slot}`, formData, {
    ...adminHeaders(),
    headers: { ...adminHeaders().headers, 'Content-Type': 'multipart/form-data' },
  }),
  deleteBannerImage: (slot)        => api.delete(`/admin/banners/${slot}/image`, adminHeaders()),
}

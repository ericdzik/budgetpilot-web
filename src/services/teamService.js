import api from '../config/api'

/** Équipe d'une entreprise : membres, invitations, profils, historique. */
export const teamService = {
  members: (companyId) => api.get(`/companies/${companyId}/members`),

  invite: (companyId, data) => api.post(`/companies/${companyId}/invitations`, data),

  cancelInvitation: (companyId, invitationId) => api.delete(`/companies/${companyId}/invitations/${invitationId}`),

  updateRole: (companyId, memberId, role) => api.put(`/companies/${companyId}/members/${memberId}`, { role }),

  removeMember: (companyId, memberId) => api.delete(`/companies/${companyId}/members/${memberId}`),

  // La personne invitée saisit son code : elle rejoint l'entreprise
  accept: (code) => api.post('/invitations/accept', { code }),

  // Historique des actions (dirigeant seulement)
  activity: (companyId) => api.get(`/companies/${companyId}/activity`),
}

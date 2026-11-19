import api from '../config/api'

/** Équipe d'une entreprise : membres, invitations, profils, historique. */
export const teamService = {
  members: (companyId) => api.get(`/companies/${companyId}/members`),

  invite: (companyId, data) => api.post(`/companies/${companyId}/invitations`, data),

  // Nouveau code et nouveau lien pour une invitation en attente (l'ancien lien cesse de fonctionner)
  share: (companyId, invitationId) => api.post(`/companies/${companyId}/invitations/${invitationId}/share`),

  // Aperçu public d'une invitation (entreprise, profil), sans connexion
  preview: (code) => api.get(`/invitations/${encodeURIComponent(code)}`),

  cancelInvitation: (companyId, invitationId) => api.delete(`/companies/${companyId}/invitations/${invitationId}`),

  updateRole: (companyId, memberId, role) => api.put(`/companies/${companyId}/members/${memberId}`, { role }),

  removeMember: (companyId, memberId) => api.delete(`/companies/${companyId}/members/${memberId}`),

  // La personne invitée saisit son code : elle rejoint l'entreprise
  accept: (code) => api.post('/invitations/accept', { code }),

  // Historique des actions (dirigeant seulement)
  activity: (companyId) => api.get(`/companies/${companyId}/activity`),
}

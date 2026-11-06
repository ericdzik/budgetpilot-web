import { useActiveCompany } from '../store/companyStore'

/**
 * Le profil de la personne dans l'entreprise active autorise-t-il cette action ?
 * Les actions sont celles de config/permissions.php du serveur (ex. 'clients.delete').
 * Le dirigeant peut tout ; une entreprise sans profil (anciens serveurs) aussi.
 */
export default function useCan() {
  const active = useActiveCompany()
  return (action) => !active || !active.role || active.role === 'owner' || (active.permissions || []).includes(action)
}

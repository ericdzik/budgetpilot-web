// Code d'invitation gardé le temps de se connecter ou de créer un compte, puis repris sur /join.
const KEY = 'pending-invite-code'

export const pendingInvite = {
  set: (code) => { try { localStorage.setItem(KEY, code) } catch { /* stockage indisponible */ } },
  get: () => { try { return localStorage.getItem(KEY) } catch { return null } },
  clear: () => { try { localStorage.removeItem(KEY) } catch { /* rien à faire */ } },
  /** Où aller après une connexion : l'invitation en attente, sinon le tableau de bord. */
  nextPath: () => {
    const code = pendingInvite.get()
    return code ? `/join?code=${encodeURIComponent(code)}` : '/dashboard'
  },
}

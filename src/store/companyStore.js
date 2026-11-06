import { create } from 'zustand'
import useAuthStore from './authStore'
import useCurrencyStore from './currencyStore'
import { companyService } from '../services/companyService'
import {
  clearActiveCompanyInMemory, getActiveCompanyId, restoreActiveCompany, setActiveCompany,
} from './companyContext'

/**
 * Entreprises du compte et entreprise active.
 * `switchCount` augmente à chaque changement : les pages sont remontées et se rechargent.
 */
const useCompanyStore = create((set, get) => {
  /** Active une entreprise : profil, devise et pages se rechargent sur elle. */
  const activate = async (companyId) => {
    setActiveCompany(useAuthStore.getState().user?.id, companyId)
    const user = await useAuthStore.getState().refreshUser().catch(() => null)
    // La devise est propre à chaque entreprise
    if (user) useCurrencyStore.getState().initFromUser(user)
    set((s) => ({ switchCount: s.switchCount + 1 }))
  }

  return {
    companies: [],
    limit: 1,
    canCreate: false,
    plan: 'freemium',
    loaded: false,
    // Faux quand le serveur ne connaît pas encore le multi-compte (route absente)
    available: true,
    // Vrai quand la liste n'a pas pu être chargée (réseau, serveur)
    loadError: false,
    switchCount: 0,

    /** Charge la liste ; si l'entreprise mémorisée n'existe plus, retour à la principale. */
    load: async () => {
      restoreActiveCompany(useAuthStore.getState().user?.id)
      try {
        const { data } = await companyService.list()
        // Entreprises du compte, puis celles où l'on a été invité (avec profil et droits)
        set({
          companies: [...data.companies, ...(data.joined_companies ?? [])],
          limit: data.limit, canCreate: data.can_create, plan: data.plan,
          available: true, loadError: false,
        })
      } catch (error) {
        // 404 : le serveur n'a pas encore le multi-compte. Autre erreur : on garde la dernière liste connue.
        if (error.response?.status === 404) set({ available: false, loadError: false })
        else set({ loadError: true })
      }

      const { companies } = get()
      const activeId = getActiveCompanyId()
      if (companies.length && !companies.some((c) => c.id === activeId)) {
        await activate((companies.find((c) => c.is_primary) ?? companies[0]).id)
      } else if (activeId && !get().loaded) {
        const active = companies.find((c) => c.id === activeId)
        // Démarrage sur une autre entreprise que la principale : son profil remplace celui chargé au départ
        if (active && !active.is_primary) await activate(activeId)
      }
      set({ loaded: true })
    },

    switchTo: async (companyId) => {
      if (companyId === getActiveCompanyId()) return
      await activate(companyId)
    },

    create: async ({ name, activity, currency }) => {
      const { data } = await companyService.create({ name, activity: activity || undefined, currency })
      await get().load()
      await activate(data.company.id)
      return data.company
    },

    remove: async (company) => {
      await companyService.remove(company.id, company.name)
      if (company.id === getActiveCompanyId()) setActiveCompany(useAuthStore.getState().user?.id, null)
      await get().load()
    },

    /** Oublie les entreprises du compte précédent (déconnexion). */
    reset: () => {
      clearActiveCompanyInMemory()
      set({ companies: [], limit: 1, canCreate: false, plan: 'freemium', loaded: false, available: true, loadError: false })
    },
  }
})

// Déconnexion : on oublie les entreprises du compte
useAuthStore.subscribe((state, previous) => {
  if (previous.isAuthenticated && !state.isAuthenticated) useCompanyStore.getState().reset()
})

/** Entreprises du compte, sans celles où l'on a été invité (elles ne comptent pas dans le quota). */
export function isOwned(company) {
  return !company.role || company.role === 'owner'
}

/** Entreprise active (la principale à défaut). */
export function useActiveCompany() {
  return useCompanyStore((s) => {
    const id = getActiveCompanyId()
    return s.companies.find((c) => c.id === id) ?? s.companies.find((c) => c.is_primary) ?? s.companies[0] ?? null
  })
}

export default useCompanyStore

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, KeyRound, LayoutGrid, Lock, Plus, Store } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useCompanyStore, { isOwned, useActiveCompany } from '../../store/companyStore'
import { ROLE_LABELS } from '../team/teamConstants'
import ConfirmDialog from '../ui/ConfirmDialog'
import CompanyAvatar from './CompanyAvatar'
import CreateCompanyModal from './CreateCompanyModal'

/** Message affiché quand l'offre du compte ne permet pas d'ajouter d'entreprise. */
export function CompanyLimitDialog({ open, onClose }) {
  const navigate = useNavigate()
  const { limit, plan } = useCompanyStore()
  // Le plafond de l'offre Pro est le maximum actuel : pas d'offre supérieure à proposer
  const atMaximum = plan === 'pro'

  return (
    <ConfirmDialog
      open={open}
      icon="store"
      title="Limite atteinte"
      message={atMaximum
        ? `Votre offre permet ${limit} entreprises, le maximum actuel. Supprimez-en une pour en ajouter une autre.`
        : `Votre offre permet ${limit} entreprise${limit > 1 ? 's' : ''}. Passez à une offre supérieure pour en ajouter.`}
      confirmLabel={atMaximum ? 'Compris' : 'Voir les offres'}
      cancelLabel="Plus tard"
      hideCancel={atMaximum}
      onConfirm={() => { onClose(); if (!atMaximum) navigate('/subscription') }}
      onCancel={onClose}
    />
  )
}

/**
 * Sélecteur d'entreprise en haut du menu : l'entreprise active, et au clic la liste des
 * entreprises du compte, puis de celles où l'on a été invité (avec le profil).
 * N'apparaît que si la personne a plusieurs entreprises.
 */
export default function CompanySwitcher() {
  const navigate = useNavigate()
  const onConsolidated = useLocation().pathname === '/consolidated'
  const { companies, canCreate, switchTo } = useCompanyStore()
  const active = useActiveCompany()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const box = useRef(null)

  // Fermeture au clic en dehors du menu
  useEffect(() => {
    if (!open) return undefined
    const close = (event) => { if (box.current && !box.current.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (companies.length < 2) return null

  const owned = companies.filter(isOwned)
  const invited = companies.filter((c) => !isOwned(c))

  const choose = async (company) => {
    setOpen(false)
    if (company.id === active?.id && !onConsolidated) return
    await switchTo(company.id)
    if (onConsolidated) navigate('/dashboard')
    toast.success(`${company.name} est maintenant votre entreprise active.`)
  }

  const go = (path) => { setOpen(false); navigate(path) }

  const item = { boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '11px 12px', borderRadius: 12, fontSize: 17, backgroundColor: 'transparent', color: '#222' }
  const label = { margin: 0, padding: '12px 12px 4px', fontSize: 13, letterSpacing: '0.05em', color: '#8A94A0' }

  const row = (company) => {
    const selected = !onConsolidated && company.id === active?.id
    return (
      <button key={company.id} onClick={() => choose(company)} style={{ ...item, backgroundColor: selected ? '#EAF2FF' : 'transparent' }}>
        <CompanyAvatar company={company} size={36} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selected ? '600' : '400' }}>
          {company.name}
        </span>
        {!isOwned(company) && (
          <span style={{ flexShrink: 0, fontSize: 13, padding: '3px 10px', borderRadius: 12, backgroundColor: '#EAF2FF', color: '#1E6FE0', fontWeight: '500' }}>{ROLE_LABELS[company.role]}</span>
        )}
        {isOwned(company) && !company.editable && <Lock size={15} color="#616161" />}
        {selected && <Check size={20} color="#1E6FE0" />}
      </button>
    )
  }

  return (
    <div ref={box} style={{ padding: '0 16px 8px', position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox" aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 9px 9px 12px', borderRadius: 50,
          border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left',
        }}
      >
        {onConsolidated
          ? <span style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#1E6FE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LayoutGrid size={18} color="#fff" /></span>
          : active && <CompanyAvatar company={active} size={34} />}
        <span style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: '700', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {onConsolidated ? 'Toutes mes entreprises' : active?.name}
        </span>
        {/* Chevron bleu dans un petit rond, calé à droite et centré sur la hauteur */}
        <span style={{
          width: 30, height: 30, borderRadius: '50%', backgroundColor: '#EAF2FF', flexShrink: 0, marginLeft: 'auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChevronDown size={20} color="#1E6FE0" strokeWidth={2.5} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </span>
      </button>

      {open && (
        <div role="listbox" style={{
          position: 'absolute', left: 16, width: 350, top: 'calc(100% - 2px)', zIndex: 80, backgroundColor: '#fff', borderRadius: 18,
          border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: 8, maxHeight: 440, overflowY: 'auto', overflowX: 'hidden',
        }}>
          <button onClick={() => go('/consolidated')} style={{ ...item, backgroundColor: onConsolidated ? '#EAF2FF' : 'transparent' }}>
            <span style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#1E6FE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LayoutGrid size={18} color="#fff" /></span>
            <span style={{ flex: 1 }}>Toutes mes entreprises</span>
            {onConsolidated && <Check size={16} color="#1E6FE0" />}
          </button>

          <p style={label}>MES ENTREPRISES</p>
          {owned.map(row)}
          <button onClick={() => { setOpen(false); canCreate ? setCreating(true) : setLimitOpen(true) }} style={{ ...item, color: '#757575' }}>
            <span style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px dashed #64B5F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color="#42A5F5" /></span>
            Ajouter une entreprise
          </button>

          {invited.length > 0 && (
            <>
              <p style={label}>INVITÉ CHEZ</p>
              {invited.map(row)}
            </>
          )}

          <div style={{ borderTop: '1px solid #EEF0F2', margin: '6px 4px 0', paddingTop: 6 }}>
            <button onClick={() => go('/companies')} style={{ ...item, color: '#757575' }}><Store size={21} color="#8A94A0" /> Gérer mes entreprises</button>
            <button onClick={() => go('/join-company')} style={{ ...item, color: '#757575' }}><KeyRound size={21} color="#8A94A0" /> Rejoindre avec un code</button>
          </div>
        </div>
      )}

      <CreateCompanyModal open={creating} onClose={() => setCreating(false)} />
      <CompanyLimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
    </div>
  )
}

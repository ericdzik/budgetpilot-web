import { useEffect, useState } from 'react'
import { Check, Lock, Plus, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useCompanyStore, { isOwned, useActiveCompany } from '../../store/companyStore'
import { ROLE_LABELS } from '../team/teamConstants'
import CompanyAvatar from './CompanyAvatar'
import CreateCompanyModal from './CreateCompanyModal'
import { CompanyLimitDialog } from './CompanySwitcher'

/**
 * Boîte de dialogue centrée « Changer d'entreprise », ouverte depuis la carte Entreprise du profil.
 * Fond flouté : on devine la page derrière. Un clic en dehors de la boîte (ou Échap) la ferme.
 */
export default function CompanyPickerDialog({ open, onClose }) {
  const { companies, canCreate, switchTo } = useCompanyStore()
  const active = useActiveCompany()
  const [creating, setCreating] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const choose = async (company) => {
    onClose()
    if (company.id === active?.id) return
    await switchTo(company.id)
    toast.success(`${company.name} est maintenant votre entreprise active.`)
  }

  const add = () => {
    onClose()
    if (canCreate) setCreating(true)
    else setLimitOpen(true)
  }

  return (
    <>
      {open && (
        <div
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, boxSizing: 'border-box', backgroundColor: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
          }}
        >
          <div role="dialog" aria-modal="true" aria-label="Changer d'entreprise" style={{
            position: 'relative', width: '100%', maxWidth: 460, maxHeight: '75vh', overflowY: 'auto', boxSizing: 'border-box',
            backgroundColor: '#fff', borderRadius: 20, padding: '28px 24px 20px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          }}>
            <button onClick={onClose} aria-label="Fermer" style={{
              position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%',
              border: '1.5px solid #BDBDBD', background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={18} color="#9E9E9E" />
            </button>

            <h2 style={{ margin: '0 44px 4px 0', fontSize: 24, fontWeight: 700, color: '#000' }}>Changer d'entreprise</h2>
            <p style={{ margin: '0 0 14px', fontSize: 15, color: '#757575' }}>Choisissez l'entreprise à utiliser</p>

            {companies.map((company) => {
              const selected = company.id === active?.id
              const meta = [company.currency, !company.editable && isOwned(company) ? 'lecture seule' : null].filter(Boolean).join(' · ')
              return (
                <button key={company.id} onClick={() => choose(company)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', border: 'none',
                  cursor: 'pointer', padding: '10px 8px', borderRadius: 12, backgroundColor: selected ? '#EAF2FF' : 'transparent',
                }}>
                  <CompanyAvatar company={company} size={44} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 17, fontWeight: selected ? 700 : 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {company.name}
                    </span>
                    {meta && <span style={{ display: 'block', fontSize: 13, color: '#757575' }}>{meta}</span>}
                  </span>
                  {!isOwned(company) && (
                    <span style={{ flexShrink: 0, fontSize: 13, padding: '3px 10px', borderRadius: 12, backgroundColor: '#EAF2FF', color: '#1E6FE0', fontWeight: 500 }}>
                      {ROLE_LABELS[company.role]}
                    </span>
                  )}
                  {isOwned(company) && !company.editable && <Lock size={16} color="#616161" />}
                  {selected && <Check size={22} color="#1E88E5" />}
                </button>
              )
            })}

            <button onClick={add} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', border: 'none',
              cursor: 'pointer', padding: '10px 8px', borderRadius: 12, backgroundColor: 'transparent', marginTop: 4,
            }}>
              <span style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={22} color="#42A5F5" />
              </span>
              <span style={{ fontSize: 17, fontWeight: 500, color: '#111' }}>Ajouter une entreprise</span>
            </button>
          </div>
        </div>
      )}

      <CreateCompanyModal open={creating} onClose={() => setCreating(false)} />
      <CompanyLimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
    </>
  )
}

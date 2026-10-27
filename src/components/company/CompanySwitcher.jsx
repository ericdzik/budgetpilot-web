import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Lock, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useCompanyStore, { useActiveCompany } from '../../store/companyStore'
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
 * Rangée d'entreprises en haut du menu : un clic sur un médaillon change
 * d'entreprise. N'apparaît que si le compte en a plusieurs.
 */
export default function CompanySwitcher() {
  const navigate = useNavigate()
  const onConsolidated = useLocation().pathname === '/consolidated'
  const { companies, canCreate, switchTo } = useCompanyStore()
  const active = useActiveCompany()
  const [creating, setCreating] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)

  if (companies.length < 2) return null

  const choose = async (company) => {
    if (company.id === active?.id && !onConsolidated) return
    await switchTo(company.id)
    if (onConsolidated) navigate('/dashboard')
    toast.success(`${company.name} est maintenant votre entreprise active.`)
  }

  return (
    <div style={{ padding: '0 20px 8px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {/* Cumul de toutes les entreprises */}
        <button
          onClick={() => navigate('/consolidated')}
          title="Toutes mes entreprises"
          aria-label="Toutes mes entreprises"
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
            backgroundColor: '#1E88E5', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: onConsolidated ? '0 0 0 2px #f4f6f8, 0 0 0 4px #1E88E5' : 'none',
          }}
        >
          <LayoutGrid size={18} color="#fff" />
        </button>
        {companies.map((company) => {
          const isActive = !onConsolidated && company.id === active?.id
          return (
            <button
              key={company.id}
              onClick={() => choose(company)}
              title={company.editable ? company.name : `${company.name} (lecture seule)`}
              style={{
                position: 'relative', border: 'none', background: 'none', padding: 0,
                cursor: isActive ? 'default' : 'pointer', borderRadius: '50%',
                boxShadow: isActive ? '0 0 0 2px #f4f6f8, 0 0 0 4px #1E88E5' : 'none',
              }}
            >
              <CompanyAvatar company={company} size={40} />
              {!company.editable && (
                <span style={{
                  position: 'absolute', right: -3, bottom: -3, width: 18, height: 18,
                  borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #d0d0d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lock size={10} color="#616161" />
                </span>
              )}
            </button>
          )
        })}
        <button
          onClick={() => (canCreate ? setCreating(true) : setLimitOpen(true))}
          title="Ajouter une entreprise"
          aria-label="Ajouter une entreprise"
          style={{
            width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
            border: '1.5px dashed #64B5F6', backgroundColor: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Plus size={20} color="#42A5F5" />
        </button>
      </div>

      {(onConsolidated || active) && (
        <p style={{ margin: '10px 0 0', fontSize: '14px', fontWeight: '700', color: '#111' }}>
          {onConsolidated ? 'Toutes mes entreprises' : active.name}
          {!onConsolidated && active.currency && (
            <span style={{ fontWeight: '400', color: '#808080', marginLeft: 6 }}>{active.currency}</span>
          )}
        </p>
      )}

      <CreateCompanyModal open={creating} onClose={() => setCreating(false)} />
      <CompanyLimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
    </div>
  )
}

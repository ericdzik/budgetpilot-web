import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import UserBadge from '../components/ui/UserBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import CompanyAvatar from '../components/company/CompanyAvatar'
import CreateCompanyModal from '../components/company/CreateCompanyModal'
import { CompanyLimitDialog } from '../components/company/CompanySwitcher'
import useCompanyStore, { isOwned, useActiveCompany } from '../store/companyStore'
import { ROLE_LABELS } from '../components/team/teamConstants'
import { companyService } from '../services/companyService'

const GUTTER = 'clamp(14px, 3vw, 28px)'

function Tag({ children, background, color, icon }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
      borderRadius: '50px', fontSize: '16px', fontWeight: '500', backgroundColor: background, color,
    }}>
      {icon}{children}
    </span>
  )
}

/** Quota de l'offre : nombre d'entreprises utilisées. */
function Quota({ used, limit, plan }) {
  const over = used > limit
  const planLabel = { pro: 'Pro', basic: 'Basic' }[plan] ?? 'Gratuite'
  const ratio = limit === 0 ? 0 : Math.min(1, over ? limit / used : used / limit)

  return (
    <div style={{ backgroundColor: over ? '#FFF3E0' : '#e3f2fd', borderRadius: '20px', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: '24px', fontWeight: '700', color: '#111' }}>
          {over ? `${limit} modifiable${limit > 1 ? 's' : ''} sur ${used}` : `${used} entreprise${used > 1 ? 's' : ''} sur ${limit}`}
        </span>
        <span style={{ fontSize: '18px', color: over ? '#E65100' : '#1565C0' }}>Offre {planLabel}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, backgroundColor: '#fff', marginTop: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${ratio * 100}%`, backgroundColor: over ? '#FB8C00' : '#1E88E5', borderRadius: 4 }} />
      </div>
      {over && (
        <p style={{ margin: '12px 0 0', fontSize: '18px', color: '#E65100' }}>
          Les autres sont en consultation et export seulement.
        </p>
      )}
    </div>
  )
}

/** Message d'état de la page (fonction indisponible, chargement impossible). */
function Notice({ title, children, action }) {
  return (
    <div style={{ backgroundColor: '#f5f5f5', borderRadius: '20px', padding: '24px' }}>
      <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#111' }}>{title}</p>
      <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: 1.5 }}>{children}</p>
      {action && (
        <button onClick={action.onClick} style={{
          marginTop: 14, border: 'none', borderRadius: '50px', padding: '10px 22px', cursor: 'pointer',
          backgroundColor: '#1E88E5', color: '#fff', fontSize: '14px', fontWeight: '600',
        }}>
          {action.label}
        </button>
      )}
    </div>
  )
}

/** Gestion des entreprises du compte : quota, activation, modification, suppression, ajout. */
export default function CompaniesPage() {
  const navigate = useNavigate()
  const { companies, limit, plan, canCreate, loaded, available, loadError, load, switchTo, remove } = useCompanyStore()
  const active = useActiveCompany()
  const [creating, setCreating] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { load() }, [load])

  const activate = async (company) => {
    if (company.id === active?.id) return
    await switchTo(company.id)
    toast.success(`${company.name} est maintenant votre entreprise active.`)
  }

  const edit = async (company) => {
    await switchTo(company.id)
    navigate('/profile/company')
  }

  // Télécharge l'archive des données avant une suppression
  const downloadExport = async () => {
    setExporting(true)
    try {
      const response = await companyService.exportZip(toDelete.id)
      const disposition = response.headers['content-disposition'] || ''
      const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] || `export-${toDelete.name}.zip`
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Export téléchargé.')
    } catch {
      toast.error("Impossible de préparer l'export. Vérifiez votre connexion et réessayez.")
    } finally {
      setExporting(false)
    }
  }

  const confirmDelete = async () => {
    const company = toDelete
    setToDelete(null)
    try {
      await remove(company)
      toast.success(`${company.name} a été supprimée.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Suppression impossible. Vérifiez votre connexion et réessayez.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <style>{`.co-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 44px 28px; }
        @media (max-width: 640px) { .co-grid { grid-template-columns: 1fr; } }`}</style>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 12, padding: `18px ${GUTTER}`,
      }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '700', color: '#111', margin: 0 }}>Mes entreprises</h1>
        <UserBadge size={48} />
      </div>

      <div style={{ flex: 1, padding: `8px ${GUTTER} 32px`, display: 'flex', flexDirection: 'column', gap: 44, width: '100%', boxSizing: 'border-box' }}>
        {!available && (
          <Notice title="Pas encore disponible sur ce serveur">
            La gestion de plusieurs entreprises n'est pas encore activée sur le serveur auquel cette application est connectée.
          </Notice>
        )}

        {available && loadError && companies.length === 0 && (
          <Notice title="Impossible de charger vos entreprises" action={{ label: 'Réessayer', onClick: load }}>
            Vérifiez votre connexion, puis réessayez.
          </Notice>
        )}

        {available && (loaded || companies.length > 0) && !(loadError && companies.length === 0) && (
          <Quota used={companies.filter(isOwned).length} limit={limit} plan={plan} />
        )}

        <div className="co-grid">
        {companies.map((company) => {
          const isActive = company.id === active?.id
          const subtitle = [!isOwned(company) && company.owner_name ? `Dirigeant : ${company.owner_name}` : null, company.activity, company.currency].filter(Boolean).join(' · ')
          return (
            <div key={company.id} style={{
              backgroundColor: '#fff', borderRadius: '20px', padding: '32px 30px',
              border: isActive ? '2px solid #1E88E5' : '1px solid #e8eaed',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <CompanyAvatar company={company} size={72} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#111' }}>{company.name}</p>
                  {subtitle && <p style={{ margin: '6px 0 0', fontSize: '18px', color: '#808080' }}>{subtitle}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {!isActive && (
                    <button onClick={() => activate(company)} style={{
                      border: 'none', borderRadius: '50px', padding: '8px 16px', cursor: 'pointer',
                      backgroundColor: '#e3f2fd', color: '#1E88E5', fontSize: '19px', fontWeight: '600',
                    }}>
                      Activer
                    </button>
                  )}
                  {isOwned(company) && company.editable && (
                    <button onClick={() => edit(company)} title="Modifier" aria-label="Modifier" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 8 }}>
                      <Pencil size={26} color="#1E88E5" />
                    </button>
                  )}
                  {isOwned(company) && companies.filter(isOwned).length > 1 && (
                    <button onClick={() => setToDelete(company)} title="Supprimer" aria-label="Supprimer" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 8 }}>
                      <Trash2 size={26} color="#1E88E5" />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 26 }}>
                {isActive && <Tag background="#E8F5E9" color="#2E7D32">Active</Tag>}
                {company.is_primary && <Tag background="#f5f5f5" color="#616161">Principale</Tag>}
                {!isOwned(company) && <Tag background="#EAF2FF" color="#1E6FE0">{ROLE_LABELS[company.role]} · invité</Tag>}
                {!company.editable && <Tag background="#FFF3E0" color="#E65100" icon={<Lock size={11} />}>Lecture seule</Tag>}
              </div>
              {!company.editable && (
                <p style={{ margin: '14px 0 0', fontSize: '18px', color: '#808080' }}>
                  Consultation et export seulement. Passez à une offre supérieure pour la modifier.
                </p>
              )}
            </div>
          )
        })}
        </div>

        {available && companies.length > 0 && (
        <button
          onClick={() => (canCreate ? setCreating(true) : setLimitOpen(true))}
          style={{
            alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8,
            border: 'none', borderRadius: '50px', padding: '14px 28px', cursor: 'pointer',
            backgroundColor: '#1E88E5', color: '#fff', fontSize: '20px', fontWeight: '600',
          }}
        >
          <Plus size={24} /> Ajouter une entreprise
        </button>
        )}
        <button onClick={() => navigate('/join-company')} style={{
          alignSelf: 'flex-start', border: 'none', background: 'none', cursor: 'pointer', color: '#1E88E5',
          fontSize: 19, fontWeight: '600', padding: '4px 8px',
        }}>
          Rejoindre une entreprise avec un code
        </button>
      </div>

      <CreateCompanyModal open={creating} onClose={() => setCreating(false)} />
      <CompanyLimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        icon="delete"
        title={toDelete ? `Supprimer ${toDelete.name} ?` : ''}
        message="Ses clients, documents, paiements, dépenses et recettes seront supprimés définitivement."
        confirmLabel="Supprimer"
        confirmColor="#1E88E5"
        requiredText={toDelete?.name}
        extraAction={{ label: "Exporter mes données d'abord", onClick: downloadExport, busy: exporting }}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

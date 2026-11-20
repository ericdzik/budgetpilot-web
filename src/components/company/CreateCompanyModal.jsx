import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useCompanyStore from '../../store/companyStore'
import useCurrencyStore, { ALL_CURRENCIES } from '../../store/currencyStore'
import { COMPANY_SECTORS } from '../../config/constants'

const field = {
  width: '100%', boxSizing: 'border-box', padding: '17px 20px',
  border: '1.5px solid #e0e0e0', borderRadius: '16px',
  fontSize: '20px', outline: 'none', backgroundColor: '#fff',
}

/**
 * Création d'une entreprise : le nom suffit, le reste se complète ensuite
 * dans le profil entreprise (logo, signature, NIF…).
 */
export default function CreateCompanyModal({ open, onClose }) {
  const navigate = useNavigate()
  const create = useCompanyStore((s) => s.create)
  const defaultCurrency = useCurrencyStore((s) => s.activeCurrency)
  const [name, setName] = useState('')
  const [activity, setActivity] = useState('')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const close = () => { setName(''); setActivity(''); setError(''); setCurrency(defaultCurrency); onClose() }

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError("Entrez le nom de l'entreprise"); return }
    setSaving(true)
    setError('')
    try {
      const company = await create({ name: name.trim(), activity: activity.trim(), currency })
      toast.success(`${company.name} est active. Complétez maintenant son profil.`)
      close()
      navigate('/profile/company')
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer l'entreprise. Vérifiez votre connexion.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
      alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)',
    }}>
      <form onSubmit={submit} style={{
        position: 'relative', backgroundColor: '#fff', borderRadius: '20px',
        padding: '44px 40px', maxWidth: '600px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <button type="button" onClick={close} aria-label="Fermer" style={{
          position: 'absolute', top: 20, right: 20, border: 'none', background: 'none',
          cursor: 'pointer', color: '#9e9e9e', padding: 4,
        }}>
          <X size={26} />
        </button>

        <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: '0 0 10px' }}>
          Ajouter une entreprise
        </h3>
        <p style={{ fontSize: '19px', color: '#666', margin: '0 0 30px', lineHeight: 1.5 }}>
          Ses clients, documents et chiffres resteront séparés de vos autres entreprises.
        </p>

        <label style={{ display: 'block', fontSize: '17px', color: '#555', margin: '0 0 8px' }}>Nom de l'entreprise</label>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus style={{ ...field, marginBottom: 20 }} />

        <label style={{ display: 'block', fontSize: '17px', color: '#555', margin: '0 0 8px' }}>Secteur d'activité (facultatif)</label>
        <select value={activity} onChange={(e) => setActivity(e.target.value)} style={{ ...field, marginBottom: 20 }}>
          <option value="">Choisir un secteur</option>
          {COMPANY_SECTORS.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
        </select>

        <label style={{ display: 'block', fontSize: '17px', color: '#555', margin: '0 0 8px' }}>Devise de l'entreprise</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={field}>
          {ALL_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          ))}
        </select>

        {error && <p style={{ fontSize: '17px', color: '#c62828', margin: '16px 0 0' }}>{error}</p>}

        <button type="submit" disabled={saving} style={{
          width: '100%', marginTop: 30, padding: '19px', border: 'none', borderRadius: '50px',
          backgroundColor: '#1E88E5', color: '#fff', fontSize: '21px', fontWeight: '600',
          cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Création…' : "Créer l'entreprise"}
        </button>
      </form>
    </div>
  )
}

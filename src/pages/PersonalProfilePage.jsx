import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import UserBadge from '../components/ui/UserBadge'
import { authService } from '../services/authService'
import PhoneInputField from '../components/ui/PhoneInputField'

// ─── Champ de formulaire ──────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '12px 14px',
          borderRadius: '10px',
          border: focused ? '2px solid #1E88E5' : '1.5px solid #e0e0e0',
          fontSize: '15px',
          fontWeight: '500',
          color: '#111',
          backgroundColor: '#fff',
          outline: 'none',
          transition: 'border 0.15s',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function PersonalProfilePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [saving, setSaving]       = useState(false)

  // Charger les données fraîches
  useEffect(() => {
    authService.getProfile()
      .then(res => {
        const u = res.data?.user ?? res.data
        if (u) {
          setUser(u)
          const parts = (u.name || '').split(' ')
          setFirstName(parts[0] || '')
          setLastName(parts.slice(1).join(' ') || '')
          setPhone(u.phone || '')
          setEmail(u.email || '')
        }
      })
      .catch(() => {
        // Fallback sur le store
        if (user) {
          const parts = (user.name || '').split(' ')
          setFirstName(parts[0] || '')
          setLastName(parts.slice(1).join(' ') || '')
          setPhone(user.phone || '')
          setEmail(user.email || '')
        }
      })
  }, [])

  const handleSave = async () => {
    if (!firstName.trim()) { toast.error('Le prénom est requis'); return }
    if (!lastName.trim())  { toast.error('Le nom est requis'); return }
    if (!email.trim())     { toast.error("L'email est requis"); return }

    setSaving(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`
      const res = await authService.updateProfile({
        name: fullName,
        phone: phone.trim(),
        email: email.trim(),
        activity: user?.activity || 'Autre',
      })
      const updated = res.data?.user ?? res.data
      if (updated) setUser(updated)
      toast.success('Profil mis à jour avec succès')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const avatarUrl = user?.avatar_url || null
  const avatarInitial = (firstName || user?.name || 'U').charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px',
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: 0 }}>
          Profil Personnel
        </h1>
        <UserBadge size={48} />
      </div>

      {/* ── Corps centré ── */}
      <div style={{ flex: 1, padding: '0 28px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e0e0e0' }}
            />
          ) : (
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              backgroundColor: '#e3f2fd',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: '700', color: '#1E88E5',
              border: '3px solid #e0e0e0',
            }}>
              {avatarInitial}
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Ligne Nom + Prénom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Nom" value={lastName} onChange={setLastName} placeholder="Votre nom" />
            <Field label="Prénom" value={firstName} onChange={setFirstName} placeholder="Votre Prénom" />
          </div>

          {/* Ligne Téléphone + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <PhoneInputField
              label="Téléphone"
              value={phone}
              onChange={setPhone}
            />
            <Field label="E-mail" value={email} onChange={setEmail} type="email" placeholder="votre@email.com" />
          </div>

          {/* Bouton Sauvegarder */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: '#1E88E5',
                color: '#fff',
                border: 'none',
                borderRadius: '30px',
                padding: '14px 48px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

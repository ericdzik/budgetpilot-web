import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import UserBadge from '../components/ui/UserBadge'
import { authService } from '../services/authService'
import PhoneInputField from '../components/ui/PhoneInputField'

// URL de base du stockage — même logique que le mobile
const STORAGE_BASE = (import.meta.env.VITE_API_URL || 'http://147.93.95.204/api').replace('/api', '/storage')

function storageUrl(path) {
  if (!path || path === '0') return null
  if (path.startsWith('http')) return path
  return `${STORAGE_BASE}/${path}`
}

// ─── Pad de signature (canvas dessinable) ────────────────────────────────────

function SignaturePad({ existingUrl, onSave }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [showCanvas, setShowCanvas] = useState(!existingUrl)
  const lastPos = useRef(null)

  // Initialise le canvas blanc
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }, [])

  useEffect(() => {
    if (showCanvas) clearCanvas()
  }, [showCanvas, clearCanvas])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = e => {
    e.preventDefault()
    setDrawing(true)
    setIsEmpty(false)
    lastPos.current = getPos(e, canvasRef.current)
  }

  const draw = e => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = () => setDrawing(false)

  const handleSave = () => {
    if (isEmpty) { toast.error('Veuillez dessiner votre signature'); return }
    const canvas = canvasRef.current
    canvas.toBlob(blob => {
      const file = new File([blob], 'signature.png', { type: 'image/png' })
      onSave(file, URL.createObjectURL(blob))
      setShowCanvas(false)
      toast.success('Signature capturée')
    }, 'image/png')
  }

  if (!showCanvas && existingUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>Signature</label>
        <div style={{
          border: '1.5px solid #e0e0e0', borderRadius: '8px',
          backgroundColor: '#fff', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80px' }}>
            <img src={existingUrl} alt="signature" style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
          <button
            type="button"
            onClick={() => setShowCanvas(true)}
            style={{
              width: '100%', padding: '10px',
              borderTop: '1px solid #f0f0f0', border: 'none', borderTop: '1px solid #f0f0f0',
              backgroundColor: '#fff', cursor: 'pointer',
              color: '#1E88E5', fontSize: '14px', fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#1E88E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            Modifier
          </button>
        </div>
        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>N'oubliez pas de capturer votre signature avant de sauvegarder</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>Signature</label>
      <div style={{ border: '1.5px solid #1E88E5', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
        {/* Zone de dessin */}
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          style={{
            width: '100%', height: '150px',
            cursor: 'crosshair', display: 'block',
            touchAction: 'none',
          }}
        />
        {/* Actions */}
        <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0' }}>
          <button
            type="button"
            onClick={clearCanvas}
            style={{
              flex: 1, padding: '10px',
              backgroundColor: '#fff', border: 'none', borderRight: '1px solid #f0f0f0',
              cursor: 'pointer', color: '#888', fontSize: '13px', fontWeight: '500',
            }}
          >
            Effacer
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              flex: 1, padding: '10px',
              backgroundColor: '#fff', border: 'none',
              cursor: 'pointer', color: '#1E88E5', fontSize: '13px', fontWeight: '600',
            }}
          >
            Capturer
          </button>
        </div>
      </div>
      <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>Dessinez votre signature ci-dessus puis cliquez sur "Capturer"</p>
    </div>
  )
}

// ─── Champ texte ──────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '11px 12px',
          borderRadius: '8px',
          border: focused ? '2px solid #1E88E5' : '1.5px solid #e0e0e0',
          fontSize: '15px', fontWeight: '500', color: '#111',
          backgroundColor: '#fff', outline: 'none',
          transition: 'border 0.15s', width: '100%', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

function SelectField({ label, value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '11px 12px',
          borderRadius: '8px',
          border: focused ? '2px solid #1E88E5' : '1.5px solid #e0e0e0',
          fontSize: '15px', fontWeight: '500', color: value ? '#111' : '#aaa',
          backgroundColor: '#fff', outline: 'none',
          transition: 'border 0.15s', width: '100%', boxSizing: 'border-box',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231E88E5' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

const LEGAL_STATUSES = ['SARL', 'SA', 'SAS', 'SASU', 'EURL', 'SNC', 'EI', 'Auto-entrepreneur', 'Association', 'Autre']
const ACTIVITIES     = ['Agriculture', 'Artisanat', 'Commerce', 'Construction', 'Éducation', 'Finance', 'Immobilier', 'Industrie', 'Informatique', 'Restauration', 'Santé', 'Services', 'Transport', 'Autre']

export default function CompanyProfilePage() {
  const { user, setUser } = useAuthStore()

  const [companyName,  setCompanyName]  = useState('')
  const [legalStatus,  setLegalStatus]  = useState('')
  const [phone,        setPhone]        = useState('')
  const [email,        setEmail]        = useState('')
  const [address,      setAddress]      = useState('')
  const [nif,          setNif]          = useState('')
  const [activity,     setActivity]     = useState('')
  const [logoFile,     setLogoFile]     = useState(null)
  const [logoPreview,  setLogoPreview]  = useState(null)
  const [sigFile,      setSigFile]      = useState(null)
  const [sigPreview,   setSigPreview]   = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [loaded,       setLoaded]       = useState(false)  // ← nouveau

  const logoInputRef = useRef()

  // Charger les données
  useEffect(() => {
    authService.getProfile()
      .then(res => {
        const u = res.data?.user ?? res.data
        if (u) {
          setUser(u)
          setCompanyName(u.company_name || '')
          setLegalStatus(u.legal_status || '')
          setPhone(u.professional_phone || u.phone || '')
          setEmail(u.professional_email || u.email || '')
          setAddress(u.company_address || '')
          setNif(u.nif || '')
          setActivity(u.activity || '')
          if (u.logo_path) setLogoPreview(storageUrl(u.logo_path))
          if (u.signature_path) setSigPreview(storageUrl(u.signature_path))
        }
      })
      .catch(() => {
        if (user) {
          setCompanyName(user.company_name || '')
          setLegalStatus(user.legal_status || '')
          setPhone(user.professional_phone || user.phone || '')
          setEmail(user.professional_email || user.email || '')
          setAddress(user.company_address || '')
          setNif(user.nif || '')
          setActivity(user.activity || '')
          if (user.logo_path) setLogoPreview(storageUrl(user.logo_path))
          if (user.signature_path) setSigPreview(storageUrl(user.signature_path))
        }
      })
  }, [])

  const handleLogoChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 1. Sauvegarder le profil textuel
      const res = await authService.updateCompanyProfile({
        company_name:       companyName.trim(),
        legal_status:       legalStatus,
        professional_phone: phone.trim(),
        professional_email: email.trim(),
        company_address:    address.trim(),
        nif:                nif.trim(),
        activity:           activity || 'Autre',
        name:               user?.name || '',
        phone:              user?.phone || '',
        email:              user?.email || '',
        gender:             user?.gender,
        avatar_id:          user?.avatar_id,
        avatar_url:         user?.avatar_url,
      })
      const updated = res.data?.user ?? res.data
      if (updated) setUser(updated)

      // 2. Upload logo si modifié
      if (logoFile) {
        const fd = new FormData()
        fd.append('logo', logoFile)
        const lr = await authService.uploadLogo(fd)
        if (lr.data?.user) setUser(lr.data.user)
      }

      // 3. Upload signature si modifiée
      if (sigFile) {
        const fd = new FormData()
        fd.append('signature', sigFile)
        const sr = await authService.uploadSignature(fd)
        if (sr.data?.user) setUser(sr.data.user)
      }

      toast.success('Profil entreprise mis à jour avec succès')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const companyInitial = companyName?.charAt(0)?.toUpperCase() || 'B'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px',
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: 0 }}>
          Modifier le Profil
        </h1>
        <UserBadge size={48} />
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, padding: '0 28px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            onClick={() => logoInputRef.current.click()}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              backgroundColor: '#e3f2fd',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', border: '2px solid #e0e0e0',
            }}>
              {logoPreview ? (
                <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src="/Logo_app2.png" alt="logo" style={{ width: 50, height: 50, objectFit: 'contain' }} />
              )}
            </div>
            {/* Bouton modifier */}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              backgroundColor: '#1E88E5', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
        </div>

        {/* Formulaire */}
        <div style={{ width: '100%', maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Ligne 1 : Nom + Statut juridique */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Nom" value={companyName} onChange={setCompanyName} placeholder="Nom de l'entreprise" />
            <SelectField label="Statut Juridique" value={legalStatus} onChange={setLegalStatus} options={LEGAL_STATUSES} placeholder="Statut juridique" />
          </div>

          {/* Ligne 2 : Téléphone + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <PhoneInputField
              label="Téléphone"
              value={phone}
              onChange={setPhone}
            />
            <Field label="E-mail" value={email} onChange={setEmail} type="email" placeholder="email@entreprise.com" />
          </div>

          {/* Ligne 3 : Adresse + NIF */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Adresse" value={address} onChange={setAddress} placeholder="Rue, numéro, ville..." />
            <Field label="NIF" value={nif} onChange={setNif} placeholder="Numéro d'Identification Fiscale" />
          </div>

          {/* Ligne 4 : Secteur d'activité + Signature */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start' }}>
            <SelectField label="Secteur d'activité" value={activity} onChange={setActivity} options={ACTIVITIES} placeholder="Choisir le secteur" />

            {/* Signature — canvas dessinable */}
            <SignaturePad
              key={sigPreview || 'empty'}
              existingUrl={sigPreview}
              onSave={(file, preview) => {
                setSigFile(file)
                setSigPreview(preview)
              }}
            />
          </div>

          {/* Bouton Sauvegarder */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: '#1E88E5', color: '#fff',
                border: 'none', borderRadius: '30px',
                padding: '14px 48px', fontSize: '16px', fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
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

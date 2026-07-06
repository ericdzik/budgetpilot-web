import { useRef, useState } from 'react'
import { Upload, RotateCcw, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useTrackingSettingsStore from '../../store/trackingSettingsStore'
import useTrackingAuthStore from '../../store/trackingAuthStore'

// ─── Composant réutilisable : carte upload logo ───────────────────────────────
function LogoCard({ title, description, logoUrl, onLogoChange, name, onNameChange, nameLabel }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef(null)

  const readFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Image uniquement'); return }
    if (file.size > 2 * 1024 * 1024)    { toast.error('Max 2 Mo');          return }
    const reader = new FileReader()
    reader.onload = (e) => onLogoChange(e.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 20,
      padding: '28px', marginBottom: 20,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>{title}</h2>
      <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 20px' }}>{description}</p>

      {/* Zone drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); readFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#E65100' : '#e0e0e0'}`,
          borderRadius: 14, padding: '24px',
          textAlign: 'center', cursor: 'pointer',
          backgroundColor: isDragging ? '#fff5f0' : '#fafafa',
          transition: 'all 0.2s', marginBottom: 16,
        }}
      >
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }} onChange={(e) => readFile(e.target.files[0])} />
        <Upload size={24} color={isDragging ? '#E65100' : '#ccc'} style={{ marginBottom: 6 }} />
        <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
          Glisser-déposer ou <span style={{ color: '#E65100', fontWeight: 600 }}>parcourir</span>
        </p>
        <p style={{ fontSize: 11, color: '#bbb', margin: '4px 0 0' }}>PNG, JPG, SVG — max 2 Mo</p>
      </div>

      {/* Aperçu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 10,
          border: '1px solid #e0e0e0', overflow: 'hidden',
          backgroundColor: '#f5f5f5', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={logoUrl} alt="aperçu"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#333', margin: 0 }}>Aperçu actuel</p>
          <p style={{ fontSize: 12, color: '#aaa', margin: '3px 0 0' }}>{description}</p>
        </div>
      </div>

      {/* Champ nom */}
      {onNameChange && (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#444',
            display: 'block', marginBottom: 6 }}>{nameLabel || 'Nom affiché'}</label>
          <input
            type="text" value={name}
            onChange={(e) => onNameChange(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px',
              border: '2px solid #e0e0e0', borderRadius: 10,
              fontSize: 14, outline: 'none', color: '#111',
            }}
            onFocus={(e) => e.target.style.borderColor = '#E65100'}
            onBlur={(e)  => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function TrackingSettingsPage() {
  const {
    clientLogoUrl,  clientName,  setClientLogo,  setClientName,
    partnerLogoUrl, partnerName, setPartnerLogo, setPartnerName,
    resetToDefaults,
  } = useTrackingSettingsStore()
  const { trackingUser } = useTrackingAuthStore()
  const isAdmin = trackingUser?.role === 'admin'

  // États locaux (modification en cours avant sauvegarde)
  const [clientLogo,   setClientLogoLocal]   = useState(clientLogoUrl)
  const [clientNom,    setClientNomLocal]     = useState(clientName)
  const [partnerLogo,  setPartnerLogoLocal]   = useState(partnerLogoUrl)
  const [partnerNom,   setPartnerNomLocal]    = useState(partnerName)

  const handleSave = () => {
    setClientLogo(clientLogo)
    setClientName(clientNom.trim() || 'getdenis')
    setPartnerLogo(partnerLogo)
    setPartnerName(partnerNom.trim() || 'Budget pilot')
    toast.success('Paramètres sauvegardés')
  }

  const handleReset = () => {
    resetToDefaults()
    setClientLogoLocal('/denistest.png')
    setClientNomLocal('getdenis')
    setPartnerLogoLocal('/Logo_app2.png')
    setPartnerNomLocal('Budget pilot')
    toast.success('Paramètres réinitialisés')
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center', color: '#aaa', fontSize: 15 }}>
        Accès réservé aux administrateurs.
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111', margin: 0 }}>Paramètres</h1>
        <p style={{ fontSize: 14, color: '#888', margin: '6px 0 0' }}>
          Personnalisez l'apparence de l'interface tracking
        </p>
      </div>

      <div style={{ maxWidth: 580 }}>

        {/* Aperçu en direct */}
        <div style={{
          backgroundColor: '#fff', borderRadius: 20,
          padding: '20px 24px', marginBottom: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#aaa',
            textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 14px' }}>
            Aperçu de l'en-tête
          </p>
          <div style={{
            backgroundColor: '#f5f5f5', borderRadius: 12, padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {/* Gauche : sidebar logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={clientLogo} alt={clientNom}
                style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8 }} />
              <span style={{ fontSize: 17, fontWeight: 600, color: '#222' }}>{clientNom || 'getdenis'}</span>
            </div>
            {/* Droite : partner logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={partnerLogo} alt={partnerNom}
                style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>{partnerNom || 'Budget pilot'}</span>
            </div>
          </div>
        </div>

        {/* Carte logo client (sidebar gauche) */}
        <LogoCard
          title="Logo sidebar (gauche)"
          description="Affiché en haut de la barre de navigation"
          logoUrl={clientLogo}
          onLogoChange={setClientLogoLocal}
          name={clientNom}
          onNameChange={setClientNomLocal}
          nameLabel="Nom affiché sous le logo"
        />

        {/* Carte logo partenaire (header droite) */}
        <LogoCard
          title="Logo partenaire (droite)"
          description="Affiché en haut à droite sur toutes les pages"
          logoUrl={partnerLogo}
          onLogoChange={setPartnerLogoLocal}
          name={partnerNom}
          onNameChange={setPartnerNomLocal}
          nameLabel="Nom du partenaire"
        />

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', backgroundColor: '#E65100', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Check size={16} /> Sauvegarder
          </button>
          <button
            onClick={handleReset}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', backgroundColor: '#fff', color: '#666',
              border: '1.5px solid #e0e0e0', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} /> Réinitialiser
          </button>
        </div>
      </div>
    </div>
  )
}

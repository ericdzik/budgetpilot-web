import { useEffect, useRef, useState } from 'react'
import { adminService } from '../../services/adminService'
import { toast } from 'react-hot-toast'
import { Upload, Trash2, Pencil } from 'lucide-react'

const SLOTS = [
  { key: 'android', label: 'Android' },
  { key: 'ios',     label: 'iOS' },
  { key: 'web',     label: 'Web-App' },
]

const fmtDate = (d) => {
  if (!d) return null
  const date = new Date(d)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Modal upload ──────────────────────────────────────────────────────────────
function BannerModal({ initialSlot, onClose, onSaved }) {
  const fileRef   = useRef(null)
  const dropRef   = useRef(null)
  // Sélection multiple : Set des slots cochés, initialisé avec le slot d'entrée
  const [selectedSlots, setSelectedSlots] = useState(new Set([initialSlot]))
  const [preview, setPreview]       = useState(null)
  const [file, setFile]             = useState(null)
  const [clientName, setClientName] = useState('')
  const [startDate, setStartDate]   = useState('')
  const [endDate, setEndDate]       = useState('')
  const [dragging, setDragging]     = useState(false)
  const [saving, setSaving]         = useState(false)

  const toggleSlot = (key) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        // Garder au moins 1 sélectionné
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const applyFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleFileInput = (e) => applyFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    applyFile(e.dataTransfer.files[0])
  }

  const handleSave = async () => {
    if (selectedSlots.size === 0) {
      toast.error('Sélectionne au moins une plateforme')
      return
    }
    setSaving(true)
    try {
      // Envoie vers tous les slots sélectionnés en parallèle
      const requests = Array.from(selectedSlots).map((slot) => {
        const fd = new FormData()
        if (file)       fd.append('image', file)
        fd.append('client_name', clientName)
        if (startDate)  fd.append('start_date', startDate)
        if (endDate)    fd.append('end_date', endDate)
        return adminService.updateBanner(slot, fd)
      })

      await Promise.all(requests)

      const count = selectedSlots.size
      const label = count === 1
        ? `Bannière ${[...selectedSlots][0]} mise à jour`
        : `Bannières mises à jour sur ${count} plateformes`
      toast.success(label)
      onSaved()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px',
        padding: '22px 28px', width: '440px', maxWidth: '95vw',
        boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
      }}>

        {/* Titre */}
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: '#111', textAlign: 'center' }}>
          Modifier la publicité
        </h2>

        {/* Sélecteur de plateformes — choix multiple */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '4px' }}>
            Plateformes
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px' }}>
            Sélectionne une ou plusieurs plateformes
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {SLOTS.map(({ key, label }) => {
              const active = selectedSlots.has(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleSlot(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '8px 18px', borderRadius: '50px',
                    border: '1.5px solid ' + (active ? '#1E88E5' : '#e0e0e0'),
                    backgroundColor: active ? '#e3f2fd' : '#fff',
                    color: active ? '#1E88E5' : '#555',
                    fontSize: '14px', fontWeight: active ? '600' : '400',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {/* Checkbox visuelle */}
                  <span style={{
                    width: 16, height: 16, borderRadius: '4px', flexShrink: 0,
                    border: '2px solid ' + (active ? '#1E88E5' : '#ccc'),
                    backgroundColor: active ? '#1E88E5' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {active && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {label}
                </button>
              )
            })}
          </div>
          {/* Résumé sélection */}
          {selectedSlots.size > 1 && (
            <div style={{
              marginTop: '8px', fontSize: '12px', color: '#1E88E5',
              backgroundColor: '#e3f2fd', borderRadius: '8px',
              padding: '6px 12px', display: 'inline-block',
            }}>
              ✓ Cette image sera publiée sur {selectedSlots.size} plateformes simultanément
            </div>
          )}
        </div>

        {/* Nom du client */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '10px' }}>
            Nom du client
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            border: '1.5px solid #e0e0e0', borderRadius: '50px',
            padding: '10px 16px', backgroundColor: '#fafafa',
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: '#bbb', flexShrink: 0,
            }} />
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Entreprise cliente"
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: '14px', color: '#333', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Dates */}
        <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', width: '80px' }}>Date début</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                border: '1.5px solid #e0e0e0', borderRadius: '50px',
                padding: '8px 16px', fontSize: '14px', outline: 'none',
                backgroundColor: '#fafafa', color: '#333',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', width: '80px' }}>Date fin</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: '1.5px solid #e0e0e0', borderRadius: '50px',
                padding: '8px 16px', fontSize: '14px', outline: 'none',
                backgroundColor: '#fafafa', color: '#333',
              }}
            />
          </div>
        </div>

        {/* Zone upload — drag & drop */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Insérer le visuel</span>
            <span style={{ fontSize: '12px', color: '#aaa' }}>Dimension: 700px – 250px</span>
          </div>
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: '1.5px solid ' + (dragging ? '#1E88E5' : '#e0e0e0'),
              borderRadius: '16px',
              backgroundColor: dragging ? '#e3f2fd' : '#f8f8f8',
              height: '110px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '10px',
              overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer',
            }}
            onClick={() => !preview && fileRef.current?.click()}
          >
            {preview ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.5)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} color="#fff" />
                </button>
              </div>
            ) : (
              <>
                <span style={{ fontSize: '14px', color: '#888' }}>Glisser le fichier ici</span>
                <button
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                  style={{
                    padding: '10px 28px', borderRadius: '50px',
                    border: 'none', backgroundColor: '#111', color: '#fff',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  Parcourir
                </button>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>

        {/* Bouton Valider */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleSave}
            disabled={saving || selectedSlots.size === 0}
            style={{
              padding: '13px 52px', borderRadius: '50px',
              border: 'none', backgroundColor: '#1E88E5', color: '#fff',
              fontSize: '16px', fontWeight: '600',
              cursor: (saving || selectedSlots.size === 0) ? 'not-allowed' : 'pointer',
              opacity: (saving || selectedSlots.size === 0) ? 0.7 : 1,
            }}
          >
            {saving
              ? `Publication sur ${selectedSlots.size} plateforme${selectedSlots.size > 1 ? 's' : ''}…`
              : `Valider${selectedSlots.size > 1 ? ` (${selectedSlots.size} plateformes)` : ''}`
            }
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Carte bannière ─────────────────────────────────────────────────────────────
function BannerCard({ slotKey, label, banner, onEdit, onDeleteImage }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!banner?.image_url) return
    if (!confirm('Supprimer l\'image de cette bannière ?')) return
    setDeleting(true)
    try {
      await adminService.deleteBannerImage(slotKey)
      toast.success('Image supprimée')
      onDeleteImage()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const hasImage = !!banner?.image_url

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '18px',
      border: '1px solid #e8e8e8', padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      {/* Header : label + bouton Changer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>{label}</span>
        <button
          onClick={onEdit}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '50px',
            border: '1.5px solid #222', background: '#fff',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#111',
          }}
        >
          <Pencil size={13} strokeWidth={2.5} />
          Changer
        </button>
      </div>

      {/* Méta : client + dates */}
      {(banner?.client_name || banner?.start_date) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>client</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>{banner?.client_name || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>dates</div>
            <div style={{ fontSize: '13px', color: '#555' }}>
              {banner?.start_date && banner?.end_date
                ? `${fmtDate(banner.start_date)} – ${fmtDate(banner.end_date)}`
                : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Aperçu image */}
      <div style={{
        borderRadius: '12px', overflow: 'hidden',
        height: '140px', backgroundColor: '#f5f5f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {hasImage ? (
          <>
            <img
              src={banner.image_url}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Bouton suppression image */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Supprimer l'image"
              style={{
                position: 'absolute', top: '8px', right: '8px',
                width: 30, height: 30, borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.5)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} color="#fff" />
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#ccc' }}>
            <Upload size={24} />
            <div style={{ fontSize: '12px', marginTop: '6px' }}>Aucune image</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function AdminBannersPage() {
  const [banners, setBanners]     = useState({})
  const [loading, setLoading]     = useState(true)
  const [editSlot, setEditSlot]   = useState(null) // slot en cours d'édition

  const loadBanners = async () => {
    try {
      const res = await adminService.getBanners()
      const map = {}
      ;(res.data || []).forEach((b) => { map[b.slot] = b })
      setBanners(map)
    } catch {
      toast.error('Erreur lors du chargement des bannières')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBanners() }, [])

  const handleSaved = () => {
    setEditSlot(null)
    loadBanners()
  }

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
        Publicités
      </h1>
      <p style={{ fontSize: '14px', color: '#aaa', margin: '0 0 32px' }}>
        Gérez les bannières publicitaires diffusées sur Android, iOS et la Web-App.
      </p>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1E88E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}>
          {SLOTS.map(({ key, label }) => (
            <BannerCard
              key={key}
              slotKey={key}
              label={label}
              banner={banners[key]}
              onEdit={() => setEditSlot(key)}
              onDeleteImage={loadBanners}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {editSlot && (
        <BannerModal
          initialSlot={editSlot}
          onClose={() => setEditSlot(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

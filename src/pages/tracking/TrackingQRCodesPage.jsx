import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { toast } from 'react-hot-toast'
import { trackingService } from '../../services/trackingService'
import useTrackingAuthStore from '../../store/trackingAuthStore'

const COLORS = { getdenis: '#E65100', client: '#1565C0' }
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'

// ─── QR Card ─────────────────────────────────────────────────────────────────
function QRCard({ link, onToggle, onDelete }) {
  const canvasRef = useRef(null)
  const qrUrl = `${API_BASE}/ref/${link.code}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 160,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
      })
    }
  }, [qrUrl])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${link.code}-${link.name.replace(/\s+/g, '_')}.png`
    a.click()
  }

  const handlePrint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>QR Code — ${link.name}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;}
      img{width:220px;height:220px;} p{font-size:18px;font-weight:600;margin-top:12px;color:#111;}
      small{font-size:13px;color:#888;margin-top:4px;}</style></head>
      <body>
        <img src="${dataUrl}" />
        <p>${link.name}</p>
        <small>${link.code}</small>
      </body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      opacity: link.active ? 1 : 0.5,
      transition: 'opacity 0.2s',
    }}>
      {/* Badge groupe */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '11px', fontWeight: '700',
          padding: '3px 10px', borderRadius: '20px',
          backgroundColor: link.group === 'getdenis' ? '#fff0ea' : '#e8f0fe',
          color: COLORS[link.group] || '#555',
        }}>
          {link.group === 'getdenis' ? 'Getdenis' : 'Client'}
        </span>
        <span style={{
          fontSize: '11px', color: link.active ? '#4CAF50' : '#aaa',
          fontWeight: '600',
        }}>
          {link.active ? 'Actif' : 'Désactivé'}
        </span>
      </div>

      {/* QR Code */}
      <canvas ref={canvasRef} style={{ borderRadius: '8px' }} />

      {/* Infos */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>{link.name}</p>
        <p style={{ fontSize: '12px', color: '#aaa', margin: '4px 0 0' }}>{link.code}</p>
        {link.description && (
          <p style={{ fontSize: '12px', color: '#777', margin: '4px 0 0' }}>{link.description}</p>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: '16px',
        padding: '8px 16px',
        backgroundColor: '#f9f9f9',
        borderRadius: '10px',
        fontSize: '13px', color: '#555',
      }}>
        <span><strong style={{ color: '#111' }}>{link.total_scans}</strong> scans</span>
        <span><strong style={{ color: '#111' }}>{link.unique_scans}</strong> uniques</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <button
          onClick={handleDownload}
          style={{
            flex: 1, padding: '8px',
            backgroundColor: '#E65100', color: '#fff',
            border: 'none', borderRadius: '8px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          Télécharger
        </button>
        <button
          onClick={handlePrint}
          style={{
            flex: 1, padding: '8px',
            backgroundColor: '#f0f0f0', color: '#333',
            border: 'none', borderRadius: '8px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          Imprimer
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <button
          onClick={() => onToggle(link.id)}
          style={{
            flex: 1, padding: '7px',
            backgroundColor: 'transparent',
            border: `1px solid ${link.active ? '#aaa' : '#4CAF50'}`,
            borderRadius: '8px', fontSize: '12px',
            color: link.active ? '#aaa' : '#4CAF50',
            cursor: 'pointer', fontWeight: '500',
          }}
        >
          {link.active ? 'Désactiver' : 'Activer'}
        </button>
        <button
          onClick={() => onDelete(link.id, link.name)}
          style={{
            flex: 1, padding: '7px',
            backgroundColor: 'transparent',
            border: '1px solid #f44336',
            borderRadius: '8px', fontSize: '12px',
            color: '#f44336', cursor: 'pointer', fontWeight: '500',
          }}
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}

// ─── Modal création ───────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', group: 'client', description: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    setLoading(true)
    try {
      const link = await trackingService.createLink(form)
      onCreate(link)
      toast.success('QR Code créé')
      onClose()
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '20px',
        padding: '32px',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '24px' }}>
          Nouveau QR Code
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Nom */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
              Nom du commercial
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex : Jean-Paul Kofi"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px',
                border: '2px solid #e0e0e0', borderRadius: '10px',
                fontSize: '14px', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#E65100'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Groupe */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
              Groupe
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { value: 'client', label: 'Client (Budget Pilot)' },
                { value: 'getdenis', label: 'Getdenis' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, group: opt.value }))}
                  style={{
                    flex: 1, padding: '10px',
                    border: `2px solid ${form.group === opt.value ? COLORS[opt.value] : '#e0e0e0'}`,
                    borderRadius: '10px',
                    backgroundColor: form.group === opt.value
                      ? (opt.value === 'getdenis' ? '#fff0ea' : '#e8f0fe')
                      : '#fff',
                    color: form.group === opt.value ? COLORS[opt.value] : '#666',
                    fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
              Description (optionnel)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Ex : Zone Lomé-Centre"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px',
                border: '2px solid #e0e0e0', borderRadius: '10px',
                fontSize: '14px', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#E65100'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px',
                backgroundColor: '#f5f5f5', color: '#555',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: '12px',
                backgroundColor: '#E65100', color: '#fff',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Création...' : 'Créer le QR Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function TrackingQRCodesPage() {
  const [links, setLinks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [filterGroup, setFilterGroup] = useState('all')
  const { trackingUser }            = useTrackingAuthStore()
  const isAdmin                     = trackingUser?.role === 'admin'

  const load = async () => {
    setLoading(true)
    try {
      const data = await trackingService.getLinks()
      setLinks(data)
    } catch {
      toast.error('Impossible de charger les QR codes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id) => {
    try {
      const updated = await trackingService.toggleLink(id)
      setLinks(prev => prev.map(l => l.id === id ? { ...l, active: updated.active } : l))
      toast.success(updated.active ? 'QR Code activé' : 'QR Code désactivé')
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer le QR Code de ${name} ? Cette action est irréversible.`)) return
    try {
      await trackingService.deleteLink(id)
      setLinks(prev => prev.filter(l => l.id !== id))
      toast.success('QR Code supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleCreate = (newLink) => {
    setLinks(prev => [newLink, ...prev])
  }

  const filtered = links.filter(l => filterGroup === 'all' || l.group === filterGroup)

  const getdenisCount = links.filter(l => l.group === 'getdenis').length
  const clientCount   = links.filter(l => l.group === 'client').length

  return (
    <div style={{ padding: '32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: 0 }}>QR Codes</h1>
          <p style={{ fontSize: '14px', color: '#888', margin: '4px 0 0' }}>
            {links.length} QR code{links.length > 1 ? 's' : ''} — {links.filter(l => l.active).length} actif{links.filter(l => l.active).length > 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#E65100', color: '#fff',
              border: 'none', borderRadius: '50px',
              padding: '12px 24px',
              fontSize: '14px', fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(230,81,0,0.3)',
            }}
          >
            + Nouveau QR Code
          </button>
        )}
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total scans', value: links.reduce((s, l) => s + (l.total_scans || 0), 0), color: '#111' },
          { label: 'Getdenis', value: getdenisCount + ' liens', color: COLORS.getdenis },
          { label: 'Clients', value: clientCount + ' liens', color: COLORS.client },
        ].map(stat => (
          <div key={stat.label} style={{
            backgroundColor: '#fff', borderRadius: '12px',
            padding: '14px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{stat.label}</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: stat.color, margin: '2px 0 0' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'all', label: 'Tous' },
          { key: 'client', label: 'Clients' },
          { key: 'getdenis', label: 'Getdenis' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterGroup(f.key)}
            style={{
              padding: '8px 18px', borderRadius: '20px', border: 'none',
              fontSize: '14px', fontWeight: filterGroup === f.key ? '600' : '400',
              backgroundColor: filterGroup === f.key ? '#E65100' : '#fff',
              color: filterGroup === f.key ? '#fff' : '#444',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grille de cartes */}
      {loading ? (
        <p style={{ color: '#aaa', textAlign: 'center', padding: '60px 0' }}>Chargement...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '16px' }}>
            {isAdmin ? 'Aucun QR code pour le moment.' : 'Aucun QR code à afficher.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                backgroundColor: '#E65100', color: '#fff',
                border: 'none', borderRadius: '50px',
                padding: '12px 28px', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Créer le premier QR Code
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px',
        }}>
          {filtered.map(link => (
            <QRCard
              key={link.id}
              link={link}
              onToggle={isAdmin ? handleToggle : () => {}}
              onDelete={isAdmin ? handleDelete : () => {}}
            />
          ))}
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}

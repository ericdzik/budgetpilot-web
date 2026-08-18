import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { toast } from 'react-hot-toast'
import { trackingService } from '../../services/trackingService'
import useTrackingAuthStore from '../../store/trackingAuthStore'

const COLOR = { getdenis: '#E65100', client: '#1565C0' }
const BG    = { getdenis: '#fff3ee', client: '#e8f0fe' }
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://192.168.1.68:8000'

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      flex: '1 1 140px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '18px 22px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
      borderLeft: `4px solid ${accent}`,
    }}>
      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '26px', fontWeight: '800', color: '#111', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#888', marginTop: '5px', fontWeight: '500' }}>{label}</div>
      {sub != null && (
        <div style={{ fontSize: '11px', color: accent, marginTop: '3px', fontWeight: '600' }}>
          {sub} uniques
        </div>
      )}
    </div>
  )
}

// ─── Barre de progression mini ────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ height: '4px', backgroundColor: '#f0f0f0', borderRadius: '99px', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '99px', transition: 'width 0.4s ease' }} />
    </div>
  )
}

// ─── QR Card ─────────────────────────────────────────────────────────────────
function QRCard({ link, onToggle, onDelete }) {
  const canvasRef = useRef(null)
  const qrUrl     = `${BACKEND_BASE}/ref/${link.code}`
  const accent    = COLOR[link.group] || '#555'
  const installs  = link.total_installs  ?? 0
  const uInstalls = link.unique_installs ?? 0
  const scans     = link.total_scans     ?? 0
  const uScans    = link.unique_scans    ?? 0
  const convRate  = scans > 0 ? Math.round((installs / scans) * 100) : 0

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 170,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
      })
    }
  }, [qrUrl])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `qr-${link.code}-${link.name.replace(/\s+/g, '_')}.png`
    a.click()
  }

  const handlePrint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>QR Code — ${link.name}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;}
      img{width:220px;height:220px;} p{font-size:18px;font-weight:700;margin-top:16px;color:#111;}
      small{font-size:13px;color:#888;}</style></head>
      <body><img src="${canvas.toDataURL('image/png')}" /><p>${link.name}</p><small>${link.code}</small></body></html>
    `)
    win.document.close(); win.focus(); win.print()
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      opacity: link.active ? 1 : 0.55,
      transition: 'opacity 0.2s, transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      {/* Bandeau coloré haut */}
      <div style={{
        backgroundColor: BG[link.group] || '#f5f5f5',
        padding: '14px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
          padding: '4px 10px', borderRadius: '20px',
          backgroundColor: accent + '22', color: accent,
        }}>
          {link.group === 'getdenis' ? 'Getdenis' : 'Client'}
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '11px', fontWeight: '600',
          color: link.active ? '#2e7d32' : '#9e9e9e',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            backgroundColor: link.active ? '#4CAF50' : '#ccc',
            display: 'inline-block',
          }} />
          {link.active ? 'Actif' : 'Désactivé'}
        </span>
      </div>

      {/* QR Code centré */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 20px 12px', backgroundColor: '#fafafa' }}>
        <canvas ref={canvasRef} style={{ borderRadius: '10px', border: '1px solid #eee' }} />
      </div>

      {/* Nom + code */}
      <div style={{ textAlign: 'center', padding: '0 16px 14px' }}>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>{link.name}</p>
        <p style={{
          fontSize: '11px', color: '#fff', margin: '5px 0 0',
          display: 'inline-block', backgroundColor: accent,
          padding: '2px 10px', borderRadius: '20px', fontWeight: '600', letterSpacing: '1px',
        }}>
          {link.code}
        </p>
        {link.description && (
          <p style={{ fontSize: '12px', color: '#888', margin: '6px 0 0', fontStyle: 'italic' }}>{link.description}</p>
        )}
      </div>

      {/* Stats */}
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Ligne scans */}
        <div style={{
          backgroundColor: '#f9f9fb', borderRadius: '12px 12px 0 0',
          padding: '10px 14px', borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>👁 Scans</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#111' }}>{scans}</span>
              <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '5px' }}>{uScans} uniq.</span>
            </div>
          </div>
          <MiniBar value={uScans} max={scans} color="#78909C" />
        </div>

        {/* Ligne installs */}
        <div style={{
          backgroundColor: '#f9f9fb', borderRadius: '0',
          padding: '10px 14px', borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>📲 Installations</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: accent }}>{installs}</span>
              <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '5px' }}>{uInstalls} uniq.</span>
            </div>
          </div>
          <MiniBar value={uInstalls} max={installs} color={accent} />
        </div>

        {/* Taux de conversion */}
        <div style={{
          backgroundColor: convRate > 0 ? '#f0fdf4' : '#f9f9fb',
          borderRadius: '0 0 12px 12px',
          padding: '10px 14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>📈 Conversion</span>
            <span style={{
              fontSize: '16px', fontWeight: '800',
              color: convRate >= 10 ? '#2e7d32' : convRate > 0 ? '#F57F17' : '#bbb',
            }}>
              {convRate}%
            </span>
          </div>
          <MiniBar value={convRate} max={100} color={convRate >= 10 ? '#4CAF50' : convRate > 0 ? '#FFC107' : '#ddd'} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleDownload} style={{
            flex: 1, padding: '9px',
            backgroundColor: accent, color: '#fff',
            border: 'none', borderRadius: '10px',
            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ⬇ Télécharger
          </button>
          <button onClick={handlePrint} style={{
            flex: 1, padding: '9px',
            backgroundColor: '#f0f0f0', color: '#444',
            border: 'none', borderRadius: '10px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}>
            🖨 Imprimer
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onToggle(link.id)} style={{
            flex: 1, padding: '8px',
            backgroundColor: 'transparent',
            border: `1.5px solid ${link.active ? '#e0e0e0' : '#4CAF50'}`,
            borderRadius: '10px', fontSize: '12px',
            color: link.active ? '#aaa' : '#4CAF50',
            cursor: 'pointer', fontWeight: '600',
          }}>
            {link.active ? 'Désactiver' : 'Activer'}
          </button>
          <button onClick={() => onDelete(link.id, link.name)} style={{
            flex: 1, padding: '8px',
            backgroundColor: 'transparent',
            border: '1.5px solid #ffcdd2',
            borderRadius: '10px', fontSize: '12px',
            color: '#e53935', cursor: 'pointer', fontWeight: '600',
          }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal création ───────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [form, setForm]     = useState({ name: '', group: 'client', description: '' })
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
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px',
        padding: '36px 32px', width: '100%', maxWidth: '440px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '28px', margin: '0 0 28px' }}>
          Nouveau QR Code
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '7px' }}>
              Nom du commercial
            </label>
            <input
              type="text" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex : Jean-Paul Kofi"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '13px 16px',
                border: '2px solid #e0e0e0', borderRadius: '12px',
                fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#E65100'}
              onBlur={e  => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '7px' }}>
              Groupe
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { value: 'client',   label: '🔵 Budget Pilot' },
                { value: 'getdenis', label: '🟠 Getdenis' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(p => ({ ...p, group: opt.value }))}
                  style={{
                    flex: 1, padding: '11px',
                    border: `2px solid ${form.group === opt.value ? COLOR[opt.value] : '#e0e0e0'}`,
                    borderRadius: '12px',
                    backgroundColor: form.group === opt.value ? BG[opt.value] : '#fff',
                    color: form.group === opt.value ? COLOR[opt.value] : '#666',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '7px' }}>
              Description <span style={{ fontWeight: '400', color: '#aaa' }}>(optionnel)</span>
            </label>
            <input
              type="text" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Ex : Zone Lomé-Centre"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '13px 16px',
                border: '2px solid #e0e0e0', borderRadius: '12px',
                fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#E65100'}
              onBlur={e  => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '13px',
              backgroundColor: '#f5f5f5', color: '#555',
              border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}>
              Annuler
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '13px',
              backgroundColor: loading ? '#ffb899' : '#E65100', color: '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Création...' : '+ Créer le QR Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function TrackingQRCodesPage() {
  const [links, setLinks]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [filterGroup, setFilterGroup] = useState('all')
  const { trackingUser }              = useTrackingAuthStore()
  const isAdmin                       = trackingUser?.role === 'admin'

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
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer le QR Code de ${name} ? Cette action est irréversible.`)) return
    try {
      await trackingService.deleteLink(id)
      setLinks(prev => prev.filter(l => l.id !== id))
      toast.success('QR Code supprimé')
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const filtered      = links.filter(l => filterGroup === 'all' || l.group === filterGroup)
  const totalScans    = links.reduce((s, l) => s + (l.total_scans     || 0), 0)
  const totalUScans   = links.reduce((s, l) => s + (l.unique_scans    || 0), 0)
  const totalInstalls = links.reduce((s, l) => s + (l.total_installs  || 0), 0)
  const totalUInst    = links.reduce((s, l) => s + (l.unique_installs || 0), 0)
  const globalConv    = totalScans > 0 ? Math.round((totalInstalls / totalScans) * 100) : 0

  return (
    <div style={{ padding: '32px 28px', minHeight: '100vh', backgroundColor: '#f7f8fa' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', margin: 0 }}>QR Codes</h1>
          <p style={{ fontSize: '14px', color: '#888', margin: '5px 0 0' }}>
            {links.length} code{links.length > 1 ? 's' : ''} · {links.filter(l => l.active).length} actif{links.filter(l => l.active).length > 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#E65100', color: '#fff',
            border: 'none', borderRadius: '50px',
            padding: '12px 24px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(230,81,0,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(230,81,0,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = '0 4px 14px rgba(230,81,0,0.35)' }}
          >
            + Nouveau QR Code
          </button>
        )}
      </div>

      {/* ── Stats globales ── */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <StatPill icon="👁" label="Total scans"      value={totalScans}    sub={totalUScans}   accent="#546E7A" />
        <StatPill icon="📲" label="Installations"    value={totalInstalls} sub={totalUInst}    accent="#1565C0" />
        <StatPill icon="📈" label="Taux conversion"  value={`${globalConv}%`}                  accent="#2e7d32" />
        <StatPill icon="🔗" label="QR codes actifs"  value={links.filter(l => l.active).length} accent="#E65100" />
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'all',      label: 'Tous',     count: links.length },
          { key: 'client',   label: 'Clients',  count: links.filter(l => l.group === 'client').length },
          { key: 'getdenis', label: 'Getdenis', count: links.filter(l => l.group === 'getdenis').length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterGroup(f.key)} style={{
            padding: '8px 18px', borderRadius: '20px', border: 'none',
            fontSize: '13px', fontWeight: filterGroup === f.key ? '700' : '500',
            backgroundColor: filterGroup === f.key ? '#E65100' : '#fff',
            color: filterGroup === f.key ? '#fff' : '#555',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            transition: 'all 0.15s',
          }}>
            {f.label}
            <span style={{
              marginLeft: '7px', fontSize: '11px',
              backgroundColor: filterGroup === f.key ? 'rgba(255,255,255,0.25)' : '#f0f0f0',
              color: filterGroup === f.key ? '#fff' : '#888',
              padding: '1px 7px', borderRadius: '20px', fontWeight: '600',
            }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Grille ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb', fontSize: '15px' }}>
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '16px' }}>
            {isAdmin ? 'Aucun QR code pour le moment.' : 'Aucun QR code à afficher.'}
          </p>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{
              backgroundColor: '#E65100', color: '#fff',
              border: 'none', borderRadius: '50px',
              padding: '13px 30px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            }}>
              Créer le premier QR Code
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '22px',
        }}>
          {filtered.map(link => (
            <QRCard
              key={link.id} link={link}
              onToggle={isAdmin ? handleToggle : () => {}}
              onDelete={isAdmin ? handleDelete : () => {}}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CreateModal onClose={() => setShowModal(false)} onCreate={l => setLinks(p => [l, ...p])} />
      )}
    </div>
  )
}

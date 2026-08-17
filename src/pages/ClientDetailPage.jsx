import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, FileText, Receipt, History, Plus, CreditCard, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { clientService } from '../services/clientService'
import api from '../config/api'
import FloatInput from '../components/ui/FloatInput'
import PhoneInputField from '../components/ui/PhoneInputField'
import CustomSelect from '../components/ui/CustomSelect'
import PeriodDropdown from '../components/ui/PeriodDropdown'
import usePremiumGate from '../hooks/usePremiumGate'

// ─── Constantes ───────────────────────────────────────────────────────────────
const PRIMARY = '#1E88E5'
const BG_PAGE = '#f4f6f8'
const BG_WHITE = '#ffffff'

const PERIOD_OPTIONS = [
  { value: 'year', label: 'Cette année' },
  { value: 'month', label: 'Ce mois' },
  { value: 'day', label: "Aujourd'hui" },
  { value: 'custom', label: 'Personnaliser' },
]

const SECTORS = [
  'Agriculture', 'Commerce', 'Construction', 'Éducation', 'Énergie',
  'Finance', 'Industrie', 'Informatique', 'Santé', 'Services', 'Transport', 'Autre',
]

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid #e0e0e0', backgroundColor: BG_WHITE,
  fontSize: '14px', color: '#111', outline: 'none', boxSizing: 'border-box',
}

// ─── Indicatifs téléphoniques ──────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'TG', dial: '228' }, { code: 'BJ', dial: '229' }, { code: 'CI', dial: '225' },
  { code: 'SN', dial: '221' }, { code: 'ML', dial: '223' }, { code: 'BF', dial: '226' },
  { code: 'GH', dial: '233' }, { code: 'NG', dial: '234' }, { code: 'CM', dial: '237' },
  { code: 'GA', dial: '241' }, { code: 'CG', dial: '242' }, { code: 'CD', dial: '243' },
  { code: 'MA', dial: '212' }, { code: 'DZ', dial: '213' }, { code: 'TN', dial: '216' },
  { code: 'FR', dial: '33'  }, { code: 'BE', dial: '32'  }, { code: 'DE', dial: '49'  },
  { code: 'GB', dial: '44'  }, { code: 'US', dial: '1'   },
]

function parsePhone(phone) {
  if (!phone) return null
  const n = phone.trim()
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    const prefix = '+' + c.dial
    if (n.startsWith(prefix)) return { code: c.code, dial: c.dial, local: n.slice(prefix.length).trim() }
    if (n.startsWith(c.dial)) return { code: c.code, dial: c.dial, local: n.slice(c.dial.length).trim() }
  }
  return null
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmt(amount) {
  if (!amount && amount !== 0) return '0'
  return Number(amount).toLocaleString('fr-FR').replace(/\s/g, '.')
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
}

function getStatus(client, invoicesCount) {
  if (!invoicesCount) return { label: 'Prospect', bg: '#FFF9C4', color: '#F9A825' }
  const days = (Date.now() - new Date(client.updated_at)) / 86400000
  if (days > 730) return { label: 'Inactif', bg: '#FFEBEE', color: '#E53935' }
  return { label: 'Actif', bg: '#E8F5E9', color: '#388E3C' }
}

function getAvatarColor(name) {
  const colors = ['#1976D2','#1565C0','#0D47A1','#2196F3','#42A5F5','#1E88E5','#0288D1','#0277BD']
  const idx = name?.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length
  return colors[idx || 0]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, Math.min(2, name.length)).toUpperCase()
}

// ─── Drawer édition ───────────────────────────────────────────────────────────
function EditDrawer({ open, onClose, client, onSaved }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [nif, setNif] = useState('')
  const [sector, setSector] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (client) {
      setName(client.name || '')
      setPhone(client.phone || '')
      setEmail(client.email || '')
      setAddress(client.address || '')
      setNif(client.registration_number || '')
      setSector(client.sector || '')
    }
  }, [client, open])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!name.trim()) { toast.error('Le nom est obligatoire'); return }
    setSaving(true)
    try {
      await api.put(`/clients/${client.id}`, {
        name: name.trim(), phone: phone.trim(),
        email: email.trim() || null, address: address.trim() || null,
        registration_number: nif.trim() || null, sector: sector || null,
      })
      toast.success('Client modifié')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:200, backdropFilter:'blur(2px)' }} />}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:'480px', maxWidth:'95vw',
        background:BG_WHITE, zIndex:201,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        display:'flex', flexDirection:'column',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.12)',
      }}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <h2 style={{ margin:0, fontSize:'22px', fontWeight:'700', color:'#111' }}>Modifier le client</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:'6px', borderRadius:'8px', display:'flex', color:'#666' }}><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:BG_PAGE }}>
          <p style={{ fontSize:'18px', fontWeight:'700', color:'#111', margin:'0 0 16px' }}>Informations client</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div style={{ gridColumn:'1/-1' }}>
              <FloatInput placeholder="Nom du client" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <PhoneInputField value={phone} onChange={setPhone} />
            </div>
            <input type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="NIF" value={nif} onChange={e => setNif(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Adresse" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
            <div style={{ gridColumn:'1/-1' }}>
              <CustomSelect value={sector} onChange={setSector} options={SECTORS.map(s => ({ value:s, label:s }))} placeholder="Secteur d'activité" />
            </div>
          </div>
        </form>
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f0f0f0', display:'flex', gap:'12px', flexShrink:0, background:BG_WHITE }}>
          <button type="button" onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:'12px', border:'1.5px solid #e0e0e0', background:BG_WHITE, fontSize:'15px', fontWeight:'600', color:'#555', cursor:'pointer' }}>Annuler</button>
          <button type="button" onClick={handleSubmit} disabled={saving} style={{ flex:2, padding:'12px', borderRadius:'12px', border:'none', background: saving ? '#90CAF9' : PRIMARY, fontSize:'15px', fontWeight:'700', color:'#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Enregistrement…' : 'Modifier'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [stats, setStats] = useState(null)
  const [quotesCount, setQuotesCount] = useState(0)
  const [invoicesCount, setInvoicesCount] = useState(0)
  const [caGlobal, setCaGlobal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statsPeriod, setStatsPeriod] = useState('year')
  const [customStart, setCustomStart] = useState(null)
  const [customEnd, setCustomEnd] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { isPremium, requirePremium, modal: premiumModal } = usePremiumGate()

  useEffect(() => {
    if (!isPremium) requirePremium('La fiche client')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fmtDateParam = (d) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null

  const loadAll = async (period = statsPeriod, start = customStart, end = customEnd) => {
    try {
      const params = {}
      if (period === 'custom' && start && end) {
        params.start_date = fmtDateParam(start)
        params.end_date = fmtDateParam(end)
      }
      const [clientRes, quotesRes, invoicesRes, dashRes] = await Promise.all([
        clientService.getOne(id, params),
        api.get(`/documents?client_id=${id}&type=quote&page=1`, { params }),
        api.get(`/documents?client_id=${id}&type=invoice&page=1`, { params }),
        api.get(`/dashboard/stats?period=${period}`, { params }),
      ])
      setClient(clientRes.data?.client || clientRes.data)
      setStats(clientRes.data?.stats || {})
      setQuotesCount(quotesRes.data?.meta?.total || quotesRes.data?.total || 0)
      setInvoicesCount(invoicesRes.data?.meta?.total || invoicesRes.data?.total || 0)
      const ca = dashRes.data?.current_month?.income || dashRes.data?.income || 0
      setCaGlobal(parseFloat(ca) || 0)
    } catch (e) {
      toast.error('Impossible de charger la fiche client')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (period, start, end) => {
    setStatsPeriod(period)
    setCustomStart(start)
    setCustomEnd(end)
    if (period !== 'custom' || (start && end)) {
      setStatsLoading(true)
      loadAll(period, start, end).finally(() => setStatsLoading(false))
    }
  }

  useEffect(() => { loadAll() }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await clientService.delete(id)
      toast.success('Client supprimé')
      navigate('/clients')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!isPremium) {
    return (
      <>
        {premiumModal}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, height:'100%', minHeight:'60vh' }}>
          <img src="/crown.svg" alt="" style={{ width:64, height:64, opacity:0.5 }} />
          <p style={{ margin:0, fontSize:'17px', fontWeight:'600', color:'#555' }}>Fiche client réservée</p>
          <p style={{ margin:0, fontSize:'14px', color:'#999' }}>Disponible avec les offres Basic et Pro.</p>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #1E88E5', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!client) return <div style={{ padding:32, color:'#888' }}>Client introuvable</div>

  const status = getStatus(client, invoicesCount)
  const avatarColor = getAvatarColor(client.name)
  const initials = getInitials(client.name)
  const totalPaid = parseFloat(stats?.total_paid || 0)
  const totalDue = parseFloat(stats?.total_due || 0)
  const totalFacture = totalPaid + totalDue
  const impact = caGlobal > 0 ? (totalPaid / caGlobal * 100) : 0
  const impactLabel = caGlobal > 0 ? `${impact.toFixed(1)} %` : '—'
  const lastDate = fmtDate(client.updated_at)

  const currency = 'XOF'

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%', background:BG_PAGE }}>

      {/* Header */}
      <div style={{ background:BG_WHITE, padding:'16px 32px', display:'flex', alignItems:'center', gap:16, borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
        <button onClick={() => navigate('/clients')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'#666', fontSize:'14px', padding:'6px 10px', borderRadius:8 }}>
          <ArrowLeft size={18} /> Retour
        </button>
        <h1 style={{ margin:0, fontSize:'24px', fontWeight:'700', color:'#111', flex:1 }}>Fiche client</h1>
      </div>

      <div style={{ padding:'24px 32px', maxWidth:'1100px', width:'100%', boxSizing:'border-box' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>

          {/* ── Colonne gauche ── */}
          <div>
            {/* Identité */}
            <div style={{ background:BG_WHITE, borderRadius:20, padding:28, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>

              {/* Badge statut + actions */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <span style={{ padding:'5px 14px', borderRadius:12, background:status.bg, color:status.color, fontSize:13, fontWeight:'700' }}>
                  {status.label}
                </span>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setEditOpen(true)} style={{ width:36, height:36, borderRadius:'50%', background:PRIMARY, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Pencil size={16} color="#fff" />
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} style={{ width:36, height:36, borderRadius:'50%', background:PRIMARY, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Trash2 size={16} color="#fff" />
                  </button>
                </div>
              </div>

              {/* Nom + avatar */}
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ color:'#fff', fontWeight:'800', fontSize:'20px' }}>{initials}</span>
                </div>
                <h2 style={{ margin:0, fontSize:'26px', fontWeight:'800', color:'#111' }}>{client.name}</h2>
              </div>

              {/* Infos */}
              {(() => {
                const pp = client.phone ? parsePhone(client.phone) : null
                const phoneValue = pp ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', background:'#f0f0f0', borderRadius:20, fontSize:13, fontWeight:600, color:'#555' }}>
                      <img src={`https://flagcdn.com/24x18/${pp.code.toLowerCase()}.png`} alt="" style={{ width:18, height:14, borderRadius:2, objectFit:'cover' }} />
                      {pp.dial}
                    </span>
                    <span style={{ fontSize:15, fontWeight:600, color:'#111' }}>{pp.local}</span>
                  </div>
                ) : client.phone ? (
                  <span style={{ fontSize:15, fontWeight:600, color:'#111' }}>{client.phone}</span>
                ) : '—'
                return [
                  { label: 'numéro téléphone', value: phoneValue },
                  { label: 'adresse mail', value: client.email || '—' },
                  { label: 'adresse', value: client.address || '—' },
                  { label: 'NIF', value: client.registration_number || '—' },
                  client.sector && { label: 'secteur', value: client.sector },
                ].filter(Boolean).map(row => (
                  <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f5f5f5' }}>
                    <span style={{ fontSize:15, color:'#aaa' }}>{row.label}</span>
                    {typeof row.value === 'string' ? (
                      <span style={{ fontSize:15, fontWeight:'600', color: row.value === '—' ? '#ccc' : '#111', textAlign:'right', maxWidth:'60%' }}>{row.value}</span>
                    ) : (
                      row.value
                    )}
                  </div>
                ))
              })()}
            </div>

            {/* Services */}
            <div style={{ background:BG_WHITE, borderRadius:20, padding:28, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin:'0 0 18px', fontSize:'18px', fontWeight:'700' }}>Services</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <ServiceBtn icon={FileText} label="Créer un devis" bg="#FFF8E1" iconColor="#F59E0B" onClick={() => navigate(`/documents/new?type=quote&client_id=${id}`)} />
                <ServiceBtn icon={Receipt} label="Créer une facture" bg="#E3F2FD" iconColor={PRIMARY} onClick={() => navigate(`/documents/new?type=invoice&client_id=${id}`)} />
                <ServiceBtn icon={History} label="Consulter historique" bg="#E3F2FD" iconColor={PRIMARY} onClick={() => navigate(`/history?client_id=${id}`)} />
                <ServiceBtn icon={Plus} label="Ajouter une dépense" bg="#FFF8E1" iconColor="#F59E0B" onClick={() => navigate(`/expenses/new?client_id=${id}`)} />
              </div>
              <div style={{ marginTop:12 }}>
                <ServiceBtn icon={CreditCard} label="Suivre les paiements" bg="#FFF8E1" iconColor="#F59E0B" onClick={() => navigate(`/history?client_id=${id}&filter=unpaid`)} wide />
              </div>
            </div>
          </div>

          {/* ── Colonne droite — Statistiques ── */}
          <div style={{ background:BG_WHITE, borderRadius:20, padding:32, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', alignSelf:'start' }}>
            {/* Titre + filtre période */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <h3 style={{ margin:0, fontSize:'28px', fontWeight:'800', color:'#111' }}>Statistiques</h3>
              <PeriodDropdown
                period={statsPeriod}
                options={PERIOD_OPTIONS}
                customStart={customStart}
                customEnd={customEnd}
                onChange={handlePeriodChange}
              />
            </div>

            {statsLoading ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'#888', fontSize:18, fontWeight:'600' }}>Chargement…</div>
            ) : (
              <>
                {/* Compteurs docs */}
                <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:28 }}>
                  <DocRow label="Devis" count={quotesCount} />
                  <DocRow label="Factures" count={invoicesCount} />
                </div>

                {/* Total facturé */}
                <div style={{ textAlign:'center', marginBottom:28, padding:'22px 16px', background:'#f8f9fa', borderRadius:16, border:'1px solid #edf0f2' }}>
                  <div style={{ fontSize:18, fontWeight:'700', color:'#555', marginBottom:8 }}>Total facturé</div>
                  <div style={{ fontSize:46, fontWeight:'900', color:'#111', lineHeight:1.1 }}>{fmt(totalFacture)} <span style={{ fontSize:24, fontWeight:'700', color:'#666' }}>{currency}</span></div>
                </div>

                {/* Mini stats */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
                  <MiniStat label="Total encaissé" value={`${fmt(totalPaid)}`} currency={currency} />
                  <MiniStat label="Restant à encaisser" value={`${fmt(totalDue)}`} currency={currency} valueColor={totalDue > 0 ? '#D84315' : undefined} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                  <MiniStat label="Date de la dernière facture" value={lastDate} />
                  <MiniStat label="Impact du client sur le CA" value={impactLabel} valueColor={impact >= 10 ? '#2E7D32' : impact >= 5 ? '#D84315' : undefined} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Drawer édition */}
      <EditDrawer open={editOpen} onClose={() => setEditOpen(false)} client={client} onSaved={() => { loadAll(); setEditOpen(false) }} />

      {/* Confirm suppression */}
      {showDeleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:BG_WHITE, borderRadius:16, padding:32, width:360, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin:'0 0 12px', fontSize:'18px', fontWeight:'700' }}>Supprimer le client ?</h3>
            <p style={{ color:'#666', marginBottom:24 }}>Cette action est irréversible. Toutes les données liées à ce client seront perdues.</p>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #e0e0e0', background:BG_WHITE, fontWeight:'600', cursor:'pointer' }}>Annuler</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:'#E53935', color:'#fff', fontWeight:'700', cursor:'pointer' }}>
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function DocRow({ label, count }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#f8f9fa', borderRadius:14, border:'1px solid #edf0f2' }}>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'#BDE1FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <FileText size={24} color={PRIMARY} />
        </div>
        <span style={{ fontSize:19, fontWeight:'700', color:'#222' }}>{label}</span>
      </div>
      <span style={{ fontSize:34, fontWeight:'900', color:'#111', marginLeft:32, minWidth:24, textAlign:'right' }}>{count}</span>
    </div>
  )
}

function MiniStat({ label, value, currency, valueColor }) {
  return (
    <div style={{ padding:'18px 20px', background:'#f8f9fa', borderRadius:14, border:'1px solid #edf0f2' }}>
      <div style={{ fontSize:16, fontWeight:'700', color:'#555', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:30, fontWeight:'900', color: valueColor || '#111' }}>
        {value}{currency && <span style={{ fontSize:18, fontWeight:'700', color:'#666', marginLeft:6 }}>{currency}</span>}
      </div>
    </div>
  )
}

function ServiceBtn({ icon: Icon, label, bg, iconColor, onClick, wide }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'14px 16px',
        background: hovered ? bg : bg,
        border:'none', borderRadius:12, cursor:'pointer',
        width: wide ? '100%' : undefined,
        opacity: hovered ? 0.85 : 1,
        transition:'opacity 0.15s',
        textAlign:'left',
      }}
    >
      <div style={{ width:32, height:32, borderRadius:8, background:`${iconColor}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={18} color={iconColor} />
      </div>
      <span style={{ fontSize:13, fontWeight:'600', color:'#111', lineHeight:1.3 }}>{label}</span>
    </button>
  )
}

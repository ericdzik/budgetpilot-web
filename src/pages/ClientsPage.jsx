import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Search, Filter, Users, X, FileText, Receipt, History, CreditCard, Pencil, Trash2, Phone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import FloatInput from '../components/ui/FloatInput'
import PhoneInputField from '../components/ui/PhoneInputField'
import CustomSelect from '../components/ui/CustomSelect'
import { clientService } from '../services/clientService'
import api from '../config/api'
import PeriodDropdown from '../components/ui/PeriodDropdown'
import usePremiumGate from '../hooks/usePremiumGate'

const PERIOD_OPTIONS = [
  { value: 'year', label: 'Cette année' },
  { value: 'month', label: 'Ce mois' },
  { value: 'day', label: "Aujourd'hui" },
  { value: 'custom', label: 'Personnaliser' },
]

const PRIMARY  = '#1E88E5'
const BG_PAGE  = '#f4f6f8'
const BG_WHITE = '#ffffff'

const SECTORS = [
  'Agriculture', 'Commerce', 'Construction', 'Éducation', 'Énergie',
  'Finance', 'Industrie', 'Informatique', 'Santé', 'Services', 'Transport', 'Autre',
]

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

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid #e0e0e0', backgroundColor: BG_WHITE,
  fontSize: '14px', color: '#111', outline: 'none', boxSizing: 'border-box',
}

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

function DocRow({ label, count }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#f8f9fa', borderRadius:10 }}>
      <div style={{ width:36, height:36, borderRadius:'50%', background:'#BDE1FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <FileText size={18} color={PRIMARY} />
      </div>
      <span style={{ flex:1, fontSize:14, color:'#666' }}>{label}</span>
      <span style={{ fontSize:22, fontWeight:'800', color:'#111' }}>{count}</span>
    </div>
  )
}

function MiniStat({ label, value, currency, valueColor }) {
  return (
    <div>
      <div style={{ fontSize:13, color:'#aaa', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:'800', color: valueColor || '#111' }}>
        {value}{currency && <span style={{ fontSize:14, fontWeight:'600', color:'#888', marginLeft:4 }}>{currency}</span>}
      </div>
    </div>
  )
}

function ServiceBtn({ imgSrc, label, bg, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:8, padding:'16px 10px',
        background: bg, border:'none', borderRadius:12, cursor:'pointer',
        opacity: hovered ? 0.85 : 1, transition:'opacity 0.15s', textAlign:'center',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        backgroundColor: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <img src={imgSrc} alt="" style={{ width:28, height:28, objectFit:'contain' }} />
      </div>
      <span style={{ fontSize:16, fontWeight:'600', color:'#111', lineHeight:1.3 }}>{label}</span>
    </button>
  )
}

function ClientDrawer({ open, onClose, onSaved, editClient = null }) {
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [email, setEmail]     = useState('')
  const [address, setAddress] = useState('')
  const [nif, setNif]         = useState('')
  const [sector, setSector]   = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (editClient) {
      setName(editClient.name || ''); setPhone(editClient.phone || '')
      setEmail(editClient.email || ''); setAddress(editClient.address || '')
      setNif(editClient.registration_number || ''); setSector(editClient.sector || '')
    } else {
      setName(''); setPhone(''); setEmail(''); setAddress(''); setNif(''); setSector('')
    }
  }, [editClient, open])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!name.trim()) { toast.error('Le nom est obligatoire'); return }
    if (!phone.trim()) { toast.error('Le téléphone est obligatoire'); return }
    setSaving(true)
    try {
      const payload = { name: name.trim(), phone: phone.trim(), email: email.trim() || null, address: address.trim() || null, registration_number: nif.trim() || null, sector: sector || null }
      if (editClient) { await api.put(`/clients/${editClient.id}`, payload); toast.success('Client modifié') }
      else { await api.post('/clients', payload); toast.success('Client créé') }
      onSaved(); onClose()
    } catch (err) { toast.error(err?.response?.data?.message || 'Une erreur est survenue') }
    finally { setSaving(false) }
  }

  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.3)', zIndex:200, backdropFilter:'blur(2px)' }} />}
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'480px', maxWidth:'95vw', backgroundColor:BG_WHITE, zIndex:201, transform: open ? 'translateX(0)' : 'translateX(100%)', transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)', display:'flex', flexDirection:'column', boxShadow:'-8px 0 40px rgba(0,0,0,0.12)' }}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <h2 style={{ margin:0, fontSize:'22px', fontWeight:'700', color:'#111' }}>{editClient ? 'Modifier le client' : 'Nouveau client'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:'6px', borderRadius:'8px', display:'flex', color:'#666' }}><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex:1, overflowY:'auto', padding:'20px 24px', backgroundColor:BG_PAGE }}>
          <p style={{ fontSize:'18px', fontWeight:'700', color:'#111', margin:'0 0 16px' }}>Informations client</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div style={{ gridColumn:'1 / -1' }}><FloatInput placeholder="Nom du client" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></div>
            <div style={{ gridColumn:'1 / -1' }}>
              <PhoneInputField value={phone} onChange={setPhone} />
            </div>
            <input type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="NIF" value={nif} onChange={e => setNif(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Adresse" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
            <div style={{ gridColumn:'1 / -1' }}><CustomSelect value={sector} onChange={setSector} options={SECTORS.map(s => ({ value:s, label:s }))} placeholder="Secteur d'activité" /></div>
          </div>
        </form>
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f0f0f0', display:'flex', gap:'12px', flexShrink:0, backgroundColor:BG_WHITE }}>
          <button type="button" onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:'12px', border:'1.5px solid #e0e0e0', backgroundColor:BG_WHITE, fontSize:'15px', fontWeight:'600', color:'#555', cursor:'pointer' }}>Annuler</button>
          <button type="button" onClick={handleSubmit} disabled={saving} style={{ flex:2, padding:'12px', borderRadius:'12px', border:'none', backgroundColor: saving ? '#90CAF9' : PRIMARY, fontSize:'15px', fontWeight:'700', color:'#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Enregistrement…' : (editClient ? 'Modifier' : 'Créer le client')}
          </button>
        </div>
      </div>
    </>
  )
}

function ClientPanel({ clientId, onEdit, onDelete }) {
  const navigate = useNavigate()
  const [client, setClient]               = useState(null)
  const [stats, setStats]                 = useState(null)
  const [quotesCount, setQuotesCount]     = useState(0)
  const [invoicesCount, setInvoicesCount] = useState(0)
  const [caGlobal, setCaGlobal]           = useState(0)
  const [loading, setLoading]             = useState(true)
  const [statsPeriod, setStatsPeriod]     = useState('year')
  const [customStart, setCustomStart]     = useState(null)
  const [customEnd, setCustomEnd]         = useState(null)
  const [statsLoading, setStatsLoading]   = useState(false)

  const fmtDateParam = (d) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null

  const loadAll = async (period, start, end) => {
    setLoading(true)
    try {
      const params = {}
      if (period === 'custom' && start && end) {
        params.start_date = fmtDateParam(start)
        params.end_date = fmtDateParam(end)
      }
      const [clientRes, quotesRes, invoicesRes, dashRes] = await Promise.all([
        clientService.getOne(clientId, params),
        api.get(`/documents?client_id=${clientId}&type=quote&page=1`, { params }),
        api.get(`/documents?client_id=${clientId}&type=invoice&page=1`, { params }),
        api.get(`/dashboard/stats?period=${period}`, { params }),
      ])
      setClient(clientRes.data?.client || clientRes.data)
      setStats(clientRes.data?.stats || {})
      setQuotesCount(quotesRes.data?.meta?.total || quotesRes.data?.total || 0)
      setInvoicesCount(invoicesRes.data?.meta?.total || invoicesRes.data?.total || 0)
      const ca = dashRes.data?.current_month?.income || dashRes.data?.income || 0
      setCaGlobal(parseFloat(ca) || 0)
    } catch { toast.error('Impossible de charger la fiche client') }
    finally { setLoading(false) }
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

  useEffect(() => { if (clientId) loadAll('year', null, null) }, [clientId])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%', minHeight:300 }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #1E88E5', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!client) return <div style={{ padding:32, color:'#888' }}>Client introuvable</div>

  const status       = getStatus(client, invoicesCount)
  const avatarColor  = getAvatarColor(client.name)
  const initials     = getInitials(client.name)
  const totalPaid    = parseFloat(stats?.total_paid || 0)
  const totalDue     = parseFloat(stats?.total_due || 0)
  const totalFacture = totalPaid + totalDue
  const impact       = caGlobal > 0 ? (totalPaid / caGlobal * 100) : 0
  const impactLabel  = caGlobal > 0 ? `${impact.toFixed(1)} %` : '—'
  // N'afficher la date que si le client a au moins une facture (même logique que le mobile)
  const lastDate     = invoicesCount > 0 ? fmtDate(client.updated_at) : '—'
  const currency     = 'XOF'

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'20px 24px' }}>
      {/* Identité */}
      <div style={{ background:BG_WHITE, borderRadius:20, padding:28, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:48 }}>

        {/* Nom + boutons modifier/supprimer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <h2 style={{ margin:0, fontSize:'32px', fontWeight:'800', color:'#111' }}>{client.name}</h2>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => onEdit(client)} style={{ width:44, height:44, borderRadius:'50%', background:PRIMARY, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Pencil size={18} color="#fff" />
            </button>
            <button onClick={() => onDelete(client.id)} style={{ width:44, height:44, borderRadius:'50%', background:PRIMARY, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Trash2 size={18} color="#fff" />
            </button>
          </div>
        </div>

        {/* Infos : label gris à gauche, valeur à droite */}
        {(() => {
          const pp = parsePhone(client.phone)
          const phoneValue = pp ? (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', background:'#f0f0f0', borderRadius:20, fontSize:13, fontWeight:600, color:'#555' }}>
                <img src={`https://flagcdn.com/24x18/${pp.code.toLowerCase()}.png`} alt="" style={{ width:18, height:14, borderRadius:2, objectFit:'cover' }} />
                {pp.dial}
              </span>
              <span style={{ fontSize:16, fontWeight:600, color:'#111' }}>{pp.local}</span>
            </div>
          ) : client.phone ? (
            <span style={{ fontSize:18, fontWeight:'500', color:'#111', textAlign:'right' }}>{client.phone}</span>
          ) : '—'
          return [
            { label:'numéro téléphone', value: phoneValue },
            { label:'adresse mail',     value: client.email || '—' },
            { label:'adresse',          value: client.address || '—' },
            { label:'NIF',              value: client.registration_number || '—' },
            client.sector && { label:'secteur', value: client.sector },
          ].filter(Boolean).map(row => (
            <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0' }}>
              <span style={{ fontSize:18, color:'#bbb', minWidth:140 }}>{row.label}</span>
              {typeof row.value === 'string' ? (
                <span style={{ fontSize:18, fontWeight:'500', color: row.value === '—' ? '#ddd' : '#111', textAlign:'right' }}>{row.value}</span>
              ) : (
                row.value
              )}
            </div>
          ))
        })()}
      </div>

      {/* Statistiques */}
      <div style={{ background:BG_WHITE, borderRadius:20, padding:28, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:48 }}>
        {/* Titre + filtre */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:'24px', fontWeight:'700' }}>Statistiques</h3>
          <PeriodDropdown
            period={statsPeriod}
            options={PERIOD_OPTIONS}
            customStart={customStart}
            customEnd={customEnd}
            onChange={handlePeriodChange}
          />
        </div>

        {statsLoading ? <div style={{ textAlign:'center', padding:'16px 0', color:'#aaa' }}>Chargement…</div> : (
          <div style={{ display:'flex', gap:32 }}>
            {/* Colonne gauche : Devis + Factures — décalées vers le bas pour s'aligner avec les mini stats */}
            <div style={{ display:'flex', flexDirection:'column', gap:36, paddingTop:90, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:10, background:'#BDE1FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <img src="/devisicone.svg" alt="" style={{ width:28, height:28, objectFit:'contain' }} />
                </div>
                <span style={{ fontSize:20, color:'#aaa', minWidth:160 }}>Devis</span>
                <span style={{ fontSize:36, fontWeight:'900', color:'#111' }}>{quotesCount}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:10, background:'#BDE1FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <img src="/operation2.svg" alt="" style={{ width:28, height:28, objectFit:'contain' }} />
                </div>
                <span style={{ fontSize:20, color:'#aaa', minWidth:160 }}>Factures</span>
                <span style={{ fontSize:36, fontWeight:'900', color:'#111' }}>{invoicesCount}</span>
              </div>
            </div>

            {/* Colonne droite : Total facturé en haut, puis mini stats */}
            <div style={{ marginLeft:'auto', minWidth:420 }}>
              <div style={{ textAlign:'center', marginBottom:24 }}>
                <div style={{ fontSize:16, color:'#aaa', marginBottom:6 }}>Total facturé</div>
                <div style={{ fontSize:56, fontWeight:'900', color:'#111', lineHeight:1 }}>{fmt(totalFacture)}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px 32px' }}>
                <div>
                  <div style={{ fontSize:14, color:'#bbb', marginBottom:4 }}>Total encaissé</div>
                  <div style={{ fontSize:32, fontWeight:'800', color:'#111' }}>{fmt(totalPaid)}</div>
                </div>
                <div>
                  <div style={{ fontSize:14, color:'#bbb', marginBottom:4 }}>Restant à encaisser</div>
                  <div style={{ fontSize:32, fontWeight:'800', color: totalDue > 0 ? '#E65100' : '#111' }}>{fmt(totalDue)}</div>
                </div>
                <div>
                  <div style={{ fontSize:14, color:'#bbb', marginBottom:4 }}>Date de la dernière facture</div>
                  <div style={{ fontSize:26, fontWeight:'700', color:'#111' }}>{lastDate}</div>
                </div>
                <div>
                  <div style={{ fontSize:14, color:'#bbb', marginBottom:4 }}>Impact du client sur le CA</div>
                  <div style={{ fontSize:26, fontWeight:'700', color: impact >= 10 ? '#388E3C' : impact >= 5 ? '#E65100' : '#111' }}>{impactLabel}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Services */}
      <div style={{ background:BG_WHITE, borderRadius:20, padding:28, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'24px', fontWeight:'700' }}>Services</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          <ServiceBtn imgSrc="/SERVICESICONE1.svg" label={'Créer\nun devis'}           bg="#FFF8E1" onClick={() => navigate(`/documents/new?type=quote&client_id=${clientId}`)} />
          <ServiceBtn imgSrc="/SERVICESICONE2.svg" label={'Créer une\nfacture'}        bg="#E3F2FD" onClick={() => navigate(`/documents/new?type=invoice&client_id=${clientId}`)} />
          <ServiceBtn imgSrc="/historyicone.svg"   label={'Consulter\nl\'historique'}  bg="#E3F2FD" onClick={() => navigate(`/history?tab=invoices&client_id=${clientId}`)} />
          <ServiceBtn imgSrc="/paymenticone.svg"    label={'Suivre les\npaiements'}     bg="#FFF8E1" onClick={() => navigate(`/history?tab=invoices&filter=unpaid_and_pending&client_id=${clientId}`)} />
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [sortOrder, setSortOrder]     = useState('recent')
  const [sortOpen, setSortOpen]       = useState(false)
  const sortRef = useRef(null)
  const [page, setPage]               = useState(1)
  const [meta, setMeta]               = useState(null)
  const [selectedId, setSelectedId]   = useState(null)
  const [deleteId, setDeleteId]       = useState(null)
  const [deleting, setDeleting]       = useState(false)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [editClient, setEditClient]   = useState(null)
  const [panelKey, setPanelKey]       = useState(0)
  const { isPremium, requirePremium, modal: premiumModal } = usePremiumGate()
  const premiumPopupShown = useRef(false)

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientService.getAll(page)
      setClients(res.data.data || [])
      setMeta(res.data.meta || null)
      if (!premiumPopupShown.current) {
        premiumPopupShown.current = true
        if (!isPremium) requirePremium('La gestion des clients', true)
      }
    } catch { toast.error('Impossible de charger les clients') }
    finally { setLoading(false) }
  }, [page, isPremium, requirePremium])

  useEffect(() => { loadClients() }, [loadClients])

  const location = useLocation()
  useEffect(() => {
    if (location.state?.selectedId) {
      setSelectedId(location.state.selectedId)
    }
  }, [location.state?.selectedId])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await clientService.delete(deleteId)
      toast.success('Client supprimé')
      if (selectedId === deleteId) setSelectedId(null)
      setDeleteId(null)
      loadClients()
    } catch { toast.error('Erreur lors de la suppression') }
    finally { setDeleting(false) }
  }

  const openCreate = () => { if (!requirePremium('Créer un client')) return; setEditClient(null); setDrawerOpen(true) }
  const openEdit   = (client) => { if (!requirePremium('Modifier un client')) return; setEditClient(client); setDrawerOpen(true) }
  const handleSaved = () => { loadClients(); setPanelKey(k => k + 1) }

  const statusOf = (client) => {
    // Aucune facture → Prospect (même logique que le mobile)
    if (!client.invoices_count || client.invoices_count === 0)
      return { label:'Prospect', bg:'#FFF9C4', color:'#F9A825' }
    const days = (Date.now() - new Date(client.updated_at)) / 86400000
    if (days > 730) return { label:'Inactif', bg:'#FFEBEE', color:'#E53935' }
    return { label:'Actif', bg:'#E8F5E9', color:'#388E3C' }
  }

  const sorted = [...clients].sort((a, b) => {
    if (sortOrder === 'az') return a.name?.localeCompare(b.name) || 0
    if (sortOrder === 'za') return b.name?.localeCompare(a.name) || 0
    return 0
  })

  const filtered = sorted.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q)
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Header
        title="Mes clients"
        subtitle={`${meta?.total ?? clients.length} client(s)`}
        actions={
          <button onClick={openCreate} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', backgroundColor:PRIMARY, color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.opacity='0.88'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
            <Plus size={16} /> Nouveau client
          </button>
        }
      />

      <div style={{ display:'flex', flex:1, overflow:'hidden', background:BG_PAGE }}>

        {/* Liste gauche */}
        <div style={{ width:'38%', minWidth:260, maxWidth:420, display:'flex', flexDirection:'column', borderRight:'1px solid #e8eaed', background:BG_WHITE, overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
            <div style={{ position:'relative' }}>
              <Search size={15} color="#aaa" style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input style={{ ...inputStyle, paddingLeft:'34px', paddingRight:'34px', fontSize:'13px' }} placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
              <div ref={sortRef} style={{ position:'absolute', right:'4px', top:'50%', transform:'translateY(-50%)' }}>
                <button onClick={() => setSortOpen(o => !o)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', color: sortOrder !== 'recent' ? PRIMARY : '#aaa', display:'flex' }}
                  title="Trier">
                  <Filter size={15} />
                </button>
                {sortOpen && (
                  <>
                    <div onClick={() => setSortOpen(false)} style={{ position:'fixed', inset:0, zIndex:99 }} />
                    <div style={{ position:'absolute', right:0, top:'100%', zIndex:100, background:'#fff', borderRadius:10, boxShadow:'0 4px 16px rgba(0,0,0,0.15)', padding:'4px', minWidth:150, marginTop:4 }}>
                      {[
                        { value:'recent', label:'Plus récents' },
                        { value:'az',     label:'A → Z' },
                        { value:'za',     label:'Z → A' },
                      ].map(o => (
                        <button key={o.value} onClick={() => { setSortOrder(o.value); setSortOpen(false) }}
                          style={{ display:'block', width:'100%', padding:'8px 12px', borderRadius:8, border:'none', background: sortOrder === o.value ? '#E3F2FD' : 'transparent', color: sortOrder === o.value ? PRIMARY : '#333', fontSize:13, fontWeight: sortOrder === o.value ? 600 : 400, textAlign:'left', cursor:'pointer' }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}><Spinner /></div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:'32px 16px' }}>
                {search ? (
                  <EmptyState icon={Users} title="Aucun résultat" description="Essayez un autre terme" />
                ) : (
                  <EmptyState icon={Users} title="Aucun client" description="Ajoutez votre premier client"
                    action={<button onClick={openCreate} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', backgroundColor:PRIMARY, color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}><Plus size={15} /> Ajouter</button>} />
                )}
              </div>
            ) : filtered.map(client => {
              const st = statusOf(client)
              const isSelected = selectedId === client.id
              return (
                <div key={client.id}
                  style={{ padding:'12px 16px', borderBottom:'1px solid #f5f5f5', backgroundColor: isSelected ? '#E3F2FD' : BG_WHITE, cursor:'pointer', transition:'background 0.12s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor='#f9fbff' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor=BG_WHITE }}
                  onClick={() => { if (requirePremium('Consulter la fiche client')) setSelectedId(client.id) }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:getAvatarColor(client.name), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ color:'#fff', fontWeight:'700', fontSize:'13px' }}>{getInitials(client.name)}</span>
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ margin:0, fontSize:'14px', fontWeight:'600', color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.name}</p>
                        {client.sector && <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#999', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.sector}</p>}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                      <span style={{ minWidth:'72px', padding:'2px 8px', borderRadius:8, background:st.bg, color:st.color, fontSize:'11px', fontWeight:'700', whiteSpace:'nowrap', textAlign:'center', display:'inline-block' }}>{st.label}</span>
                      <button onClick={e => { e.stopPropagation(); if (requirePremium('Consulter la fiche client')) setSelectedId(client.id) }}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:PRIMARY, fontSize:'12px', fontWeight:'600', textDecoration:'underline', whiteSpace:'nowrap' }}>
                        Voir plus
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {meta && meta.last_page > 1 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid #f0f0f0' }}>
                <span style={{ fontSize:12, color:'#888' }}>Page {meta.current_page}/{meta.last_page}</span>
                <div style={{ display:'flex', gap:8 }}>
                  <Button variant="secondary" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>←</Button>
                  <Button variant="secondary" size="sm" disabled={page===meta.last_page} onClick={() => setPage(p=>p+1)}>→</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panneau droit */}
        <div style={{ flex:1, overflow:'hidden', background:BG_PAGE }}>
          {selectedId ? (
            <ClientPanel key={`${selectedId}-${panelKey}`} clientId={selectedId} onEdit={openEdit} onDelete={id => setDeleteId(id)} />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12 }}>
              <Users size={48} color="#ddd" />
              <p style={{ margin:0, fontSize:'16px', fontWeight:'500', color:'#bbb' }}>Sélectionnez un client</p>
              <p style={{ margin:0, fontSize:'13px', color:'#ccc' }}>Cliquez sur "Voir plus" pour afficher la fiche</p>
            </div>
          )}
        </div>
      </div>

      <ClientDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={handleSaved} editClient={editClient} />

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting}
        title="Supprimer le client" message="Cette action est irréversible." confirmLabel="Supprimer" />

      {premiumModal}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

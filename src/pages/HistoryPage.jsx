import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Search, SlidersHorizontal, Pencil, Download, Eye,
  Trash2, ChevronDown, ChevronUp, X, Check, FileText, CircleDollarSign,
} from 'lucide-react'
import api from '../config/api'
import PdfPreviewModal from '../components/ui/PdfPreviewModal'
import UserBadge from '../components/ui/UserBadge'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '0'
  return Number(n).toLocaleString('fr-FR').replace(/\s/g, '.')
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return d }
}

function getMonthKey(dateStr) {
  if (!dateStr) return 'Inconnu'
  const d = new Date(dateStr)
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

function statusInfo(item, type) {
  if (type === 'invoices' || type === 'expenses') {
    const s = item.payment_status || item.status
    if (s === 'paid')                          return { label: 'Payée',    color: '#4CAF50', bg: '#E8F5E9' }
    if (s === 'partial' || s === 'partially_paid') return { label: 'Payée', color: '#FF9800', bg: '#FFF3E0' }
    // Non payéee(unpaid, sent, draft, overdue) → badge gris
    return { label: 'Payée', color: '#9E9E9E', bg: '#F5F5F5' }
  }
  return null
}

function shortRef(ref) {
  if (!ref) return ''
  // FAC-26-003 → #FC-003 | DEV-26-042 → #DV-042 | EXP-001 → #EXP-001 | REC-001 → #REC-001
  if (ref.startsWith('FAC')) return '#FC-' + ref.split('-').pop()
  if (ref.startsWith('DEV')) return '#DV-' + ref.split('-').pop()
  if (ref.startsWith('EXP')) return '#EXP-' + ref.split('-').pop()
  if (ref.startsWith('REC')) return '#REC-' + ref.split('-').pop()
  return '#' + ref
}

// ─── Composant carte item ─────────────────────────────────────────────────────

function HistoryCard({ item, type, onRefresh }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail]     = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [pdfPreview, setPdfPreview] = useState(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

  // Paiement rapide
  const [payDate, setPayDate]     = useState(new Date().toISOString().split('T')[0])
  const [payAmount, setPayAmount] = useState('')
  const [addingPay, setAddingPay] = useState(false)
  const [deletingPay, setDeletingPay] = useState(null)

  const status = statusInfo(item, type)

  const loadDetail = async () => {
    if (detail) return
    setLoadingDetail(true)
    try {
      let res
      if (type === 'invoices' || type === 'quotes') {
        res = await api.get(`/documents/${item.id}`)
        setDetail(res.data)
      } else if (type === 'expenses') {
        res = await api.get(`/expenses/${item.id}`)
        setDetail(res.data.expense || res.data)
      } else {
        res = await api.get(`/revenues/${item.id}`)
        setDetail(res.data.revenue || res.data)
      }
    } catch { toast.error('Impossible de charger le détail') }
    finally { setLoadingDetail(false) }
  }

  const toggle = () => {
    if (!expanded) loadDetail()
    setExpanded(v => !v)
  }

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cet élément ?')) return
    try {
      if (type === 'invoices' || type === 'quotes') await api.delete(`/documents/${item.id}`)
      else if (type === 'expenses') await api.delete(`/expenses/${item.id}`)
      else await api.delete(`/revenues/${item.id}`)
      toast.success('Supprimé')
      onRefresh()
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const handleAddPayment = async () => {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return toast.error('Montant invalide')
    setAddingPay(true)
    try {
      const endpoint = type === 'expenses'
        ? `/expenses/${item.id}/payments`
        : `/documents/${item.id}/payments`
      await api.post(endpoint, { amount, payment_date: payDate, payment_method: 'cash' })
      toast.success('Paiement ajouté')
      setPayAmount('')
      setDetail(null) // Force reload
      onRefresh()
    } catch { toast.error('Erreur lors de l\'ajout du paiement') }
    finally { setAddingPay(false) }
  }

  const handleDeletePayment = async (payId) => {
    setDeletingPay(payId)
    try {
      const endpoint = type === 'expenses'
        ? `/expenses/${item.id}/payments/${payId}`
        : `/documents/${item.id}/payments/${payId}`
      await api.delete(endpoint)
      toast.success('Paiement supprimé')
      setDetail(null)
      onRefresh()
    } catch { toast.error('Erreur') }
    finally { setDeletingPay(null) }
  }

  const handleMarkAsPaid = async () => {
    if (!window.confirm('Marquer comme entièrement payée ?')) return
    try {
      const today = new Date().toISOString().split('T')[0]
      if (type === 'expenses') {
        await api.post(`/expenses/${item.id}/mark-as-paid`, {
          payment_method: 'cash',
          payment_date: today,
          notes: 'Paiement automatique',
        })
      } else {
        await api.post(`/documents/${item.id}/mark-as-paid`, {
          payment_method: 'cash',
          payment_date: today,
          notes: 'Paiement automatique',
        })
      }
      toast.success('Marquée comme payée ✓')
      setDetail(null)
      onRefresh()
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors du marquage'
      toast.error(msg)
    }
  }

  const handleDownloadCsv = async () => {
    try {
      const endpoint = type === 'expenses'
        ? `/expenses/${item.id}/csv`
        : `/documents/${item.id}/csv`
      const res = await api.get(endpoint, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.reference_number || item.id}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch { toast.error('Erreur export CSV') }
  }

  const payments = detail?.payments || []
  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const remaining = parseFloat(detail?.total_amount || detail?.total || item.total_amount || 0) - totalPaid
  const isFullyPaid = remaining <= 0

  const showPayments = (type === 'invoices' || type === 'expenses') && expanded

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '12px', marginBottom: '8px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      overflow: 'visible',
    }}>
      {/* ── Partie toujours visible ── */}
      <div
        onClick={toggle}
        style={{ padding: '22px 28px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Gauche */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#111' }}>
                {item.client_name || item.client?.name || item.supplier_name || item.client || item.description || 'Sans nom'}
              </span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>
                {shortRef(item.reference_number)}
              </span>
              <span style={{ fontSize: '16px', color: '#888' }}>
                {fmtDate(item.issue_date || item.date || item.created_at)}
              </span>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#111' }}>
                {fmt(item.total_amount || item.total || item.amount)} XOF
              </span>
              {status && (
                <span style={{
                  padding: '4px 14px', borderRadius: '10px',
                  fontSize: '15px', fontWeight: '600',
                  color: status.color, backgroundColor: status.bg,
                }}>
                  {status.label}
                </span>
              )}
            </div>
          </div>

          {/* Droite : actions + voir plus/moins */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}
            onClick={e => e.stopPropagation()}>

            {/* Icônes d'action */}
            {(type === 'invoices' || type === 'quotes') && (
              <>
                <button onClick={() => navigate(`/documents/${item.id}/edit`)}
                  style={iconBtn}><Pencil size={16} color="#888" /></button>
                {/* Icône paiement — uniquement si pas encore payé, factures seulement */}
                {type === 'invoices' && (item.payment_status !== 'paid') && (
                  <button onClick={handleMarkAsPaid} title="Marquer comme payée"
                    style={iconBtn}><CircleDollarSign size={16} color="#4CAF50" /></button>
                )}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowDownloadMenu(v => !v)} style={iconBtn}>
                    <Download size={16} color="#888" />
                  </button>
                  {showDownloadMenu && (
                    <div style={{
                      position: 'absolute', right: 0, top: '100%', zIndex: 100,
                      backgroundColor: '#fff', borderRadius: '10px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      padding: '6px 0', minWidth: '160px',
                    }}>
                      <button onClick={() => { setPdfPreview({ docId: item.id, clientName: item.client_name }); setShowDownloadMenu(false) }}
                        style={menuItem}>
                        <Download size={14} /> Télécharger .pdf
                      </button>
                      <button onClick={() => { handleDownloadCsv(); setShowDownloadMenu(false) }}
                        style={menuItem}>
                        <FileText size={14} /> Télécharger .csv
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => setPdfPreview({ docId: item.id, clientName: item.client_name || item.client?.name })}
                  style={iconBtn}><Eye size={16} color="#888" /></button>
                <button onClick={handleDelete} style={iconBtn}><Trash2 size={16} color="#888" /></button>
              </>
            )}
            {(type === 'expenses') && (
              <>
                <button onClick={() => navigate(`/expenses/${item.id}/edit`)}
                  style={iconBtn}><Pencil size={16} color="#888" /></button>
                {/* Icône paiement — uniquement si pas encore payé */}
                {(item.payment_status !== 'paid') && (
                  <button onClick={handleMarkAsPaid} title="Marquer comme payée"
                    style={iconBtn}><CircleDollarSign size={16} color="#4CAF50" /></button>
                )}
                <button onClick={handleDownloadCsv} style={iconBtn}><Download size={16} color="#888" /></button>
                <button onClick={handleDelete} style={iconBtn}><Trash2 size={16} color="#888" /></button>
              </>
            )}
            {type === 'receipts' && (
              <>
                <button onClick={() => navigate(`/revenues/${item.id}/edit`)}
                  style={iconBtn}><Pencil size={16} color="#888" /></button>
                <button onClick={handleDownloadCsv} style={iconBtn}><Download size={16} color="#888" /></button>
                <button onClick={handleDelete} style={iconBtn}><Trash2 size={16} color="#888" /></button>
              </>
            )}

            {/* Voir plus / Voir moins */}
            <span style={{ fontSize: '15px', color: '#111', textDecoration: 'underline', cursor: 'pointer', marginLeft: '4px' }}
              onClick={toggle}>
              {expanded ? 'Voir moins' : 'Voir plus'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Détail expandable ── */}
      {expanded && (
        <div style={{ borderTop: '1px dashed #e0e0e0', padding: '20px 28px' }}>
          {loadingDetail ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Chargement...</div>
          ) : detail ? (
            <>
              {/* Section paiements (Factures + Dépenses) */}
              {showPayments && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

                    {/* Gauche : En-cours de paiement */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                        En-cours de paiement
                      </div>
                      {payments.length > 0 ? payments.map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '17px', color: '#666', minWidth: '110px' }}>{fmtDate(p.payment_date)}</span>
                          <span style={{ fontSize: '18px', fontWeight: '700', minWidth: '100px' }}>{fmt(p.amount)}</span>
                          <button onClick={() => handleDeletePayment(p.id)} disabled={deletingPay === p.id}
                            style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '4px', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <Trash2 size={14} color="#aaa" />
                          </button>
                        </div>
                      )) : (
                        <div style={{ fontSize: '17px', color: '#bbb' }}>Aucun paiement</div>
                      )}
                    </div>

                    {/* Centre : Ajouter un paiement */}
                    {!isFullyPaid && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                          Ajouter un paiement
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '15px', color: '#aaa', marginBottom: '3px' }}>Date</div>
                            <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                              style={{ padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', width: '140px' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', color: '#aaa', marginBottom: '3px' }}>Montant</div>
                            <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                              placeholder="0"
                              style={{ padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', width: '120px' }} />
                          </div>
                          <button onClick={handleAddPayment} disabled={addingPay}
                            style={{
                              marginTop: '20px', padding: '10px 24px',
                              backgroundColor: '#1E88E5', color: '#fff',
                              border: 'none', borderRadius: '20px',
                              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                            }}>
                            {addingPay ? '...' : 'Valider'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Droite : Montant perçu / restant */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '32px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '17px', color: '#555' }}>Montant perçu</span>
                        <span style={{ fontSize: '18px', fontWeight: '700' }}>{fmt(totalPaid)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '32px' }}>
                        <span style={{ fontSize: '17px', color: '#555' }}>Montant restant</span>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: remaining > 0 ? '#333' : '#4CAF50' }}>
                          {fmt(Math.max(0, remaining))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {detail.notes && (
                <div style={{
                  display: 'flex', gap: '16px', padding: '14px 18px',
                  border: '1px solid #e8e8e8', borderRadius: '8px', marginBottom: '14px',
                }}>
                  <span style={{ fontSize: '17px', fontWeight: '700', color: '#333', flexShrink: 0 }}>Description</span>
                  <span style={{ fontSize: '17px', color: '#555', lineHeight: 1.5 }}>{detail.notes}</span>
                </div>
              )}

              {/* Totaux en bas */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline',
                gap: '24px', flexWrap: 'wrap', paddingTop: '10px',
                borderTop: detail.notes ? 'none' : '1px solid #f0f0f0',
              }}>
                {(detail.subtotal || detail.sub_total) > 0 && (
                  <span style={{ fontSize: '17px', color: '#555' }}>
                    Sous-Total <strong style={{ fontSize: '19px', color: '#111', marginLeft: '6px' }}>
                      {fmt(detail.subtotal || detail.sub_total)}
                    </strong>
                  </span>
                )}
                {(detail.discount_amount > 0 || detail.discount_percent > 0) && (
                  <span style={{ fontSize: '17px', color: '#888' }}>
                    Remise ({detail.discount_type === 'percentage' ? `${detail.discount_percent}%` : 'fixe'})
                    <strong style={{ fontSize: '19px', color: '#111', marginLeft: '6px' }}>
                      {fmt(detail.discount_amount)}
                    </strong>
                  </span>
                )}
                {detail.has_tva && (detail.tax_amount > 0) && (
                  <span style={{ fontSize: '17px', color: '#888' }}>
                    Taxe (18%)
                    <strong style={{ fontSize: '19px', color: '#111', marginLeft: '6px' }}>
                      {fmt(detail.tax_amount)}
                    </strong>
                  </span>
                )}
                <span style={{ fontSize: '18px', color: '#333', fontWeight: '600' }}>
                  Total
                  <strong style={{ fontSize: '28px', color: '#111', marginLeft: '8px' }}>
                    {fmt(detail.total_amount || detail.total || item.total_amount || item.amount)}
                  </strong>
                </span>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Modal PDF */}
      {pdfPreview && (
        <PdfPreviewModal
          docId={pdfPreview.docId}
          clientName={pdfPreview.clientName}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  )
}

// Styles partagés
const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center',
}
const menuItem = {
  display: 'flex', alignItems: 'center', gap: '8px',
  width: '100%', padding: '8px 16px', background: 'none', border: 'none',
  cursor: 'pointer', fontSize: '13px', color: '#333', textAlign: 'left',
}

// ─── Page principale ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'invoices', label: 'Factures' },
  { key: 'quotes',   label: 'Devis' },
  { key: 'expenses', label: 'Dépenses' },
  { key: 'receipts', label: 'Recettes' },
]

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function HistoryPage() {
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'invoices'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let data = []
      if (activeTab === 'invoices') {
        const r = await api.get('/documents?type=invoice&per_page=100')
        data = r.data.data || r.data.documents || []
      } else if (activeTab === 'quotes') {
        const r = await api.get('/documents?type=quote&per_page=100')
        data = r.data.data || r.data.documents || []
      } else if (activeTab === 'expenses') {
        const r = await api.get('/expenses?per_page=100')
        data = r.data.data || r.data.expenses || []
      } else {
        const r = await api.get('/revenues?per_page=100')
        data = r.data.data || r.data.revenues || []
      }
      // Trier par date décroissante
      data.sort((a, b) => new Date(b.issue_date || b.date || b.created_at) - new Date(a.issue_date || a.date || a.created_at))
      setItems(data)
    } catch { toast.error('Impossible de charger les données') }
    finally { setLoading(false) }
  }, [activeTab])

  useEffect(() => { load() }, [load])

  // Filtrage
  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (item.client_name || '').toLowerCase().includes(q) ||
      (item.reference_number || '').toLowerCase().includes(q) ||
      (item.supplier_name || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)

    let matchStatus = true
    if (filterStatus !== 'all' && (activeTab === 'invoices' || activeTab === 'expenses')) {
      const s = item.payment_status || item.status
      if (filterStatus === 'paid')    matchStatus = s === 'paid'
      if (filterStatus === 'unpaid')  matchStatus = s !== 'paid' && s !== 'partially_paid'
      if (filterStatus === 'partial') matchStatus = s === 'partially_paid'
    }
    return matchSearch && matchStatus
  })

  // Grouper par mois
  const grouped = {}
  filtered.forEach(item => {
    const key = getMonthKey(item.issue_date || item.date || item.created_at)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: 0 }}>Suivi des opérations</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', fontWeight: '600', color: '#333', cursor: 'pointer' }}>
            XOF <ChevronDown size={15} color="#1E88E5" />
          </div>
        </div>
        {/* Badge Pro + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserBadge size={48} />
        </div>
      </div>

      {/* ── Onglets + Recherche ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 28px 16px', flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setFilterStatus('all') }}
            style={{
              padding: '9px 22px', borderRadius: '25px', border: 'none',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              backgroundColor: activeTab === tab.key ? '#1E88E5' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#333',
              transition: 'all 0.15s',
            }}>
            {tab.label}
          </button>
        ))}

        {/* Recherche */}
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f5f5f5', borderRadius: '25px', padding: '8px 16px', marginLeft: '8px' }}>
          <Search size={16} color="#aaa" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher"
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '14px', color: '#333' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color="#aaa" /></button>}
        </div>

        {/* Filtre statut (Factures + Dépenses) */}
        {(activeTab === 'invoices' || activeTab === 'expenses') && (
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '25px', border: '1px solid #e0e0e0', fontSize: '14px', color: '#333', cursor: 'pointer', outline: 'none' }}>
            <option value="all">Tous</option>
            <option value="paid">Payées</option>
            <option value="partial">En cours</option>
            <option value="unpaid">Non payées</option>
          </select>
        )}
      </div>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, padding: '16px 28px 28px', overflowY: 'auto', backgroundColor: '#f4f6f8', borderRadius: '16px 16px 0 0', margin: '0 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e0e0e0', borderTopColor: '#1E88E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#bbb', fontSize: '15px' }}>
            Aucun élément trouvé
          </div>
        ) : (
          Object.entries(grouped).map(([month, monthItems]) => (
            <div key={month}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#888', marginBottom: '10px', marginTop: '8px' }}>
                {month}
              </div>
              {monthItems.map(item => (
                <HistoryCard key={item.id} item={item} type={activeTab} onRefresh={load} />
              ))}
            </div>
          ))
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

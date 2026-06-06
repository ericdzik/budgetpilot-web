import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Search, SlidersHorizontal, Pencil, Download, Eye,
  Trash2, ChevronDown, ChevronUp, X, Check, FileText, CircleDollarSign, MoreVertical,
} from 'lucide-react'
import api from '../config/api'
import PdfPreviewModal from '../components/ui/PdfPreviewModal'
import UserBadge from '../components/ui/UserBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'

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
  // Règle badge paiement : toujours "Payée", couleur selon état
  // gris = non payé, orange = partiel, vert = payé
  if (type === 'invoices' || type === 'expenses') {
    const s = item.payment_status || item.status
    if (s === 'paid')                              return { label: 'Payée', color: '#4CAF50', bg: '#E8F5E9' }
    if (s === 'partial' || s === 'partially_paid') return { label: 'Payée', color: '#FF9800', bg: '#FFF3E0' }
    // unpaid, sent, draft, overdue → gris
    return { label: 'Payée', color: '#9E9E9E', bg: '#F5F5F5' }
  }
  if (type === 'quotes') {
    const s = item.status
    if (s === 'accepted')  return { label: 'Accepté',  color: '#4CAF50', bg: '#E8F5E9' }
    if (s === 'rejected')  return { label: 'Refusé',   color: '#e53935', bg: '#FFEBEE' }
    if (s === 'sent')      return { label: 'Envoyé',   color: '#1E88E5', bg: '#E3F2FD' }
    if (s === 'draft')     return { label: 'Brouillon',color: '#9E9E9E', bg: '#F5F5F5' }
    return { label: 'Devis', color: '#9E9E9E', bg: '#F5F5F5' }
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

// Élément de menu contextuel
function CtxItem({ icon, label, onClick, color, danger }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        width: '100%', padding: '11px 16px',
        background: hovered ? (danger ? '#fff5f5' : '#f0f7ff') : 'none',
        border: 'none', borderRadius: '10px',
        fontSize: '15px', fontWeight: '500',
        color: color || '#222',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.12s',
      }}
    >
      {/* Icône dans un cercle coloré */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        backgroundColor: danger ? '#ffebee' : '#e8f4ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      {label}
    </button>
  )
}

// ─── Composant carte item ─────────────────────────────────────────────────────

function HistoryCard({ item, type, onRefresh }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail]     = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [pdfPreview, setPdfPreview] = useState(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)

  // Dialog de confirmation custom
  const [confirmDialog, setConfirmDialog] = useState(null) // { title, message, icon, confirmLabel, confirmColor, onConfirm }

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
    if (!expanded) {
      setDetail(null)
      setLoadingDetail(true)
      // On force le rechargement en utilisant une ref pour éviter le stale closure
      const endpoint = type === 'invoices' || type === 'quotes'
        ? `/documents/${item.id}`
        : type === 'expenses'
          ? `/expenses/${item.id}`
          : `/revenues/${item.id}`
      api.get(endpoint)
        .then(res => {
          if (type === 'invoices' || type === 'quotes') {
            setDetail(res.data)
          } else if (type === 'expenses') {
            setDetail(res.data.expense || res.data)
          } else {
            setDetail(res.data.revenue || res.data)
          }
        })
        .catch(() => toast.error('Impossible de charger le détail'))
        .finally(() => setLoadingDetail(false))
    }
    setExpanded(v => !v)
  }

  const handleDelete = async () => {
    setConfirmDialog({
      title: 'Supprimer cet élément ?',
      message: 'Cette action est irréversible.',
      icon: 'delete',
      confirmLabel: 'Supprimer',
      confirmColor: '#e53935',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          if (type === 'invoices' || type === 'quotes') await api.delete(`/documents/${item.id}`)
          else if (type === 'expenses') await api.delete(`/expenses/${item.id}`)
          else await api.delete(`/revenues/${item.id}`)
          toast.success('Supprimé')
          onRefresh()
        } catch { toast.error('Erreur lors de la suppression') }
      }
    })
  }

  // Recharger le détail sans fermer la carte
  const reloadDetail = async () => {
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
    } catch { toast.error('Impossible de recharger le détail') }
    finally { setLoadingDetail(false) }
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
      await reloadDetail() // Recharge sans fermer la carte
      // Ne pas appeler onRefresh() pour éviter de fermer la carte
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
      await reloadDetail() // Recharge sans fermer la carte
      // Ne pas appeler onRefresh() pour éviter de fermer la carte
    } catch { toast.error('Erreur') }
    finally { setDeletingPay(null) }
  }

  const handleConvertToInvoice = async () => {
    setConfirmDialog({
      title: 'Convertir en facture ?',
      message: 'Ce devis sera converti en facture.',
      icon: 'warning',
      confirmLabel: 'Convertir',
      confirmColor: '#1E88E5',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await api.post(`/documents/${item.id}/convert-to-invoice`)
          toast.success('Devis converti en facture')
          onRefresh()
        } catch { toast.error('Erreur lors de la conversion') }
      }
    })
  }

  const handleDuplicate = async () => {
    try {
      await api.post(`/documents/${item.id}/duplicate`)
      toast.success('Document dupliqué')
      onRefresh()
    } catch { toast.error('Erreur lors de la duplication') }
  }

  const handleMarkAsUnpaid = async () => {
    setConfirmDialog({
      title: 'Marquer comme non payée ?',
      message: 'Tous les paiements enregistrés seront supprimés.',
      icon: 'warning',
      confirmLabel: 'Confirmer',
      confirmColor: '#FF9800',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          const endpoint = type === 'expenses'
            ? `/expenses/${item.id}/mark-as-unpaid`
            : `/documents/${item.id}/mark-as-unpaid`
          await api.post(endpoint)
          toast.success('Marqué comme non payé')
          setDetail(null)
          onRefresh()
        } catch (err) {
          toast.error(err.response?.data?.message || 'Erreur')
        }
      }
    })
  }

  const handleMarkAsPaid = async () => {
    setConfirmDialog({
      title: 'Marquer comme payée ?',
      message: 'Le statut sera mis à jour immédiatement.',
      icon: 'pay',
      confirmLabel: 'Confirmer',
      confirmColor: '#1E88E5',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          const today = new Date().toISOString().split('T')[0]
          if (type === 'expenses') {
            await api.post(`/expenses/${item.id}/mark-as-paid`, {
              payment_method: 'cash', payment_date: today, notes: 'Paiement automatique',
            })
          } else {
            await api.post(`/documents/${item.id}/mark-as-paid`, {
              payment_method: 'cash', payment_date: today, notes: 'Paiement automatique',
            })
          }
          toast.success('Marquée comme payée ✓')
          setDetail(null)
          onRefresh()
        } catch (err) {
          toast.error(err.response?.data?.message || 'Erreur lors du marquage')
        }
      }
    })
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
  // Pour les dépenses le backend renvoie 'amount', pour les documents 'total_amount'
  const itemTotalAmount = parseFloat(
    detail?.total_amount || detail?.total || detail?.amount ||
    item.total_amount || item.total || item.amount || 0
  )
  const remaining = itemTotalAmount - totalPaid
  const isFullyPaid = remaining <= 0

  // Utiliser le statut du détail chargé en priorité (plus à jour que item)
  const currentPaymentStatus = detail?.payment_status ?? item.payment_status
  const showPayments = (type === 'invoices' || (type === 'expenses' && currentPaymentStatus !== 'paid')) && expanded

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '12px', marginBottom: '6px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      overflow: 'visible',
    }}>
      {/* ── Partie toujours visible ── */}
      <div
        onClick={toggle}
        style={{ padding: COL_PADDING, cursor: 'pointer' }}
      >
        {/* Grille : Nom | Référence | Date | Montant | Statut | Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: COL_TEMPLATE,
          alignItems: 'center',
          gap: COL_GAP,
        }}>
          {/* Nom */}
          <span style={{ fontSize: '21px', fontWeight: '700', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.client_name || item.client?.name || item.supplier_name || item.client || item.description || 'Sans nom'}
          </span>

          {/* Référence */}
          <span style={{ fontSize: '17px', fontWeight: '600', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortRef(item.reference_number)}
          </span>

          {/* Date */}
          <span style={{ fontSize: '17px', color: '#888', whiteSpace: 'nowrap' }}>
            {fmtDate(item.issue_date || item.date || item.created_at)}
          </span>

          {/* Montant */}
          <span style={{ fontSize: '19px', fontWeight: '700', color: '#111', whiteSpace: 'nowrap' }}>
            {fmt(item.total_amount || item.total || item.amount)} <span style={{ fontSize: '15px', color: '#888', fontWeight: '500' }}>XOF</span>
          </span>

          {/* Statut */}
          <div>
            {status && type !== 'quotes' ? (
              <span style={{
                display: 'inline-block',
                padding: '5px 16px', borderRadius: '20px',
                fontSize: '15px', fontWeight: '600',
                color: status.color, backgroundColor: status.bg,
                whiteSpace: 'nowrap',
              }}>
                {status.label}
              </span>
            ) : (
              <span />
            )}
          </div>

          {/* Actions — collées à droite */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', marginLeft: 'auto' }}
            onClick={e => e.stopPropagation()}>

            {/* Icônes d'action */}
            {(type === 'invoices' || type === 'quotes') && (
              <>
                <button onClick={() => navigate(`/documents/${item.id}/edit`)}
                  style={iconBtn}><Pencil size={20} color="#888" /></button>
                {/* Icône paiement — uniquement si pas encore payé, factures seulement */}
                {type === 'invoices' && (item.payment_status !== 'paid') && (
                  <button onClick={handleMarkAsPaid} title="Marquer comme payée"
                    style={iconBtn}><CircleDollarSign size={20} color="#4CAF50" /></button>
                )}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowDownloadMenu(v => !v)} style={iconBtn}>
                    <Download size={20} color="#888" />
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
                        <Download size={15} /> Télécharger .pdf
                      </button>
                      <button onClick={() => { handleDownloadCsv(); setShowDownloadMenu(false) }}
                        style={menuItem}>
                        <FileText size={15} /> Télécharger .csv
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => setPdfPreview({ docId: item.id, clientName: item.client_name || item.client?.name })}
                  style={iconBtn}><Eye size={20} color="#888" /></button>
                <button onClick={handleDelete} style={iconBtn}><Trash2 size={20} color="#888" /></button>
              </>
            )}
            {(type === 'expenses') && (
              <>
                <button onClick={() => navigate(`/expenses/${item.id}/edit`)}
                  style={iconBtn}><Pencil size={20} color="#888" /></button>
                {/* Icône paiement — uniquement si pas encore payé */}
                {(item.payment_status !== 'paid') && (
                  <button onClick={handleMarkAsPaid} title="Marquer comme payée"
                    style={iconBtn}><CircleDollarSign size={20} color="#4CAF50" /></button>
                )}
                <button onClick={handleDownloadCsv} style={iconBtn}><Download size={20} color="#888" /></button>
                <button onClick={handleDelete} style={iconBtn}><Trash2 size={20} color="#888" /></button>
              </>
            )}
            {type === 'receipts' && (
              <>
                <button onClick={() => navigate(`/revenues/${item.id}/edit`)}
                  style={iconBtn}><Pencil size={20} color="#888" /></button>
                <button onClick={handleDownloadCsv} style={iconBtn}><Download size={20} color="#888" /></button>
                <button onClick={handleDelete} style={iconBtn}><Trash2 size={20} color="#888" /></button>
              </>
            )}

            {/* Bouton 3 points — menu contextuel */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowContextMenu(v => !v)}
                style={{ ...iconBtn, marginLeft: '4px' }}
              >
                <MoreVertical size={20} color="#888" />
              </button>

              {showContextMenu && (
                <>
                  {/* Overlay fermeture */}
                  <div onClick={() => setShowContextMenu(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 99 }} />

                  <div style={{
                    position: 'absolute', right: 0, top: '100%', zIndex: 100,
                    backgroundColor: '#fff', borderRadius: '14px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                    padding: '6px', minWidth: '210px',
                  }}>

                    {/* ── Factures ── */}
                    {type === 'invoices' && (<>
                      <CtxItem icon={<Pencil size={16}/>} label="Modifier"
                        onClick={() => { navigate(`/documents/${item.id}/edit`); setShowContextMenu(false) }} />
                      <CtxItem icon={<FileText size={16}/>} label="Dupliquer"
                        onClick={() => { handleDuplicate(); setShowContextMenu(false) }} />
                      {item.payment_status !== 'paid'
                        ? <CtxItem icon={<CircleDollarSign size={16} color="#9E9E9E"/>} label="Marquer comme payée"
                            onClick={() => { handleMarkAsPaid(); setShowContextMenu(false) }} />
                        : <CtxItem icon={<CircleDollarSign size={16} color="#FF9800"/>} label="Marquer comme non payée" color="#FF9800"
                            onClick={() => { handleMarkAsUnpaid(); setShowContextMenu(false) }} />
                      }
                      <CtxItem icon={<Download size={16}/>} label="Télécharger .pdf"
                        onClick={() => { setPdfPreview({ docId: item.id, clientName: item.client_name }); setShowContextMenu(false) }} />
                      <CtxItem icon={<FileText size={16}/>} label="Télécharger .csv"
                        onClick={() => { handleDownloadCsv(); setShowContextMenu(false) }} />
                      <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                      <CtxItem icon={<Trash2 size={16} color="#e53935"/>} label="Supprimer" color="#e53935"
                        onClick={() => { handleDelete(); setShowContextMenu(false) }} />
                    </>)}

                    {/* ── Devis ── */}
                    {type === 'quotes' && (<>
                      <CtxItem icon={<Pencil size={16}/>} label="Modifier"
                        onClick={() => { navigate(`/documents/${item.id}/edit`); setShowContextMenu(false) }} />
                      <CtxItem icon={<FileText size={16}/>} label="Dupliquer"
                        onClick={() => { handleDuplicate(); setShowContextMenu(false) }} />
                      <CtxItem icon={<Check size={16} color="#4CAF50"/>} label="Convertir en facture" color="#4CAF50"
                        onClick={() => { handleConvertToInvoice(); setShowContextMenu(false) }} />
                      <CtxItem icon={<Download size={16}/>} label="Télécharger .pdf"
                        onClick={() => { setPdfPreview({ docId: item.id, clientName: item.client_name }); setShowContextMenu(false) }} />
                      <CtxItem icon={<FileText size={16}/>} label="Télécharger .csv"
                        onClick={() => { handleDownloadCsv(); setShowContextMenu(false) }} />
                      <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                      <CtxItem icon={<Trash2 size={16} color="#e53935"/>} label="Supprimer" color="#e53935"
                        onClick={() => { handleDelete(); setShowContextMenu(false) }} />
                    </>)}

                    {/* ── Dépenses ── */}
                    {type === 'expenses' && (<>
                      <CtxItem icon={<Pencil size={16}/>} label="Modifier"
                        onClick={() => { navigate(`/expenses/${item.id}/edit`); setShowContextMenu(false) }} />
                      {item.payment_status !== 'paid'
                        ? <CtxItem icon={<CircleDollarSign size={16} color="#9E9E9E"/>} label="Marquer comme payée"
                            onClick={() => { handleMarkAsPaid(); setShowContextMenu(false) }} />
                        : <CtxItem icon={<CircleDollarSign size={16} color="#FF9800"/>} label="Marquer comme non payée" color="#FF9800"
                            onClick={() => { handleMarkAsUnpaid(); setShowContextMenu(false) }} />
                      }
                      <CtxItem icon={<Download size={16}/>} label="Exporter en CSV"
                        onClick={() => { handleDownloadCsv(); setShowContextMenu(false) }} />
                      <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                      <CtxItem icon={<Trash2 size={16} color="#e53935"/>} label="Supprimer" color="#e53935"
                        onClick={() => { handleDelete(); setShowContextMenu(false) }} />
                    </>)}

                    {/* ── Recettes ── */}
                    {type === 'receipts' && (<>
                      <CtxItem icon={<Pencil size={16}/>} label="Modifier"
                        onClick={() => { navigate(`/revenues/${item.id}/edit`); setShowContextMenu(false) }} />
                      <CtxItem icon={<Download size={16}/>} label="Exporter en CSV"
                        onClick={() => { handleDownloadCsv(); setShowContextMenu(false) }} />
                      <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                      <CtxItem icon={<Trash2 size={16} color="#e53935"/>} label="Supprimer" color="#e53935"
                        onClick={() => { handleDelete(); setShowContextMenu(false) }} />
                    </>)}
                  </div>
                </>
              )}
            </div>

            {/* Voir plus / Voir moins */}
            <span style={{ fontSize: '17px', color: '#111', textDecoration: 'underline', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '6px' }}
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
                {(() => {
                  // Calculer le sous-total depuis les items
                  const itemsSubtotal = (detail.items || []).reduce((acc, it) => {
                    const total = Number(it.total_price ?? it.total ?? (it.quantity * it.unit_price) ?? 0)
                    return acc + total
                  }, 0)

                  const discountPct = Number(detail.discount_percent || 0)
                  const discountAmt = discountPct > 0 ? itemsSubtotal * discountPct / 100 : 0
                  const afterDiscount = itemsSubtotal - discountAmt

                  const taxAmt = Number(detail.tax_amount || 0)
                  const total = Number(itemTotalAmount)

                  return (
                    <>
                      {itemsSubtotal > 0 && (
                        <span style={{ fontSize: '17px', color: '#555' }}>
                          Sous-Total <strong style={{ fontSize: '19px', color: '#111', marginLeft: '6px' }}>
                            {fmt(itemsSubtotal)}
                          </strong>
                        </span>
                      )}
                      {discountPct > 0 && (
                        <span style={{ fontSize: '17px', color: '#888' }}>
                          Remise ({discountPct.toFixed(2)}%)
                          <strong style={{ fontSize: '19px', color: '#111', marginLeft: '6px' }}>
                            {fmt(discountAmt)}
                          </strong>
                        </span>
                      )}
                      {taxAmt > 0 && (
                        <span style={{ fontSize: '17px', color: '#888' }}>
                          Taxe
                          <strong style={{ fontSize: '19px', color: '#111', marginLeft: '6px' }}>
                            {fmt(taxAmt)}
                          </strong>
                        </span>
                      )}
                      <span style={{ fontSize: '18px', color: '#333', fontWeight: '600' }}>
                        Total
                        <strong style={{ fontSize: '28px', color: '#111', marginLeft: '8px' }}>
                          {fmt(total)}
                        </strong>
                      </span>
                    </>
                  )
                })()}
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

      {/* Dialog de confirmation custom */}
      {confirmDialog && (
        <ConfirmDialog
          open={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          icon={confirmDialog.icon}
          confirmLabel={confirmDialog.confirmLabel}
          confirmColor={confirmDialog.confirmColor}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}

// Styles partagés
const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center',
}
const menuItem = {
  display: 'flex', alignItems: 'center', gap: '8px',
  width: '100%', padding: '8px 16px', background: 'none', border: 'none',
  cursor: 'pointer', fontSize: '13px', color: '#333', textAlign: 'left',
}

// Colonnes identiques header + cartes : Nom | Référence | Date | Montant | Statut | Actions
const COL_TEMPLATE = '1fr 130px 150px 150px 100px 1fr'
const COL_GAP = '12px'
const COL_PADDING = '16px 20px'

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
  const initialTab    = searchParams.get('tab')    || 'invoices'
  const initialFilter = searchParams.get('filter') || 'all'

  const [activeTab, setActiveTab]           = useState(initialTab)
  const [items, setItems]                   = useState([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [filterStatus, setFilterStatus]     = useState(initialFilter)
  const [filterOpen, setFilterOpen]         = useState(false)

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

  // Recharger quand la fenêtre reprend le focus (retour depuis le formulaire d'édition)
  useEffect(() => {
    const handleFocus = () => load()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [load])

  // Filtrage
  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (item.client_name   || '').toLowerCase().includes(q) ||
      (item.client?.name  || '').toLowerCase().includes(q) ||
      (item.supplier_name || '').toLowerCase().includes(q) ||
      (item.description   || '').toLowerCase().includes(q) ||
      (item.reference_number || '').toLowerCase().includes(q) ||
      (item.name          || '').toLowerCase().includes(q) ||
      (item.notes         || '').toLowerCase().includes(q)

    // Filtre statut (factures + dépenses)
    let matchStatus = true
    if (filterStatus !== 'all' && (activeTab === 'invoices' || activeTab === 'expenses')) {
      const s = item.payment_status || item.status
      if (filterStatus === 'paid')             matchStatus = s === 'paid'
      if (filterStatus === 'unpaid')           matchStatus = s !== 'paid' && s !== 'partially_paid'
      if (filterStatus === 'partial')          matchStatus = s === 'partially_paid'
      if (filterStatus === 'unpaid_and_pending') matchStatus = s !== 'paid'
    }

    // Filtre date (devis + recettes)
    let matchDate = true
    if (filterStatus !== 'all' && (activeTab === 'quotes' || activeTab === 'receipts')) {
      const d = new Date(item.issue_date || item.date || item.created_at)
      const now = new Date()
      if (filterStatus === 'today') {
        matchDate = d.toDateString() === now.toDateString()
      } else if (filterStatus === 'week') {
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0)
        const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999)
        matchDate = d >= weekStart && d <= weekEnd
      } else if (filterStatus === 'month') {
        matchDate = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      }
    }

    return matchSearch && matchStatus && matchDate
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
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setFilterStatus('all'); setFilterOpen(false) }}
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

        {/* Barre recherche + filtre intégré — même design que le mobile */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative', marginLeft: '8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#f0f0f0', borderRadius: '25px', padding: '10px 16px',
          }}>
            {/* Icône loupe */}
            <Search size={18} color="#888" style={{ flexShrink: 0 }} />

            {/* Input */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Rechercher"
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '15px', color: '#333' }}
            />

            {/* Bouton ✕ si texte */}
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}>
                <X size={16} color="#aaa" />
              </button>
            )}

            {/* Séparateur */}
            <div style={{ width: '1px', height: '18px', backgroundColor: '#ddd', flexShrink: 0 }} />

            {/* Icône filtre entonnoir */}
            <button
              onClick={e => { e.stopPropagation(); setFilterOpen(v => !v) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}
            >
              <SlidersHorizontal
                size={18}
                color={filterStatus !== 'all' ? '#1E88E5' : '#888'}
              />
            </button>
          </div>

          {/* Dropdown filtre — style popup comme mobile */}
          {filterOpen && (
            <>
              {/* Overlay pour fermer */}
              <div
                onClick={() => setFilterOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 100,
                backgroundColor: '#fff', borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                padding: '8px', minWidth: '200px',
              }}>
                {/* Options selon l'onglet actif */}
                {((activeTab === 'invoices' || activeTab === 'expenses') ? [
                  { value: 'all',                label: 'Tout' },
                  { value: 'paid',               label: 'Payée' },
                  { value: 'unpaid_and_pending', label: 'Impayées (Toutes)' },
                ] : [
                  { value: 'all',   label: 'Tout' },
                  { value: 'today', label: "Aujourd'hui" },
                  { value: 'week',  label: 'Cette semaine' },
                  { value: 'month', label: 'Ce mois' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterStatus(opt.value); setFilterOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '10px 16px',
                      background: filterStatus === opt.value ? '#e8f4ff' : 'none',
                      border: 'none', borderRadius: '10px',
                      fontSize: '15px', fontWeight: filterStatus === opt.value ? '600' : '400',
                      color: filterStatus === opt.value ? '#1E88E5' : '#333',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {opt.label}
                    {filterStatus === opt.value && (
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%',
                        backgroundColor: '#1E88E5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
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
          <>
            {/* ── Header colonnes ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: COL_TEMPLATE,
              gap: COL_GAP,
              padding: COL_PADDING,
              marginBottom: '4px',
            }}>
              {['Nom', 'Référence', 'Date', 'Montant', activeTab === 'quotes' ? '' : 'Statut', ''].map((h, i) => (
                <span key={i} style={{
                  fontSize: '14px', fontWeight: '700', color: '#aaa',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  textAlign: i === 5 ? 'right' : 'left',
                }}>
                  {h}
                </span>
              ))}
            </div>

            {Object.entries(grouped).map(([month, monthItems]) => (
              <div key={month}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#888', marginBottom: '6px', marginTop: '16px', paddingLeft: '4px' }}>
                  {month}
                </div>
                {monthItems.map(item => (
                  <HistoryCard key={item.id} item={item} type={activeTab} onRefresh={load} />
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import api from '../config/api'
import UserBadge from '../components/ui/UserBadge'
import FloatInput from '../components/ui/FloatInput'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PRIMARY       = '#1E88E5'
const BG_PAGE       = '#f4f6f8'
const BG_BLUE_LIGHT = '#e8f4ff'
const BG_WHITE      = '#ffffff'

const PAYMENT_METHODS = [
  { value: 'cash',         label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card',         label: 'Carte bancaire' },
  { value: 'transfer',     label: 'Virement bancaire' },
  { value: 'check',        label: 'Chèque' },
]

const REVENUE_CATEGORIES = [
  'Vente de produits', 'Prestation de services', 'Consultation', 'Location',
  'Commission', 'Subvention', 'Remboursement', 'Autres',
]

function newItem() {
  return {
    id: Date.now() + Math.random(),
    title: '',
    quantity: '',
    unitPrice: '',
    totalPrice: 0,
    _manualFields: [],
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function RevenueFormPage() {
  const navigate  = useNavigate()
  const { id }    = useParams()
  const isEditing = !!id
  const pageTitle = isEditing ? 'Modifier une recette' : 'Créer une nouvelle recette'

  const today = new Date().toISOString().slice(0, 10)

  // ── Numéro de référence ──
  const [refNumber,  setRefNumber]  = useState('')
  const [refLoading, setRefLoading] = useState(true)

  // ── Champs ──
  const [issueDate,      setIssueDate]      = useState(today)
  const [clientName,     setClientName]     = useState('')
  const [category,       setCategory]       = useState(REVENUE_CATEGORIES[0])
  const [paymentMethod,  setPaymentMethod]  = useState('cash')
  const [notes,          setNotes]          = useState('')
  const [items,          setItems]          = useState([newItem()])

  // ── Autocomplétion client ──
  const [suggestions,     setSuggestions]     = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef(null)

  // ── UI ──
  const [submitting, setSubmitting] = useState(false)

  // ── Calculs ──
  const itemTotal = (it) =>
    Number(it.totalPrice) || (Number(it.quantity) * Number(it.unitPrice))
  const subtotal = items.reduce((acc, it) => acc + itemTotal(it), 0)
  const total    = subtotal

  const fmt = (n) => Number(n).toLocaleString('fr-FR').replace(/\s/g, '.')

  // ── Gestion des items — système 2 champs actifs (comme DocumentFormPage) ──
  const updateItem = (itemId, field, value) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== itemId) return it
      let updated = { ...it, [field]: value }

      if (field === 'quantity' || field === 'unitPrice' || field === 'totalPrice') {
        const fieldKey = field === 'unitPrice'   ? 'price'
                       : field === 'totalPrice'  ? 'total'
                       : 'qty'
        const manual = updated._manualFields.filter(f => f !== fieldKey)
        manual.push(fieldKey)
        if (manual.length > 2) manual.shift()
        updated._manualFields = manual

        const qty   = Number(updated.quantity)
        const price = Number(updated.unitPrice)
        const total = Number(updated.totalPrice)

        if (manual.length === 2) {
          const hasQty   = manual.includes('qty')
          const hasPrice = manual.includes('price')
          const hasTotal = manual.includes('total')
          if (hasQty && hasPrice)    updated.totalPrice = qty * price
          else if (hasQty && hasTotal)   updated.unitPrice  = qty > 0 ? Math.round((total / qty) * 100) / 100 : 0
          else if (hasPrice && hasTotal) updated.quantity   = price > 0 ? Math.round((total / price) * 100) / 100 : 0
        } else {
          const q = Number(updated.quantity)
          const p = Number(updated.unitPrice)
          if (fieldKey !== 'total' && q > 0 && p > 0) updated.totalPrice = q * p
        }
      }
      return updated
    }))
  }

  const removeItem = (itemId) =>
    setItems((prev) => prev.filter((it) => it.id !== itemId))

  const addItem = () => setItems((prev) => [...prev, newItem()])

  // ── Chargement du numéro suivant (création) ──
  useEffect(() => {
    if (isEditing) return
    setRefLoading(true)
    api.get('/revenues/next-number')
      .then((res) => setRefNumber(res.data?.number ?? res.data?.next_number ?? ''))
      .catch(() => {})
      .finally(() => setRefLoading(false))
  }, [isEditing])

  // ── Chargement en mode édition ──
  useEffect(() => {
    if (!isEditing) return
    api.get(`/revenues/${id}`).then(res => {
      const rev = res.data.revenue || res.data
      setRefNumber(rev.reference_number || `REC-${String(rev.id).padStart(3, '0')}`)
      setRefLoading(false)
      setIssueDate(rev.date?.slice(0, 10) || today)
      setClientName(rev.client_name || '')
      setCategory(rev.category || REVENUE_CATEGORIES[0])
      setPaymentMethod(rev.payment_method || 'cash')
      setNotes(rev.notes || '')
      // Si items stockés, les charger ; sinon créer un item par défaut
      if (rev.items && rev.items.length > 0) {
        setItems(rev.items.map(it => {
          const qty   = Number(it.quantity)                           || 0
          const price = Number(it.unit_price ?? it.unitPrice)         || 0
          return {
            id: it.id || Date.now() + Math.random(),
            title: it.description || it.title || '',
            quantity: qty,
            unitPrice: price,
            totalPrice: qty * price,
            _manualFields: ['qty', 'price'],
          }
        }))
      } else {
        const price = Number(rev.amount) || 0
        setItems([{
          id: Date.now(),
          title: rev.description || '',
          quantity: 1,
          unitPrice: price,
          totalPrice: price,
          _manualFields: ['qty', 'price'],
        }])
      }
    }).catch(() => toast.error('Impossible de charger la recette'))
  }, [id, isEditing])

  // ── Fermer suggestions au clic extérieur ──
  useEffect(() => {
    function handleClick(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Autocomplétion client ──
  // ── Autocomplétion client — chargement unique au montage ──
  const [allClients, setAllClients] = useState([])

  useEffect(() => {
    api.get('/clients?per_page=200')
      .then(res => {
        const list = res.data?.data ?? res.data ?? []
        setAllClients(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
  }, [])

  const searchClients = useCallback((q) => {
    if (!q || q.length < 1) { setSuggestions([]); setShowSuggestions(false); return }
    const lower = q.toLowerCase()
    const filtered = allClients.filter(c =>
      (c.name  || '').toLowerCase().includes(lower) ||
      (c.phone || '').toLowerCase().includes(lower) ||
      (c.email || '').toLowerCase().includes(lower)
    ).slice(0, 10)
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }, [allClients])

  const handleClientNameChange = (e) => {
    const val = e.target.value
    setClientName(val)
    searchClients(val)
  }

  const handleSelectSuggestion = (c) => {
    setClientName(c.name ?? '')
    setShowSuggestions(false)
    setSuggestions([])
  }

  // ── Réinitialisation ──
  const handleReset = () => {
    setClientName('')
    setCategory(REVENUE_CATEGORIES[0])
    setPaymentMethod('cash')
    setNotes('')
    setItems([newItem()])
    if (!isEditing) {
      setRefLoading(true)
      api.get('/revenues/next-number')
        .then((res) => setRefNumber(res.data?.number ?? res.data?.next_number ?? ''))
        .catch(() => {})
        .finally(() => setRefLoading(false))
    }
  }

  // ── Soumission ──
  const handleSubmit = async () => {
    if (!clientName.trim()) { toast.error('Le nom du client est obligatoire'); return }
    for (const it of items) {
      if (!it.title.trim()) { toast.error('Chaque élément doit avoir un intitulé'); return }
      if (!it.totalPrice && Number(it.quantity) <= 0) { toast.error('La quantité ou le montant doit être renseigné'); return }
      if (Number(it.unitPrice) < 0) { toast.error('Le prix est invalide'); return }
    }

    setSubmitting(true)
    try {
      const description = items.map(it => it.title.trim()).filter(Boolean).join(', ') || 'Recette'

      const payload = {
        description,
        amount:         total,
        category,
        date:           issueDate,
        payment_method: paymentMethod,
        client_name:    clientName.trim() || null,
        notes:          notes.trim() || null,
      }

      if (isEditing) {
        await api.put(`/revenues/${id}`, payload)
        toast.success('Recette modifiée')
      } else {
        await api.post('/revenues', payload)
        toast.success('Recette créée avec succès')
      }
      navigate('/history?tab=receipts')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Une erreur est survenue'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Styles partagés ──────────────────────────────────────────────────────

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    backgroundColor: BG_WHITE,
    fontSize: '14px',
    color: '#111',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '500',
    color: '#888',
    marginBottom: '4px',
    display: 'block',
  }

  const sectionTitle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111',
    margin: '0 0 16px 0',
  }

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231E88E5' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '32px',
    cursor: 'pointer',
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ padding: '18px 28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: 0 }}>{pageTitle}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserBadge size={48} />
          </div>
        </div>
        {/* Numéro + Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#111', letterSpacing: '-1px' }}>
            {refLoading
              ? <span style={{ fontSize: '20px', color: '#aaa' }}>...</span>
              : `#${refNumber || 'REC-001'}`
            }
          </div>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            style={{ ...inputStyle, width: '180px' }}
          />
        </div>
      </div>

      {/* ── Corps scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px', backgroundColor: BG_PAGE, borderRadius: '16px 16px 0 0', margin: '0 16px' }}>

        {/* ── Informations client ── */}
        <div style={{ marginBottom: '28px', overflow: 'visible' }}>
          <p style={sectionTitle}>Informations client</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ position: 'relative', zIndex: 50 }} ref={suggestionsRef}>
              <FloatInput
                placeholder="Nom du client"
                required
                value={clientName}
                onChange={handleClientNameChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                style={inputStyle}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                  backgroundColor: '#fff', border: '1px solid #e0e0e0',
                  borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  maxHeight: '200px', overflowY: 'auto', marginTop: '4px',
                }}>
                  {suggestions.map((c, idx) => (
                    <div
                      key={c.id ?? idx}
                      onMouseDown={() => handleSelectSuggestion(c)}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = BG_BLUE_LIGHT}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                    >
                      <span style={{ fontWeight: '600' }}>{c.name}</span>
                      {c.phone && <span style={{ color: '#888', marginLeft: '8px', fontSize: '12px' }}>{c.phone}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
              {REVENUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ── Informations sur la recette (éléments) ── */}
        <div style={{ marginBottom: '28px' }}>
          <p style={sectionTitle}>Informations sur la recette</p>

          {items.map((it, idx) => (
            <div key={it.id} style={{ backgroundColor: BG_WHITE, borderRadius: '14px', padding: '16px 20px', marginBottom: '12px', border: '1px solid #e8eaed' }}>
              {/* En-tête item */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>Élément #{idx + 1}</span>
                <button
                  onClick={() => setItems(prev => [...prev, { ...it, id: Date.now() + Math.random() }])}
                  style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '6px', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                >⧉</button>
                <button
                  onClick={() => removeItem(it.id)}
                  disabled={items.length === 1}
                  style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '6px', width: 24, height: 24, cursor: items.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: items.length === 1 ? '#ccc' : '#e53935' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Intitulé */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Intitulé <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Description de l'élément"
                  value={it.title}
                  onChange={(e) => updateItem(it.id, 'title', e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Quantité | Prix | Montant */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Quantité <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="number" min="0" placeholder="0"
                    value={Number(it.quantity) || ''}
                    onChange={(e) => updateItem(it.id, 'quantity', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Prix <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="number" min="0" placeholder="0"
                    value={Number(it.unitPrice) || ''}
                    onChange={(e) => updateItem(it.id, 'unitPrice', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Montant <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="number" min="0" placeholder="0"
                    value={Number(it.totalPrice) || ''}
                    onChange={(e) => updateItem(it.id, 'totalPrice', e.target.value)}
                    style={{ ...inputStyle, fontWeight: '600' }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Bouton Ajouter centré */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <button
              onClick={addItem}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '25px', padding: '12px 28px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
            >
              <Plus size={18} /> Ajouter un élément
            </button>
          </div>
        </div>

        {/* ── Détails ── */}
        <div style={{ marginBottom: '28px' }}>
          <p style={sectionTitle}>Détails</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

            {/* Col 1 : Méthode de paiement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Méthode de paiement <span style={{ color: 'red' }}>*</span></label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={selectStyle}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Col 2 : Récapitulatif */}
            <div style={{ backgroundColor: BG_BLUE_LIGHT, borderRadius: '14px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d0e8ff', fontSize: '14px', color: '#444' }}>
                <span>Sous-total</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '16px', fontWeight: '800', color: '#111' }}>
                <span>Total (XOF)</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            {/* Col 3 : Description */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '8px', display: 'block' }}>
                Ajouter une description
              </label>
              <textarea
                placeholder="Ajouter une note ou une remarque"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                style={{ ...inputStyle, backgroundColor: BG_BLUE_LIGHT, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
              />
            </div>
          </div>
        </div>

        {/* ── Boutons d'action ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px' }}>
          <button
            onClick={handleReset}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: '14px', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ backgroundColor: submitting ? '#90caf9' : PRIMARY, color: '#fff', border: 'none', borderRadius: '25px', padding: '12px 36px', fontSize: '15px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {submitting ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Validation...
              </>
            ) : 'Valider'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 1; }
      `}</style>
    </div>
  )
}

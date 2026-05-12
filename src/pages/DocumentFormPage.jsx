import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import api from '../config/api'
import useAuthStore from '../store/authStore'
import UserBadge from '../components/ui/UserBadge'
import FloatInput from '../components/ui/FloatInput'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES = ['Produits/Services', "Main d'oeuvre", 'Transport', 'Autres']
const UNITS = ['unité', 'g', 'kg', 'T', 'ml', 'L', 'm', 'h']
const PAYMENT_METHODS = ['Espèces', 'Virement', 'Chèque', 'Carte bancaire', 'Mobile Money']
const SECTORS = [
  'Agriculture', 'Commerce', 'Construction', 'Éducation', 'Énergie',
  'Finance', 'Industrie', 'Informatique', 'Santé', 'Services', 'Transport', 'Autre',
]

const PRIMARY = '#1E88E5'
const BG_PAGE = '#f4f6f8'
const BG_BLUE_LIGHT = '#e8f4ff'
const BG_WHITE = '#ffffff'

function newItem() {
  return {
    id: Date.now() + Math.random(),
    description: '',
    category: 'Produits/Services',
    forfait: false,
    unit: 'unité',
    quantity: 1,
    unit_price: 0,
    discount_percent: 0,
    tax_percent: 0,
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DocumentFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { id } = useParams()
  const isEditing = !!id

  // En mode édition, le type vient du document chargé
  const [type, setType] = useState(searchParams.get('type') === 'invoice' ? 'invoice' : 'quote')
  const isInvoice = type === 'invoice'
  const title = isEditing
    ? (isInvoice ? 'Modifier la facture' : 'Modifier le devis')
    : (isInvoice ? 'Créer une nouvelle facture' : 'Créer un nouveau devis')

  // ── Sync type depuis l'URL (Devis → Facture sans remontage du composant) ──
  useEffect(() => {
    if (!isEditing) {
      const urlType = searchParams.get('type') === 'invoice' ? 'invoice' : 'quote'
      setType(urlType)
    }
  }, [searchParams, isEditing])  // ── Référence document ──
  const [refNumber, setRefNumber] = useState('')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))

  // ── Client ──
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientNif, setClientNif] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientSector, setClientSector] = useState('')
  const [selectedClient, setSelectedClient] = useState(null) // { id, name, ... }
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef(null)

  // ── Items ──
  const [items, setItems] = useState([newItem()])

  // ── Détails ──
  const [discountType, setDiscountType] = useState('percentage') // 'percentage' | 'fixed'
  const [discount, setDiscount] = useState(0)
  const [taxPercent, setTaxPercent] = useState(0)
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Espèces')

  // ── UI ──
  const [submitting, setSubmitting] = useState(false)

  // ── Chargement du prochain numéro OU du document existant ──
  useEffect(() => {
    if (isEditing) {
      // Mode édition : charger le document
      api.get(`/documents/${id}`).then(res => {
        const doc = res.data
        setType(doc.type)
        setRefNumber(doc.reference_number || '')
        setIssueDate(doc.issue_date?.slice(0, 10) || new Date().toISOString().slice(0, 10))
        setPaymentMethod(doc.payment_method || 'Espèces')
        setDiscount(doc.discount_percent || 0)
        setDiscountType(doc.discount_type || 'percentage')
        setTaxPercent(doc.tax_percent || 0)
        setNotes(doc.notes || '')
        // Client
        const client = doc.client
        if (client) {
          setSelectedClient(client)
          setClientName(client.name || '')
          setClientPhone(client.phone || '')
          setClientEmail(client.email || '')
          setClientNif(client.registration_number || '')
          setClientAddress(client.address || '')
          setClientSector(client.sector || '')
        }
        // Items
        if (doc.items && doc.items.length > 0) {
          setItems(doc.items.map(it => ({
            id: it.id || Date.now() + Math.random(),
            description: it.description || '',
            category: it.category || 'Produits/Services',
            forfait: false,
            unit: it.unit || 'unité',
            quantity: it.quantity || 1,
            unit_price: it.unit_price || 0,
            discount_percent: it.discount_percent || 0,
            tax_percent: it.tax_percent || 0,
          })))
        }
      }).catch(() => toast.error('Impossible de charger le document'))
    } else {
      // Mode création : réinitialiser le formulaire et charger le prochain numéro
      setRefNumber('')
      setIssueDate(new Date().toISOString().slice(0, 10))
      setClientName(''); setClientPhone(''); setClientEmail('')
      setClientNif(''); setClientAddress(''); setClientSector('')
      setSelectedClient(null)
      setItems([newItem()])
      setDiscount(0); setTaxPercent(0); setNotes('')
      setPaymentMethod('Espèces'); setDiscountType('percentage')
      api.get(`/documents/next-number?type=${type}`)
        .then((res) => setRefNumber(res.data?.number ?? res.data?.next_number ?? ''))
        .catch(() => {})
    }
  }, [id, isEditing, type])

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
  const searchClients = useCallback(async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); return }
    try {
      const res = await api.get(`/contacts/search?q=${encodeURIComponent(q)}`)
      setSuggestions(res.data?.data ?? res.data ?? [])
      setShowSuggestions(true)
    } catch {
      setSuggestions([])
    }
  }, [])

  const handleClientNameChange = (e) => {
    const val = e.target.value
    setClientName(val)
    setSelectedClient(null)
    searchClients(val)
  }

  const handleSelectSuggestion = (c) => {
    setSelectedClient(c)
    setClientName(c.name ?? '')
    setClientPhone(c.phone ?? '')
    setClientEmail(c.email ?? '')
    setClientNif(c.nif ?? c.tax_number ?? '')
    setClientAddress(c.address ?? '')
    setClientSector(c.sector ?? '')
    setShowSuggestions(false)
    setSuggestions([])
  }

  // ── Gestion des items ──
  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, [field]: value } : it))
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const addItem = () => setItems((prev) => [...prev, newItem()])

  // ── Calculs ──
  const itemTotal = (it) => {
    const base = Number(it.quantity) * Number(it.unit_price)
    const disc = base * (Number(it.discount_percent) / 100)
    const taxed = (base - disc) * (1 + Number(it.tax_percent) / 100)
    return taxed
  }

  const subtotal = items.reduce((acc, it) => acc + Number(it.quantity) * Number(it.unit_price), 0)
  const discountAmount = discountType === 'percentage'
    ? subtotal * (Number(discount) / 100)
    : Number(discount)
  const taxAmount = (subtotal - discountAmount) * (Number(taxPercent) / 100)
  const total = subtotal - discountAmount + taxAmount

  const fmt = (n) => Number(n).toLocaleString('fr-FR').replace(/\s/g, '.')

  // ── Réinitialisation ──
  const handleReset = () => {
    setClientName(''); setClientPhone(''); setClientEmail('')
    setClientNif(''); setClientAddress(''); setClientSector('')
    setSelectedClient(null)
    setItems([newItem()])
    setDiscount(0); setTaxPercent(0); setNotes('')
    setPaymentMethod('Espèces')
    setDiscountType('percentage')
  }

  // ── Soumission ──
  const handleSubmit = async () => {
    if (!clientName.trim()) { toast.error('Le nom du client est obligatoire'); return }
    if (!clientPhone.trim()) { toast.error('Le numéro de téléphone est obligatoire'); return }
    for (const it of items) {
      if (!it.description.trim()) { toast.error('Chaque item doit avoir un intitulé'); return }
      if (!it.quantity || Number(it.quantity) <= 0) { toast.error('La quantité doit être > 0'); return }
      if (it.unit_price === '' || Number(it.unit_price) < 0) { toast.error('Le prix unitaire est invalide'); return }
    }

    setSubmitting(true)
    try {
      let clientId = selectedClient?.id ?? null

      if (!clientId) {
        const clientRes = await api.post('/clients', {
          name: clientName.trim(),
          phone: clientPhone.trim(),
          email: clientEmail.trim() || null,
          nif: clientNif.trim() || null,
          address: clientAddress.trim() || null,
          sector: clientSector || null,
        })
        clientId = clientRes.data?.data?.id ?? clientRes.data?.id
      }

      const payload = {
        client_id: clientId,
        type,
        status: 'sent',
        issue_date: issueDate,
        discount_percent: Number(discount),
        discount_type: discountType,
        tax_percent: Number(taxPercent),
        notes: notes.trim() || null,
        ...(isInvoice ? { payment_method: paymentMethod } : {}),
        items: items.map((it) => ({
          description: it.description.trim(),
          category: it.category,
          quantity: Number(it.quantity),
          unit: it.unit,
          unit_price: Number(it.unit_price),
          discount_percent: Number(it.discount_percent),
          discount_type: 'percentage',
          discount_amount: Number(it.quantity) * Number(it.unit_price) * (Number(it.discount_percent) / 100),
          total: itemTotal(it),
        })),
      }

      if (isEditing) {
        await api.put(`/documents/${id}`, payload)
        toast.success(isInvoice ? 'Facture modifiée' : 'Devis modifié')
      } else {
        await api.post('/documents', payload)
        toast.success(isInvoice ? 'Facture créée avec succès' : 'Devis créé avec succès')
      }
      navigate('/history?tab=' + (isInvoice ? 'invoices' : 'quotes'))
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

  const { user } = useAuthStore()
  // isPro géré par UserBadge

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header + Numéro — fond blanc (hérite du main) ── */}
      <div style={{ padding: '18px 28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: 0 }}>{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserBadge size={48} />
          </div>
        </div>
        {/* Numéro + Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#111', letterSpacing: '-1px' }}>
            #{refNumber || (isInvoice ? 'FC-001' : 'DV-001')}
          </div>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
            style={{ ...inputStyle, width: '180px' }} />
        </div>
      </div>

      {/* ── Corps scrollable — fond gris avec marge latérale ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px', backgroundColor: BG_PAGE, borderRadius: '16px 16px 0 0', margin: '0 16px' }}>

        {/* Informations client */}
        <div style={{ marginBottom: '28px' }}>
          <p style={sectionTitle}>Informations client</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ position: 'relative' }} ref={suggestionsRef}>
              <FloatInput
                placeholder="Nom du client"
                required
                value={clientName}
                onChange={handleClientNameChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                style={inputStyle}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                  {suggestions.map((c) => (
                    <div key={c.id} onMouseDown={() => handleSelectSuggestion(c)}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = BG_BLUE_LIGHT}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}>
                      <span style={{ fontWeight: '600' }}>{c.name}</span>
                      {c.phone && <span style={{ color: '#888', marginLeft: '8px', fontSize: '12px' }}>{c.phone}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input type="email" placeholder="Adresse e-mail" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} style={inputStyle} />
            <FloatInput placeholder="Numéro de téléphone" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} style={inputStyle} type="tel" />
            <input type="text" placeholder="NIF (Numéro d'immatriculation)" value={clientNif} onChange={(e) => setClientNif(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Adresse" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} style={inputStyle} />
            <select value={clientSector} onChange={(e) => setClientSector(e.target.value)} style={selectStyle}>
              <option value="">Secteur d'activité</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Produits ou services */}
        <div style={{ marginBottom: '28px' }}>
          <p style={sectionTitle}>Produits ou services</p>

          {items.map((it, idx) => (
            <div key={it.id} style={{ backgroundColor: BG_WHITE, borderRadius: '14px', padding: '16px 20px', marginBottom: '12px', border: '1px solid #e8eaed' }}>
              {/* En-tête item */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>Élément #{idx + 1}</span>
                <button onClick={() => setItems(prev => [...prev, { ...it, id: Date.now() + Math.random() }])}
                  style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '6px', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⧉</button>
                <button onClick={() => removeItem(it.id)} disabled={items.length === 1}
                  style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '6px', width: 24, height: 24, cursor: items.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: items.length === 1 ? '#ccc' : '#e53935' }}>
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Ligne 1 : Intitulé | Catégorie | Forfait */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Intitulé <span style={{ color: 'red' }}>*</span></label>
                  <input type="text" placeholder="Description du produit/service"
                    value={it.description} onChange={(e) => updateItem(it.id, 'description', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Catégorie</label>
                  <select value={it.category} onChange={(e) => updateItem(it.id, 'category', e.target.value)} style={selectStyle}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Forfait</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 0' }}>
                    <input type="radio" name={'forfait-' + it.id} checked={it.forfait}
                      onChange={() => updateItem(it.id, 'forfait', true)}
                      style={{ accentColor: PRIMARY, width: 16, height: 16 }} />
                    <span style={{ fontSize: '13px', color: '#555' }}>Oui</span>
                  </div>
                </div>
              </div>

              {/* Ligne 2 : Unité | Quantité | Prix | Montant */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1.5fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Unité</label>
                  <select value={it.unit} onChange={(e) => updateItem(it.id, 'unit', e.target.value)} style={selectStyle}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Quantité <span style={{ color: 'red' }}>*</span></label>
                  <input type="number" min="0" placeholder="0" value={it.quantity}
                    onChange={(e) => updateItem(it.id, 'quantity', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Prix <span style={{ color: 'red' }}>*</span></label>
                  <input type="number" min="0" placeholder="0" value={it.unit_price}
                    onChange={(e) => updateItem(it.id, 'unit_price', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Montant <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ ...inputStyle, fontWeight: '700', color: '#111', display: 'flex', alignItems: 'center' }}>
                    {fmt(itemTotal(it))}
                  </div>
                </div>
              </div>

              {/* Ligne 3 : Remise | Taxe */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 120px', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Remise (%)</label>
                  <input type="number" min="0" max="100" placeholder="0" value={it.discount_percent}
                    onChange={(e) => updateItem(it.id, 'discount_percent', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Taxe (%)</label>
                  <input type="number" min="0" max="100" placeholder="0" value={it.tax_percent}
                    onChange={(e) => updateItem(it.id, 'tax_percent', e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          ))}

          {/* Bouton Ajouter centré */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '25px', padding: '12px 28px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              <Plus size={18} /> Ajouter un élément
            </button>
          </div>
        </div>

        {/* Détails */}
        <div style={{ marginBottom: '28px' }}>
          <p style={sectionTitle}>Détails</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

            {/* Col 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {[{ value: 'percentage', label: '%' }, { value: 'fixed', label: 'XOF' }].map((opt) => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="radio" name="discountType" value={opt.value}
                      checked={discountType === opt.value} onChange={() => setDiscountType(opt.value)}
                      style={{ accentColor: PRIMARY, width: 16, height: 16 }} />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div>
                <label style={labelStyle}>Remise</label>
                <input type="number" min="0" placeholder="0" value={discount}
                  onChange={(e) => setDiscount(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Taxe</label>
                <input type="number" min="0" max="100" placeholder="0" value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)} style={inputStyle} />
              </div>
              {isInvoice && (
                <div>
                  <label style={labelStyle}>Méthode de paiement</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={selectStyle}>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Col 2 : Récapitulatif */}
            <div style={{ backgroundColor: BG_BLUE_LIGHT, borderRadius: '14px', padding: '16px 20px' }}>
              {[
                { label: 'Sous-total', value: fmt(subtotal) },
                { label: 'Remise', value: fmt(discountAmount) },
                { label: 'Taxe', value: fmt(taxAmount) },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d0e8ff', fontSize: '14px', color: '#444' }}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '16px', fontWeight: '800', color: '#111' }}>
                <span>Total (XOF)</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            {/* Col 3 : Description */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '8px', display: 'block' }}>Ajouter une description</label>
              <textarea placeholder="Ajouter une note ou une remarque" value={notes}
                onChange={(e) => setNotes(e.target.value)} rows={6}
                style={{ ...inputStyle, backgroundColor: BG_BLUE_LIGHT, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }} />
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px' }}>
          <button onClick={handleReset} style={{ background: 'none', border: 'none', color: '#888', fontSize: '14px', textDecoration: 'underline', cursor: 'pointer' }}>
            Réinitialiser
          </button>
          <button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: submitting ? '#90caf9' : PRIMARY, color: '#fff', border: 'none', borderRadius: '25px', padding: '12px 36px', fontSize: '15px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {submitting ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Validation...</> : 'Valider'}
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

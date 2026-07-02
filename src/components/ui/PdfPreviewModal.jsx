import { useState, useEffect, useRef } from 'react'
import { X, Download, Share2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import html2pdf from 'html2pdf.js'
import QRCode from 'qrcode'
import api from '../../config/api'
import { STORAGE_BASE_URL } from '../../config/constants'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '0'
  return Number(n).toLocaleString('fr-FR').replace(/\s/g, '.')
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return d }
}

function statusLabel(s) {
  const m = { paid: 'Payée', partially_paid: 'Part. payée', sent: 'Envoyée', overdue: 'En retard', draft: 'Brouillon' }
  return m[s] || s
}

// ─── Template Minimal ────────────────────────────────────────────────────────

function MinimalTemplate({ doc, profile, qrDataUrl }) {
  const company = {
    name:    profile?.company_name    || profile?.name    || 'Mon Entreprise',
    address: profile?.company_address || '',
    phone:   profile?.professional_phone || profile?.phone || '',
    email:   profile?.professional_email || profile?.email || '',
    nif:     profile?.nif || '',
  }

  const client = doc.client || {}
  const items  = doc.items  || []

  // Calculs
  const subtotalBefore = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0)
  const itemDiscounts  = items.reduce((s, i) => s + ((i.quantity * i.unit_price) - i.total), 0)

  let globalDiscount = 0
  if (doc.discount_percent > 0) {
    globalDiscount = doc.discount_type === 'percentage'
      ? subtotalBefore * (doc.discount_percent / 100)
      : doc.discount_percent
  }

  const totalDiscount = itemDiscounts + globalDiscount
  const subtotalAfter = subtotalBefore - totalDiscount
  const tvaRate       = 18
  const tvaAmount     = doc.has_tva ? subtotalAfter * (tvaRate / 100) : 0
  const total         = doc.total_amount || (subtotalAfter + tvaAmount)

  const logoUrl      = profile?.logo_path ? `${STORAGE_BASE_URL}/${profile.logo_path}` : null
  const signatureUrl = profile?.signature_path && profile.signature_path !== '0'
    ? `${STORAGE_BASE_URL}/${profile.signature_path}` : null

  // Grouper les items par catégorie
  const grouped = {}
  items.forEach(item => {
    const cat = item.category || 'Articles'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })

  const PAGE_W = '794px'  // 210mm à 96dpi — fixe en px pour html2canvas

  return (
    <div style={{
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '10px',
      color: '#000',
      background: '#fff',
      width: PAGE_W,
      minHeight: '1123px',  // 297mm à 96dpi
      padding: '20px 24px 24px',
      boxSizing: 'border-box',
      position: 'relative',
      textRendering: 'geometricPrecision',
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>

        {/* Col 1 : Logo + Ref + Date */}
        <div style={{ flex: 1 }}>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain', marginBottom: 6, display: 'block' }} />
            : <div style={{ width: 28, height: 28, background: '#4CAF50', borderRadius: 4, marginBottom: 6 }} />
          }
          <div style={{ fontSize: 9, color: '#555', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 'bold', color: '#000' }}>{doc.reference_number}</div>
            <div>{fmtDate(doc.issue_date || doc.created_at)}</div>
            {doc.due_date && <div>Éch. {fmtDate(doc.due_date)}</div>}
          </div>
        </div>

        {/* Col 2 : Émetteur */}
        <div style={{ flex: 1, fontSize: 9, lineHeight: 1.6 }}>
          <div style={{ fontWeight: 'bold', color: '#000', marginBottom: 2 }}>{company.name}</div>
          {company.phone   && <div style={{ color: '#444' }}>{company.phone}</div>}
          {company.address && <div style={{ color: '#444' }}>{company.address}</div>}
          {company.nif     && <div style={{ color: '#444' }}>NIF : {company.nif}</div>}
        </div>

        {/* Col 3 : Destinataire */}
        <div style={{ flex: 1, fontSize: 9, lineHeight: 1.6 }}>
          <div style={{ fontWeight: 'bold', color: '#000', marginBottom: 2 }}>{client.name || '—'}</div>
          {client.phone   && <div style={{ color: '#444' }}>{client.phone}</div>}
          {client.email   && <div style={{ color: '#444' }}>{client.email}</div>}
          {client.address && <div style={{ color: '#444' }}>{client.address}</div>}
        </div>
      </div>

      {/* ── TABLEAU PRINCIPAL ── */}
      <div style={{ position: 'relative' }}>

        {/* En-tête noir arrondi */}
        <div style={{
          background: '#000',
          borderRadius: '10px 10px 0 0',
          display: 'flex',
          padding: '7px 10px',
        }}>
          <div style={{ flex: 4, color: '#fff', fontWeight: 'bold', fontSize: 10, paddingLeft: 6 }}>Description</div>
          <div style={{ flex: 1, color: '#fff', fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>QTÉ</div>
          <div style={{ flex: 2, color: '#fff', fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>Prix unitaire</div>
          <div style={{ flex: 2, color: '#fff', fontWeight: 'bold', fontSize: 10, textAlign: 'right', paddingRight: 8 }}>Total (XOF)</div>
        </div>

        {/* Corps + Pied dans un seul conteneur bordé */}
        <div style={{ border: '1.5px solid #000', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'visible' }}>

          {/* Lignes articles */}
          <div>
            {Object.entries(grouped).map(([cat, catItems], gi) => {
              const catTotal = catItems.reduce((s, i) => s + i.total, 0)
              const showCatSubtotal = Object.keys(grouped).length > 1
              return (
                <div key={gi}>
                  {catItems.map((item, ii) => (
                    <div key={ii} style={{
                      display: 'flex', padding: '6px 10px',
                      borderBottom: ii < catItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                      background: '#fff',
                    }}>
                      <div style={{ flex: 4, paddingLeft: 6, fontSize: 10 }}>{item.description}</div>
                      <div style={{ flex: 1, textAlign: 'center', fontSize: 10 }}>{item.quantity}</div>
                      <div style={{ flex: 2, textAlign: 'center', fontSize: 10 }}>{fmt(item.unit_price)}</div>
                      <div style={{ flex: 2, textAlign: 'right', paddingRight: 8, fontSize: 10 }}>{fmt(item.total)}</div>
                    </div>
                  ))}
                  {showCatSubtotal && (
                    <div style={{ display: 'flex', padding: '5px 10px', background: '#f0f0f0' }}>
                      <div style={{ flex: 7, paddingLeft: 6, fontWeight: 'bold', fontSize: 10 }}>Sous-total {cat}</div>
                      <div style={{ flex: 2, textAlign: 'right', paddingRight: 8, fontWeight: 'bold', fontSize: 10 }}>{fmt(catTotal)}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Séparateur invisible — juste un espace */}
          <div style={{ height: 1, background: 'transparent' }} />

          {/* Pied : Paiement + boîte totaux flottante */}
          <div style={{ display: 'flex', position: 'relative', minHeight: 70 }}>
            <div style={{ flex: 1, padding: '10px 12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>Paiement</div>
              <div style={{ fontSize: 9, color: '#444', lineHeight: 1.7 }}>
                <div>Statut : <strong>{statusLabel(doc.status)}</strong></div>
                {doc.due_date && <div>Échéance : <strong>{fmtDate(doc.due_date)}</strong></div>}
              </div>
            </div>
            <div style={{ flex: 1 }} />

            {/* Boîte totaux — fond blanc + ligne Total noire */}
            <div style={{
              position: 'absolute',
              bottom: -30,
              right: 20,
              background: '#fff',
              border: '2px solid #000',
              borderRadius: '10px',
              minWidth: 200,
              zIndex: 10,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: '#000' }}>Sous Total :</span>
                  <span style={{ fontSize: 10, color: '#000' }}>{fmt(subtotalBefore)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: '#000' }}>Remise :</span>
                    <span style={{ fontSize: 10, color: '#000' }}>{fmt(totalDiscount)}</span>
                  </div>
                )}
                {doc.has_tva && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: '#000' }}>TVA ({tvaRate}%) :</span>
                    <span style={{ fontSize: 10, color: '#000' }}>{fmt(tvaAmount)}</span>
                  </div>
                )}
              </div>
              <div style={{ background: '#000', padding: '8px 14px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 'bold' }}>Total :</span>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 'bold' }}>{fmt(total)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── PIED DE PAGE FIXE ── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '0 32px 24px',
      }}>

        {/* ── Ligne signatures ── */}
        <div style={{ display: 'flex', justifyContent: 'space-evenly', marginBottom: 28, paddingTop: 12 }}>

          {/* Signature émetteur */}
          <div style={{ width: 190, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#000', marginBottom: 6 }}>Signature émetteur</div>
            <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              {signatureUrl
                ? <img src={signatureUrl} alt="Signature" style={{ maxHeight: 48, maxWidth: 170, objectFit: 'contain' }} />
                : null
              }
            </div>
          </div>

          {/* Signature destinataire */}
          <div style={{ width: 190, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#000', marginBottom: 6 }}>Signature destinataire</div>
            <div style={{ height: 48, marginBottom: 6 }} />
          </div>

        </div>

        {/* ── Barre branding ── */}
        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}>

          {/* Conçu par + logo Pilot */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#000' }}>Conçu par</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src="/logo_bb.svg" alt="Budget Pilot"
                style={{ width: 26, height: 26, objectFit: 'contain', filter: 'brightness(0) saturate(100%)' }} />
              <span style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>Pilot</span>
            </div>
          </div>

          {/* Séparateur */}
          <div style={{ width: 1, height: 52, background: '#e0e0e0', flexShrink: 0 }} />

          {/* QR + lien */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <div style={{ width: 70, height: 70, flexShrink: 0 }}>
              {qrDataUrl
                ? <img src={qrDataUrl} alt="QR" style={{ width: 70, height: 70, display: 'block' }} />
                : <div style={{ width: 70, height: 70, background: '#f0f0f0', border: '1px solid #ccc' }} />
              }
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <a href="https://www.getbudgetpilot.com" target="_blank" rel="noreferrer"
                style={{ color: '#1E88E5', textDecoration: 'underline', fontSize: 12, cursor: 'pointer' }}>
                www.getbudgetpilot.com
              </a>
              {company.nif && (
                <span style={{ fontSize: 14, color: '#555', fontWeight: '500' }}>NIF : {company.nif}</span>
              )}
            </div>
          </div>

          {/* Numéro de page à droite */}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>Page 1</div>

        </div>
      </div>
    </div>
  )
}

// ─── Modal principale ─────────────────────────────────────────────────────────

export default function PdfPreviewModal({ docId, clientName, onClose }) {
  const [doc, setDoc]         = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing]         = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const templateRef = useRef(null)

  useEffect(() => { loadData() }, [docId])

  // Générer le QR code une seule fois au montage
  useEffect(() => {
    QRCode.toDataURL('https://www.getbudgetpilot.com', {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    }).then(url => {
      setQrDataUrl(url)
    }).catch(() => {
      // fallback silencieux
    })
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [docRes, profileRes] = await Promise.all([
        api.get(`/documents/${docId}`),
        api.get('/profile'),
      ])
      setDoc(docRes.data)
      setProfile(profileRes.data.user || profileRes.data)
    } catch {
      toast.error('Impossible de charger le document')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!templateRef.current) return
    setDownloading(true)
    try {
      const filename = `${doc?.type === 'invoice' ? 'Facture' : 'Devis'}-${doc?.reference_number || docId}.pdf`
      await html2pdf().set({
        margin:      0,
        filename,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 794,
          windowHeight: 1123,
          scrollX: 0,
          scrollY: 0,
          width: 794,
        },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(templateRef.current).save()
      toast.success('PDF téléchargé !')
    } catch {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!templateRef.current) return
    setSharing(true)
    try {
      const filename = `${doc?.type === 'invoice' ? 'Facture' : 'Devis'}-${doc?.reference_number || docId}.pdf`

      // Générer le PDF en blob
      const blob = await html2pdf().set({
        margin:      0,
        filename,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 794,
          windowHeight: 1123,
          scrollX: 0,
          scrollY: 0,
          width: 794,
        },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(templateRef.current).outputPdf('blob')

      const file = new File([blob], filename, { type: 'application/pdf' })

      // Web Share API — supporte le partage de fichiers (Chrome Android, Safari iOS)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title:   filename,
          text:    `${doc?.type === 'invoice' ? 'Facture' : 'Devis'} ${doc?.reference_number}`,
          files:   [file],
        })
        toast.success('Partagé !')
      } else if (navigator.share) {
        // Partage sans fichier (lien ou texte seulement)
        await navigator.share({
          title: filename,
          text:  `${doc?.type === 'invoice' ? 'Facture' : 'Devis'} ${doc?.reference_number} — Budget Pilot`,
        })
      } else {
        // Fallback : ouvrir le PDF dans un nouvel onglet
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 60000)
        toast.success('PDF ouvert dans un nouvel onglet')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast.error('Erreur lors du partage')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: '16px',
        width: '100%', maxWidth: '900px', height: '92vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
      }}>
        {/* Header modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #eee', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>
              Aperçu — {clientName || `Document #${docId}`}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
              Vérifiez avant de télécharger
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleShare} disabled={loading || sharing} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 20px',
              backgroundColor: loading ? '#f5f5f5' : '#fff',
              color: loading ? '#bbb' : '#333',
              border: '1.5px solid #e0e0e0',
              borderRadius: '20px',
              fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              <Share2 size={16} />
              {sharing ? 'Préparation...' : 'Partager'}
            </button>
            <button onClick={handleDownload} disabled={loading || downloading} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 20px',
              backgroundColor: loading ? '#90CAF9' : '#1E88E5',
              color: '#fff', border: 'none', borderRadius: '20px',
              fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              <Download size={16} />
              {downloading ? 'Génération...' : 'Télécharger PDF'}
            </button>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: '#f5f5f5', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <X size={18} color="#555" />
            </button>
          </div>
        </div>

        {/* Corps — aperçu scrollable */}
        <div style={{
          flex: 1, overflowY: 'auto',
          backgroundColor: '#e5e5e5',
          padding: '24px',
          display: 'flex', justifyContent: 'center',
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100%' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTopColor: '#1E88E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 14, color: '#888' }}>Chargement du document...</span>
            </div>
          ) : doc ? (
            <div ref={templateRef} style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', borderRadius: 4 }}>
              <MinimalTemplate doc={doc} profile={profile} qrDataUrl={qrDataUrl || ''} />
            </div>
          ) : null}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

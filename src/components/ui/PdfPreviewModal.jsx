import { useState, useEffect } from 'react'
import { X, Download, Share2, ChevronDown, ChevronUp, Sliders } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { BlobProvider } from '@react-pdf/renderer'
import { Document as PdfDoc, Page as PdfPage, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import QRCode from 'qrcode'
import api from '../../config/api'
import { STORAGE_BASE_URL } from '../../config/constants'
import { generateMinimalPdfBlob, amountToWords } from './MinimalPdfDocument'
import { formatAmount } from '../../store/currencyStore'
import { PDF_TEMPLATES, generatePdfBlob } from './pdfTemplates'
import usePremiumGate from '../../hooks/usePremiumGate'
import { getTextColor, accentToBoxBg, accentToSubtotalBg } from './pdfColorUtils'
import { FONT_CHOICES } from './pdfFonts'

// Templates réservés aux comptes premium (Basic / Pro)
const PREMIUM_TEMPLATES = ['classic', 'modern', 'corporate', 'administrative']

// ─── Defaults de personnalisation par template ────────────────────────────────
const ACCENT_PRESETS = [
  { color: '#16A34A', label: 'Vert' },
  { color: '#E1A100', label: 'Jaune' },
  { color: '#1E88E5', label: 'Bleu appli' },
  { color: '#C0392B', label: 'Rouge' },
  { color: '#7B3FE4', label: 'Violet' },
  { color: '#000000', label: 'Noir' },
]
const CUSTOMIZATION_DEFAULTS = {
  // showQrCode/showBranding ne sont plus personnalisables : dérivées automatiquement
  // du statut premium (voir buildPdfBlob / rendu de l'aperçu).
  minimal:       { accentColor: '#1E88E5', noColor: true, fontChoice: 'helvetica' },
  classic:       { accentColor: '#1E88E5', frameWidth: 1.5, noColor: true, fontChoice: 'helvetica' },
  modern:        { accentColor: '#1E88E5', accentLight: '#f0f0f0', boxRadius: 32, noColor: true, fontChoice: 'helvetica' },
  corporate:     { accentColor: '#1E88E5', noColor: true, fontChoice: 'helvetica' },
  administrative: { accentColor: '#1E88E5', noColor: false, fontChoice: 'helvetica' },
}

function loadCustomization() {
  try {
    const saved = localStorage.getItem('budgetpilot_pdf_customization')
    if (!saved) return { ...CUSTOMIZATION_DEFAULTS }
    const parsed = JSON.parse(saved)
    // Fusionner par template pour ne garder que les clés de personnalisation connues
    const safeKeys = ['accentColor', 'frameWidth', 'accentLight', 'boxRadius', 'noColor', 'fontChoice']
    const result = { ...CUSTOMIZATION_DEFAULTS }
    Object.keys(CUSTOMIZATION_DEFAULTS).forEach(tplId => {
      if (parsed[tplId]) {
        result[tplId] = { ...CUSTOMIZATION_DEFAULTS[tplId] }
        safeKeys.forEach(k => {
          if (parsed[tplId][k] !== undefined) result[tplId][k] = parsed[tplId][k]
        })
      }
    })
    return result
  } catch { return { ...CUSTOMIZATION_DEFAULTS } }
}

function saveCustomization(all) {
  try { localStorage.setItem('budgetpilot_pdf_customization', JSON.stringify(all)) } catch { /* ignore */ }
}

// ─── Config pdfjs worker ──────────────────────────────────────────────────────
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

// ─── Composant viewer PDF ─────────────────────────────────────────────────────
function PdfViewer({ url }) {
  const [numPages, setNumPages] = useState(null)

  return (
    <PdfDoc
      file={url}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      loading={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
          <span style={{ fontSize: 14, color: '#888' }}>Chargement...</span>
        </div>
      }
    >
      {Array.from({ length: numPages || 1 }, (_, i) => (
        <div key={i} style={{
          marginBottom: i < (numPages || 1) - 1 ? 24 : 0,
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
          background: '#fff',
          display: 'block',
        }}>
          <PdfPage
            pageNumber={i + 1}
            width={680}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </div>
      ))}
    </PdfDoc>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '0'
  const num = Number(n)
  const hasDecimals = Math.abs(num) < 1000 && num !== Math.round(num)
  const parts = num.toFixed(hasDecimals ? 2 : 0).split('.')
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return parts[1] && parts[1] !== '00' ? `${intPart},${parts[1]}` : intPart
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

// ─── Template Minimal (aperçu HTML — injecté dans le registre via PreviewComponent) ──

const MINIMAL_ITEMS_PER_PAGE = 20
const MINIMAL_ITEMS_ON_LAST_PAGE = 6

function MinimalTemplate({ doc, profile, qrDataUrl, currency = 'XOF', conversionRate = 1.0, accentColor = '#000000', showQrCode = true, showBranding = true }) {
  const headerTextColor = getTextColor(accentColor)
  const subtotalBgHtml  = accentToSubtotalBg(accentColor)
  const boxBgHtml       = accentToBoxBg(accentColor)

  const company = {
    name:    profile?.company_name    || profile?.name    || 'Mon Entreprise',
    address: profile?.company_address || '',
    phone:   profile?.professional_phone || profile?.phone || '',
    email:   profile?.professional_email || profile?.email || '',
    nif:     profile?.nif || '',
  }

  const client = doc.client || {}
  const items  = doc.items  || []
  const toNum  = v => (isNaN(parseFloat(v)) ? 0 : parseFloat(v))

  const subtotalBefore = items.reduce((s, i) => s + toNum(i.quantity) * toNum(i.unit_price), 0)
  const itemsWithTotal = items.map(i => ({
    ...i,
    _total: (i.total != null && !isNaN(i.total)) ? toNum(i.total) : toNum(i.quantity) * toNum(i.unit_price),
  }))
  const itemDiscounts = itemsWithTotal.reduce((s, i) => s + (toNum(i.quantity) * toNum(i.unit_price) - i._total), 0)

  let globalDiscount = 0
  if (toNum(doc.discount_percent) > 0) {
    globalDiscount = doc.discount_type === 'percentage'
      ? subtotalBefore * (toNum(doc.discount_percent) / 100)
      : toNum(doc.discount_percent)
  }

  const totalDiscount = itemDiscounts + globalDiscount
  const subtotalAfter = subtotalBefore - totalDiscount
  const tvaRate       = 18
  const tvaAmount     = doc.has_tva ? subtotalAfter * (tvaRate / 100) : 0
  const totalRaw      = toNum(doc.total_amount) || (subtotalAfter + tvaAmount)
  const cr            = conversionRate || 1.0
  const subtotalBeforeConverted = subtotalBefore * cr
  const totalDiscountConverted  = totalDiscount * cr
  const tvaAmountConverted      = tvaAmount * cr
  const total = totalRaw * cr

  const normalizeStorageUrl = (p) => {
    if (!p || p === '0') return null
    if (p.startsWith('http://') || p.startsWith('https://')) return p
    const clean = p.startsWith('/') ? p.slice(1) : p
    return `${STORAGE_BASE_URL}/${clean}`
  }
  const logoUrl      = normalizeStorageUrl(profile?.logo_path)
  const signatureUrl = normalizeStorageUrl(profile?.signature_path)

  const grouped = {}
  itemsWithTotal.forEach(item => {
    const cat = item.category || 'Articles'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })
  const showCatSubtotal = Object.keys(grouped).length > 1

  // Aplatir + découper : la dernière page doit réserver la place des totaux,
  // du montant en lettres et des signatures, comme le PDF généré.
  const flatItems = []
  Object.entries(grouped).forEach(([cat, catItems]) => {
    catItems.forEach(item => flatItems.push({ ...item, _cat: cat }))
    flatItems.push({ __subtotal: true, _cat: cat, _catItems: catItems })
  })
  const pageSlices = []
  const lastPageItems = flatItems.length > MINIMAL_ITEMS_PER_PAGE
    ? flatItems.slice(-MINIMAL_ITEMS_ON_LAST_PAGE)
    : []
  const itemsBeforeLastPage = lastPageItems.length > 0
    ? flatItems.slice(0, -MINIMAL_ITEMS_ON_LAST_PAGE)
    : flatItems
  for (let i = 0; i < itemsBeforeLastPage.length; i += MINIMAL_ITEMS_PER_PAGE) {
    pageSlices.push(itemsBeforeLastPage.slice(i, i + MINIMAL_ITEMS_PER_PAGE))
  }
  if (lastPageItems.length > 0) pageSlices.push(lastPageItems)
  if (pageSlices.length === 0) pageSlices.push([])

  const PAGE_W = '794px'

  // ── Composants réutilisables HTML ──
  const Header = () => (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        {logoUrl
          ? <img src={logoUrl} alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 6, display: 'block' }} />
          : <div style={{ width: 44, height: 44, background: accentColor, borderRadius: 4, marginBottom: 6 }} />
        }
        <div style={{ fontSize: 9, color: headerColor, lineHeight: 1.6 }}>
          <div style={{ fontWeight: 'bold', color: headerColor }}>{doc.reference_number}</div>
          <div>Date : {fmtDate(doc.issue_date || doc.created_at)}</div>
          {doc.due_date && <div>Éch. {fmtDate(doc.due_date)}</div>}
        </div>
      </div>
      <div style={{ flex: 1, fontSize: 9, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 'bold', color: '#111', marginBottom: 2 }}>ÉMETTEUR</div>
        <div style={{ color: headerColor, fontWeight: 'bold' }}>{company.name}</div>
        {company.phone   && <div style={{ color: headerColor }}>{company.phone}</div>}
        {company.address && <div style={{ color: headerColor }}>{company.address}</div>}
      </div>
      <div style={{ flex: 1, fontSize: 9, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 'bold', color: '#111', marginBottom: 2 }}>DESTINATAIRE</div>
        <div style={{ color: headerColor, fontWeight: 'bold' }}>{client.name || '—'}</div>
        {client.phone   && <div style={{ color: headerColor }}>{client.phone}</div>}
        {client.email   && <div style={{ color: headerColor }}>{client.email}</div>}
        {client.address && <div style={{ color: headerColor }}>{client.address}</div>}
      </div>
    </div>
  )

  const TableHead = () => (
    <>
      {doc.title && (
        <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#000', marginBottom: '8px', letterSpacing: '0.3px' }}>
          {doc.title.toUpperCase()}
        </div>
      )}
      <div style={{ background: accentColor, borderRadius: '10px 10px 0 0', display: 'flex', padding: '7px 10px' }}>
        <div style={{ flex: 4, color: headerTextColor, fontWeight: 'bold', fontSize: 10, paddingLeft: 6 }}>Description</div>
        <div style={{ flex: 1, color: headerTextColor, fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>QTÉ</div>
        <div style={{ flex: 2, color: headerTextColor, fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>Prix unitaire</div>
        <div style={{ flex: 2, color: headerTextColor, fontWeight: 'bold', fontSize: 10, textAlign: 'right', paddingRight: 8 }}>Total ({currency})</div>
      </div>
    </>
  )

  const Footer = ({ pageNum, totalPages, showSignature }) => (
    <div style={{ padding: '0 32px 24px' }}>
      {showSignature && (
        <div style={{ display: 'flex', justifyContent: 'space-evenly', marginBottom: 28, paddingTop: 12 }}>
          <div style={{ width: 190, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#000', marginBottom: 6 }}>Signature émetteur</div>
            <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              {signatureUrl && <img src={signatureUrl} alt="Signature" style={{ maxHeight: 48, maxWidth: 170, objectFit: 'contain' }} />}
            </div>
          </div>
          <div style={{ width: 190, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#000', marginBottom: 6 }}>Signature destinataire</div>
            <div style={{ height: 48, marginBottom: 6 }} />
          </div>
        </div>
      )}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 24 }}>
        {showBranding && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, color: '#000' }}>Conçu par</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="/logo_bb.svg" alt="Budget Pilot" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                <span style={{ fontWeight: 'bold', fontSize: 20, color: '#000' }}>Pilot</span>
              </div>
            </div>
            <div style={{ width: 1, height: 60, background: '#e0e0e0', flexShrink: 0 }} />
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          {showQrCode && (
            <div style={{ width: 80, height: 80, flexShrink: 0 }}>
              {qrDataUrl
                ? <img src={qrDataUrl} alt="QR" style={{ width: 80, height: 80, display: 'block' }} />
                : <div style={{ width: 80, height: 80, background: '#f0f0f0', border: '1px solid #ccc' }} />
              }
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <a href="https://www.getbudgetpilot.com" target="_blank" rel="noreferrer"
              style={{ color: '#1E88E5', textDecoration: 'underline', fontSize: 14 }}>
              www.getbudgetpilot.com
            </a>
            {company.nif && <span style={{ fontSize: 14, color: '#555', fontWeight: '500' }}>NIF : {company.nif}</span>}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 14, color: '#888' }}>{pageNum} / {totalPages}</div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10px', color: '#000', background: '#e5e5e5' }}>
      {pageSlices.map((slice, pageIdx) => {
        const isLastPage = pageIdx === pageSlices.length - 1
        return (
          <div key={pageIdx} style={{
            background: '#fff', width: PAGE_W,
            padding: '20px 24px',
            boxSizing: 'border-box',
            marginBottom: pageIdx < pageSlices.length - 1 ? 24 : 0,
          }}>
            <Header />

            {/* Tableau */}
            <div>
              <TableHead />
              <div style={{ border: '1.5px solid #000', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
                {slice.map((row, ri) => {
                  if (row.__subtotal) {
                    const catTotal = row._catItems.reduce((s, i) => s + i._total, 0)
                    return showCatSubtotal ? (
                      <div key={`sub-${ri}`} style={{ display: 'flex', padding: '5px 10px', background: subtotalBgHtml, marginTop: 6, marginBottom: 6 }}>
                        <div style={{ flex: 7, paddingLeft: 6, fontWeight: 'bold', fontSize: 10, color: accentColor }}>Sous-total {row._cat}</div>
                        <div style={{ flex: 2, textAlign: 'right', paddingRight: 8, fontWeight: 'bold', fontSize: 10, color: accentColor }}>{formatAmount(catTotal * cr, currency)}</div>
                      </div>
                    ) : null
                  }
                  return (
                    <div key={ri} style={{ display: 'flex', padding: '6px 10px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
                      <div style={{ flex: 4, paddingLeft: 6, fontSize: 10 }}>{row.description}</div>
                      <div style={{ flex: 1, textAlign: 'center', fontSize: 10 }}>{row.quantity}</div>
                      <div style={{ flex: 2, textAlign: 'center', fontSize: 10 }}>{fmt(toNum(row.unit_price) * cr)}</div>
                      <div style={{ flex: 2, textAlign: 'right', paddingRight: 8, fontSize: 10 }}>{fmt(row._total * cr)}</div>
                    </div>
                  )
                })}

                {/* Paiement + Totaux — dernière page seulement */}
                {isLastPage && (
                  <div style={{ display: 'table', width: '100%', borderCollapse: 'collapse', minHeight: 80 }}>
                    <div style={{ display: 'table-row' }}>
                      <div style={{ display: 'table-cell', verticalAlign: 'top', padding: '10px 12px', width: '50%' }}>
                        <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>Paiement</div>
                        <div style={{ fontSize: 9, color: '#444', lineHeight: 1.7 }}>
                          <div>Statut : <strong>{statusLabel(doc.status)}</strong></div>
                          {doc.due_date && <div>Échéance : <strong>{fmtDate(doc.due_date)}</strong></div>}
                        </div>
                      </div>
                      <div style={{ display: 'table-cell', verticalAlign: 'bottom', padding: '0', width: '50%', textAlign: 'right' }}>
                        <div style={{ display: 'inline-block', background: boxBgHtml, border: `2px solid ${accentColor}`, borderRadius: '10px', minWidth: 200, overflow: 'hidden', marginBottom: '-2px', marginRight: 20 }}>
                          <div style={{ padding: '8px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 10 }}>Sous Total :</span>
                              <span style={{ fontSize: 10 }}>{fmt(subtotalBeforeConverted)}</span>
                            </div>
                            {totalDiscount > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 10 }}>Remise :</span>
                                <span style={{ fontSize: 10 }}>{fmt(totalDiscountConverted)}</span>
                              </div>
                            )}
                            {doc.has_tva && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 10 }}>TVA ({tvaRate}%) :</span>
                                <span style={{ fontSize: 10 }}>{fmt(tvaAmountConverted)}</span>
                              </div>
                            )}
                          </div>
                          <div style={{ background: accentColor, padding: '8px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 11, color: headerTextColor, fontWeight: 'bold' }}>Total :</span>
                              <span style={{ fontSize: 11, color: headerTextColor, fontWeight: 'bold' }}>{fmt(total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Montant en lettres — collé sous le tableau à gauche */}
            {isLastPage && (
              <div style={{ padding: '6px 0 0 0' }}>
                <span style={{ fontWeight: 'bold', fontSize: 9, color: '#000' }}>Arrêtée la présente facture à la somme de : </span>
                <span style={{ fontSize: 9, color: '#000', fontStyle: 'italic' }}>{amountToWords(total, currency)}</span>
              </div>
            )}

            {/* Footer */}
            <Footer pageNum={pageIdx + 1} totalPages={pageSlices.length} showSignature={isLastPage || pageSlices.length === 1} />
          </div>
        )
      })}
    </div>
  )
}
// ─── Miniatures de sélection de template ─────────────────────────────────────

// Génère la miniature SVG d'un template en reflétant sa personnalisation réelle
// (couleur accent / sans-couleur) — évite d'avoir à ouvrir le template en grand
// juste pour voir le rendu des couleurs choisies.
function renderTemplateThumb(id, custom = {}) {
  const accentColor = custom.accentColor || '#1E88E5'
  const noColor = !!custom.noColor
  const brand = noColor ? '#111' : accentColor
  const brandTint = noColor ? '#fff' : accentToBoxBg(accentColor)
  const brandText = noColor ? '#111' : getTextColor(accentColor)

  if (id === 'minimal') {
    return (
      <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="80" height="110" fill="#fff" />
        <rect x="4" y="5" width="12" height="12" rx="2" fill="#e0e0e0" />
        <rect x="28" y="5" width="20" height="3" rx="1" fill="#ccc" />
        <rect x="28" y="10" width="14" height="2" rx="1" fill="#e0e0e0" />
        <rect x="55" y="5" width="18" height="3" rx="1" fill="#ccc" />
        <rect x="55" y="10" width="14" height="2" rx="1" fill="#e0e0e0" />
        <rect x="4" y="22" width="72" height="9" rx="4" fill={brand} />
        <rect x="7" y="25" width="30" height="3" rx="1" fill={brandText} opacity="0.8" />
        <rect x="50" y="25" width="10" height="3" rx="1" fill={brandText} opacity="0.6" />
        <rect x="63" y="25" width="10" height="3" rx="1" fill={brandText} opacity="0.6" />
        {[0,1,2,3].map(i => (
          <g key={i}>
            <rect x="4" y={33+i*9} width="72" height="8" fill={i%2===0 ? '#fff' : '#fafafa'} />
            <rect x="7" y={36+i*9} width="28" height="2" rx="1" fill="#ddd" />
            <rect x="52" y={36+i*9} width="8" height="2" rx="1" fill="#ddd" />
            <rect x="64" y={36+i*9} width="9" height="2" rx="1" fill="#ddd" />
            <line x1="4" y1={33+i*9} x2="76" y2={33+i*9} stroke="#f0f0f0" strokeWidth="0.5" />
          </g>
        ))}
        <rect x="4" y="22" width="72" height="70" rx="4" fill="none" stroke={brand} strokeWidth="1.2" />
        <rect x="40" y="75" width="34" height="22" rx="3" fill="#fff" stroke={brand} strokeWidth="1" />
        <rect x="40" y="89" width="34" height="8" rx="3" fill={brand} />
        <rect x="43" y="78" width="16" height="2" rx="1" fill="#ccc" />
        <rect x="43" y="83" width="12" height="2" rx="1" fill="#ccc" />
        <rect x="43" y="91" width="14" height="3" rx="1" fill={brandText} opacity="0.8" />
        <line x1="4" y1="100" x2="76" y2="100" stroke="#e0e0e0" strokeWidth="0.8" />
        <rect x="4" y="103" width="18" height="2" rx="1" fill="#ccc" />
        <rect x="60" y="103" width="14" height="2" rx="1" fill="#e0e0e0" />
      </svg>
    )
  }

  if (id === 'corporate') {
    return (
      <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="80" height="110" fill="#fff" />
        <rect x="4" y="5" width="13" height="13" rx="2" fill="#e0e0e0" />
        <rect x="44" y="5" width="30" height="6" rx="1.5" fill="#222" />
        <rect x="48" y="13" width="22" height="2.5" rx="1" fill="#bbb" />
        <rect x="48" y="17" width="16" height="2" rx="1" fill="#ddd" />
        <line x1="4" y1="22" x2="76" y2="22" stroke="#ccc" strokeWidth="0.8" />
        <rect x="4" y="25" width="22" height="3" rx="1" fill="#555" />
        <rect x="4" y="30" width="16" height="2" rx="1" fill="#ddd" />
        <rect x="4" y="34" width="20" height="2" rx="1" fill="#ddd" />
        <rect x="4" y="37" width="72" height="7" rx="1" fill={brand} />
        <rect x="6" y="39" width="20" height="2.5" rx="1" fill={brandText} opacity="0.85" />
        <rect x="52" y="39" width="8" height="2.5" rx="1" fill={brandText} opacity="0.6" />
        <rect x="64" y="39" width="8" height="2.5" rx="1" fill={brandText} opacity="0.6" />
        {[0,1,2,3].map(i => (
          <g key={i}>
            <rect x="4" y={46+i*8} width="72" height="7" fill="#fff" />
            <rect x="4" y={53+i*8} width="72" height="0.5" fill="#ebebeb" />
            <rect x="6" y={49+i*8} width="24" height="2" rx="1" fill="#ddd" />
            <rect x="52" y={49+i*8} width="8" height="2" rx="1" fill="#ddd" />
            <rect x="64" y={49+i*8} width="9" height="2" rx="1" fill="#ddd" />
          </g>
        ))}
        <rect x="40" y="78" width="34" height="18" rx="2" fill={brandTint} />
        <rect x="42" y="80" width="14" height="2.5" rx="1" fill="#ccc" />
        <rect x="42" y="85" width="12" height="2" rx="1" fill="#ddd" />
        <line x1="40" y1="90" x2="74" y2="90" stroke={brand} strokeWidth="1.5" />
        <rect x="42" y="92" width="18" height="3" rx="1" fill={brand} />
        <line x1="4" y1="102" x2="76" y2="102" stroke="#ddd" strokeWidth="0.8" />
        <rect x="4" y="105" width="18" height="2" rx="1" fill="#ccc" />
        <rect x="58" y="105" width="16" height="2" rx="1" fill="#e0e0e0" />
      </svg>
    )
  }

  if (id === 'classic') {
    return (
      <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="80" height="110" fill="#fff" />
        <rect width="80" height="110" fill="none" stroke={brand} strokeWidth="1.5" />
        <rect x="6" y="7" width="12" height="12" rx="2" fill="#e0e0e0" />
        <rect x="46" y="7" width="28" height="5" rx="1.5" fill="#222" />
        <rect x="50" y="14" width="20" height="2" rx="1" fill="#bbb" />
        <line x1="6" y1="23" x2="74" y2="23" stroke="#ccc" strokeWidth="0.8" />
        <rect x="6" y="26" width="20" height="2.5" rx="1" fill="#888" />
        <line x1="6" y1="30" x2="36" y2="30" stroke="#ccc" strokeWidth="0.5" />
        <rect x="6" y="32" width="18" height="2" rx="1" fill="#ccc" />
        <line x1="40" y1="26" x2="40" y2="46" stroke="#ccc" strokeWidth="0.8" />
        <rect x="44" y="26" width="20" height="2.5" rx="1" fill="#888" />
        <line x1="44" y1="30" x2="74" y2="30" stroke="#ccc" strokeWidth="0.5" />
        <rect x="44" y="32" width="18" height="2" rx="1" fill="#ccc" />
        <line x1="6" y1="50" x2="74" y2="50" stroke={brand} strokeWidth="1.5" />
        <rect x="6" y="46" width="26" height="3.5" rx="1" fill="#bbb" />
        <rect x="50" y="46" width="10" height="3.5" rx="1" fill="#bbb" />
        {[0,1,2].map(i => (
          <g key={i}>
            <rect x="6" y={52+i*8} width="68" height="7" fill="#fff" />
            <line x1="6" y1={59+i*8} x2="74" y2={59+i*8} stroke="#e0e0e0" strokeWidth="0.5" />
            <rect x="8" y={55+i*8} width="24" height="2" rx="1" fill="#ddd" />
            <rect x="52" y={55+i*8} width="8" height="2" rx="1" fill="#ddd" />
          </g>
        ))}
        <line x1="6" y1="76" x2="74" y2="76" stroke={brand} strokeWidth="1.5" />
        <rect x="6" y="77" width="68" height="7" fill={brandTint} />
        <rect x="8" y="79.5" width="20" height="2" rx="1" fill="#444" />
        <line x1="6" y1="84" x2="74" y2="84" stroke={brand} strokeWidth="1.5" />
        <rect x="40" y="87" width="34" height="14" rx="1" fill="#fafafa" />
        <rect x="42" y="89" width="16" height="2" rx="1" fill="#ccc" />
        <line x1="40" y1="95" x2="74" y2="95" stroke={brand} strokeWidth="1.5" />
        <rect x="42" y="97" width="18" height="3" rx="1" fill={brand} />
        <rect x="10" y="104" width="20" height="2" rx="1" fill="#888" />
        <rect x="50" y="104" width="20" height="2" rx="1" fill="#888" />
      </svg>
    )
  }

  // modern
  return (
    <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="80" height="110" fill="#fff" />
      <rect x="4" y="5" width="42" height="7" rx="1.5" fill="#111" />
      <rect x="58" y="5" width="16" height="2" rx="1" fill="#ccc" />
      <rect x="58" y="9" width="14" height="2" rx="1" fill="#e0e0e0" />
      <rect x="4" y="16" width="26" height="20" rx="2" fill="#e0e0e0" />
      <rect x="4" y="39" width="16" height="20" rx="3" fill={brand} />
      <rect x="7" y="42" width="10" height="4" rx="1" fill={brandText} opacity="0.85" />
      <rect x="7" y="48" width="7" height="2" rx="1" fill={brandText} opacity="0.6" />
      <rect x="7" y="52" width="9" height="2" rx="1" fill={brandText} opacity="0.6" />
      <rect x="24" y="39" width="52" height="20" rx="3" fill={brandTint} stroke="#ccc" strokeWidth="0.6" />
      <rect x="27" y="42" width="10" height="2" rx="1" fill="#bbb" />
      <rect x="27" y="46" width="24" height="3" rx="1" fill="#444" />
      <rect x="27" y="51" width="18" height="2" rx="1" fill="#ddd" />
      <line x1="4" y1="63" x2="76" y2="63" stroke="#111" strokeWidth="1.5" />
      <rect x="4" y="59" width="24" height="3.5" rx="1" fill="#bbb" />
      <rect x="50" y="59" width="10" height="3.5" rx="1" fill="#bbb" />
      {[0,1].map(i => (
        <g key={i}>
          <rect x="4" y={65+i*7} width="72" height="6" fill="#fff" />
          <line x1="4" y1={71+i*7} x2="76" y2={71+i*7} stroke="#ebebeb" strokeWidth="0.5" />
        </g>
      ))}
      <rect x="4" y="80" width="72" height="7" fill="#f0f0f0" />
      <rect x="6" y="82.5" width="18" height="2" rx="1" fill="#555" />
      <rect x="40" y="90" width="34" height="15" rx="1" fill="#fafafa" />
      <rect x="42" y="92" width="16" height="2" rx="1" fill="#ccc" />
      <line x1="40" y1="100" x2="74" y2="100" stroke={brand} strokeWidth="1.5" />
      <rect x="42" y="102" width="18" height="3" rx="1" fill={brand} />
      <line x1="4" y1="107" x2="76" y2="107" stroke="#ddd" strokeWidth="0.8" />
    </svg>
  )
}

// ─── Modal principale ─────────────────────────────────────────────────────────

export default function PdfPreviewModal({ docId, clientName, onClose }) {
  const [doc, setDoc]         = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing]         = useState(false)
  const [qrDataUrl, setQrDataUrl]     = useState(null)
  const [logoDataUrl, setLogoDataUrl] = useState(null)
  const [sigDataUrl, setSigDataUrl]   = useState(null)
  const [logoBbDataUrl, setLogoBbDataUrl] = useState(null)

  // ── Sélection du template ──
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    return localStorage.getItem('budgetpilot_default_template') || 'minimal'
  })
  const [defaultTemplate, setDefaultTemplate] = useState(() => {
    return localStorage.getItem('budgetpilot_default_template') || 'minimal'
  })

  // ── Personnalisation des templates ──
  const [templateCustomization, setTemplateCustomization] = useState(() => loadCustomization())
  // Ouvert par défaut : la personnalisation était trop peu découvrable une fois repliée
  const [customPanelOpen, setCustomPanelOpen] = useState(true)

  const { isPremium, requirePremium, modal: premiumModal } = usePremiumGate()

  // Inject le MinimalTemplate dans le registre (évite l'import circulaire)
  const TEMPLATES_WITH_PREVIEW = PDF_TEMPLATES.map(t =>
    t.id === 'minimal' ? { ...t, PreviewComponent: MinimalTemplate } : t
  )

  useEffect(() => { loadData() }, [docId])

  useEffect(() => {
    QRCode.toDataURL('https://www.getbudgetpilot.com', {
      width: 280, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {})
  }, [])

  useEffect(() => {
    const svgToPng = async () => {
      try {
        const res  = await fetch('/logo_bb.svg')
        const svgText = await res.text()
        const blob = new Blob([svgText], { type: 'image/svg+xml' })
        const url  = URL.createObjectURL(blob)
        const img  = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width  = 80
          canvas.height = 104
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, 80, 104)
          setLogoBbDataUrl(canvas.toDataURL('image/png'))
          URL.revokeObjectURL(url)
        }
        img.src = url
      } catch { /* fallback silencieux */ }
    }
    svgToPng()
  }, [])

  const toDataUrl = async (storagePath) => {
    if (!storagePath) return null

    // Normalise le chemin en path relatif (ex: logos/xxx.jpg)
    const relativePath = storagePath
      .replace(/^https?:\/\/[^/]+\/storage\//, '')
      .replace(/^storage\//, '')
      .replace(/^\/+/, '')

    // Détecte et supprime un BOM UTF-8 éventuel, valide les magic bytes JPEG/PNG
    const processBlob = async (rawBlob) => {
      if (!rawBlob || rawBlob.size === 0) return null
      let blob = rawBlob

      // 1. Supprimer le BOM UTF-8 (0xEF 0xBB 0xBF) si présent
      try {
        const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
        if (header[0] === 0xef && header[1] === 0xbb && header[2] === 0xbf) {
          blob = blob.slice(3, blob.size, blob.type)
        }
      } catch {}

      // 2. Vérifier les signatures magiques JPEG / PNG
      try {
        const h = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
        const isJpeg = h[0] === 0xff && h[1] === 0xd8
        const isPng  = h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47
        if (isJpeg || isPng) {
          return await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        }
      } catch {}

      // 3. Fallback canvas pour WebP, SVG ou tout autre format
      return await new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(blob)
        const img = new window.Image()
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width  = img.naturalWidth  || img.width  || 100
            canvas.height = img.naturalHeight || img.height || 100
            canvas.getContext('2d').drawImage(img, 0, 0)
            const dataUrl = canvas.toDataURL('image/png')
            URL.revokeObjectURL(objectUrl)
            resolve(dataUrl)
          } catch {
            URL.revokeObjectURL(objectUrl)
            resolve(null)
          }
        }
        img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null) }
        img.src = objectUrl
      })
    }

    // Tentative 1 : via le proxy API authentifié (axios, CORS garanti)
    try {
      const response = await api.get(`/storage-proxy/${relativePath}`, { responseType: 'blob' })
      const ct = response.headers?.['content-type'] || ''
      if (ct.includes('text/html') || ct.includes('application/json')) throw new Error('bad content-type')
      const dataUrl = await processBlob(response.data)
      if (dataUrl) return dataUrl
    } catch {}

    // Tentative 2 : fetch direct (sans auth, pour images publiques)
    try {
      const fullUrl = `${STORAGE_BASE_URL}/${relativePath}`
      const res = await fetch(fullUrl, { mode: 'cors', credentials: 'omit' })
      const ct  = res.headers.get('content-type') || ''
      if (!res.ok || ct.includes('text/html') || ct.includes('application/json')) throw new Error('bad response')
      return await processBlob(await res.blob())
    } catch {
      return null
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [docRes, profileRes] = await Promise.all([
        api.get(`/documents/${docId}`),
        api.get('/profile'),
      ])
      setDoc(docRes.data)
      const prof = profileRes.data.user || profileRes.data
      setProfile(prof)
      const [logo, sig] = await Promise.all([
        toDataUrl(prof?.logo_path),
        toDataUrl(prof?.signature_path && prof.signature_path !== '0' ? prof.signature_path : null),
      ])
      setLogoDataUrl(logo)
      setSigDataUrl(sig)
    } catch {
      toast.error('Impossible de charger le document')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const buildPdfBlob = () => {
    const custom = { ...(templateCustomization[selectedTemplate] || {}) }
    // QR code + branding "Conçu par" : offerts en gratuit (attribution/upsell),
    // retirés automatiquement pour les comptes premium — plus un choix manuel.
    if (selectedTemplate === 'minimal') {
      custom.showQrCode = !isPremium
      custom.showBranding = !isPremium
    }
    return generatePdfBlob(selectedTemplate, doc, profile, qrDataUrl, logoDataUrl, sigDataUrl, logoBbDataUrl, doc?.currency || 'XOF', 1.0, custom)
  }

  const buildFilename = () => {
    const ref = doc?.reference_number || docId
    if (doc?.title) {
      const rawTitle = doc.title
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      const title = rawTitle.length > 30 ? rawTitle.substring(0, 30) + '...' : rawTitle
      return `${title}_${ref}.pdf`
    }
    return `${ref}.pdf`
  }

  const handleDownload = async () => {
    if (PREMIUM_TEMPLATES.includes(selectedTemplate) && !isPremium) {
      requirePremium('Templates PDF Premium', true)
      return
    }
    setDownloading(true)
    try {
      const blob     = await buildPdfBlob()
      const filename = buildFilename()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      toast.success('PDF téléchargé !')
    } catch {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const blob     = await buildPdfBlob()
      const filename = buildFilename()
      const file     = new File([blob], filename, { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: filename,
          text:  `${doc?.type === 'invoice' ? 'Facture' : 'Devis'} ${doc?.reference_number}`,
          files: [file],
        })
        toast.success('Partagé !')
      } else if (navigator.share) {
        await navigator.share({
          title: filename,
          text:  `${doc?.type === 'invoice' ? 'Facture' : 'Devis'} ${doc?.reference_number} — Budget Pilot`,
        })
      } else {
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 60000)
        toast.success('PDF ouvert dans un nouvel onglet')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Erreur lors du partage')
    } finally {
      setSharing(false)
    }
  }

  // ── Mise à jour de la personnalisation ──
  const updateCustomization = (key, value) => {
    setTemplateCustomization(prev => {
      const next = {
        ...prev,
        [selectedTemplate]: { ...(prev[selectedTemplate] || {}), [key]: value },
      }
      saveCustomization(next)
      return next
    })
  }

  // Change plusieurs clés en une seule fois (ex : choisir une couleur ET sortir du mode "sans couleur")
  const updateCustomizationMulti = (patch) => {
    setTemplateCustomization(prev => {
      const next = {
        ...prev,
        [selectedTemplate]: { ...(prev[selectedTemplate] || {}), ...patch },
      }
      saveCustomization(next)
      return next
    })
  }

  // Sélectionner une couleur accent désactive automatiquement le mode "sans couleur"
  const pickAccentColor = (color) => updateCustomizationMulti({ accentColor: color, noColor: false })

  // Raccourci pour lire la customisation du template actif
  const activeCustom = templateCustomization[selectedTemplate] || CUSTOMIZATION_DEFAULTS[selectedTemplate] || {}


  // Réinitialise toute la personnalisation du template actif à ses valeurs par défaut
  const resetCustomization = () => {
    setTemplateCustomization(prev => {
      const next = { ...prev, [selectedTemplate]: { ...CUSTOMIZATION_DEFAULTS[selectedTemplate] } }
      saveCustomization(next)
      return next
    })
    toast.success('Personnalisation réinitialisée')
  }

  // ── Sélection du template ──
  const [sheetOpen, setSheetOpen] = useState(false)

  const saveAsDefault = (templateId) => {
    localStorage.setItem('budgetpilot_default_template', templateId)
    setDefaultTemplate(templateId)
    toast.success(`Template "${TEMPLATES_WITH_PREVIEW.find(t => t.id === templateId)?.label}" défini par défaut`)
  }

  // Aperçu : vrai PDF via BlobProvider → iframe
  const activePdfDoc = TEMPLATES_WITH_PREVIEW.find(t => t.id === selectedTemplate)
  const activeTemplate = activePdfDoc
  const PdfDocComp = activePdfDoc?.PdfDocumentComponent

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '4px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: '12px',
        width: '100%', maxWidth: '1100px',
        height: '99vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>

        {/* ── Header modal ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #eee', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>
              Aperçu — {clientName || `Document #${docId}`}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
              Template actif : <strong style={{ color: '#1E88E5' }}>{activeTemplate?.label}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleShare} disabled={loading || sharing} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 20px',
              backgroundColor: loading ? '#f5f5f5' : '#fff',
              color: loading ? '#bbb' : '#333',
              border: '1.5px solid #e0e0e0',
              borderRadius: '20px', fontSize: '14px', fontWeight: '600',
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

        {/* ── Corps — aperçu scrollable pleine hauteur ── */}
        <div style={{
          flex: 1, overflowY: 'auto',
          backgroundColor: '#e5e5e5',
          padding: '24px',
          paddingBottom: '80px',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100%' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTopColor: '#1E88E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 14, color: '#888' }}>Chargement du document...</span>
            </div>
          ) : doc && PdfDocComp ? (
            <BlobProvider document={
              <PdfDocComp
                {...(activeCustom)}
                {...(selectedTemplate === 'minimal' ? { showQrCode: !isPremium, showBranding: !isPremium } : {})}
                doc={doc}
                profile={profile}
                qrDataUrl={qrDataUrl}
                logoDataUrl={logoDataUrl}
                signatureDataUrl={sigDataUrl}
                logoBbDataUrl={logoBbDataUrl}
                currency={doc?.currency || 'XOF'}
                conversionRate={1.0}
              />
            }>
              {({ url, loading: pdfLoading, error }) => {
                if (pdfLoading) return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100%', minHeight: 400 }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTopColor: '#1E88E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 14, color: '#888' }}>Génération de l'aperçu...</span>
                  </div>
                )
                if (error) return (
                  <div style={{ padding: 24, color: '#e53e3e', fontSize: 14 }}>
                    Erreur lors de la génération de l'aperçu.
                  </div>
                )
                return (
                  <div style={{
                    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                    flexShrink: 0,
                    background: '#fff',
                    position: 'relative',
                  }}>
                    <PdfViewer url={url} />
                    {/* Overlay Premium pour compte gratuit */}
                    {PREMIUM_TEMPLATES.includes(selectedTemplate) && !isPremium && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 12, borderRadius: 4,
                        backdropFilter: 'blur(2px)',
                      }}>
                        <div style={{ fontSize: 36 }}>👑</div>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Template Premium</div>
                        <div style={{ color: '#ddd', fontSize: 13, textAlign: 'center', maxWidth: 220 }}>
                          Passez à un plan payant pour télécharger ce template
                        </div>
                        <button
                          onClick={() => requirePremium('Templates PDF Premium', true)}
                          style={{
                            marginTop: 8, padding: '10px 24px',
                            backgroundColor: '#F59E0B', color: '#fff',
                            border: 'none', borderRadius: 24,
                            fontSize: 13, fontWeight: '700', cursor: 'pointer',
                          }}
                        >Voir les offres</button>
                      </div>
                    )}
                  </div>
                )
              }}
            </BlobProvider>
          ) : null}
        </div>

        {/* ── Bouton flottant "Changer de template" ── */}
        {!loading && (
          <button
            onClick={() => setSheetOpen(v => !v)}
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 22px',
              backgroundColor: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              fontSize: '14px', fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 16 }}>◧</span>
            Template : {activeTemplate?.label}
            {/* Pastille de couleur — signale que la personnalisation est disponible */}
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              backgroundColor: activeCustom.noColor ? '#fff' : (activeCustom.accentColor || '#1E88E5'),
              border: '1.5px solid rgba(255,255,255,0.6)',
              flexShrink: 0,
            }} />
            <span style={{
              display: 'inline-block',
              transform: sheetOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}>▾</span>
          </button>
        )}

        {/* ── Bottom Sheet ── */}
        {sheetOpen && (
          <div
            onClick={() => setSheetOpen(false)}
            style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 9,
              borderRadius: '16px',
            }}
          />
        )}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          backgroundColor: '#fff',
          borderRadius: '20px 20px 16px 16px',
          padding: '20px 24px 28px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          zIndex: 11,
          transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '75vh',
          overflowY: 'auto',
        }}>
          {/* Poignée */}
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            backgroundColor: '#ddd', margin: '0 auto 18px',
          }} />

          <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#111' }}>
            Choisir un template
          </h4>

          {/* Grille 2×2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}>
            {TEMPLATES_WITH_PREVIEW.map(tpl => {
              const isActive = selectedTemplate === tpl.id
              const isPremiumTpl = PREMIUM_TEMPLATES.includes(tpl.id)
              return (
                <button
                  key={tpl.id}
                  onClick={() => { setSelectedTemplate(tpl.id); setSheetOpen(false) }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '10px', padding: '14px 10px',
                    border: isActive ? '2px solid #1E88E5' : '2px solid #e8e8e8',
                    borderRadius: '14px',
                    backgroundColor: isActive ? '#E3F2FD' : '#fafafa',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  {/* Badge actif */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 20, height: 20, borderRadius: '50%',
                      backgroundColor: '#1E88E5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: '#fff', fontWeight: 'bold',
                    }}>✓</div>
                  )}
                  {/* Badge Premium */}
                  {isPremiumTpl && !isPremium && (
                    <div style={{
                      position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: '#F59E0B', color: '#fff',
                      fontSize: 9, fontWeight: '700', letterSpacing: 0.5,
                      padding: '2px 8px', borderRadius: 20,
                      whiteSpace: 'nowrap',
                    }}>✦ PREMIUM</div>
                  )}
                  {/* Étoile défaut */}
                  <div
                    onClick={e => { e.stopPropagation(); saveAsDefault(tpl.id) }}
                    title={defaultTemplate === tpl.id ? 'Template par défaut' : 'Définir par défaut'}
                    style={{
                      position: 'absolute', top: 8, left: 8,
                      fontSize: 16, cursor: 'pointer', lineHeight: 1,
                      color: defaultTemplate === tpl.id ? '#F59E0B' : '#ccc',
                      transition: 'color 0.15s',
                    }}
                  >
                    {defaultTemplate === tpl.id ? '★' : '☆'}
                  </div>
                  {/* Miniature SVG — reflète la couleur choisie pour ce template */}
                  <div style={{
                    width: 72, height: 96,
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: isActive
                      ? '0 4px 16px rgba(30,136,229,0.3)'
                      : '0 2px 8px rgba(0,0,0,0.12)',
                  }}>
                    {renderTemplateThumb(tpl.id, templateCustomization[tpl.id] || CUSTOMIZATION_DEFAULTS[tpl.id])}
                  </div>
                  {/* Label + description */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '13px', fontWeight: isActive ? '700' : '600',
                      color: isActive ? '#1E88E5' : '#222',
                    }}>
                      {tpl.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: 3 }}>
                      {tpl.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* ── Panneau personnalisation ── */}
          <div style={{ marginTop: 18, borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCustomPanelOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: '600', color: '#333', padding: 0,
                }}
              >
                <Sliders size={15} />
                Personnaliser le template
                {customPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {customPanelOpen && (
                <button
                  onClick={resetCustomization}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: '600', color: '#888', padding: 0,
                  }}
                >
                  ↺ Réinitialiser
                </button>
              )}
            </div>

            {customPanelOpen && (
              <div style={{
                marginTop: 14,
                display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
                gap: '16px 40px',
              }}>

                {/* ── Couleur — pilote fonds et labels sur tout le template ── */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: '600', color: '#444', display: 'block', marginBottom: 8 }}>
                    Couleur
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Sans couleur — restaure le design d'origine noir/blanc, sans fond coloré */}
                    <button
                      onClick={() => updateCustomization('noColor', true)}
                      title="Sans couleur (design d'origine)"
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer', flexShrink: 0,
                        position: 'relative', overflow: 'hidden',
                        boxShadow: activeCustom.noColor ? '0 0 0 3px #fff, 0 0 0 5px #111' : '0 1px 4px rgba(0,0,0,0.2)',
                        transform: activeCustom.noColor ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', left: '50%', top: '50%',
                        width: '135%', height: 1.5, backgroundColor: '#e53e3e',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                      }} />
                    </button>
                    {ACCENT_PRESETS.map(p => {
                      const isActive = !activeCustom.noColor && (activeCustom.accentColor || '#1E88E5') === p.color
                      return (
                        <button key={p.color} onClick={() => pickAccentColor(p.color)}
                          title={p.label}
                          style={{
                            width: 32, height: 32, borderRadius: '50%', border: 'none',
                            backgroundColor: p.color, cursor: 'pointer', flexShrink: 0,
                            boxShadow: isActive ? `0 0 0 3px #fff, 0 0 0 5px ${p.color}` : '0 1px 4px rgba(0,0,0,0.2)',
                            transform: isActive ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.15s',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* ── Police — s'applique à tout le contenu du PDF ── */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: '600', color: '#444', display: 'block', marginBottom: 8 }}>
                    Police
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
                    {FONT_CHOICES.map(f => {
                      const isActive = (activeCustom.fontChoice || 'helvetica') === f.id
                      return (
                        <button key={f.id} onClick={() => updateCustomization('fontChoice', f.id)}
                          style={{
                            padding: '5px 14px', fontSize: 12, fontWeight: '600',
                            background: isActive ? '#E3F2FD' : '#fff',
                            border: `1.5px solid ${isActive ? '#1E88E5' : '#ddd'}`,
                            borderRadius: 20, cursor: 'pointer',
                            color: isActive ? '#1E88E5' : '#555',
                          }}
                        >
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── Options Classic ── */}
                {selectedTemplate === 'classic' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: '600', color: '#444', display: 'block', marginBottom: 8 }}>
                      Épaisseur du cadre
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 1.5, 2].map(w => (
                        <button key={w} onClick={() => updateCustomization('frameWidth', w)}
                          style={{
                            flex: 1, padding: '6px 0', fontSize: 12, fontWeight: '600',
                            border: `${w}px solid ${(activeCustom.frameWidth ?? 1.5) === w ? '#1E88E5' : '#ddd'}`,
                            borderRadius: 8, cursor: 'pointer',
                            background: (activeCustom.frameWidth ?? 1.5) === w ? '#E3F2FD' : '#fff',
                            color: (activeCustom.frameWidth ?? 1.5) === w ? '#1E88E5' : '#555',
                          }}
                        >{w}px</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Options Modern ── */}
                {selectedTemplate === 'modern' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: '600', color: '#444', display: 'block', marginBottom: 8 }}>
                      Arrondi des boxes info
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[{ label: 'Carré', value: 0 }, { label: 'Doux', value: 16 }, { label: 'Rond', value: 32 }].map(opt => (
                        <button key={opt.value} onClick={() => updateCustomization('boxRadius', opt.value)}
                          style={{
                            flex: 1, padding: '6px 0', fontSize: 11, fontWeight: '600',
                            border: `1.5px solid ${(activeCustom.boxRadius ?? 32) === opt.value ? '#1E88E5' : '#ddd'}`,
                            borderRadius: opt.value === 0 ? 4 : opt.value === 16 ? 8 : 16,
                            cursor: 'pointer',
                            background: (activeCustom.boxRadius ?? 32) === opt.value ? '#E3F2FD' : '#fff',
                            color: (activeCustom.boxRadius ?? 32) === opt.value ? '#1E88E5' : '#555',
                          }}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {premiumModal}
    </div>
  )
}

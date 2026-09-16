import { useState, useEffect } from 'react'
import { X, Download, Share2 } from 'lucide-react'
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

function MinimalTemplate({ doc, profile, qrDataUrl, currency = 'XOF', conversionRate = 1.0 }) {
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

  // Aplatir + découper en pages de MINIMAL_ITEMS_PER_PAGE
  const flatItems = []
  Object.entries(grouped).forEach(([cat, catItems]) => {
    catItems.forEach(item => flatItems.push({ ...item, _cat: cat }))
    flatItems.push({ __subtotal: true, _cat: cat, _catItems: catItems })
  })
  const pageSlices = []
  for (let i = 0; i < flatItems.length; i += MINIMAL_ITEMS_PER_PAGE) {
    pageSlices.push(flatItems.slice(i, i + MINIMAL_ITEMS_PER_PAGE))
  }
  if (pageSlices.length === 0) pageSlices.push([])

  const PAGE_W = '794px'

  // ── Composants réutilisables HTML ──
  const Header = () => (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        {logoUrl
          ? <img src={logoUrl} alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 6, display: 'block' }} />
          : <div style={{ width: 44, height: 44, background: '#4CAF50', borderRadius: 4, marginBottom: 6 }} />
        }
        <div style={{ fontSize: 9, color: '#555', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 'bold', color: '#000' }}>{doc.reference_number}</div>
          <div>Date : {fmtDate(doc.issue_date || doc.created_at)}</div>
          {doc.due_date && <div>Éch. {fmtDate(doc.due_date)}</div>}
        </div>
      </div>
      <div style={{ flex: 1, fontSize: 9, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 'bold', color: '#000', marginBottom: 2 }}>ÉMETTEUR</div>
        <div style={{ color: '#444' }}>{company.name}</div>
        {company.phone   && <div style={{ color: '#444' }}>{company.phone}</div>}
        {company.address && <div style={{ color: '#444' }}>{company.address}</div>}
      </div>
      <div style={{ flex: 1, fontSize: 9, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 'bold', color: '#000', marginBottom: 2 }}>DESTINATAIRE</div>
        <div style={{ color: '#444' }}>{client.name || '—'}</div>
        {client.phone   && <div style={{ color: '#444' }}>{client.phone}</div>}
        {client.email   && <div style={{ color: '#444' }}>{client.email}</div>}
        {client.address && <div style={{ color: '#444' }}>{client.address}</div>}
      </div>
    </div>
  )

  const TableHead = () => (
    <>
      {doc.title && (
        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#000', marginBottom: '8px', letterSpacing: '0.3px' }}>
          {doc.title.toUpperCase()}
        </div>
      )}
      <div style={{ background: '#000', borderRadius: '10px 10px 0 0', display: 'flex', padding: '7px 10px' }}>
        <div style={{ flex: 4, color: '#fff', fontWeight: 'bold', fontSize: 10, paddingLeft: 6 }}>Description</div>
        <div style={{ flex: 1, color: '#fff', fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>QTÉ</div>
        <div style={{ flex: 2, color: '#fff', fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>Prix unitaire</div>
        <div style={{ flex: 2, color: '#fff', fontWeight: 'bold', fontSize: 10, textAlign: 'right', paddingRight: 8 }}>Total ({currency})</div>
      </div>
    </>
  )

  const Footer = ({ pageNum, totalPages }) => (
    <div style={{ padding: '0 32px 24px' }}>
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
      <div style={{ borderTop: '1px solid #ddd', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 14, color: '#000' }}>Conçu par</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/logo_bb.svg" alt="Budget Pilot" style={{ width: 32, height: 32, objectFit: 'contain', filter: 'brightness(0) saturate(100%)' }} />
            <span style={{ fontWeight: 'bold', fontSize: 20, color: '#000' }}>Pilot</span>
          </div>
        </div>
        <div style={{ width: 1, height: 60, background: '#e0e0e0', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ width: 80, height: 80, flexShrink: 0 }}>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR" style={{ width: 80, height: 80, display: 'block' }} />
              : <div style={{ width: 80, height: 80, background: '#f0f0f0', border: '1px solid #ccc' }} />
            }
          </div>
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
                      <div key={`sub-${ri}`} style={{ display: 'flex', padding: '5px 10px', background: '#f0f0f0' }}>
                        <div style={{ flex: 7, paddingLeft: 6, fontWeight: 'bold', fontSize: 10 }}>Sous-total {row._cat}</div>
                        <div style={{ flex: 2, textAlign: 'right', paddingRight: 8, fontWeight: 'bold', fontSize: 10 }}>{formatAmount(catTotal * cr, currency)}</div>
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
                        <div style={{ display: 'inline-block', background: '#fff', border: '2px solid #000', borderRadius: '10px', minWidth: 200, overflow: 'hidden', marginBottom: '-2px', marginRight: 20 }}>
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
                          <div style={{ background: '#000', padding: '8px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 11, color: '#fff', fontWeight: 'bold' }}>Total :</span>
                              <span style={{ fontSize: 11, color: '#fff', fontWeight: 'bold' }}>{fmt(total)}</span>
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
                <span style={{ fontWeight: 'bold', fontSize: 9, color: '#000' }}>Total : </span>
                <span style={{ fontSize: 9, color: '#000', fontStyle: 'italic' }}>{amountToWords(total, currency)}</span>
              </div>
            )}

            {/* Footer */}
            <Footer pageNum={pageIdx + 1} totalPages={pageSlices.length} />
          </div>
        )
      })}
    </div>
  )
}
// ─── Miniatures de sélection de template ─────────────────────────────────────

// Thumbnails SVG inline — représentation simplifiée de chaque design
const TEMPLATE_THUMBS = {
  minimal: (
    <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* fond blanc */}
      <rect width="80" height="110" fill="#fff" />
      {/* header 3 cols */}
      <rect x="4" y="5" width="12" height="12" rx="2" fill="#e0e0e0" />
      <rect x="28" y="5" width="20" height="3" rx="1" fill="#ccc" />
      <rect x="28" y="10" width="14" height="2" rx="1" fill="#e0e0e0" />
      <rect x="55" y="5" width="18" height="3" rx="1" fill="#ccc" />
      <rect x="55" y="10" width="14" height="2" rx="1" fill="#e0e0e0" />
      {/* tableau header arrondi noir */}
      <rect x="4" y="22" width="72" height="9" rx="4" fill="#111" />
      <rect x="7" y="25" width="30" height="3" rx="1" fill="#fff" opacity="0.8" />
      <rect x="50" y="25" width="10" height="3" rx="1" fill="#fff" opacity="0.6" />
      <rect x="63" y="25" width="10" height="3" rx="1" fill="#fff" opacity="0.6" />
      {/* lignes tableau */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="4" y={33+i*9} width="72" height="8" fill={i%2===0 ? '#fff' : '#fafafa'} />
          <rect x="7" y={36+i*9} width="28" height="2" rx="1" fill="#ddd" />
          <rect x="52" y={36+i*9} width="8" height="2" rx="1" fill="#ddd" />
          <rect x="64" y={36+i*9} width="9" height="2" rx="1" fill="#ddd" />
          <line x1="4" y1={33+i*9} x2="76" y2={33+i*9} stroke="#f0f0f0" strokeWidth="0.5" />
        </g>
      ))}
      {/* bordure tableau */}
      <rect x="4" y="22" width="72" height="70" rx="4" fill="none" stroke="#111" strokeWidth="1.2" />
      {/* bloc totaux arrondi */}
      <rect x="40" y="75" width="34" height="22" rx="3" fill="#fff" stroke="#111" strokeWidth="1" />
      <rect x="40" y="89" width="34" height="8" rx="3" fill="#111" />
      <rect x="43" y="78" width="16" height="2" rx="1" fill="#ccc" />
      <rect x="43" y="83" width="12" height="2" rx="1" fill="#ccc" />
      <rect x="43" y="91" width="14" height="3" rx="1" fill="#fff" opacity="0.8" />
      {/* footer */}
      <line x1="4" y1="100" x2="76" y2="100" stroke="#e0e0e0" strokeWidth="0.8" />
      <rect x="4" y="103" width="18" height="2" rx="1" fill="#ccc" />
      <rect x="60" y="103" width="14" height="2" rx="1" fill="#e0e0e0" />
    </svg>
  ),
  corporate: (
    <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="80" height="110" fill="#fff" />
      {/* logo gauche */}
      <rect x="4" y="5" width="13" height="13" rx="2" fill="#e0e0e0" />
      {/* ref grande droite */}
      <rect x="44" y="5" width="30" height="6" rx="1.5" fill="#222" />
      <rect x="48" y="13" width="22" height="2.5" rx="1" fill="#bbb" />
      <rect x="48" y="17" width="16" height="2" rx="1" fill="#ddd" />
      {/* separator */}
      <line x1="4" y1="22" x2="76" y2="22" stroke="#ccc" strokeWidth="0.8" />
      {/* info client */}
      <rect x="4" y="25" width="22" height="3" rx="1" fill="#555" />
      <rect x="4" y="30" width="16" height="2" rx="1" fill="#ddd" />
      <rect x="4" y="34" width="20" height="2" rx="1" fill="#ddd" />
      {/* tableau header */}
      <line x1="4" y1="42" x2="76" y2="42" stroke="#111" strokeWidth="1.5" />
      <rect x="4" y="37" width="28" height="4" rx="1" fill="#bbb" />
      <rect x="50" y="37" width="10" height="4" rx="1" fill="#bbb" />
      <rect x="64" y="37" width="10" height="4" rx="1" fill="#bbb" />
      {/* lignes */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="4" y={44+i*8} width="72" height="7" fill="#fff" />
          <rect x="4" y={51+i*8} width="72" height="0.5" fill="#ebebeb" />
          <rect x="6" y={47+i*8} width="24" height="2" rx="1" fill="#ddd" />
          <rect x="52" y={47+i*8} width="8" height="2" rx="1" fill="#ddd" />
          <rect x="64" y={47+i*8} width="9" height="2" rx="1" fill="#ddd" />
        </g>
      ))}
      {/* totaux */}
      <rect x="40" y="76" width="34" height="18" rx="2" fill="#fafafa" />
      <rect x="42" y="78" width="14" height="2.5" rx="1" fill="#ccc" />
      <rect x="42" y="83" width="12" height="2" rx="1" fill="#ddd" />
      <line x1="40" y1="88" x2="74" y2="88" stroke="#111" strokeWidth="1.5" />
      <rect x="42" y="90" width="18" height="3" rx="1" fill="#333" />
      {/* footer */}
      <line x1="4" y1="102" x2="76" y2="102" stroke="#ddd" strokeWidth="0.8" />
      <rect x="4" y="105" width="18" height="2" rx="1" fill="#ccc" />
      <rect x="58" y="105" width="16" height="2" rx="1" fill="#e0e0e0" />
    </svg>
  ),
  classic: (
    <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="80" height="110" fill="#fff" />
      {/* logo gauche */}
      <rect x="4" y="5" width="12" height="12" rx="2" fill="#e0e0e0" />
      {/* ref droite grande */}
      <rect x="46" y="5" width="28" height="5" rx="1.5" fill="#222" />
      <rect x="50" y="12" width="20" height="2" rx="1" fill="#bbb" />
      {/* separator */}
      <line x1="4" y1="21" x2="76" y2="21" stroke="#ccc" strokeWidth="0.8" />
      {/* 2 colonnes émetteur/destinataire */}
      <rect x="4" y="24" width="20" height="2.5" rx="1" fill="#888" />
      <line x1="4" y1="28" x2="36" y2="28" stroke="#ccc" strokeWidth="0.5" />
      <rect x="4" y="30" width="18" height="2" rx="1" fill="#ccc" />
      <rect x="4" y="34" width="14" height="2" rx="1" fill="#e0e0e0" />
      {/* separateur vertical */}
      <line x1="40" y1="24" x2="40" y2="44" stroke="#ccc" strokeWidth="0.8" />
      {/* destinataire */}
      <rect x="44" y="24" width="20" height="2.5" rx="1" fill="#888" />
      <line x1="44" y1="28" x2="76" y2="28" stroke="#ccc" strokeWidth="0.5" />
      <rect x="44" y="30" width="18" height="2" rx="1" fill="#ccc" />
      <rect x="44" y="34" width="14" height="2" rx="1" fill="#e0e0e0" />
      {/* tableau */}
      <line x1="4" y1="48" x2="76" y2="48" stroke="#111" strokeWidth="1.5" />
      <rect x="4" y="44" width="26" height="3.5" rx="1" fill="#bbb" />
      <rect x="50" y="44" width="10" height="3.5" rx="1" fill="#bbb" />
      <rect x="64" y="44" width="10" height="3.5" rx="1" fill="#bbb" />
      {[0,1,2].map(i => (
        <g key={i}>
          <rect x="4" y={50+i*8} width="72" height="7" fill="#fff" />
          <line x1="4" y1={57+i*8} x2="76" y2={57+i*8} stroke="#e0e0e0" strokeWidth="0.5" />
          <rect x="6" y={53+i*8} width="24" height="2" rx="1" fill="#ddd" />
          <rect x="52" y={53+i*8} width="8" height="2" rx="1" fill="#ddd" />
          <rect x="64" y={53+i*8} width="9" height="2" rx="1" fill="#ddd" />
        </g>
      ))}
      {/* SOUSTOTAL */}
      <line x1="4" y1="74" x2="76" y2="74" stroke="#111" strokeWidth="1.5" />
      <rect x="4" y="75" width="72" height="7" fill="#fff" />
      <rect x="6" y="77.5" width="20" height="2" rx="1" fill="#444" />
      <rect x="62" y="77.5" width="10" height="2" rx="1" fill="#444" />
      <line x1="4" y1="82" x2="76" y2="82" stroke="#111" strokeWidth="1.5" />
      {/* totaux droite */}
      <rect x="40" y="85" width="34" height="16" rx="1" fill="#fafafa" />
      <rect x="42" y="87" width="16" height="2" rx="1" fill="#ccc" />
      <rect x="42" y="91" width="14" height="2" rx="1" fill="#ddd" />
      <line x1="40" y1="95" x2="74" y2="95" stroke="#111" strokeWidth="1.5" />
      <rect x="42" y="97" width="18" height="3" rx="1" fill="#333" />
      {/* footer */}
      <rect x="8" y="104" width="22" height="2" rx="1" fill="#888" />
      <rect x="50" y="104" width="22" height="2" rx="1" fill="#888" />
      <rect x="30" y="107" width="20" height="1.5" rx="1" fill="#ccc" />
    </svg>
  ),
  modern: (
    <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="80" height="110" fill="#fff" />
      {/* Nom société grand */}
      <rect x="4" y="5" width="42" height="7" rx="1.5" fill="#111" />
      {/* adresse droite */}
      <rect x="58" y="5" width="16" height="2" rx="1" fill="#ccc" />
      <rect x="58" y="9" width="14" height="2" rx="1" fill="#e0e0e0" />
      {/* carrés décoratifs */}
      <rect x="4" y="15" width="5" height="5" rx="1" fill="#888" />
      <rect x="11" y="15" width="5" height="5" rx="1" fill="#888" />
      <rect x="18" y="15" width="5" height="5" rx="1" fill="#f0f0f0" stroke="#888" strokeWidth="0.5" />
      <rect x="25" y="15" width="5" height="5" rx="1" fill="#f0f0f0" stroke="#888" strokeWidth="0.5" />
      <rect x="32" y="15" width="5" height="5" rx="1" fill="#f0f0f0" stroke="#888" strokeWidth="0.5" />
      {/* 2 boxes arrondies */}
      <rect x="4" y="23" width="34" height="18" rx="3" fill="#fff" stroke="#ccc" strokeWidth="0.8" />
      <rect x="7" y="26" width="20" height="4" rx="1" fill="#333" />
      <rect x="7" y="32" width="14" height="2" rx="1" fill="#bbb" />
      <rect x="7" y="36" width="18" height="2" rx="1" fill="#ddd" />
      <rect x="42" y="23" width="34" height="18" rx="3" fill="#fff" stroke="#ccc" strokeWidth="0.8" />
      <rect x="45" y="26" width="10" height="2" rx="1" fill="#bbb" />
      <rect x="45" y="30" width="24" height="3" rx="1" fill="#444" />
      <rect x="45" y="35" width="18" height="2" rx="1" fill="#ddd" />
      {/* tableau */}
      <line x1="4" y1="46" x2="76" y2="46" stroke="#111" strokeWidth="1.5" />
      <rect x="4" y="42" width="24" height="3.5" rx="1" fill="#bbb" />
      <rect x="50" y="42" width="10" height="3.5" rx="1" fill="#bbb" />
      <rect x="64" y="42" width="10" height="3.5" rx="1" fill="#bbb" />
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="4" y={48+i*7} width="72" height="6" fill="#fff" />
          <line x1="4" y1={54+i*7} x2="76" y2={54+i*7} stroke="#ebebeb" strokeWidth="0.5" />
          <rect x="6" y={50.5+i*7} width="22" height="2" rx="1" fill="#ddd" />
          <rect x="52" y={50.5+i*7} width="7" height="2" rx="1" fill="#ddd" />
          <rect x="63" y={50.5+i*7} width="9" height="2" rx="1" fill="#ddd" />
        </g>
      ))}
      {/* SOUS TOTAL gris */}
      <rect x="4" y="76" width="72" height="7" fill="#f0f0f0" />
      <rect x="6" y="78.5" width="18" height="2" rx="1" fill="#555" />
      <rect x="62" y="78.5" width="10" height="2" rx="1" fill="#555" />
      {/* totaux */}
      <rect x="40" y="86" width="34" height="15" rx="1" fill="#fafafa" />
      <rect x="42" y="88" width="16" height="2" rx="1" fill="#ccc" />
      <rect x="42" y="92" width="14" height="2" rx="1" fill="#ddd" />
      <line x1="40" y1="96" x2="74" y2="96" stroke="#111" strokeWidth="1.5" />
      <rect x="42" y="98" width="18" height="3" rx="1" fill="#333" />
      {/* footer */}
      <line x1="4" y1="104" x2="76" y2="104" stroke="#ddd" strokeWidth="0.8" />
      <rect x="4" y="106" width="16" height="2" rx="1" fill="#ccc" />
      <rect x="58" y="106" width="16" height="2" rx="1" fill="#e0e0e0" />
    </svg>
  ),
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
  const [selectedTemplate, setSelectedTemplate] = useState('minimal')

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
    const svgToPngBlack = async () => {
      try {
        const res  = await fetch('/logo_bb.svg')
        let svgText = await res.text()
        svgText = svgText
          .replace(/stroke:#ebf7ff/g, 'stroke:#000000')
          .replace(/stop-color:#ebf7ff/g, 'stop-color:#000000')
          .replace(/fill:#ebf7ff/g, 'fill:#000000')
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
    svgToPngBlack()
  }, [])

  const toDataUrl = async (url) => {
    if (!url) return null

    // Convertit une URL storage en URL proxy API (CORS garanti)
    const toProxyUrl = (u) => {
      try {
        if (!u) return null
        if (u.includes('/storage/')) {
          return u.replace('/storage/', '/api/storage-proxy/')
        }
        const storageBase = STORAGE_BASE_URL
        const apiBase = storageBase.replace('/storage', '/api/storage-proxy')
        const relativePath = u.replace(storageBase + '/', '')
        return `${apiBase}/${relativePath}`
      } catch { return u }
    }

    const processBlob = async (rawBlob) => {
      if (!rawBlob || rawBlob.size === 0) return null

      let blob = rawBlob
      // 1. Détecter et supprimer un éventuel UTF-8 BOM (0xEF, 0xBB, 0xBF)
      try {
        const sliceHeader = await blob.slice(0, 4).arrayBuffer()
        const header = new Uint8Array(sliceHeader)
        if (header[0] === 0xef && header[1] === 0xbb && header[2] === 0xbf) {
          blob = blob.slice(3, blob.size, blob.type)
        }
      } catch {}

      // 2. Vérifier les magic bytes pour JPEG et PNG
      try {
        const sliceHeader = await blob.slice(0, 4).arrayBuffer()
        const h = new Uint8Array(sliceHeader)
        const isJpeg = h[0] === 0xff && h[1] === 0xd8
        const isPng = h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47

        if (isJpeg || isPng) {
          return await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        }
      } catch {}

      // 3. Fallback canvas pour les autres formats (WebP, SVG, etc.) ou conversion standard
      return await new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(blob)
        const img = new window.Image()
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth || img.width || 100
            canvas.height = img.naturalHeight || img.height || 100
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
            const dataUrl = canvas.toDataURL('image/png')
            URL.revokeObjectURL(objectUrl)
            resolve(dataUrl)
          } catch {
            URL.revokeObjectURL(objectUrl)
            resolve(null)
          }
        }
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          resolve(null)
        }
        img.src = objectUrl
      })
    }

    const proxyUrl = toProxyUrl(url)

    // Tentative 1 : via proxy API (CORS garanti)
    try {
      const res = await fetch(proxyUrl, { mode: 'cors' })
      const ct = res.headers.get('content-type') || ''
      if (!res.ok || ct.includes('text/html') || ct.includes('application/json')) {
        throw new Error(`Invalid response ${res.status}`)
      }
      const blob = await res.blob()
      const dataUrl = await processBlob(blob)
      if (dataUrl) return dataUrl
    } catch {}

    // Tentative 2 : fetch direct
    try {
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
      const ct = res.headers.get('content-type') || ''
      if (!res.ok || ct.includes('text/html') || ct.includes('application/json')) {
        throw new Error(`Invalid response ${res.status}`)
      }
      const blob = await res.blob()
      return await processBlob(blob)
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

      const normalizeStorageUrl = (p) => {
        if (!p || p === '0') return null
        if (p.startsWith('http://') || p.startsWith('https://')) return p
        const clean = p.startsWith('/') ? p.slice(1) : p
        return `${STORAGE_BASE_URL}/${clean}`
      }

      const logoUrl = normalizeStorageUrl(prof?.logo_path)
      const sigUrl  = normalizeStorageUrl(prof?.signature_path)
      const [logo, sig] = await Promise.all([toDataUrl(logoUrl), toDataUrl(sigUrl)])
      setLogoDataUrl(logo)
      setSigDataUrl(sig)
    } catch {
      toast.error('Impossible de charger le document')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const buildPdfBlob = () =>
    generatePdfBlob(selectedTemplate, doc, profile, qrDataUrl, logoDataUrl, sigDataUrl, logoBbDataUrl, doc?.currency || 'XOF', 1.0)

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

  // ── Sélection du template ──
  const [sheetOpen, setSheetOpen] = useState(false)

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
                  }}>
                    <PdfViewer url={url} />
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
                  {/* Miniature SVG plus grande */}
                  <div style={{
                    width: 72, height: 96,
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: isActive
                      ? '0 4px 16px rgba(30,136,229,0.3)'
                      : '0 2px 8px rgba(0,0,0,0.12)',
                  }}>
                    {TEMPLATE_THUMBS[tpl.id]}
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
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/**
 * CorporatePdfDocument — Template PDF "Corporate"
 *
 * Layout EXACT d'après screenshot :
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  [Logo] ABALO CUISINE SARL          FAC-26-025                  │
 * │         +22899…  Kégué, Lomé        CUISINE AMÉRICAINE          │
 * │         NIF:19191919                01/07/2026                  │
 * ├──────────────────────┬──────────────────────────────────────────┤
 * │ Mme Awa Fanguinovény  │  Description  Qté  Prix unit  Total[XOF]│
 * │ +228 685…            │  ÉLÉMENT 1     1    1000       1000      │
 * │ awa.fangu@gmail.com  │  ÉLÉMENT 2     2   10.000     20.000     │
 * │ Kodjoviakopé, Lomé   │  ÉLÉMENT 3     1    3000       3000      │
 * │                      │  SOUS TOTAL               24.000        │
 * │ Paiement             │  ÉLÉMENT 1     4     500      2000       │
 * │ Statut: Payée Espèces│  ÉLÉMENT 2     6    1000      6000       │
 * │                      │  ÉLÉMENT 3    10    5000     50.000      │
 * │ Signature émetteur   │  SOUS TOTAL               58.000        │
 * │  [image sig]         │                                          │
 * │                      │                                          │
 * │ Signature destinataire│                                         │
 * │  [espace]            │       Sous-total : 82.000                │
 * │                      │       TVA (0%) :   0 €                   │
 * │                      │       TOTAL : 82.000 (grand)             │
 * │                      │       quatre-vingt-deux mille francs CFA │
 * ├──────────────────────┴──────────────────────────────────────────┤
 * │                  GETBUDGETPILOT.COM                    1/1      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import {
  Document, Page, View, Text, Image, StyleSheet, pdf,
} from '@react-pdf/renderer'
import { amountToWords } from './MinimalPdfDocument'
import { STORAGE_BASE_URL } from '../../config/constants'
import { getTextColor, accentToBoxBg, accentToSubtotalBg } from './pdfColorUtils'

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
    const dt = new Date(d)
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
  } catch { return String(d) }
}

function statusLabel(s) {
  return { paid: 'Payée', partially_paid: 'Part. payée', sent: 'Envoyée', overdue: 'En retard', draft: 'Brouillon' }[s] || s || '—'
}

function toNum(v) { return isNaN(parseFloat(v)) ? 0 : parseFloat(v) }

// ─── Dimensions colonnes ─────────────────────────────────────────────────────
const LEFT_W  = 145  // largeur colonne gauche (px PDF)
const GAP     = 12   // espace entre les 2 colonnes

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111',
    backgroundColor: '#fff',
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 28,
  },

  // ── Header (pleine largeur) ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  logoBox: { width: 44, height: 44, backgroundColor: '#e0e0e0', borderRadius: 3, border: '1px solid #ccc' },
  logoImg:  { width: 44, height: 44, objectFit: 'cover', borderRadius: 3, border: '1px solid #ccc' },
  companyName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 2 },
  companyLine: { fontSize: 8.5, color: '#000', marginTop: 1.5 },
  headerRight: { alignItems: 'flex-end', maxWidth: 250 },
  refNum:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#111' },
  docTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111', marginTop: 3, textAlign: 'right' },
  docDate:  { fontSize: 9,  color: '#555', marginTop: 3, textAlign: 'right' },

  // ── Corps principal : 2 colonnes ──
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
  },

  // ── Colonne gauche (fixed sur toutes les pages) ──
  leftCol: {
    width: LEFT_W,
    flexShrink: 0,
    paddingRight: GAP,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  clientName:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 3 },
  clientDetail: { fontSize: 12, color: '#000', marginTop: 2 },

  dividerH: { height: 0, marginTop: 12, marginBottom: 12 },

  paymentTitle:  { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  paymentDetail: { fontSize: 12, color: '#444', marginTop: 2 },

  sigTitle: { fontSize: 12, color: '#111', marginTop: 0, marginBottom: 6 },
  sigImgBox: {
    height: 40,
    justifyContent: 'flex-start',
    marginBottom: 2,
  },
  sigImg: { maxHeight: 40, maxWidth: LEFT_W - 10, objectFit: 'contain' },
  sigLine: { height: 0, width: 0 },
  sigSpaceBox: { height: 40, marginBottom: 2 },

  // ── Colonne droite : tableau ──
  rightCol: {
    flex: 1,
    border: '1.5px solid #bbb',
    borderRadius: 3,
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1px solid #bbb',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  thText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  subtotalRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderTop: '1px solid #bbb',
    borderBottom: '1px solid #bbb',
    marginBottom: 4,
  },
  tdDesc:  { flex: 3, fontSize: 11, textAlign: 'center' },
  tdQty:   { flex: 1, fontSize: 11, textAlign: 'center' },
  tdPrice: { flex: 1.8, fontSize: 11, textAlign: 'center' },
  tdTotal: { flex: 1.8, fontSize: 11, textAlign: 'center' },

  // ── Bloc totaux (dans colonne droite, en bas) ──
  totalsBlock: {
    marginTop: 16,
    alignItems: 'flex-end',
    paddingRight: 10,
    paddingBottom: 8,
  },
  totalsInner: { width: 200 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalsLabel: { fontSize: 9, color: '#333' },
  totalsValue: { fontSize: 9, color: '#333' },
  totalsValueMuted: { fontSize: 9, color: '#aaa' },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 4,
  },
  totalFinalLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111' },
  totalFinalValue: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#111' },
  wordsText: {
    fontSize: 8,
    color: '#555',
    fontFamily: 'Helvetica-Oblique',
    marginTop: 3,
    textAlign: 'right',
  },

  // ── Footer ──
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 28, paddingBottom: 10,
  },
  footerRow: {
    paddingTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerSide: { fontSize: 8, color: '#000', flex: 1 },
  footerCenter: { fontSize: 8.5, color: '#000', letterSpacing: 0.5, flex: 1, textAlign: 'center' },})

// ─── Découpage des items en pages ────────────────────────────────────────────
const ROW_H       = 32   // hauteur d'une ligne item (paddingVertical:10*2 + fontSize:11)
const HEADER_H    = 34   // en-tête tableau
const SUBTOTAL_H  = 34   // ligne SOUS TOTAL
const TOTALS_H    = 90   // bloc totaux (dernière page)
const PAGE_BODY_H = 660  // hauteur utile du bodyRow par page

/**
 * Découpe un tableau d'items (toutes catégories confondues, avec _cat) en tranches
 * qui tiennent dans PAGE_BODY_H. Retourne un tableau de pages, chacune = liste d'items.
 * La dernière page inclut les totaux → moins de lignes.
 */
function sliceItemsIntoPages(groupEntries) {
  // Aplatit tous les items avec leur catégorie
  const flat = []
  groupEntries.forEach(([cat, items]) => {
    items.forEach(item => flat.push({ ...item, _cat: cat }))
    flat.push({ __subtotal: true, _cat: cat, items })
  })

  const pages = []
  let current = []
  let usedH = HEADER_H

  flat.forEach((row, idx) => {
    const rowH = row.__subtotal ? SUBTOTAL_H : ROW_H
    const isLast = idx === flat.length - 1
    // Réserver de la place pour les totaux sur la dernière page
    const reserveH = isLast ? TOTALS_H : 0
    if (usedH + rowH + reserveH > PAGE_BODY_H && current.length > 0) {
      pages.push(current)
      current = []
      usedH = HEADER_H
    }
    current.push(row)
    usedH += rowH
  })
  if (current.length > 0) pages.push(current)
  return pages
}

// ─── Composant Document ───────────────────────────────────────────────────────

export function CorporatePdfDocument({ doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0, accentColor = '#1E88E5', headerColor = '#000000' }) {
  const company = {
    name:    profile?.company_name    || profile?.name    || 'Mon Entreprise',
    address: profile?.company_address || '',
    phone:   profile?.professional_phone || profile?.phone || '',
    city:    profile?.company_city    || '',
    nif:     profile?.nif || '',
  }
  const client = doc.client || {}
  const items  = doc.items  || []
  const cr     = conversionRate || 1.0

  // Styles dynamiques dépendant de accentColor
  const headerTextColor = getTextColor(accentColor)
  const subtotalBg      = accentToSubtotalBg(accentColor)
  const boxBg           = accentToBoxBg(accentColor)

  const dynS = {
    rightCol:    { ...S.rightCol,    border: `1.5px solid ${accentColor}` },
    tableHeader: { ...S.tableHeader, borderBottom: `1px solid ${accentColor}`, backgroundColor: accentColor },
    thText:      { ...S.thText,      color: headerTextColor },
    subtotalRow: { ...S.subtotalRow, borderTop: `1px solid ${accentColor}`, borderBottom: `1px solid ${accentColor}`, backgroundColor: subtotalBg, marginTop: 6, marginBottom: 6 },
    subtotalText:{ fontFamily: 'Helvetica-Bold', color: accentColor, fontSize: 12 },
    totalFinalLabel: { ...S.totalFinalLabel, color: accentColor },
    totalFinalValue: { ...S.totalFinalValue, color: accentColor },
  }

  // Calculs
  const itemsWithTotal = items.map(i => ({
    ...i,
    _total: (i.total != null && !isNaN(i.total)) ? toNum(i.total) : toNum(i.quantity) * toNum(i.unit_price),
  }))
  const subtotalBefore = itemsWithTotal.reduce((s, i) => s + toNum(i.quantity) * toNum(i.unit_price), 0)
  const itemDiscounts  = itemsWithTotal.reduce((s, i) => s + (toNum(i.quantity) * toNum(i.unit_price) - i._total), 0)
  let globalDiscount = 0
  if (toNum(doc.discount_percent) > 0) {
    globalDiscount = doc.discount_type === 'percentage'
      ? subtotalBefore * (toNum(doc.discount_percent) / 100)
      : toNum(doc.discount_percent)
  }
  const totalDiscount = itemDiscounts + globalDiscount
  const subtotalAfter = subtotalBefore - totalDiscount
  const tvaRate       = doc.has_tva ? 18 : 0
  const tvaAmount     = doc.has_tva ? subtotalAfter * (tvaRate / 100) : 0
  const totalRaw      = toNum(doc.total_amount) || (subtotalAfter + tvaAmount)
  const total         = totalRaw * cr
  const subtotalDisp  = (subtotalBefore - totalDiscount) * cr

  // Grouper par catégorie
  const grouped = {}
  itemsWithTotal.forEach(item => {
    const cat = item.category || '__default__'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })
  const groupEntries = Object.entries(grouped)

  // Découper en pages
  const pageSlices = sliceItemsIntoPages(groupEntries)
  const totalPages = pageSlices.length

  // ── Composant réutilisable : colonne gauche ──────────────────────────────
  const LeftColumn = ({ isLastPage }) => (
    <View style={S.leftCol}>
      <View>
        <Text style={[S.clientName, { color: headerColor }]}>{client.name || '—'}</Text>
        {!!client.phone   && <Text style={[S.clientDetail, { color: headerColor }]}>{client.phone}</Text>}
        {!!client.email   && <Text style={[S.clientDetail, { color: headerColor }]}>{client.email}</Text>}
        {!!client.address && <Text style={[S.clientDetail, { color: headerColor }]}>{client.address}</Text>}
      </View>

      {isLastPage && (
        <View style={{ marginTop: 240 }}>
          <Text style={S.paymentTitle}>Paiement</Text>        <Text style={S.paymentDetail}>
            {'Statut : '}<Text style={{ fontFamily: 'Helvetica-Bold' }}>{statusLabel(doc.status)}</Text>
          </Text>
          {!!doc.due_date && (
            <Text style={S.paymentDetail}>
              {'Échéance : '}<Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtDate(doc.due_date)}</Text>
            </Text>
          )}
          <Text style={[S.sigTitle, { marginTop: 40 }]}>Signature émetteur</Text>
          <View style={S.sigImgBox}>
            {signatureDataUrl ? <Image src={signatureDataUrl} style={S.sigImg} /> : null}
          </View>
          <View style={S.sigLine} />

          <Text style={[S.sigTitle, { marginTop: 40 }]}>Signature destinataire</Text>
          <View style={S.sigSpaceBox} />
          <View style={S.sigLine} />
        </View>
      )}
    </View>
  )

  // ── Composant réutilisable : en-tête tableau ─────────────────────────────
  const TableHeader = () => (
    <View style={dynS.tableHeader}>
      <Text style={[dynS.thText, { flex: 3, textAlign: 'center' }]}>Description</Text>
      <Text style={[dynS.thText, { flex: 1, textAlign: 'center' }]}>Quantité</Text>
      <Text style={[dynS.thText, { flex: 1.8, textAlign: 'center' }]}>Prix unitaire</Text>
      <Text style={[dynS.thText, { flex: 1.8, textAlign: 'center' }]}>Total [{currency}]</Text>
    </View>
  )

  // ── Composant réutilisable : bloc totaux ─────────────────────────────────
  const TotalsBlock = () => (
    <View style={S.totalsBlock}>
      <View style={S.totalsInner}>
        <View style={S.totalsRow}>
          <Text style={S.totalsLabel}>Sous-total :</Text>
          <Text style={S.totalsValue}>{fmt(subtotalDisp)}</Text>
        </View>
        <View style={S.totalsRow}>
          <Text style={S.totalsLabel}>TVA ({tvaRate}%) :</Text>
          {doc.has_tva
            ? <Text style={S.totalsValue}>{fmt(tvaAmount * cr)}</Text>
            : <Text style={S.totalsValueMuted}>{fmt(0)}</Text>
          }
        </View>
        {totalDiscount > 0 && (
          <View style={S.totalsRow}>
            <Text style={S.totalsLabel}>Remise :</Text>
            <Text style={S.totalsValue}>- {fmt(totalDiscount * cr)}</Text>
          </View>
        )}
        <View style={S.totalFinalRow}>
          <Text style={dynS.totalFinalLabel}>TOTAL :</Text>
          <Text style={dynS.totalFinalValue}>{fmt(total)}</Text>
        </View>
        <Text style={S.wordsText}>{amountToWords(total, currency)}</Text>
      </View>
    </View>
  )

  // ── Header commun à toutes les pages ────────────────────────────────────
  const PageHeader = () => (
    <View style={S.headerRow}>
      <View style={S.headerLeft}>
        {logoDataUrl
          ? <Image src={logoDataUrl} style={S.logoImg} />
          : <View style={S.logoBox} />
        }
        <View>
          <Text style={[S.companyName, { color: headerColor }]}>{company.name}</Text>
          {!!company.phone && <Text style={[S.companyLine, { color: headerColor }]}>{company.phone}</Text>}
          {(!!company.city || !!company.address) && (
            <Text style={[S.companyLine, { color: headerColor }]}>{[company.city, company.address].filter(Boolean).join(', ')}</Text>
          )}
          {!!company.nif && <Text style={[S.companyLine, { color: headerColor }]}>NIF : {company.nif}</Text>}
        </View>
      </View>
      <View style={S.headerRight}>
        <Text style={[S.refNum, { color: headerColor }]}>{doc.reference_number}</Text>
        {!!doc.title && <Text style={S.docTitle}>{doc.title.toUpperCase()}</Text>}
        <Text style={S.docDate}>{fmtDate(doc.issue_date || doc.created_at)}</Text>
      </View>
    </View>
  )

  return (
    <Document>
      {pageSlices.map((slice, pageIdx) => {
        const isLastPage = pageIdx === totalPages - 1
        return (
          <Page key={pageIdx} size="A4" style={S.page}>
            <PageHeader />

            <View style={S.bodyRow}>
              <LeftColumn isLastPage={isLastPage || totalPages === 1} />
              {/* Colonne droite */}
              <View style={[dynS.rightCol, { justifyContent: 'space-between' }]}>
                <View>
                  <TableHeader />
                  {slice.map((row, ri) => {
                    if (row.__subtotal) {
                      const catTotal = row.items.reduce((s, i) => s + i._total, 0)
                      return (
                        <View key={`sub-${ri}`} style={dynS.subtotalRow}>
                          <Text style={[S.tdDesc, { flex: 5.8, textAlign: 'left' }, dynS.subtotalText]}>
                            SOUS TOTAL {row._cat !== '__default__' ? row._cat : ''}
                          </Text>
                          <Text style={[S.tdTotal, dynS.subtotalText]}>
                            {fmt(catTotal * cr)}
                          </Text>
                        </View>
                      )
                    }
                    return (
                      <View key={ri} style={S.tableRow}>
                        <Text style={S.tdDesc}>{row.description}</Text>
                        <Text style={S.tdQty}>{row.quantity}</Text>
                        <Text style={S.tdPrice}>{fmt(toNum(row.unit_price) * cr)}</Text>
                        <Text style={S.tdTotal}>{fmt(row._total * cr)}</Text>
                      </View>
                    )
                  })}
                </View>

                {/* Totaux uniquement sur la dernière page — collés en bas */}
                {isLastPage && <TotalsBlock />}
              </View>
            </View>

            {/* Footer */}
            <View style={S.footer} fixed>
              <View style={S.footerRow}>
                <Text style={S.footerSide}>GETBUDGETPILOT.COM</Text>
                <Text style={S.footerCenter}
                  render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} fixed />
                <Text style={S.footerSide} />
              </View>
            </View>
          </Page>
        )
      })}
    </Document>
  )
}

// ─── Preview HTML (aperçu dans la modal) ─────────────────────────────────────

export function CorporateTemplate({ doc, profile, currency = 'XOF', conversionRate = 1.0, accentColor = '#1E88E5', headerColor = '#000000' }) {
  const storageBase = STORAGE_BASE_URL || ''
  const headerTextColor = getTextColor(accentColor)
  const subtotalBgHtml  = accentToSubtotalBg(accentColor)
  const boxBgHtml       = accentToBoxBg(accentColor)

  const company = {
    name:    profile?.company_name    || profile?.name    || 'Mon Entreprise',
    address: profile?.company_address || '',
    phone:   profile?.professional_phone || profile?.phone || '',
    city:    profile?.company_city    || '',
    nif:     profile?.nif || '',
  }
  const client = doc.client || {}
  const items  = doc.items  || []
  const cr     = conversionRate || 1.0
  const toNumL = v => isNaN(parseFloat(v)) ? 0 : parseFloat(v)

  const itemsWithTotal = items.map(i => ({
    ...i,
    _total: (i.total != null && !isNaN(i.total)) ? toNumL(i.total) : toNumL(i.quantity) * toNumL(i.unit_price),
  }))
  const subtotalBefore = itemsWithTotal.reduce((s, i) => s + toNumL(i.quantity) * toNumL(i.unit_price), 0)
  const itemDiscounts  = itemsWithTotal.reduce((s, i) => s + (toNumL(i.quantity) * toNumL(i.unit_price) - i._total), 0)
  let globalDiscount = 0
  if (toNumL(doc.discount_percent) > 0) {
    globalDiscount = doc.discount_type === 'percentage'
      ? subtotalBefore * (toNumL(doc.discount_percent) / 100)
      : toNumL(doc.discount_percent)
  }
  const totalDiscount = itemDiscounts + globalDiscount
  const subtotalAfter = subtotalBefore - totalDiscount
  const tvaRate       = doc.has_tva ? 18 : 0
  const tvaAmount     = doc.has_tva ? subtotalAfter * (tvaRate / 100) : 0
  const totalRaw      = toNumL(doc.total_amount) || (subtotalAfter + tvaAmount)
  const total         = totalRaw * cr
  const subtotalDisp  = (subtotalBefore - totalDiscount) * cr

  const logoUrl      = profile?.logo_path ? `${storageBase}/${profile.logo_path}` : null
  const signatureUrl = profile?.signature_path && profile.signature_path !== '0'
    ? `${storageBase}/${profile.signature_path}` : null

  const grouped = {}
  itemsWithTotal.forEach(item => {
    const cat = item.category || '__default__'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })

  const fmtD = d => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) }
    catch { return d }
  }
  const sL = s => ({ paid: 'Payée', partially_paid: 'Part. payée', sent: 'Envoyée', overdue: 'En retard', draft: 'Brouillon' }[s] || s || '—')

  const LEFT = 185  // px — largeur colonne gauche dans l'aperçu HTML

  return (
    <div style={{
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10px', color: '#111',
      background: '#fff', width: '794px', minHeight: '1123px',
      padding: '24px 28px 40px', boxSizing: 'border-box', position: 'relative',
    }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        {/* Gauche */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={{ width: 44, height: 44, objectFit: 'cover', border: '1px solid #ccc', borderRadius: 3 }} />
            : <div style={{ width: 44, height: 44, background: '#e0e0e0', borderRadius: 3, border: '1px solid #ccc' }} />
          }
          <div>
            <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2, color: headerColor }}>{company.name}</div>
            {company.phone   && <div style={{ fontSize: 8.5, color: headerColor, marginTop: 1.5 }}>{company.phone}</div>}
            {(company.city || company.address) && (
              <div style={{ fontSize: 8.5, color: headerColor, marginTop: 1.5 }}>
                {[company.city, company.address].filter(Boolean).join(', ')}
              </div>
            )}
            {company.nif && <div style={{ fontSize: 8.5, color: headerColor, marginTop: 1.5 }}>NIF : {company.nif}</div>}
          </div>
        </div>
        {/* Droite */}
        <div style={{ textAlign: 'right', maxWidth: 250 }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: headerColor }}>{doc.reference_number}</div>
          {doc.title && <div style={{ fontSize: 10, fontWeight: 'bold', color: headerColor, marginTop: 3 }}>{doc.title.toUpperCase()}</div>}
          <div style={{ fontSize: 9, color: '#555', marginTop: 3 }}>{fmtD(doc.issue_date || doc.created_at)}</div>
        </div>
      </div>

      {/* ── CORPS : 2 COLONNES ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minHeight: 880 }}>

        {/* ── COLONNE GAUCHE ── */}
        <div style={{ width: LEFT, flexShrink: 0, paddingRight: 12, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignSelf: 'stretch' }}>
          {/* Bloc 1 : Info client */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 3, color: headerColor }}>{client.name || '—'}</div>
            {client.phone   && <div style={{ fontSize: 12, color: headerColor, marginTop: 2 }}>{client.phone}</div>}
            {client.email   && <div style={{ fontSize: 12, color: headerColor, marginTop: 2 }}>{client.email}</div>}
            {client.address && <div style={{ fontSize: 12, color: headerColor, marginTop: 2 }}>{client.address}</div>}
          </div>

          {/* Bloc 2+3 : Paiement + Signature émetteur groupés */}
          <div style={{ marginTop: 240 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Paiement</div>
            <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>
              Statut : <strong>{sL(doc.status)}</strong>
            </div>
            {doc.due_date && (
              <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>
                Échéance : <strong>{fmtD(doc.due_date)}</strong>
              </div>
            )}
            {/* Signature émetteur — juste en dessous */}
            <div style={{ fontSize: 12, color: '#111', marginTop: 40, marginBottom: 6 }}>Signature émetteur</div>
            <div style={{ height: 40, display: 'flex', alignItems: 'flex-start' }}>
              {signatureUrl && (
                <img src={signatureUrl} alt="Signature"
                  style={{ maxHeight: 40, maxWidth: LEFT - 20, objectFit: 'contain' }} />
              )}
            </div>

            {/* Signature destinataire — juste en dessous */}
            <div style={{ fontSize: 12, color: '#111', marginTop: 40, marginBottom: 6 }}>Signature destinataire</div>
            <div style={{ height: 40 }} />
          </div>
        </div>

        {/* ── COLONNE DROITE : tableau ── */}
        <div style={{ flex: 1, border: `1.5px solid ${accentColor}`, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* En-tête tableau */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${accentColor}`, padding: '10px 4px', backgroundColor: accentColor }}>
            <div style={{ flex: 3, fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: headerTextColor }}>Description</div>
            <div style={{ flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: headerTextColor }}>Quantité</div>
            <div style={{ flex: 1.8, fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: headerTextColor }}>Prix unitaire</div>
            <div style={{ flex: 1.8, fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: headerTextColor }}>Total [{currency}]</div>
          </div>

          {/* Lignes par groupe */}
          {Object.entries(grouped).map(([cat, catItems], gi) => {
            const catTotal = catItems.reduce((s, i) => s + i._total, 0)
            return (
              <div key={gi}>
                {catItems.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', padding: '10px 4px' }}>
                    <div style={{ flex: 3, fontSize: 11, textAlign: 'center' }}>{item.description}</div>
                    <div style={{ flex: 1, fontSize: 11, textAlign: 'center' }}>{item.quantity}</div>
                    <div style={{ flex: 1.8, fontSize: 11, textAlign: 'center' }}>{fmt(toNumL(item.unit_price) * cr)}</div>
                    <div style={{ flex: 1.8, fontSize: 11, textAlign: 'center' }}>{fmt(item._total * cr)}</div>
                  </div>
                ))}
                {/* SOUS TOTAL */}
                <div style={{
                  display: 'flex', padding: '10px 4px',
                  backgroundColor: subtotalBgHtml,
                  borderTop: `1px solid ${accentColor}`, borderBottom: `1px solid ${accentColor}`,
                  marginTop: 6, marginBottom: 6,
                }}>
                  <div style={{ flex: 5.8, fontSize: 12, fontWeight: 'bold', textAlign: 'left', color: accentColor }}>
                    SOUS TOTAL {cat !== '__default__' ? cat : ''}
                  </div>
                  <div style={{ flex: 1.8, fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: accentColor }}>{fmt(catTotal * cr)}</div>
                </div>
              </div>
            )
          })}

          {/* Bloc totaux — aligné à droite, poussé en bas */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingRight: 12, paddingBottom: 8 }}>
            <div style={{ width: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ fontSize: 9, color: '#333' }}>Sous-total :</span>
                <span style={{ fontSize: 9 }}>{fmt(subtotalDisp)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ fontSize: 9, color: '#333' }}>TVA ({tvaRate}%) :</span>
                <span style={{ fontSize: 9, color: doc.has_tva ? '#333' : '#aaa' }}>
                  {doc.has_tva ? fmt(tvaAmount * cr) : fmt(0)}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ fontSize: 9, color: '#333' }}>Remise :</span>
                  <span style={{ fontSize: 9 }}>- {fmt(totalDiscount * cr)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, paddingTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 'bold', color: accentColor }}>TOTAL :</span>
                <span style={{ fontSize: 17, fontWeight: 'bold', color: accentColor }}>{fmt(total)}</span>
              </div>
              <div style={{ fontSize: 8, color: '#555', fontStyle: 'italic', marginTop: 4, textAlign: 'right' }}>
                {amountToWords(total, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 10px' }}>
        <div style={{ paddingTop: 7, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 8.5, color: '#000', letterSpacing: 0.5, flex: 1 }}>GETBUDGETPILOT.COM</span>
          <span style={{ fontSize: 8, color: '#000', flex: 1, textAlign: 'center' }}>1/1</span>
          <span style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  )
}

// ─── Génération blob ──────────────────────────────────────────────────────────

export async function generateCorporatePdfBlob(doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0, customization = {}) {
  const { accentColor = '#1E88E5', headerColor = '#000000' } = customization
  return pdf(
    <CorporatePdfDocument
      doc={doc} profile={profile}
      qrDataUrl={qrDataUrl} logoDataUrl={logoDataUrl}
      signatureDataUrl={signatureDataUrl} logoBbDataUrl={logoBbDataUrl}
      currency={currency} conversionRate={conversionRate}
      accentColor={accentColor} headerColor={headerColor}
    />
  ).toBlob()
}

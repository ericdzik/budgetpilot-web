/**
 * ModernPdfDocument — Template PDF "Modern"
 *
 * Design (d'après screenshot) :
 * - Header : nom société très grand et gras (24px+) à gauche, adresse société petite à droite
 * - 2 boxes arrondies côte à côte : référence+date (gauche) | destinataire (droite)
 * - Tableau : séparateurs légers, header en gras avec border-bottom
 * - SOUS TOTAL en bas du tableau, texte bold
 * - Totaux à droite : TOTAL HT / TVA X% / REMISE / TOTAL TTC
 * - Montant en lettres sous les totaux
 * - Footer : Paiement (gauche) | Signature émetteur (centre-gauche) | Signature destinataire (centre-droite) | GETBUDGETPILOT.COM
 */

import {
  Document, Page, View, Text, Image, StyleSheet, pdf,
} from '@react-pdf/renderer'
import { amountToWords } from './MinimalPdfDocument'
import { STORAGE_BASE_URL } from '../../config/constants'
import { getTextColor, accentToBoxBg, getSecondaryColor, getSecondaryTextColor } from './pdfColorUtils'
import { withFont, resolveFontFamily } from './pdfFonts'

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

// ─── Styles ──────────────────────────────────────────────────────────────────

const BASE_STYLES = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111',
    backgroundColor: '#fff',
    paddingTop: 28,
    flexDirection: 'column',
    paddingBottom: 20,
    paddingHorizontal: 36,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  companyNameBig: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
    letterSpacing: 0.3,
  },
  companyAddressBlock: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  companyAddrLine: { fontSize: 8, color: '#000', marginTop: 1 },

  // ── 2 boxes info ──
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  infoBox: {
    flex: 1,
    border: '1px solid #111',
    borderRadius: 32,
    padding: '12px 14px',
  },
  infoBoxLabel: {
    fontSize: 9,
    color: '#111',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  infoBoxRef: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 4 },
  infoBoxSubtitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 4, lineHeight: 1.6 },
  infoBoxDate: { fontSize: 9, color: '#111', marginTop: 3 },
  infoBoxName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 5 },
  infoBoxDetail: { fontSize: 9, color: '#111', marginTop: 3, lineHeight: 1.6 },

  // ── Tableau ──
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopStyle: 'dashed',
    borderTopColor: '#aaa',
    borderBottomWidth: 1,
    borderBottomStyle: 'dashed',
    borderBottomColor: '#aaa',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  thText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
    letterSpacing: 0.2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomStyle: 'dashed',
    borderBottomColor: '#bbb',
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  subtotalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopStyle: 'dashed',
    borderTopColor: '#bbb',
    borderBottomWidth: 1,
    borderBottomStyle: 'dashed',
    borderBottomColor: '#bbb',
  },
  tdDesc:  { flex: 4, fontSize: 10 },
  tdQty:   { flex: 1, fontSize: 10, textAlign: 'center' },
  tdPrice: { flex: 2, fontSize: 10, textAlign: 'right' },
  tdTotal: { flex: 2, fontSize: 10, textAlign: 'right' },

  // ── Zone totaux + paiement ──
  bottomZone: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },

  totalsBox: { width: 230 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsLabel: { fontSize: 10, color: '#333', fontFamily: 'Helvetica-Bold' },
  totalsValue: { fontSize: 10, color: '#333' },
  totalsValueDash: { fontSize: 10, color: '#111' },
  totalTTCRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 3,
  },
  totalTTCLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111' },
  totalTTCValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111' },

  // Montant en lettres
  wordsRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap' },

  // ── Footer ──
  footer: {
    marginTop: 'auto',
    paddingBottom: 18,
  },
  footerLine: {
    paddingTop: 12,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  footerSep: {
    width: 0,
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderLeftColor: '#111',
    marginHorizontal: 16,
    alignSelf: 'stretch',
  },
  footerRight: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  footerPayTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  footerPayDetail: { fontSize: 9, color: '#555', marginTop: 2 },
  footerUrl: { fontSize: 8, color: '#000', letterSpacing: 0.5, marginTop: 12 },
  sigBox: { alignItems: 'center', flex: 1 },
  sigLabel: { fontSize: 9, color: '#333', marginBottom: 6, textAlign: 'center' },
  sigImg:   { maxHeight: 40, maxWidth: 130, objectFit: 'contain' },
  sigSpace: { height: 40 },
  pageNum: { fontSize: 8, color: '#aaa' },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
})

// ─── Composant Document ───────────────────────────────────────────────────────

export function ModernPdfDocument({ doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0, accentColor = '#1E88E5', accentLight = '#f0f0f0', boxRadius = 32, noColor = false, fontChoice = 'helvetica' }) {
  const S = withFont(BASE_STYLES, fontChoice)
  const fontBold = resolveFontFamily(fontChoice, 'bold')
  const company = {
    name:    profile?.company_name    || profile?.name    || 'Mon Entreprise',
    address: profile?.company_address || '',
    phone:   profile?.professional_phone || profile?.phone || '',
    email:   profile?.professional_email || profile?.email || '',
    nif:     profile?.nif || '',
  }
  const client = doc.client || {}
  const items  = doc.items  || []
  const cr     = conversionRate || 1.0

  // Agencement façon Prestige : la couleur principale pilote fonds ET labels (comme
  // le navy) ; la secondaire est l'accent sur fond coloré + le fond clair du sous-total
  // (comme l'or) — le texte des colonnes du tableau reste en contraste auto (comme sur
  // Prestige, où l'en-tête de tableau reste blanc, pas doré).
  const headerTextColor = noColor ? '#111' : getTextColor(accentColor)
  const labelColor      = noColor ? '#111' : accentColor
  const boxBg           = accentToBoxBg(accentColor)
  // La couleur secondaire est dérivée automatiquement de l'accent.
  const secondaryColor  = getSecondaryColor(accentColor)
  const box1TextColor   = noColor ? '#111' : getSecondaryTextColor(accentColor, secondaryColor)

  // État "sans coloration" — reproduit le design d'origine (noir/blanc, sans fond coloré)
  const dynS = noColor ? {
    infoBox:       { ...S.infoBox, borderRadius: boxRadius },
    infoBoxAccent: { ...S.infoBox, borderRadius: boxRadius },
    tableHeader:   { flexDirection: 'row', borderBottom: '1.5px solid #111', paddingBottom: 5, paddingHorizontal: 6 },
    thText:        { ...S.thText, color: '#111' },
    subtotalRow:   { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 6, borderTop: '1px solid #ccc', marginTop: 6, marginBottom: 6 },
    subtotalText:  { fontFamily: fontBold, color: '#111' },
    footerSep:     { ...S.footerSep, borderLeftColor: '#ddd' },
  } : {
    infoBox:    { ...S.infoBox,  borderRadius: boxRadius, backgroundColor: boxBg },
    infoBoxAccent: { ...S.infoBox, borderRadius: boxRadius, backgroundColor: accentColor, border: `1px solid ${accentColor}` },
    tableHeader:{ ...S.tableHeader, backgroundColor: accentColor,
      borderTopColor: accentColor, borderBottomColor: accentColor },
    thText:     { ...S.thText,   color: headerTextColor },
    subtotalRow:{ ...S.subtotalRow,
      borderTopColor: accentColor, borderBottomColor: accentColor,
      marginTop: 6, marginBottom: 6 },
    subtotalText: { fontFamily: fontBold, color: accentColor },
    footerSep:  { ...S.footerSep, borderLeftColor: secondaryColor },
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
  const tvaRate       = 18
  const tvaAmount     = doc.has_tva ? subtotalAfter * (tvaRate / 100) : 0
  const totalRaw      = toNum(doc.total_amount) || (subtotalAfter + tvaAmount)
  const total         = totalRaw * cr

  // Grouper par catégorie
  const grouped = {}
  itemsWithTotal.forEach(item => {
    const cat = item.category || 'Articles'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })
  const groupEntries    = Object.entries(grouped)
  const showCatSubtotal = groupEntries.length > 1

  // ── Pagination intelligente ──
  // Une page A4 fait 842px. Padding top/bottom = 28+115 = 143px. Espace utile ~699px.
  // Header (nom32px + logo50px + 2boxes~90px + tableHeader~30px) ≈ 230px
  // Espace items par page ≈ 699 - 230 = 469px
  // Chaque item fait ~24px (paddingVertical:7 x2 + font10)
  // → max items par page sans totaux : floor(469/24) ≈ 19
  // Zone totaux (bottomZone + footer signatures) ≈ 160px
  // → max items sur une page avec totaux : floor((469-160)/24) ≈ 12
  //
  // Algorithme : on essaie de tout mettre sur le moins de pages possible.
  // Sur chaque page on alloue :
  //   - ITEMS_NORMAL = 17 si pas la dernière page
  //   - ITEMS_LAST   = 11 si c'est aussi la dernière (doit contenir les totaux)
  // On recalcule jusqu'à stabilisation.

  const ITEMS_NORMAL = 17  // page sans zone totaux
  const ITEMS_LAST   = 11  // page avec zone totaux + signatures

  // Aplatir toutes les lignes (items + sous-totaux par catégorie)
  const flatRows = []
  groupEntries.forEach(([cat, catItems]) => {
    catItems.forEach(item => flatRows.push({ type: 'item', item }))
    if (showCatSubtotal) {
      const catTotal = catItems.reduce((s, i) => s + i._total, 0)
      flatRows.push({ type: 'subtotal', cat, catTotal })
    }
  })

  // Découper intelligemment : on simule le découpage et on ajuste la dernière page
  const buildPages = (rows) => {
    if (rows.length === 0) return [[]]
    const result = []
    let rem = [...rows]
    while (rem.length > 0) {
      // Combien reste-t-il après cette page si on prend ITEMS_NORMAL ?
      const willBeLastIfNormal = rem.length <= ITEMS_NORMAL
      const willBeLastIfLast   = rem.length <= ITEMS_LAST
      // Si tout rentre dans ITEMS_LAST → c'est la dernière page, on prend ITEMS_LAST
      // Si tout rentre dans ITEMS_NORMAL mais pas ITEMS_LAST → risque de débord
      //   → on prend ITEMS_LAST pour forcer les totaux à tenir
      // Sinon → page intermédiaire, on prend ITEMS_NORMAL
      let limit
      if (willBeLastIfLast) {
        limit = ITEMS_LAST  // dernière page, avec totaux
      } else if (willBeLastIfNormal) {
        // Il y a entre ITEMS_LAST+1 et ITEMS_NORMAL items restants
        // Si on les met tous → totaux débordent → séparer en 2 pages
        // Page intermédiaire avec ITEMS_NORMAL - (ITEMS_NORMAL - ITEMS_LAST) items
        // = on laisse le reste pour la dernière page
        limit = rem.length - ITEMS_LAST  // page intermédiaire sans totaux
      } else {
        limit = ITEMS_NORMAL  // page normale
      }
      result.push(rem.slice(0, limit))
      rem = rem.slice(limit)
    }
    return result
  }

  const pages = buildPages(flatRows)

  return (
    <Document>
      {pages.map((pageRows, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1

        return (
          <Page key={pageIdx} size="A4" style={S.page}>

            {/* ── HEADER : affiché sur toutes les pages ── */}
            <View style={S.headerRow}>
              <View>
                <Text style={S.companyNameBig}>{company.name.toUpperCase()}</Text>
              </View>
              <View style={S.companyAddressBlock}>
                <Text style={S.companyAddrLine}>{company.name}</Text>
                {!!company.address && <Text style={S.companyAddrLine}>{company.address}</Text>}
                {!!company.phone   && <Text style={S.companyAddrLine}>{company.phone}</Text>}
                {!!company.nif     && <Text style={S.companyAddrLine}>NIF : {company.nif}</Text>}
              </View>
            </View>

            {/* Logo — toutes les pages */}
            <View style={{ marginBottom: 16, marginTop: 4 }}>
              {logoDataUrl
                ? <Image src={logoDataUrl} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                : <View style={{ width: 50, height: 50, backgroundColor: '#e0e0e0', borderRadius: 3 }} />
              }
            </View>

            {/* 2 boxes Référence / Destinataire — toutes les pages */}
            <View style={S.infoRow}>
              <View style={[dynS.infoBoxAccent, { flex: 1 }]}>
                <Text style={[S.infoBoxRef, { color: box1TextColor }]}>{doc.reference_number}</Text>
                {doc.title && <Text style={[S.infoBoxSubtitle, { color: headerTextColor }]}>{doc.title.toUpperCase()}</Text>}
                <Text style={[S.infoBoxDate, { color: headerTextColor }]}>{fmtDate(doc.issue_date || doc.created_at)}</Text>
                {doc.due_date && <Text style={[S.infoBoxDate, { marginTop: 2, color: headerTextColor }]}>Éch. {fmtDate(doc.due_date)}</Text>}
              </View>
              <View style={[dynS.infoBox, { flex: 1.5 }]}>
                <Text style={[S.infoBoxLabel, { color: '#111' }]}>DESTINATAIRE :</Text>
                <Text style={S.infoBoxName}>{client.name || '—'}</Text>
                {!!client.address && <Text style={S.infoBoxDetail}>{client.address}</Text>}
                {!!client.phone   && <Text style={S.infoBoxDetail}>{client.phone}</Text>}
                {!!client.email   && <Text style={S.infoBoxDetail}>{client.email}</Text>}
              </View>
            </View>

            {/* ── TABLEAU header : toutes les pages ── */}
            <View style={dynS.tableHeader}>
              <Text style={[dynS.thText, { flex: 4 }]}>Description </Text>
              <Text style={[dynS.thText, { flex: 1, textAlign: 'center' }]}>Quantité :</Text>
              <Text style={[dynS.thText, { flex: 2, textAlign: 'right' }]}>Prix Unitaire</Text>
              <Text style={[dynS.thText, { flex: 2, textAlign: 'right' }]}>Total [{currency}]</Text>
            </View>

            {/* ── Lignes du tableau ── */}
            {pageRows.map((row, ri) => {
              if (row.type === 'subtotal') {
                return (
                  <View key={`sub-${ri}`} style={dynS.subtotalRow}>
                    <Text style={[S.tdDesc, { flex: 7 }, dynS.subtotalText]}>SOUS TOTAL{row.cat ? ` ${row.cat}` : ''}</Text>
                    <Text style={[S.tdTotal, dynS.subtotalText]}>{fmt(row.catTotal * cr)}</Text>
                  </View>
                )
              }
              const isLast = ri === pageRows.length - 1 && isLastPage
              return (
                <View key={ri} style={isLast ? S.tableRowLast : S.tableRow}>
                  <Text style={S.tdDesc}>{row.item.description}</Text>
                  <Text style={S.tdQty}>{row.item.quantity}</Text>
                  <Text style={S.tdPrice}>{fmt(toNum(row.item.unit_price) * cr)}</Text>
                  <Text style={S.tdTotal}>{fmt(row.item._total * cr)}</Text>
                </View>
              )
            })}

            {/* ── SOUS TOTAL global + TOTAUX + FOOTER : dernière page seulement ── */}
            {isLastPage && (
              <>
                {!showCatSubtotal && (
                  <View style={dynS.subtotalRow}>
                    <Text style={[S.tdDesc, { flex: 7 }, dynS.subtotalText]}>SOUS TOTAL</Text>
                    <Text style={[S.tdTotal, dynS.subtotalText]}>{fmt((subtotalBefore - totalDiscount) * cr)}</Text>
                  </View>
                )}

                <View style={S.bottomZone}>
                  <View style={S.totalsBox}>
                    <View style={S.totalsRow}>
                      <Text style={S.totalsLabel}>SOUS-TOTAL GLOBAL :</Text>
                      <Text style={S.totalsValue}>{fmt(subtotalBefore * cr)}</Text>
                    </View>
                    <View style={S.totalsRow}>
                      <Text style={S.totalsLabel}>REMISE :</Text>
                      {totalDiscount > 0
                        ? <Text style={S.totalsValue}>- {fmt(totalDiscount * cr)}</Text>
                        : <Text style={S.totalsValueDash}>-</Text>
                      }
                    </View>
                    <View style={S.totalsRow}>
                      <Text style={S.totalsLabel}>TVA {doc.has_tva ? tvaRate : 0}% :</Text>
                      {doc.has_tva
                        ? <Text style={S.totalsValue}>{fmt(tvaAmount * cr)}</Text>
                        : <Text style={S.totalsValueDash}>-</Text>
                      }
                    </View>
                    <View style={S.totalTTCRow}>
                      <Text style={S.totalTTCLabel}>TOTAL TTC :</Text>
                      <Text style={S.totalTTCValue}>{fmt(total)}</Text>
                    </View>
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Oblique', color: '#444', textAlign: 'right' }}>
                        Arrêtée la présente facture à la somme de : {amountToWords(total, currency)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* ── FOOTER : toutes les pages, signatures sur dernière seulement ── */}
            <View style={S.footer}>
              <View style={S.footerLine}>
                <View style={S.footerContent}>
                  <View style={S.footerLeft}>
                    <Text style={[S.footerPayTitle, { color: '#111' }]}>Paiement</Text>
                    <Text style={S.footerPayDetail}>Statut : {statusLabel(doc.status)}</Text>
                    {!!doc.payment_method && <Text style={S.footerPayDetail}>{doc.payment_method}</Text>}
                    <Text style={S.footerUrl}>GETBUDGETPILOT.COM</Text>
                  </View>
                  {isLastPage && (
                    <>
                      <View style={dynS.footerSep} />
                      <View style={S.footerRight}>
                        <View style={S.sigBox}>
                          <Text style={S.sigLabel}>Signature émetteur</Text>
                          {signatureDataUrl
                            ? <Image src={signatureDataUrl} style={S.sigImg} />
                            : <View style={S.sigSpace} />
                          }
                        </View>
                        <View style={S.sigBox}>
                          <Text style={S.sigLabel}>Signature destinataire</Text>
                          <View style={S.sigSpace} />
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>

          </Page>
        )
      })}
    </Document>
  )
}

// ─── Preview HTML ─────────────────────────────────────────────────────────────

export function ModernTemplate({ doc, profile, currency = 'XOF', conversionRate = 1.0, accentColor = '#1E88E5', accentLight = '#f0f0f0', boxRadius = 32 }) {
  const storageBase = STORAGE_BASE_URL || ''
  const headerTextColor = getTextColor(accentColor)
  const labelColor      = accentColor
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
  const tvaRate       = 18
  const tvaAmount     = doc.has_tva ? subtotalAfter * (tvaRate / 100) : 0
  const totalRaw      = toNumL(doc.total_amount) || (subtotalAfter + tvaAmount)
  const total         = totalRaw * cr

  const signatureUrl = profile?.signature_path && profile.signature_path !== '0'
    ? `${storageBase}/${profile.signature_path}` : null
  const logoUrl = profile?.logo_path ? `${storageBase}/${profile.logo_path}` : null

  const grouped = {}
  itemsWithTotal.forEach(item => {
    const cat = item.category || 'Articles'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })
  const showCatSubtotal = Object.keys(grouped).length > 1

  const fmtD = d => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) } catch { return d } }
  const sL   = s => ({ paid: 'Payée', partially_paid: 'Part. payée', sent: 'Envoyée', overdue: 'En retard', draft: 'Brouillon' }[s] || s || '—')

  return (
    <div style={{
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10px', color: '#111',
      background: '#fff', width: '794px', minHeight: '1123px',
      padding: '28px 36px 120px', boxSizing: 'border-box', position: 'relative',
    }}>
      {/* HEADER : nom société grand */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: '0.3px', color: labelColor }}>{company.name.toUpperCase()}</div>
        </div>
        <div style={{ textAlign: 'right', marginTop: 4 }}>
          <div style={{ fontSize: 8, color: labelColor }}>{company.name}</div>
          {company.address && <div style={{ fontSize: 8, color: labelColor }}>{company.address}</div>}
          {company.phone   && <div style={{ fontSize: 8, color: labelColor }}>{company.phone}</div>}
          {company.nif     && <div style={{ fontSize: 8, color: labelColor }}>NIF : {company.nif}</div>}
        </div>
      </div>

      {/* Logo à la place des carrés */}
      <div style={{ marginBottom: 16, marginTop: 4 }}>
        {logoUrl
          ? <img src={logoUrl} alt="Logo" style={{ width: 50, height: 50, objectFit: 'contain', display: 'block' }} />
          : <div style={{ width: 50, height: 50, background: '#e0e0e0', borderRadius: 3 }} />
        }
      </div>

      {/* 2 BOXES */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        {/* Box référence */}
        <div style={{ flex: 1, border: `1px solid ${accentColor}`, borderRadius: boxRadius, padding: '12px 14px', backgroundColor: accentColor }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: headerTextColor }}>{doc.reference_number}</div>
          {doc.title && <div style={{ fontSize: 10, fontWeight: 'bold', color: headerTextColor, marginBottom: 4, lineHeight: 1.6 }}>{doc.title.toUpperCase()}</div>}
          <div style={{ fontSize: 9, color: headerTextColor, marginTop: 4 }}>{fmtD(doc.issue_date || doc.created_at)}</div>
          {doc.due_date && <div style={{ fontSize: 9, color: headerTextColor, marginTop: 4 }}>Éch. {fmtD(doc.due_date)}</div>}
        </div>

        {/* Box destinataire */}
        <div style={{ flex: 1.5, border: '1px solid #111', borderRadius: boxRadius, padding: '12px 14px', backgroundColor: boxBgHtml }}>
          <div style={{ fontSize: 9, color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>DESTINATAIRE :</div>
          <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 6, color: labelColor }}>{client.name || '—'}</div>
          {client.address && <div style={{ fontSize: 9, color: labelColor, marginTop: 4, lineHeight: 1.6 }}>{client.address}</div>}
          {client.phone   && <div style={{ fontSize: 9, color: labelColor, marginTop: 4, lineHeight: 1.6 }}>{client.phone}</div>}
          {client.email   && <div style={{ fontSize: 9, color: labelColor, marginTop: 4, lineHeight: 1.6 }}>{client.email}</div>}
        </div>
      </div>

      {/* TABLEAU */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderTop: `1px dashed ${accentColor}`, borderBottom: `1px dashed ${accentColor}`, backgroundColor: accentColor }}>
            <th style={{ textAlign: 'left',   padding: '0 6px 5px', fontSize: 9, fontWeight: 'bold', color: headerTextColor }}>Description </th>
            <th style={{ textAlign: 'center', padding: '0 6px 5px', fontSize: 9, fontWeight: 'bold', color: headerTextColor }}>Quantité </th>
            <th style={{ textAlign: 'right',  padding: '0 6px 5px', fontSize: 9, fontWeight: 'bold', color: headerTextColor }}>Prix Unitaire</th>
            <th style={{ textAlign: 'right',  padding: '0 6px 5px', fontSize: 9, fontWeight: 'bold', color: headerTextColor }}>Total [{currency}]</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([cat, catItems], gi) => {
            const catTotal = catItems.reduce((s, i) => s + i._total, 0)
            return (
              <>
                {catItems.map((item, ii) => (
                  <tr key={`${gi}-${ii}`} style={{ borderBottom: '1px dashed #bbb' }}>
                    <td style={{ padding: '7px 6px', fontSize: 10 }}>{item.description}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: 10 }}>{item.quantity}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: 10 }}>{fmt(toNumL(item.unit_price) * cr)}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: 10 }}>{fmt(item._total * cr)}</td>
                  </tr>
                ))}
                {showCatSubtotal && (
                  <>
                    <tr><td colSpan={4} style={{ height: 6, padding: 0, border: 'none' }}></td></tr>
                    <tr key={`sub-${gi}`} style={{ borderTop: `1px dashed ${accentColor}`, borderBottom: `1px dashed ${accentColor}` }}>
                      <td colSpan={3} style={{ padding: '6px', fontWeight: 'bold', fontSize: 10, color: accentColor }}>SOUS TOTAL{showCatSubtotal ? ` ${cat}` : ''}</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: 10, color: accentColor }}>{fmt(catTotal * cr)}</td>
                    </tr>
                    <tr><td colSpan={4} style={{ height: 6, padding: 0, border: 'none' }}></td></tr>
                  </>
                )}
              </>
            )
          })}
          {/* SOUS TOTAL global */}
          {!showCatSubtotal && (
            <>
              <tr><td colSpan={4} style={{ height: 6, padding: 0, border: 'none' }}></td></tr>
              <tr style={{ borderTop: `1px dashed ${accentColor}`, borderBottom: `1px dashed ${accentColor}` }}>
                <td colSpan={3} style={{ padding: '6px', fontWeight: 'bold', fontSize: 10, color: accentColor }}>SOUS TOTAL</td>
                <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: 10, color: accentColor }}>{fmt((subtotalBefore - totalDiscount) * cr)}</td>
              </tr>
              <tr><td colSpan={4} style={{ height: 6, padding: 0, border: 'none' }}></td></tr>
            </>
          )}
        </tbody>
      </table>

      {/* TOTAUX */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <div style={{ width: 230 }}>
          {[
            ['SOUS-TOTAL GLOBAL :', fmt(subtotalBefore * cr), false],
            [`REMISE :`, totalDiscount > 0 ? `- ${fmt(totalDiscount * cr)}` : '-', totalDiscount === 0],
            [`TVA ${doc.has_tva ? tvaRate : 0}% :`, doc.has_tva ? fmt(tvaAmount * cr) : '-', !doc.has_tva],
          ].map(([label, value, isDash], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: 10, fontWeight: 'bold', color: labelColor }}>{label}</span>
              <span style={{ fontSize: 10, color: labelColor }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: labelColor }}>TOTAL TTC :</span>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: labelColor }}>{fmt(total)}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 9, color: '#444', fontStyle: 'italic', textAlign: 'right' }}>
            Arrêtée la présente facture à la somme de : {amountToWords(total, currency)}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 36px 18px' }}>
        <div style={{ paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {/* Gauche : Paiement */}
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4, color: '#111' }}>Paiement</div>
              <div style={{ fontSize: 9, color: labelColor, marginTop: 2 }}>Statut : {sL(doc.status)}</div>
              {doc.payment_method && <div style={{ fontSize: 9, color: labelColor, marginTop: 2 }}>{doc.payment_method}</div>}
              <div style={{ fontSize: 8, color: '#000', letterSpacing: 0.5, marginTop: 12 }}>GETBUDGETPILOT.COM</div>
            </div>

            {/* Séparateur vertical */}
            <div style={{ width: 0, borderLeft: `2px solid ${accentColor}`, alignSelf: 'stretch', margin: '0 16px' }} />

            {/* Droite : Signatures */}
            <div style={{ flex: 2, display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 9, color: '#333', marginBottom: 6 }}>Signature émetteur</div>
                {signatureUrl
                  ? <img src={signatureUrl} alt="Signature" style={{ maxHeight: 40, maxWidth: 130, objectFit: 'contain' }} />
                  : <div style={{ height: 40 }} />
                }
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 9, color: '#333', marginBottom: 6 }}>Signature destinataire</div>
                <div style={{ height: 40 }} />
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}

// ─── Génération blob ──────────────────────────────────────────────────────────

export async function generateModernPdfBlob(doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0, customization = {}) {
  const { accentColor = '#1E88E5', accentLight = '#f0f0f0', boxRadius = 32, noColor = false, fontChoice = 'helvetica' } = customization
  return pdf(
    <ModernPdfDocument
      doc={doc} profile={profile}
      qrDataUrl={qrDataUrl} logoDataUrl={logoDataUrl}
      signatureDataUrl={signatureDataUrl} logoBbDataUrl={logoBbDataUrl}
      currency={currency} conversionRate={conversionRate}
      accentColor={accentColor} accentLight={accentLight} boxRadius={boxRadius} noColor={noColor} fontChoice={fontChoice}
    />
  ).toBlob()
}

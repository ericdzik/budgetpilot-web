/**
 * ClassicPdfDocument — Template PDF "Classic"
 *
 * Design (d'après screenshot) :
 * - Header : logo en haut à gauche | référence grande + gras à droite | date sous la ref
 * - 2 colonnes sous header : ÉMETTEUR (gauche) | DESTINATAIRE (droite), séparés par une ligne verticale
 * - Tableau : entête en gras avec underline, border-bottom fin sur chaque ligne, fond blanc
 * - SOUS TOTAL en ligne dédiée, texte bold
 * - Totaux à droite : TOTAL HT / TVA / REMISE / TOTAL TTC — tirets pour valeurs nulles
 * - Montant en lettres sous les totaux
 * - Footer : Signature émetteur (gauche avec image) | Signature destinataire (droite) | GETBUDGETPILOT.COM + numéro de page
 */

import React, { Fragment } from 'react'
import {
  Document, Page, View, Text, Image, StyleSheet, pdf,
} from '@react-pdf/renderer'
import { amountToWords } from './MinimalPdfDocument'
import { STORAGE_BASE_URL } from '../../config/constants'
import { getTextColor, accentToBoxBg, accentToSubtotalBg, getSecondaryColor, mixWithWhite } from './pdfColorUtils'
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
    fontSize: 11,
    color: '#111',
    backgroundColor: '#fff',
    padding: 20,
  },
  // Cadre qui entoure tout le contenu de la facture
  frame: {
    flex: 1,
    border: '1.5px solid #111',
    padding: 32,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
    paddingBottom: 16,
  },
  logoBox: { width: 52, height: 52, backgroundColor: '#e0e0e0', borderRadius: 3 },
  logoImg: { width: 52, height: 52, objectFit: 'contain' },
  headerRight: { alignItems: 'flex-end', maxWidth: 280 },
  refNum: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#111' },
  docTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111', marginTop: 3 },
  docDate: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111', marginTop: 3 },

  // ── Émetteur / Destinataire ──
  partiesRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 0,
  },
  partyCol: { flex: 1, paddingRight: 16 },
  partySep: { width: 0, marginHorizontal: 16 },
  partyLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  partyDetail: { fontSize: 10, color: '#000', marginTop: 2, lineHeight: 1.5 },
  partyName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 2 },

  // ── Tableau ──
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1.5px solid #111',
    paddingBottom: 5,
    paddingHorizontal: 6,
    marginBottom: 0,
  },
  thText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  subtotalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderTop: '1.5px solid #111',
    borderBottom: '1.5px solid #111',
    marginTop: 2,
  },
  tdDesc:  { flex: 4, fontSize: 11 },
  tdQty:   { flex: 1, fontSize: 11, textAlign: 'center' },
  tdPrice: { flex: 2, fontSize: 11, textAlign: 'right' },
  tdTotal: { flex: 2, fontSize: 11, textAlign: 'right' },

  // ── Zone paiement + totaux ──
  bottomZone: { flexDirection: 'row', marginTop: 18, gap: 16 },
  paymentBox: { flex: 1 },
  paymentTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  paymentDetail: { fontSize: 10, color: '#444', marginTop: 2 },

  // Totaux alignés à droite
  totalsBox: { flex: 1 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsLabel: { fontSize: 11, color: '#333', fontFamily: 'Helvetica-Bold' },
  totalsValue: { fontSize: 11, color: '#333', textAlign: 'right', flex: 1 },
  totalsValueDash: { fontSize: 11, color: '#aaa', textAlign: 'right', flex: 1 },
  totalTTCRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    marginTop: 2,
  },
  totalTTCLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111' },
  totalTTCValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111', textAlign: 'right', flex: 1 },

  // Montant en lettres
  wordsRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap' },

  // ── Footer fixe ──
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
  },
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 10,
  },
  sigBox: { width: 160, alignItems: 'center' },
  sigLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  sigImg:   { maxHeight: 40, maxWidth: 140, objectFit: 'contain' },
  sigSpace: { height: 40 },
  footerBottom: {
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLink: { fontSize: 8, color: '#111', letterSpacing: 0.5 },
  pageNum:    { fontSize: 8, color: '#111', letterSpacing: 0.5 },
})

// ─── Composant Document ───────────────────────────────────────────────────────

export function ClassicPdfDocument({ doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0, accentColor = '#1E88E5', frameWidth = 1.5, noColor = false, fontChoice = 'helvetica' }) {
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

  // Agencement façon Prestige : la couleur principale pilote les fonds structurels
  // ET les SEULS libellés courts de section (ÉMETTEUR/DESTINATAIRE/Paiement/Signature,
  // footer) — les données elles-mêmes (nom, contact, statut, montants) restent en
  // noir/gris neutre, exactement comme sur Prestige. La secondaire sert d'accent sur
  // fond coloré et de fond clair pour le sous-total (comme l'or).
  const headerTextColor = noColor ? '#111' : getTextColor(accentColor)
  const labelColor      = noColor ? '#111' : accentColor
  // Couleur secondaire complémentaire (dérivée automatiquement) — fond du SOUS TOTAL
  const secondaryColor  = getSecondaryColor(accentColor)
  const secondaryBg     = mixWithWhite(secondaryColor, 0.35)

  // État "sans coloration" — reproduit le design d'origine (noir/blanc, sans fond coloré)
  const dynS = noColor ? {
    frame:         { ...S.frame, border: `${frameWidth}px solid #111` },
    tableHeader:   { ...S.tableHeader, borderBottom: `${frameWidth}px solid #111` },
    thText:        { ...S.thText, color: '#111' },
    subtotalRow:   { ...S.subtotalRow, borderTop: `${frameWidth}px solid #111`, borderBottom: `${frameWidth}px solid #111`, marginTop: 6, marginBottom: 6 },
    subtotalText:  { color: '#111', fontFamily: fontBold },
    sigLabel:      { ...S.sigLabel, color: '#111' },
    footerLink:    { ...S.footerLink, color: labelColor },
    pageNum:       { ...S.pageNum, color: labelColor },
  } : {
    frame:         { ...S.frame, border: `${frameWidth}px solid ${accentColor}` },
    tableHeader:   { ...S.tableHeader, borderBottom: `${frameWidth}px solid ${accentColor}`, backgroundColor: accentColor },
    thText:        { ...S.thText, color: headerTextColor },
    subtotalRow:   { ...S.subtotalRow, borderTop: `${frameWidth}px solid ${accentColor}`, borderBottom: `${frameWidth}px solid ${accentColor}`, backgroundColor: secondaryBg, marginTop: 6, marginBottom: 6 },
    subtotalText:  { color: accentColor, fontFamily: fontBold },
    sigLabel:      { ...S.sigLabel, color: '#111' },
    footerLink:    { ...S.footerLink, color: labelColor },
    pageNum:       { ...S.pageNum, color: labelColor },
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

  // ── Pagination : 16 lignes max sur la page 1, 22 sur les suivantes ──
  const ITEMS_PER_PAGE_1 = 16
  const ITEMS_PER_PAGE_N = 16

  // Aplatir toutes les lignes (items + sous-totaux catégorie)
  const flatRows = []
  groupEntries.forEach(([cat, catItems], gi) => {
    catItems.forEach(item => flatRows.push({ type: 'item', item, cat, gi }))
    if (showCatSubtotal) {
      const catTotal = catItems.reduce((s, i) => s + i._total, 0)
      flatRows.push({ type: 'subtotal', cat, catTotal, gi })
    }
  })

  // Découper en pages
  const pages = []
  let remaining = [...flatRows]
  let isFirstPage = true
  while (remaining.length > 0) {
    const limit = isFirstPage ? ITEMS_PER_PAGE_1 : ITEMS_PER_PAGE_N
    pages.push(remaining.slice(0, limit))
    remaining = remaining.slice(limit)
    isFirstPage = false
  }
  if (pages.length === 0) pages.push([])

  // Composant réutilisable : header tableau
  const TableHeader = () => (
    <View style={[dynS.tableHeader, { alignItems: 'center', minHeight: 26 }]}>
      <Text style={[dynS.thText, { flex: 4, textAlign: 'center' }]}>DESCRIPTION</Text>
      <Text style={[dynS.thText, { flex: 1, textAlign: 'center' }]}>QUANTITÉ</Text>
      <Text style={[dynS.thText, { flex: 2, textAlign: 'center' }]}>PRIX UNITAIRE</Text>
      <Text style={[dynS.thText, { flex: 2, textAlign: 'center' }]}>TOTAL [{currency}]</Text>
    </View>
  )

  // Composant footer
  const Footer = ({ showSignature = true }) => (
    <View style={S.footer}>
      {showSignature && (
        <View style={S.sigRow}>
          <View style={S.sigBox}>
            <Text style={dynS.sigLabel}>SIGNATURE ÉMETTEUR</Text>
            {signatureDataUrl
              ? <Image src={signatureDataUrl} style={S.sigImg} />
              : <View style={S.sigSpace} />
            }
          </View>
          <View style={S.sigBox}>
            <Text style={dynS.sigLabel}>SIGNATURE DESTINATAIRE</Text>
            <View style={S.sigSpace} />
          </View>
        </View>
      )}
      <View style={S.footerBottom}>
        <Text style={dynS.footerLink}>GETBUDGETPILOT.COM</Text>
        <Text style={dynS.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} fixed />
      </View>
    </View>
  )

  return (
    <Document>
      {pages.map((pageRows, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1
        return (
          <Page key={pageIdx} size="A4" style={S.page}>
            <View style={[dynS.frame, { flex: 1 }]}>

              {/* ── HEADER : toutes les pages ── */}
              <View style={[S.headerRow, { marginBottom: 10 }]}>
                    <View>
                      {logoDataUrl
                        ? <Image src={logoDataUrl} style={S.logoImg} />
                        : <View style={S.logoBox} />
                      }
                    </View>
                    <View style={S.headerRight}>
                      <Text style={S.refNum}>{doc.reference_number}</Text>
                      {doc.title && <Text style={S.docTitle}>{doc.title.toUpperCase()}</Text>}
                      <Text style={S.docDate}>{fmtDate(doc.issue_date || doc.created_at)}</Text>
                      {doc.due_date && <Text style={[S.docDate, { fontSize: 8 }]}>Éch. {fmtDate(doc.due_date)}</Text>}
                    </View>
                  </View>

                  <View style={[S.partiesRow, { marginBottom: 20 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[S.partyLabel, { color: '#111' }]}>ÉMETTEUR :</Text>
                      <Text style={S.partyName}>{company.name}</Text>
                      {!!company.phone   && <Text style={S.partyDetail}>{company.phone}</Text>}
                      {!!company.email   && <Text style={S.partyDetail}>{company.email}</Text>}
                      {!!company.address && <Text style={S.partyDetail}>{company.address}</Text>}
                      {!!company.nif     && <Text style={S.partyDetail}>NIF : {company.nif}</Text>}
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={[S.partyLabel, { color: '#111' }]}>DESTINATAIRE :</Text>
                      <Text style={S.partyName}>{client.name || '—'}</Text>
                      {!!client.phone   && <Text style={S.partyDetail}>{client.phone}</Text>}
                      {!!client.email   && <Text style={S.partyDetail}>{client.email}</Text>}
                      {!!client.address && <Text style={S.partyDetail}>{client.address}</Text>}
                    </View>
                  </View>

              {/* ── TABLEAU ── */}
              <TableHeader />

              {pageRows.map((row, ri) => {
                if (row.type === 'subtotal') {
                  return (
                    <View key={`sub-${ri}`} style={dynS.subtotalRow}>
                      <Text style={[S.tdDesc, { flex: 7 }, dynS.subtotalText]}>SOUS TOTAL{row.cat ? ` ${row.cat}` : ''}</Text>
                      <Text style={[S.tdTotal, dynS.subtotalText]}>{fmt(row.catTotal * cr)}</Text>
                    </View>
                  )
                }
                return (
                  <View key={ri} style={S.tableRow}>
                    <Text style={S.tdDesc}>{row.item.description}</Text>
                    <Text style={S.tdQty}>{row.item.quantity}</Text>
                    <Text style={S.tdPrice}>{fmt(toNum(row.item.unit_price) * cr)}</Text>
                    <Text style={S.tdTotal}>{fmt(row.item._total * cr)}</Text>
                  </View>
                )
              })}

              {/* ── SOUSTOTAL GLOBAL + TOTAUX + FOOTER : dernière page seulement ── */}
              {isLastPage && (
                <>
                  {!showCatSubtotal && (
                    <View style={dynS.subtotalRow}>
                      <Text style={[S.tdDesc, { flex: 7 }, dynS.subtotalText]}>SOUS TOTAL</Text>
                      <Text style={[S.tdTotal, dynS.subtotalText]}>{fmt((subtotalBefore - totalDiscount) * cr)}</Text>
                    </View>
                  )}

                  <View style={S.bottomZone}>
                    <View style={S.paymentBox}>
                      <Text style={[S.paymentTitle, { color: '#111' }]}>Paiement</Text>
                      <Text style={S.paymentDetail}>Statut : {statusLabel(doc.status)}</Text>
                      {!!doc.due_date && <Text style={S.paymentDetail}>Échéance : {fmtDate(doc.due_date)}</Text>}
                    </View>
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
                        <Text style={S.totalsLabel}>TVA :</Text>
                        {doc.has_tva
                          ? <Text style={S.totalsValue}>{fmt(tvaAmount * cr)}</Text>
                          : <Text style={S.totalsValueDash}>00,00</Text>
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

              {/* ── FOOTER : toutes les pages ── */}
              <View style={[S.footer, { marginTop: 'auto' }]}>
                <Footer showSignature={isLastPage || pages.length === 1} />
              </View>

            </View>
          </Page>
        )
      })}
    </Document>
  )
}

// ─── Preview HTML ─────────────────────────────────────────────────────────────

export function ClassicTemplate({ doc, profile, currency = 'XOF', conversionRate = 1.0, accentColor = '#1E88E5', frameWidth = 1.5 }) {
  const storageBase = STORAGE_BASE_URL || ''
  const headerTextColor = getTextColor(accentColor)
  const labelColor      = accentColor
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
  const cr     = conversionRate || 1.0
  const toNum  = v => isNaN(parseFloat(v)) ? 0 : parseFloat(v)

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

  const logoUrl      = profile?.logo_path ? `${storageBase}/${profile.logo_path}` : null
  const signatureUrl = profile?.signature_path && profile.signature_path !== '0'
    ? `${storageBase}/${profile.signature_path}` : null

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
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', color: '#111',
      background: '#fff', width: '794px',
      boxSizing: 'border-box',
      border: `${frameWidth}px solid ${accentColor}`,
      margin: '20px auto',
    }}>
      {/* Contenu intérieur avec padding uniforme */}
      <div style={{ padding: '32px', minHeight: '1059px', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER : logo gauche + ref droite */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', display: 'block' }} />
            : <div style={{ width: 60, height: 60, background: '#e0e0e0' }} />
          }
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 'bold', letterSpacing: '-0.5px', color: labelColor }}>{doc.reference_number}</div>
          {doc.title && <div style={{ fontSize: 11, fontWeight: 'bold', color: labelColor, marginTop: 4 }}>{doc.title.toUpperCase()}</div>}
          <div style={{ fontSize: 12, fontWeight: 'bold', color: labelColor, marginTop: 4 }}>{fmtD(doc.issue_date || doc.created_at)}</div>
          {doc.due_date && <div style={{ fontSize: 11, fontWeight: 'bold', color: labelColor, marginTop: 2 }}>Éch. {fmtD(doc.due_date)}</div>}
        </div>
      </div>

      {/* ÉMETTEUR / DESTINATAIRE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, color: '#111' }}>ÉMETTEUR :</div>
          <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 3, color: labelColor }}>{company.name}</div>
          {company.address && <div style={{ fontSize: 11, color: labelColor, lineHeight: '1.6' }}>{company.address}</div>}
          {company.phone   && <div style={{ fontSize: 11, color: labelColor, lineHeight: '1.6' }}>{company.phone}</div>}
          {company.email   && <div style={{ fontSize: 11, color: labelColor, lineHeight: '1.6' }}>{company.email}</div>}
          {company.nif     && <div style={{ fontSize: 11, color: labelColor, lineHeight: '1.6' }}>NIF: {company.nif}</div>}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, color: '#111' }}>DESTINATAIRE :</div>
          <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 3, color: labelColor }}>{client.name || '—'}</div>
          {client.phone   && <div style={{ fontSize: 11, color: labelColor, lineHeight: '1.6' }}>{client.phone}</div>}
          {client.email   && <div style={{ fontSize: 11, color: labelColor, lineHeight: '1.6' }}>{client.email}</div>}
          {client.address && <div style={{ fontSize: 11, color: labelColor, lineHeight: '1.6' }}>{client.address}</div>}
        </div>
      </div>

      {/* TABLEAU */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
        <thead>
          <tr style={{ borderBottom: `${frameWidth}px solid ${accentColor}`, backgroundColor: accentColor }}>
            {[['DESCRIPTION', 'center'], ['QUANTITÉ', 'center'], ['PRIX UNITAIRE', 'center'], [`TOTAL [${currency}]`, 'center']].map(([label, align], i) => (
              <th key={i} style={{ textAlign: align, verticalAlign: 'middle', padding: '8px', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.3px', color: headerTextColor, height: 32 }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([cat, catItems], gi) => {
            const catTotal = catItems.reduce((s, i) => s + i._total, 0)
            return (
              <Fragment key={gi}>
                {catItems.map((item, ii) => (
                  <tr key={`${gi}-${ii}`}>
                    <td style={{ padding: '8px', fontSize: 11 }}>{item.description}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: 11 }}>{item.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: 11 }}>{fmt(toNum(item.unit_price) * cr)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: 11 }}>{fmt(item._total * cr)}</td>
                  </tr>
                ))}
                {showCatSubtotal && (
                  <>
                    <tr><td colSpan={4} style={{ height: 6, padding: 0, border: 'none' }}></td></tr>
                    <tr key={`sub-${gi}`} style={{ borderTop: `${frameWidth}px solid ${accentColor}`, borderBottom: `${frameWidth}px solid ${accentColor}`, backgroundColor: subtotalBgHtml }}>
                      <td colSpan={3} style={{ padding: '8px', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', color: accentColor }}>SOUS TOTAL {showCatSubtotal ? cat : ''}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: 11, color: accentColor }}>{fmt(catTotal * cr)}</td>
                    </tr>
                    <tr><td colSpan={4} style={{ height: 6, padding: 0, border: 'none' }}></td></tr>
                  </>
                )}
              </Fragment>
            )
          })}
          {!showCatSubtotal && (
            <>
              <tr><td colSpan={4} style={{ height: 6, padding: 0, border: 'none' }}></td></tr>
              <tr style={{ borderTop: `${frameWidth}px solid ${accentColor}`, borderBottom: `${frameWidth}px solid ${accentColor}`, backgroundColor: subtotalBgHtml }}>
                <td colSpan={3} style={{ padding: '8px', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', color: accentColor }}>SOUS TOTAL</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: 11, color: accentColor }}>{fmt((subtotalBefore - totalDiscount) * cr)}</td>
              </tr>
              <tr><td colSpan={4} style={{ height: 6, padding: 0, border: 'none' }}></td></tr>
            </>
          )}
        </tbody>
      </table>

      {/* TOTAUX + PAIEMENT */}
      <div style={{ display: 'flex', marginTop: 20, gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 5, color: '#111' }}>Paiement</div>
          <div style={{ fontSize: 11, color: labelColor }}>Statut : {sL(doc.status)}</div>
          {doc.due_date && <div style={{ fontSize: 11, color: labelColor }}>Échéance : {fmtD(doc.due_date)}</div>}
        </div>
        <div style={{ flex: 1 }}>
          {[
            ['SOUS-TOTAL GLOBAL :', fmt(subtotalBefore * cr)],
            ['REMISE :', totalDiscount > 0 ? `- ${fmt(totalDiscount * cr)}` : '-'],
            ['TVA :', doc.has_tva ? fmt(tvaAmount * cr) : '00,00'],
          ].map(([label, value], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: labelColor }}>{label}</span>
              <span style={{ fontSize: 12, color: labelColor, minWidth: 90, textAlign: 'right' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 'bold', color: labelColor }}>TOTAL TTC :</span>
            <span style={{ fontSize: 14, fontWeight: 'bold', minWidth: 90, textAlign: 'right', color: labelColor }}>{fmt(total)}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: '#444', fontStyle: 'italic', textAlign: 'right' }}>
            Arrêtée la présente facture à la somme de : {amountToWords(total, currency)}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ width: 160, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8, color: '#111' }}>SIGNATURE ÉMETTEUR</div>
            {signatureUrl
              ? <img src={signatureUrl} alt="Signature" style={{ maxHeight: 44, maxWidth: 140, objectFit: 'contain' }} />
              : <div style={{ height: 44 }} />
            }
          </div>
          <div style={{ width: 160, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8, color: '#111' }}>SIGNATURE DESTINATAIRE</div>
            <div style={{ height: 44 }} />
          </div>
        </div>
        <div style={{ paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: labelColor, letterSpacing: '0.5px' }}>GETBUDGETPILOT.COM</span>
          <span style={{ fontSize: 9, color: labelColor }}>1/1</span>
        </div>
      </div>

      </div>{/* fin padding intérieur */}
    </div>
  )
}

// ─── Génération blob ──────────────────────────────────────────────────────────

export async function generateClassicPdfBlob(doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0, customization = {}) {
  const { accentColor = '#1E88E5', frameWidth = 1.5, noColor = false, fontChoice = 'helvetica' } = customization
  return pdf(
    <ClassicPdfDocument
      doc={doc} profile={profile}
      qrDataUrl={qrDataUrl} logoDataUrl={logoDataUrl}
      signatureDataUrl={signatureDataUrl} logoBbDataUrl={logoBbDataUrl}
      currency={currency} conversionRate={conversionRate}
      accentColor={accentColor} frameWidth={frameWidth} noColor={noColor} fontChoice={fontChoice}
    />
  ).toBlob()
}

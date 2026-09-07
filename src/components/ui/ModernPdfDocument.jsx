/**
 * ModernPdfDocument — Template PDF "Modern"
 *
 * Design (d'après screenshot) :
 * - Header : nom société très grand et gras (24px+) à gauche, adresse société petite à droite
 * - Petits carrés décoratifs colorés (5 points/carrés en ligne) sous le nom société
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

// Couleur accent du template Modern
const ACCENT = '#888888'
const ACCENT_LIGHT = '#f0f0f0'

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111',
    backgroundColor: '#fff',
    paddingTop: 28,
    paddingBottom: 115,
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
  companyAddrLine: { fontSize: 8, color: '#666', marginTop: 1 },

  // Petits carrés décoratifs
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: ACCENT,
    borderRadius: 1,
  },
  dotLight: {
    width: 8,
    height: 8,
    backgroundColor: ACCENT_LIGHT,
    borderRadius: 1,
    border: `1px solid ${ACCENT}`,
  },

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
  infoBoxSubtitle: { fontSize: 10, color: '#111', marginBottom: 4, lineHeight: 1.6 },
  infoBoxDate: { fontSize: 9, color: '#111', marginTop: 3 },
  infoBoxName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 5 },
  infoBoxDetail: { fontSize: 9, color: '#111', marginTop: 3, lineHeight: 1.6 },

  // ── Tableau ──
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1.5px solid #111',
    paddingBottom: 5,
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
    borderBottom: '1px solid #ebebeb',
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
    borderTop: '1px solid #ccc',
  },
  tdDesc:  { flex: 4, fontSize: 10 },
  tdQty:   { flex: 1, fontSize: 10, textAlign: 'center' },
  tdPrice: { flex: 2, fontSize: 10, textAlign: 'right' },
  tdTotal: { flex: 2, fontSize: 10, textAlign: 'right' },

  // ── Zone totaux + paiement ──
  bottomZone: { flexDirection: 'row', marginTop: 20, gap: 16 },
  paymentBox: { flex: 1 },
  paymentTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  paymentDetail: { fontSize: 9, color: '#555', marginTop: 2 },

  totalsBox: { width: 230 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsLabel: { fontSize: 10, color: '#333', fontFamily: 'Helvetica-Bold' },
  totalsValue: { fontSize: 10, color: '#333' },
  totalsValueDash: { fontSize: 10, color: '#bbb' },
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

  // ── Footer fixe ──
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 36, paddingBottom: 18,
  },
  footerLine: {
    borderTop: '1px solid #ddd',
    paddingTop: 12,
  },
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  // Paiement footer (gauche)
  footerPayBox: { width: 160 },
  footerPayTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  footerPayDetail: { fontSize: 8, color: '#555', marginTop: 1 },
  // Sig boxes
  sigBox: { width: 150, alignItems: 'center' },
  sigLabel: {
    fontSize: 9,
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  sigImg:   { maxHeight: 40, maxWidth: 130, objectFit: 'contain' },
  sigSpace: { height: 40 },
  footerBottom: {
    borderTop: '1px solid #ddd',
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLink: { fontSize: 8, color: '#aaa', letterSpacing: 0.5 },
  pageNum: { fontSize: 8, color: '#aaa' },
})

// ─── Composant Document ───────────────────────────────────────────────────────

export function ModernPdfDocument({ doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0 }) {
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
  const subtotalHT    = (subtotalBefore - totalDiscount) * cr

  // Grouper par catégorie
  const grouped = {}
  itemsWithTotal.forEach(item => {
    const cat = item.category || 'Articles'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })
  const groupEntries    = Object.entries(grouped)
  const showCatSubtotal = groupEntries.length > 1

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* ── HEADER : nom société grand à gauche, adresse droite ── */}
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

        {/* ── Logo à la place des carrés ── */}
        <View style={{ marginBottom: 16, marginTop: 4 }}>
          {logoDataUrl
            ? <Image src={logoDataUrl} style={{ width: 50, height: 50, objectFit: 'contain' }} />
            : <View style={{ width: 50, height: 50, backgroundColor: '#e0e0e0', borderRadius: 3 }} />
          }
        </View>

        {/* ── 2 BOXES : Référence | Destinataire ── */}
        <View style={S.infoRow}>
          {/* Box référence */}
          <View style={[S.infoBox, { flex: 1 }]}>
            <Text style={S.infoBoxRef}>{doc.reference_number}</Text>
            {doc.title && <Text style={S.infoBoxSubtitle}>{doc.title.toUpperCase()}</Text>}
            <Text style={S.infoBoxDate}>{fmtDate(doc.issue_date || doc.created_at)}</Text>
            {doc.due_date && <Text style={[S.infoBoxDate, { marginTop: 2 }]}>Éch. {fmtDate(doc.due_date)}</Text>}
          </View>

          {/* Box destinataire */}
          <View style={[S.infoBox, { flex: 1.5 }]}>
            <Text style={S.infoBoxLabel}>DESTINATAIRE :</Text>
            <Text style={S.infoBoxName}>{client.name || '—'}</Text>
            {!!client.address && <Text style={S.infoBoxDetail}>{client.address}</Text>}
            {!!client.phone   && <Text style={S.infoBoxDetail}>{client.phone}</Text>}
            {!!client.email   && <Text style={S.infoBoxDetail}>{client.email}</Text>}
          </View>
        </View>

        {/* ── TABLEAU ── */}
        <View style={S.tableHeader}>
          <Text style={[S.thText, { flex: 4 }]}>Description :</Text>
          <Text style={[S.thText, { flex: 1, textAlign: 'center' }]}>Quantité :</Text>
          <Text style={[S.thText, { flex: 2, textAlign: 'right' }]}>Prix Unitaire</Text>
          <Text style={[S.thText, { flex: 2, textAlign: 'right' }]}>Total [{currency}]</Text>
        </View>

        {groupEntries.map(([cat, catItems], gi) => {
          const catTotal    = catItems.reduce((s, i) => s + i._total, 0)
          const isLastGroup = gi === groupEntries.length - 1

          return (
            <View key={gi}>
              {catItems.map((item, ii) => {
                const isLastInGroup = ii === catItems.length - 1
                const isVeryLast    = isLastGroup && isLastInGroup && !showCatSubtotal
                return (
                  <View key={ii} style={isVeryLast ? S.tableRowLast : S.tableRow}>
                    <Text style={S.tdDesc}>{item.description}</Text>
                    <Text style={S.tdQty}>{item.quantity}</Text>
                    <Text style={S.tdPrice}>{fmt(toNum(item.unit_price) * cr)}</Text>
                    <Text style={S.tdTotal}>{fmt(item._total * cr)}</Text>
                  </View>
                )
              })}
              {showCatSubtotal && (
                <View style={S.subtotalRow}>
                  <Text style={[S.tdDesc, { flex: 7, fontFamily: 'Helvetica-Bold' }]}>SOUS TOTAL</Text>
                  <Text style={[S.tdTotal, { fontFamily: 'Helvetica-Bold' }]}>{fmt(catTotal * cr)}</Text>
                </View>
              )}
            </View>
          )
        })}

        {/* SOUS TOTAL global si 1 seule catégorie */}
        {!showCatSubtotal && (
          <View style={S.subtotalRow}>
            <Text style={[S.tdDesc, { flex: 7, fontFamily: 'Helvetica-Bold' }]}>SOUS TOTAL</Text>
            <Text style={[S.tdTotal, { fontFamily: 'Helvetica-Bold' }]}>{fmt((subtotalBefore - totalDiscount) * cr)}</Text>
          </View>
        )}

        {/* ── ZONE TOTAUX + PAIEMENT ── */}
        <View style={S.bottomZone}>
          <View style={S.paymentBox}>
            <Text style={S.paymentTitle}>Paiement</Text>
            <Text style={S.paymentDetail}>Statut : {statusLabel(doc.status)}</Text>
            {!!doc.due_date && <Text style={S.paymentDetail}>Échéance : {fmtDate(doc.due_date)}</Text>}
          </View>

          <View style={S.totalsBox}>
            <View style={S.totalsRow}>
              <Text style={S.totalsLabel}>TOTAL HT :</Text>
              <Text style={S.totalsValue}>{fmt(subtotalHT)}</Text>
            </View>
            <View style={S.totalsRow}>
              <Text style={S.totalsLabel}>TVA {doc.has_tva ? tvaRate : 0}% :</Text>
              {doc.has_tva
                ? <Text style={S.totalsValue}>{fmt(tvaAmount * cr)}</Text>
                : <Text style={S.totalsValueDash}>-</Text>
              }
            </View>
            <View style={S.totalsRow}>
              <Text style={S.totalsLabel}>REMISE :</Text>
              {totalDiscount > 0
                ? <Text style={S.totalsValue}>- {fmt(totalDiscount * cr)}</Text>
                : <Text style={S.totalsValueDash}>-</Text>
              }
            </View>
            <View style={S.totalTTCRow}>
              <Text style={S.totalTTCLabel}>TOTAL TTC :</Text>
              <Text style={S.totalTTCValue}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* Montant en lettres */}
        <View style={S.wordsRow}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Oblique', color: '#444' }}>
            {amountToWords(total, currency)}
          </Text>
        </View>

        {/* ── FOOTER FIXE ── */}
        <View style={S.footer} fixed>
          <View style={S.footerLine}>
            <View style={S.sigRow}>
              {/* Pas de paiement dans le footer — déjà dans le corps */}
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
            <View style={S.footerBottom}>
              <Text style={S.footerLink}>GETBUDGETPILOT.COM</Text>
              {!!company.nif && <Text style={S.footerLink}>NIF : {company.nif}</Text>}
              <Text style={S.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}

// ─── Preview HTML ─────────────────────────────────────────────────────────────

export function ModernTemplate({ doc, profile, currency = 'XOF', conversionRate = 1.0 }) {
  const storageBase = STORAGE_BASE_URL || ''

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
  const subtotalHT    = (subtotalBefore - totalDiscount) * cr

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
          <div style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: '0.3px' }}>{company.name.toUpperCase()}</div>
        </div>
        <div style={{ textAlign: 'right', marginTop: 4 }}>
          <div style={{ fontSize: 8, color: '#666' }}>{company.name}</div>
          {company.address && <div style={{ fontSize: 8, color: '#666' }}>{company.address}</div>}
          {company.phone   && <div style={{ fontSize: 8, color: '#666' }}>{company.phone}</div>}
          {company.nif     && <div style={{ fontSize: 8, color: '#666' }}>NIF : {company.nif}</div>}
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
        <div style={{ flex: 1, border: '1px solid #111', borderRadius: 32, padding: '12px 14px' }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>{doc.reference_number}</div>
          {doc.title && <div style={{ fontSize: 10, color: '#111', marginBottom: 4, lineHeight: 1.6 }}>{doc.title.toUpperCase()}</div>}
          <div style={{ fontSize: 9, color: '#111', marginTop: 4 }}>{fmtD(doc.issue_date || doc.created_at)}</div>
          {doc.due_date && <div style={{ fontSize: 9, color: '#111', marginTop: 4 }}>Éch. {fmtD(doc.due_date)}</div>}
        </div>

        {/* Box destinataire */}
        <div style={{ flex: 1.5, border: '1px solid #111', borderRadius: 32, padding: '12px 14px' }}>
          <div style={{ fontSize: 9, color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>DESTINATAIRE :</div>
          <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>{client.name || '—'}</div>
          {client.address && <div style={{ fontSize: 9, color: '#111', marginTop: 4, lineHeight: 1.6 }}>{client.address}</div>}
          {client.phone   && <div style={{ fontSize: 9, color: '#111', marginTop: 4, lineHeight: 1.6 }}>{client.phone}</div>}
          {client.email   && <div style={{ fontSize: 9, color: '#111', marginTop: 4, lineHeight: 1.6 }}>{client.email}</div>}
        </div>
      </div>

      {/* TABLEAU */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #111' }}>
            <th style={{ textAlign: 'left',   padding: '0 6px 5px', fontSize: 9, fontWeight: 'bold' }}>Description :</th>
            <th style={{ textAlign: 'center', padding: '0 6px 5px', fontSize: 9, fontWeight: 'bold' }}>Quantité :</th>
            <th style={{ textAlign: 'right',  padding: '0 6px 5px', fontSize: 9, fontWeight: 'bold' }}>Prix Unitaire</th>
            <th style={{ textAlign: 'right',  padding: '0 6px 5px', fontSize: 9, fontWeight: 'bold' }}>Total [{currency}]</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([cat, catItems], gi) => {
            const catTotal = catItems.reduce((s, i) => s + i._total, 0)
            return (
              <>
                {catItems.map((item, ii) => (
                  <tr key={`${gi}-${ii}`} style={{ borderBottom: '1px solid #ebebeb' }}>
                    <td style={{ padding: '7px 6px', fontSize: 10 }}>{item.description}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: 10 }}>{item.quantity}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: 10 }}>{fmt(toNumL(item.unit_price) * cr)}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: 10 }}>{fmt(item._total * cr)}</td>
                  </tr>
                ))}
                {showCatSubtotal && (
                  <tr key={`sub-${gi}`} style={{ borderTop: '1px solid #ccc' }}>
                    <td colSpan={3} style={{ padding: '6px', fontWeight: 'bold', fontSize: 10 }}>SOUS TOTAL</td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: 10 }}>{fmt(catTotal * cr)}</td>
                  </tr>
                )}
              </>
            )
          })}
          {/* SOUS TOTAL global */}
          {!showCatSubtotal && (
            <tr style={{ borderTop: '1px solid #ccc' }}>
              <td colSpan={3} style={{ padding: '6px', fontWeight: 'bold', fontSize: 10 }}>SOUS TOTAL</td>
              <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: 10 }}>{fmt((subtotalBefore - totalDiscount) * cr)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* TOTAUX + PAIEMENT */}
      <div style={{ display: 'flex', marginTop: 20, gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>Paiement</div>
          <div style={{ fontSize: 9, color: '#555' }}>Statut : {sL(doc.status)}</div>
          {doc.due_date && <div style={{ fontSize: 9, color: '#555' }}>Échéance : {fmtD(doc.due_date)}</div>}
        </div>
        <div style={{ width: 230 }}>
          {[
            [`TOTAL HT :`, fmt(subtotalHT), false],
            [`TVA ${doc.has_tva ? tvaRate : 0}% :`, doc.has_tva ? fmt(tvaAmount * cr) : '-', !doc.has_tva],
            [`REMISE :`, totalDiscount > 0 ? `- ${fmt(totalDiscount * cr)}` : '-', totalDiscount === 0],
          ].map(([label, value, isDash], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: 10, fontWeight: 'bold' }}>{label}</span>
              <span style={{ fontSize: 10, color: isDash ? '#bbb' : '#333' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 'bold' }}>TOTAL TTC :</span>
            <span style={{ fontSize: 12, fontWeight: 'bold' }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* MONTANT EN LETTRES */}
      <div style={{ marginTop: 10, fontSize: 9, color: '#444', fontStyle: 'italic' }}>
        {amountToWords(total, currency)}
      </div>

      {/* FOOTER */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 36px 18px' }}>
        <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ width: 150, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#333', marginBottom: 6 }}>Signature émetteur</div>
              {signatureUrl
                ? <img src={signatureUrl} alt="Signature" style={{ maxHeight: 40, maxWidth: 130, objectFit: 'contain' }} />
                : <div style={{ height: 40 }} />
              }
            </div>
            <div style={{ width: 150, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#333', marginBottom: 6 }}>Signature destinataire</div>
              <div style={{ height: 40 }} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid #ddd', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: '#aaa', letterSpacing: 0.5 }}>GETBUDGETPILOT.COM</span>
            {company.nif && <span style={{ fontSize: 8, color: '#aaa' }}>NIF : {company.nif}</span>}
            <span style={{ fontSize: 8, color: '#aaa' }}>1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Génération blob ──────────────────────────────────────────────────────────

export async function generateModernPdfBlob(doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0) {
  return pdf(
    <ModernPdfDocument
      doc={doc} profile={profile}
      qrDataUrl={qrDataUrl} logoDataUrl={logoDataUrl}
      signatureDataUrl={signatureDataUrl} logoBbDataUrl={logoBbDataUrl}
      currency={currency} conversionRate={conversionRate}
    />
  ).toBlob()
}

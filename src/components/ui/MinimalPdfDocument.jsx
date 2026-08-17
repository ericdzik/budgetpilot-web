/**
 * MinimalPdfDocument — Template PDF "Minimal" généré via @react-pdf/renderer
 *
 * Reproduction EXACTE du MinimalTemplate HTML utilisé pour l'aperçu.
 * Ce fichier est la source de vérité pour le PDF téléchargé/partagé.
 *
 * RÈGLES (voir regles-ux.md) :
 * - Ne pas modifier la structure sans modifier l'aperçu HTML en même temps
 * - Le bloc total (Sous-total / Remise / TVA / Total) est positionné en
 *   absolute à droite de la zone "Paiement" — c'est le design voulu
 */

import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '0'
  const num = Number(n)
  // Si le nombre a des décimales significatives (montants convertis en petite devise),
  // garder 2 décimales. Sinon, arrondir à l'entier.
  const rounded = Math.abs(num) < 1000 && num !== Math.round(num)
    ? parseFloat(num.toFixed(2))
    : Math.round(num)
  const parts = rounded.toFixed(Math.abs(num) < 1000 && num !== Math.round(num) ? 2 : 0)
    .split('.')
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return parts[1] && parts[1] !== '00' ? `${intPart},${parts[1]}` : intPart
}

// Formater un montant avec le symbole de devise (logique sans store React)
function fmtCurrency(amount, currencyCode = 'XOF') {
  const code = (currencyCode || 'XOF').toUpperCase()
  const num = Number(amount) || 0

  const SYMBOLS = {
    XOF: 'FCFA', XAF: 'FCFA',
    USD: '$',    EUR: '€',     GBP: '£',
    JPY: '¥',    CNY: '¥',     CHF: 'Fr',
    CAD: 'CA$',  AUD: 'A$',    NZD: 'NZ$',
    NGN: '₦',    GHS: '₵',     KES: 'KSh',
    ZAR: 'R',    EGP: '£',     MAD: 'DH',
    DZD: 'DA',   TND: 'DT',    INR: '₹',
    BRL: 'R$',   MXN: '$',     RUB: '₽',
    SAR: '﷼',    AED: 'د.إ',   TRY: '₺',
    KRW: '₩',    THB: '฿',     SGD: 'S$',
    HKD: 'HK$',  SEK: 'kr',    NOK: 'kr',
    DKK: 'kr',   PLN: 'zł',    CZK: 'Kč',
    HUF: 'Ft',   RON: 'lei',   UAH: '₴',
    IDR: 'Rp',   MYR: 'RM',    PHP: '₱',
    VND: '₫',    PKR: '₨',     BDT: '৳',
    ILS: '₪',    CDF: 'FC',    GNF: 'FG',
    UGX: 'USh',  TZS: 'TSh',   ZMW: 'K',
    ETB: 'Br',
  }

  if (code === 'XOF' || code === 'XAF') {
    return `${fmt(Math.round(num))} FCFA`
  }

  const noDecimal = ['JPY', 'KRW', 'VND', 'IDR', 'UGX', 'TZS', 'GNF', 'MMK']
  const sym = SYMBOLS[code] || code

  if (noDecimal.includes(code)) {
    return `${fmt(Math.round(num))} ${sym}`
  }

  const formatted = num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const symbolAfter = ['EUR', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON']
  if (symbolAfter.includes(code)) return `${formatted} ${sym}`
  return `${sym}${formatted}`
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    const day   = String(dt.getDate()).padStart(2, '0')
    const month = String(dt.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}/${dt.getFullYear()}`
  } catch { return String(d) }
}

function statusLabel(s) {
  const m = { paid: 'Payée', partially_paid: 'Part. payée', sent: 'Envoyée', overdue: 'En retard', draft: 'Brouillon' }
  return m[s] || s || '—'
}

function toNum(v) {
  return isNaN(parseFloat(v)) ? 0 : parseFloat(v)
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000',
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 110, // espace pour le footer fixe
    paddingHorizontal: 24,
  },

  // ── Header 3 colonnes ──
  headerRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  headerCol: {
    flex: 1,
  },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    marginBottom: 6,
  },
  logoImg: {
    width: 44,
    height: 44,
    objectFit: 'contain',
    marginBottom: 6,
  },
  refNum: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000',
  },
  refSmall: {
    fontSize: 9,
    color: '#555',
    marginTop: 1,
  },
  companyName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000',
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 9,
    color: '#444',
    marginTop: 1,
  },

  // ── En-tête tableau ──
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  thText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Corps tableau ──
  tableBody: {
    borderLeft: '1.5px solid #000',
    borderRight: '1.5px solid #000',
    borderBottom: '1.5px solid #000',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottom: '1px solid #f0f0f0',
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  subtotalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
  },
  tdDesc: { flex: 4, fontSize: 10, paddingLeft: 6 },
  tdQty:  { flex: 1, fontSize: 10, textAlign: 'center' },
  tdPrice:{ flex: 2, fontSize: 10, textAlign: 'center' },
  tdTotal:{ flex: 2, fontSize: 10, textAlign: 'right', paddingRight: 8 },

  // ── Zone Paiement + Totaux ──
  footerZone: {
    flexDirection: 'row',
    minHeight: 70,
    position: 'relative',
  },
  paymentBox: {
    flex: 1,
    padding: 10,
  },
  paymentTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  paymentDetail: {
    fontSize: 9,
    color: '#444',
    marginTop: 1,
  },
  // Bloc totaux — position absolute à droite, reproduit la superposition
  totalsBox: {
    position: 'absolute',
    bottom: -30,
    right: 20,
    width: 210,
    border: '2px solid #000',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  totalsInner: {
    padding: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: { fontSize: 10, color: '#000' },
  totalValue: { fontSize: 10, color: '#000' },
  totalFinalBar: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalFinalLabel: { fontSize: 11, color: '#fff', fontFamily: 'Helvetica-Bold' },
  totalFinalValue: { fontSize: 11, color: '#fff', fontFamily: 'Helvetica-Bold' },

  // ── Footer fixe ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 24,
    marginTop: 8,
  },
  sigBox: {
    width: 180,
    alignItems: 'center',
  },
  sigLabel: { fontSize: 10, color: '#000', marginBottom: 4 },
  sigImg:   { maxHeight: 44, maxWidth: 160, objectFit: 'contain' },
  sigSpace: { height: 44 },
  brandingBar: {
    borderTop: '1px solid #ddd',
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  brandingLeft: {
    flexDirection: 'column',
    gap: 4,
  },
  brandingConcuPar: { fontSize: 14, color: '#000' },
  brandingPilotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandingLogoImg: { width: 28, height: 28, objectFit: 'contain' },
  brandingPilot: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#000' },
  brandingDivider: { width: 1, height: 56, backgroundColor: '#e0e0e0' },
  brandingQrArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qrImg: { width: 60, height: 60 },
  brandingLink: { fontSize: 14, color: '#1E88E5', textDecoration: 'underline' },
  brandingNif:  { fontSize: 14, color: '#555', marginLeft: 8 },
  pageNum: { marginLeft: 'auto', fontSize: 14, color: '#888' },
})

// ─── Composant Document ───────────────────────────────────────────────────────

export function MinimalPdfDocument({ doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0 }) {
  const company = {
    name:    profile?.company_name    || profile?.name    || 'Mon Entreprise',
    address: profile?.company_address || '',
    phone:   profile?.professional_phone || profile?.phone || '',
    nif:     profile?.nif || '',
  }

  const client = doc.client || {}
  const items  = doc.items  || []

  // Calculs identiques au MinimalTemplate HTML
  const itemsWithTotal = items.map(i => ({
    ...i,
    _total: (i.total != null && !isNaN(i.total))
      ? toNum(i.total)
      : toNum(i.quantity) * toNum(i.unit_price),
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

  // Devise du document — pas de conversion
  const cr = conversionRate || 1.0
  const subtotalBeforeConverted = subtotalBefore * cr
  const totalDiscountConverted  = totalDiscount * cr
  const tvaAmountConverted      = tvaAmount * cr
  const total = totalRaw * cr

  // Grouper par catégorie
  const grouped = {}
  itemsWithTotal.forEach(item => {
    const cat = item.category || 'Articles'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })
  const groupEntries   = Object.entries(grouped)
  const showCatSubtotal = groupEntries.length > 1

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* ── HEADER ── */}
        <View style={S.headerRow}>
          {/* Col 1 : Logo + Ref */}
          <View style={S.headerCol}>
            {logoDataUrl
              ? <Image src={logoDataUrl} style={S.logoImg} />
              : <View style={S.logoBox} />
            }
            <Text style={S.refNum}>{doc.reference_number}</Text>
            <Text style={S.refSmall}>{fmtDate(doc.issue_date || doc.created_at)}</Text>
            {doc.due_date && <Text style={S.refSmall}>Éch. {fmtDate(doc.due_date)}</Text>}
          </View>

          {/* Col 2 : Émetteur */}
          <View style={S.headerCol}>
            <Text style={S.companyName}>{company.name}</Text>
            {!!company.phone   && <Text style={S.companyDetail}>{company.phone}</Text>}
            {!!company.address && <Text style={S.companyDetail}>{company.address}</Text>}
            {!!company.nif     && <Text style={S.companyDetail}>NIF : {company.nif}</Text>}
          </View>

          {/* Col 3 : Destinataire */}
          <View style={S.headerCol}>
            <Text style={S.companyName}>{client.name || '—'}</Text>
            {!!client.phone   && <Text style={S.companyDetail}>{client.phone}</Text>}
            {!!client.email   && <Text style={S.companyDetail}>{client.email}</Text>}
            {!!client.address && <Text style={S.companyDetail}>{client.address}</Text>}
          </View>
        </View>

        {/* ── TABLEAU ── */}
        {/* En-tête noir arrondi */}
        <View style={S.tableHeader}>
          <Text style={[S.thText, { flex: 4, paddingLeft: 6 }]}>Description</Text>
          <Text style={[S.thText, { flex: 1, textAlign: 'center' }]}>QTÉ</Text>
          <Text style={[S.thText, { flex: 2, textAlign: 'center' }]}>Prix unitaire</Text>
          <Text style={[S.thText, { flex: 2, textAlign: 'right', paddingRight: 8 }]}>Total ({currency})</Text>
        </View>

        {/* Corps */}
        <View style={S.tableBody}>
          {groupEntries.map(([cat, catItems], gi) => {
            const catTotal    = catItems.reduce((s, i) => s + i._total, 0)
            const isLastGroup = gi === groupEntries.length - 1

            return (
              <View key={gi}>
                {catItems.map((item, ii) => {
                  const isLastInGroup = ii === catItems.length - 1
                  const isVeryLast    = isLastGroup && isLastInGroup && !showCatSubtotal
                  const rowStyle      = isVeryLast ? S.tableRowLast : S.tableRow
                  return (
                    <View key={ii} style={rowStyle}>
                      <Text style={S.tdDesc}>{item.description}</Text>
                      <Text style={S.tdQty}>{item.quantity}</Text>
                      <Text style={S.tdPrice}>{fmt(toNum(item.unit_price) * cr)}</Text>
                      <Text style={S.tdTotal}>{fmt(item._total * cr)}</Text>
                    </View>
                  )
                })}

                {showCatSubtotal && (
                  <View style={S.subtotalRow}>
                    <Text style={[S.tdDesc, { flex: 7, fontFamily: 'Helvetica-Bold' }]}>
                      Sous-total {cat}
                    </Text>
                    <Text style={[S.tdTotal, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>
                      {fmtCurrency(catTotal * cr, currency)}
                    </Text>
                  </View>
                )}
              </View>
            )
          })}

          {/* Zone Paiement + Totaux superposés */}
          <View style={S.footerZone}>
            {/* Paiement (gauche) */}
            <View style={S.paymentBox}>
              <Text style={S.paymentTitle}>Paiement</Text>
              <Text style={S.paymentDetail}>Statut : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{statusLabel(doc.status)}</Text></Text>
              {!!doc.due_date && (
                <Text style={S.paymentDetail}>Échéance : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtDate(doc.due_date)}</Text></Text>
              )}
            </View>

            {/* Bloc totaux — superposé, position absolute */}
            <View style={S.totalsBox}>
              <View style={S.totalsInner}>
                <View style={S.totalRow}>
                  <Text style={S.totalLabel}>Sous Total :</Text>
                  <Text style={S.totalValue}>{fmtCurrency(subtotalBeforeConverted, currency)}</Text>
                </View>
                {totalDiscount > 0 && (
                  <View style={S.totalRow}>
                    <Text style={S.totalLabel}>Remise :</Text>
                    <Text style={S.totalValue}>{fmtCurrency(totalDiscountConverted, currency)}</Text>
                  </View>
                )}
                {doc.has_tva && (
                  <View style={S.totalRow}>
                    <Text style={S.totalLabel}>TVA ({tvaRate}%) :</Text>
                    <Text style={S.totalValue}>{fmtCurrency(tvaAmountConverted, currency)}</Text>
                  </View>
                )}
              </View>
              <View style={S.totalFinalBar}>
                <Text style={S.totalFinalLabel}>Total :</Text>
                <Text style={S.totalFinalValue}>{fmtCurrency(total, currency)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── FOOTER FIXE ── */}
        <View style={S.footer} fixed>
          {/* Signatures */}
          <View style={S.sigRow}>
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

          {/* Barre branding */}
          <View style={S.brandingBar}>
            <View style={S.brandingLeft}>
              <Text style={S.brandingConcuPar}>Conçu par</Text>
              <View style={S.brandingPilotRow}>
                {logoBbDataUrl
                  ? <Image src={logoBbDataUrl} style={S.brandingLogoImg} />
                  : null
                }
                <Text style={S.brandingPilot}>Pilot</Text>
              </View>
            </View>

            <View style={S.brandingDivider} />

            <View style={S.brandingQrArea}>
              {qrDataUrl ? (
                <Image src={qrDataUrl} style={S.qrImg} />
              ) : (
                <View style={{ width: 52, height: 52, backgroundColor: '#f0f0f0' }} />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Link src="https://www.getbudgetpilot.com" style={S.brandingLink}>
                  www.getbudgetpilot.com
                </Link>
                {!!company.nif && (
                  <Text style={S.brandingNif}>NIF : {company.nif}</Text>
                )}
              </View>
            </View>

            <Text style={S.pageNum} render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            } fixed />
          </View>
        </View>

      </Page>
    </Document>
  )
}

// ─── Fonction utilitaire pour générer le blob PDF ────────────────────────────

export async function generateMinimalPdfBlob(doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0) {
  const blob = await pdf(
    <MinimalPdfDocument
      doc={doc}
      profile={profile}
      qrDataUrl={qrDataUrl}
      logoDataUrl={logoDataUrl}
      signatureDataUrl={signatureDataUrl}
      logoBbDataUrl={logoBbDataUrl}
      currency={currency}
      conversionRate={conversionRate}
    />
  ).toBlob()
  return blob
}

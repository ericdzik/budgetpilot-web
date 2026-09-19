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
import { getTextColor, accentToBoxBg, accentToSubtotalBg, getSecondaryColor, getSecondaryTextColor, mixWithWhite } from './pdfColorUtils'
import { withFont, resolveFontFamily } from './pdfFonts'

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

// ─── Montant en lettres (français) ───────────────────────────────────────────

const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf']
const DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante',
  'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

function belowThousand(n) {
  if (n === 0) return ''
  if (n < 20) return UNITS[n]
  const d = Math.floor(n / 10)
  const u = n % 10
  if (d === 7) return u === 0 ? 'soixante-dix' : `soixante-${UNITS[10 + u]}`
  if (d === 9) return u === 0 ? 'quatre-vingt-dix' : `quatre-vingt-${UNITS[10 + u]}`
  if (d === 8 && u === 0) return 'quatre-vingts'
  if (d === 8) return `quatre-vingt-${UNITS[u]}`
  if (u === 1 && d >= 2 && d <= 6) return `${DIZAINES[d]}-et-un`
  if (u === 0) return DIZAINES[d]
  return `${DIZAINES[d]}-${UNITS[u]}`
}

function belowMillion(n) {
  if (n === 0) return ''
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const parts = []
  if (hundreds > 0) {
    parts.push(hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent${rest === 0 ? 's' : ''}`)
  }
  if (rest > 0) parts.push(belowThousand(rest))
  return parts.join(' ')
}

function intToWords(n) {
  if (n === 0) return 'zéro'
  const parts = []
  const milliards = Math.floor(n / 1_000_000_000)
  const millions  = Math.floor((n % 1_000_000_000) / 1_000_000)
  const milliers  = Math.floor((n % 1_000_000) / 1_000)
  const reste     = n % 1_000
  if (milliards > 0) parts.push(milliards === 1 ? 'un milliard' : `${belowMillion(milliards)} milliards`)
  if (millions  > 0) parts.push(millions  === 1 ? 'un million'  : `${belowMillion(millions)} millions`)
  if (milliers  > 0) parts.push(milliers  === 1 ? 'mille'       : `${belowMillion(milliers)} mille`)
  if (reste     > 0) parts.push(belowMillion(reste))
  return parts.join(' ')
}

export function amountToWords(amount, currencyCode = 'XOF') {
  const code = (currencyCode || 'XOF').toUpperCase()
  const abs = Math.abs(Number(amount) || 0)
  const intPart = Math.trunc(abs)
  const decPart = Math.round((abs - intPart) * 100)
  const negative = amount < 0

  const UNITS_MAP = {
    XOF: { unit: 'franc CFA',       plural: 'francs CFA',       cent: 'centime',  centP: 'centimes',  dec: false },
    XAF: { unit: 'franc CFA',       plural: 'francs CFA',       cent: 'centime',  centP: 'centimes',  dec: false },
    EUR: { unit: 'euro',            plural: 'euros',            cent: 'centime',  centP: 'centimes',  dec: true  },
    USD: { unit: 'dollar',          plural: 'dollars',          cent: 'cent',     centP: 'cents',     dec: true  },
    CAD: { unit: 'dollar canadien', plural: 'dollars canadiens',cent: 'cent',     centP: 'cents',     dec: true  },
    AUD: { unit: 'dollar',          plural: 'dollars',          cent: 'cent',     centP: 'cents',     dec: true  },
    GBP: { unit: 'livre sterling',  plural: 'livres sterling',  cent: 'penny',    centP: 'pence',     dec: true  },
    CHF: { unit: 'franc suisse',    plural: 'francs suisses',   cent: 'centime',  centP: 'centimes',  dec: true  },
    MAD: { unit: 'dirham',          plural: 'dirhams',          cent: 'centime',  centP: 'centimes',  dec: true  },
    DZD: { unit: 'dinar algérien',  plural: 'dinars algériens', cent: 'centime',  centP: 'centimes',  dec: true  },
    TND: { unit: 'dinar tunisien',  plural: 'dinars tunisiens', cent: 'millime',  centP: 'millimes',  dec: true  },
    NGN: { unit: 'naira',           plural: 'nairas',           cent: 'kobo',     centP: 'kobos',     dec: true  },
    GHS: { unit: 'cedi',            plural: 'cedis',            cent: 'pesewa',   centP: 'pesewas',   dec: true  },
    GNF: { unit: 'franc',           plural: 'francs',           cent: 'centime',  centP: 'centimes',  dec: false },
    CDF: { unit: 'franc',           plural: 'francs',           cent: 'centime',  centP: 'centimes',  dec: false },
  }

  const info = UNITS_MAP[code] || { unit: code.toLowerCase(), plural: `${code.toLowerCase()}s`, cent: 'centime', centP: 'centimes', dec: true }

  const intWords = intToWords(intPart)
  const unitLabel = intPart <= 1 ? info.unit : info.plural
  let result = `${negative ? 'moins ' : ''}${intWords} ${unitLabel}`

  if (info.dec && decPart > 0) {
    const centWords = intToWords(decPart)
    const centLabel = decPart <= 1 ? info.cent : info.centP
    result += ` et ${centWords} ${centLabel}`
  }

  return result.charAt(0).toUpperCase() + result.slice(1)
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
// Les styles dépendants de l'accent sont générés dynamiquement dans le composant.

const S_STATIC = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000',
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 140, // espace pour le footer fixe (signatures + branding)
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
    color: '#000',
    marginTop: 1,
  },

  // ── En-tête tableau ──
  thText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Corps tableau ──
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottom: '1px solid #f0f0f0',
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 4,
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
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalFinalLabel: { fontSize: 11, color: '#fff', fontFamily: 'Helvetica-Bold' },
  totalFinalValue: { fontSize: 11, color: '#fff', fontFamily: 'Helvetica-Bold' },
  totalFinalWords: { fontSize: 8, color: '#fff', fontFamily: 'Helvetica-Oblique', marginTop: 4 },

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

export function MinimalPdfDocument({ doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0, accentColor = '#1E88E5', showQrCode = true, showBranding = true, noColor = false, fontChoice = 'helvetica' }) {
  // Agencement façon Prestige : la couleur principale pilote fonds ET labels (comme
  // le navy) ; la secondaire est l'accent sur fond coloré (barre du total final,
  // comme le "TOTAL TTC" doré) + le fond clair du sous-total — le texte de l'en-tête
  // du tableau reste en contraste auto (comme sur Prestige, où il reste blanc).
  const headerTextColor  = noColor ? '#fff' : getTextColor(accentColor)
  const labelColor       = noColor ? '#000' : accentColor
  // Couleur secondaire complémentaire (dérivée automatiquement)
  const secondaryColor   = getSecondaryColor(accentColor)
  const subtotalBg       = mixWithWhite(secondaryColor, 0.35)
  const boxBg            = accentToBoxBg(accentColor)
  const totalBarTextColor = noColor ? '#fff' : getSecondaryTextColor(accentColor, secondaryColor)

  // État "sans coloration" — reproduit le design d'origine (en-tête/barre de total noirs, sans accent)
  const S = withFont({
    ...S_STATIC,
    logoBox: { width: 44, height: 44, backgroundColor: noColor ? '#000' : accentColor, borderRadius: 4, marginBottom: 6 },
    tableHeader: {
      flexDirection: 'row', backgroundColor: noColor ? '#000' : accentColor,
      borderTopLeftRadius: 10, borderTopRightRadius: 10,
      paddingVertical: 7, paddingHorizontal: 10,
    },
    thText: { ...S_STATIC.thText, color: headerTextColor },
    tableBody: {
      borderLeft: `1.5px solid ${noColor ? '#000' : accentColor}`,
      borderRight: `1.5px solid ${noColor ? '#000' : accentColor}`,
      borderBottom: `1.5px solid ${noColor ? '#000' : accentColor}`,
      borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    },
    subtotalRow: {
      flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 10,
      backgroundColor: noColor ? '#f0f0f0' : subtotalBg, marginTop: 6, marginBottom: 6,
    },
    subtotalText: { fontFamily: 'Helvetica-Bold', color: noColor ? '#111' : accentColor },
    totalsBox: {
      width: 210, border: `2px solid ${noColor ? '#000' : accentColor}`,
      borderRadius: 10, backgroundColor: noColor ? '#fff' : boxBg,
      overflow: 'hidden', alignSelf: 'flex-end',
      marginBottom: 4, marginRight: 4,
    },
    totalFinalBar: {
      backgroundColor: noColor ? '#000' : accentColor,
      paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'column',
    },
    totalFinalLabel: { fontSize: 11, color: totalBarTextColor, fontFamily: 'Helvetica-Bold' },
    totalFinalValue: { fontSize: 11, color: totalBarTextColor, fontFamily: 'Helvetica-Bold' },
    brandingBar: {
      borderTop: '1px solid #ddd', paddingTop: 10,
      flexDirection: 'row', alignItems: 'center', gap: 20,
    },
  }, fontChoice)
  const fontBold = resolveFontFamily(fontChoice, 'bold')
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

  // ── Pagination manuelle ──────────────────────────────────────────────────
  // La dernière page accueille également les totaux, le montant en lettres et
  // les signatures. Lui réserver moins de lignes évite que react-pdf crée une
  // page de débordement vide avant la suite du tableau.
  const ITEMS_PER_PAGE = 20
  const ITEMS_ON_LAST_PAGE = 6

  // Aplatir tous les items avec leur catégorie
  const flatItems = []
  groupEntries.forEach(([cat, catItems]) => {
    catItems.forEach(item => flatItems.push({ ...item, _cat: cat }))
    flatItems.push({ __subtotal: true, _cat: cat, _catItems: catItems })
  })

  // Découper : les pages ordinaires peuvent contenir 20 lignes, mais la dernière
  // est volontairement limitée à 10 lignes pour garder la zone finale sur page.
  const pageSlices = []
  const lastPageItems = flatItems.length > ITEMS_PER_PAGE
    ? flatItems.slice(-ITEMS_ON_LAST_PAGE)
    : []
  const itemsBeforeLastPage = lastPageItems.length > 0
    ? flatItems.slice(0, -ITEMS_ON_LAST_PAGE)
    : flatItems

  for (let i = 0; i < itemsBeforeLastPage.length; i += ITEMS_PER_PAGE) {
    pageSlices.push(itemsBeforeLastPage.slice(i, i + ITEMS_PER_PAGE))
  }
  if (lastPageItems.length > 0) pageSlices.push(lastPageItems)
  if (pageSlices.length === 0) pageSlices.push([])
  const totalPagesCount = pageSlices.length

  // ── Composants réutilisables ─────────────────────────────────────────────

  const PageHeader = () => (
    <View style={S.headerRow}>
      <View style={S.headerCol}>
        {logoDataUrl
          ? <Image src={logoDataUrl} style={S.logoImg} />
          : <View style={S.logoBox} />
        }
        <Text style={S.refNum}>{doc.reference_number}</Text>
        <Text style={S.refSmall}>Date : {fmtDate(doc.issue_date || doc.created_at)}</Text>
        {doc.due_date && <Text style={S.refSmall}>Éch. {fmtDate(doc.due_date)}</Text>}
      </View>
      <View style={S.headerCol}>
        <Text style={[S.companyName, { marginBottom: 2, color: '#111' }]}>ÉMETTEUR</Text>
        <Text style={[S.companyDetail, { fontFamily: fontBold }]}>{company.name}</Text>
        {!!company.phone   && <Text style={S.companyDetail}>{company.phone}</Text>}
        {!!company.address && <Text style={S.companyDetail}>{company.address}</Text>}
      </View>
      <View style={S.headerCol}>
        <Text style={[S.companyName, { marginBottom: 2, color: '#111' }]}>DESTINATAIRE</Text>
        <Text style={[S.companyDetail, { fontFamily: fontBold }]}>{client.name || '—'}</Text>
        {!!client.phone   && <Text style={S.companyDetail}>{client.phone}</Text>}
        {!!client.email   && <Text style={S.companyDetail}>{client.email}</Text>}
        {!!client.address && <Text style={S.companyDetail}>{client.address}</Text>}
      </View>
    </View>
  )

  const TableHead = () => (
    <>
      {!!doc.title && (
        <View style={{ marginBottom: 6, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, fontFamily: fontBold, color: '#111', letterSpacing: 0.3, textAlign: 'center' }}>
            {doc.title.toUpperCase()}
          </Text>
        </View>
      )}
      <View style={S.tableHeader}>
        <Text style={[S.thText, { flex: 4, paddingLeft: 6 }]}>Description</Text>
        <Text style={[S.thText, { flex: 1, textAlign: 'center' }]}>QTÉ</Text>
        <Text style={[S.thText, { flex: 2, textAlign: 'center' }]}>Prix unitaire</Text>
        <Text style={[S.thText, { flex: 2, textAlign: 'right', paddingRight: 8 }]}>Total ({currency})</Text>
      </View>
    </>
  )

  const PageFooter = ({ showSignature }) => (
    <View style={S.footer}>
      {showSignature && (
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
      )}
      <View style={S.brandingBar}>
        {showBranding && (
          <>
            <View style={S.brandingLeft}>
              <Text style={S.brandingConcuPar}>Conçu par</Text>
              <View style={S.brandingPilotRow}>
                {logoBbDataUrl ? <Image src={logoBbDataUrl} style={S.brandingLogoImg} /> : null}
                <Text style={S.brandingPilot}>Pilot</Text>
              </View>
            </View>
            <View style={S.brandingDivider} />
          </>
        )}
        <View style={S.brandingQrArea}>
          {showQrCode && (qrDataUrl
            ? <Image src={qrDataUrl} style={S.qrImg} />
            : <View style={{ width: 52, height: 52, backgroundColor: '#f0f0f0' }} />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Link src="https://www.getbudgetpilot.com" style={S.brandingLink}>
              www.getbudgetpilot.com
            </Link>
            {!!company.nif && <Text style={S.brandingNif}>NIF : {company.nif}</Text>}
          </View>
        </View>
        <Text style={S.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </View>
    </View>
  )

  return (
    <Document>
      {pageSlices.map((slice, pageIdx) => {
        const isLastPage = pageIdx === totalPagesCount - 1
        return (
          <Page key={pageIdx} size="A4" style={S.page}>
            <PageHeader />
            <TableHead />
            <View style={S.tableBody}>
              {slice.map((row, ri) => {
                if (row.__subtotal) {
                  const catTotal = row._catItems.reduce((s, i) => s + i._total, 0)
                  return showCatSubtotal ? (
                    <View key={`sub-${ri}`} style={S.subtotalRow}>
                      <Text style={[S.tdDesc, { flex: 7, fontFamily: fontBold, color: labelColor }]}>
                        Sous-total {row._cat}
                      </Text>
                      <Text style={[S.tdTotal, { flex: 2, fontFamily: fontBold, color: labelColor }]}>
                        {fmtCurrency(catTotal * cr, currency)}
                      </Text>
                    </View>
                  ) : null
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

              {/* Paiement + Totaux — uniquement sur la dernière page */}
              {isLastPage && (
                <View style={S.footerZone}>
                  <View style={S.paymentBox}>
                    <Text style={[S.paymentTitle, { color: '#111' }]}>Paiement</Text>
                    <Text style={S.paymentDetail}>Statut : <Text style={{ fontFamily: fontBold }}>{statusLabel(doc.status)}</Text></Text>
                    {!!doc.due_date && (
                      <Text style={S.paymentDetail}>Échéance : <Text style={{ fontFamily: fontBold }}>{fmtDate(doc.due_date)}</Text></Text>
                    )}
                  </View>
                  <View style={S.totalsBox}>
                    <View style={S.totalsInner}>
                      <View style={S.totalRow}>
                        <Text style={S.totalLabel}>Sous Total :</Text>
                        <Text style={S.totalValue}>{fmt(subtotalBeforeConverted)}</Text>
                      </View>
                      {totalDiscount > 0 && (
                        <View style={S.totalRow}>
                          <Text style={S.totalLabel}>Remise :</Text>
                          <Text style={S.totalValue}>- {fmt(totalDiscountConverted)}</Text>
                        </View>
                      )}
                      {doc.has_tva && (
                        <View style={S.totalRow}>
                          <Text style={S.totalLabel}>TVA ({tvaRate}%) :</Text>
                          <Text style={S.totalValue}>{fmt(tvaAmountConverted)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={S.totalFinalBar}>
                      <View style={S.totalFinalRow}>
                        <Text style={S.totalFinalLabel}>Total :</Text>
                        <Text style={S.totalFinalValue}>{fmt(total)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Montant en lettres — uniquement sur la dernière page */}
            {isLastPage && (
              <View style={{ marginTop: 8, marginHorizontal: 15, flexDirection: 'row', flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 9, color: '#000', fontFamily: fontBold }}>Arrêtée la présente facture à la somme de : </Text>
                <Text style={{
                  fontSize: (() => { const l = amountToWords(total, currency).length; return l <= 40 ? 11 : l <= 60 ? 10 : l <= 80 ? 9 : 8 })(),
                  color: '#000',
                  fontFamily: 'Helvetica-Oblique',
                }}>
                  {amountToWords(total, currency)}
                </Text>
              </View>
            )}

            <PageFooter showSignature={isLastPage || totalPagesCount === 1} />
          </Page>
        )
      })}
    </Document>
  )
}

// ─── Fonction utilitaire pour générer le blob PDF ────────────────────────────

export async function generateMinimalPdfBlob(doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0, customization = {}) {
  const { accentColor = '#1E88E5', showQrCode = true, showBranding = true, noColor = false, fontChoice = 'helvetica' } = customization
  const blob = await pdf(
    <MinimalPdfDocument
      doc={doc} profile={profile}
      qrDataUrl={qrDataUrl} logoDataUrl={logoDataUrl}
      signatureDataUrl={signatureDataUrl} logoBbDataUrl={logoBbDataUrl}
      currency={currency} conversionRate={conversionRate}
      accentColor={accentColor} showQrCode={showQrCode} showBranding={showBranding}
      noColor={noColor} fontChoice={fontChoice}
    />
  ).toBlob()
  return blob
}

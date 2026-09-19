import { Document, Page, View, Text, Image, StyleSheet, pdf } from '@react-pdf/renderer'
import { getTextColor, mixWithWhite } from './pdfColorUtils'
import { amountToWords } from './MinimalPdfDocument'
import { withFont } from './pdfFonts'

const money = value => Math.round(Number(value) || 0).toLocaleString('fr-FR').replace(/\u202f/g, '.')
const date = value => value ? new Date(value).toLocaleDateString('fr-FR') : '—'
const status = value => ({ paid: 'Payée', partially_paid: 'Partiellement payée', sent: 'Envoyée', overdue: 'En retard', draft: 'Brouillon' }[value] || value || '—')

// A4 = 595.28 pt. Avec les marges horizontales de 36 pt, le tableau mesure
// exactement 523.28 pt. Des largeurs fixes empêchent les écarts d'arrondi de flex.
const TABLE_COLUMNS = Object.freeze({ designation: 222.67, quantity: 77.93, unitPrice: 111.34, amount: 111.34 })
const TABLE_WIDTH = Object.values(TABLE_COLUMNS).reduce((sum, width) => sum + width, 0)
const SUMMARY_WIDTH = TABLE_COLUMNS.designation + TABLE_COLUMNS.quantity + TABLE_COLUMNS.unitPrice

const BASE_STYLES = StyleSheet.create({
  page: { padding: '28 36 76', fontFamily: 'Helvetica', fontSize: 10, color: '#111' },
  header: { borderBottomWidth: 2, paddingBottom: 10, flexDirection: 'column', alignItems: 'center' },
  logo: { width: 50, height: 50, objectFit: 'contain', marginBottom: 6 },
  company: { alignItems: 'center', paddingHorizontal: 12 },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  companyDetail: { fontSize: 8, textAlign: 'center', marginTop: 3 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'center', textDecoration: 'underline', marginTop: 30, marginBottom: 20 },
  info: { marginBottom: 20, lineHeight: 1.8 },
  infoLabel: { fontFamily: 'Helvetica-Bold', textDecoration: 'underline' },
  table: { width: TABLE_WIDTH, borderWidth: 1 },
  row: { flexDirection: 'row', borderBottomWidth: 0.7, minHeight: 24, alignItems: 'center' },
  cell: { borderRightWidth: 0.7, justifyContent: 'center' },
  cellText: { padding: 6 },
  head: { fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  // 4 + 1.4 + 2 : couvre exactement Désignation, Qté et P. U ; le montant
  // reste ainsi aligné sous la quatrième colonne du tableau.
  totalsLabel: { width: SUMMARY_WIDTH, borderRightWidth: 0.7, justifyContent: 'center' },
  totalsValue: { width: TABLE_COLUMNS.amount, justifyContent: 'center' },
  totalsLabelText: { padding: 6, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  totalsValueText: { padding: 6, textAlign: 'right' },
  totalsValueTextBold: { fontFamily: 'Helvetica-Bold' },
  words: { fontFamily: 'Helvetica-BoldOblique', fontSize: 10, marginTop: 18, lineHeight: 1.45 },
  signatureDate: { marginTop: 18 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 36 },
  signatureCol: { alignItems: 'center', width: 160 },
  signatureLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  footer: { position: 'absolute', bottom: 0, left: -36, right: -36, padding: '8 36', fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
})

export function AdministrativePdfDocument({ doc, profile, logoDataUrl, signatureDataUrl, currency = 'XOF', conversionRate = 1, accentColor = '#1E88E5', noColor = false, fontChoice = 'helvetica' }) {
  const S = withFont(BASE_STYLES, fontChoice)
  const brand = noColor ? '#1E88E5' : accentColor
  const textOnBrand = getTextColor(brand)
  const company = profile?.company_name || profile?.name || 'Mon Entreprise'
  const client = doc.client || {}
  const items = doc.items || []
  const rows = items.map(item => ({ ...item, total: Number(item.total ?? (Number(item.quantity || 0) * Number(item.unit_price || 0))) }))
  const subtotal = rows.reduce((sum, item) => sum + item.total, 0) * conversionRate
  const grossSubtotal = rows.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0) * conversionRate
  const lineDiscount = grossSubtotal - subtotal
  const globalDiscount = Number(doc.discount_percent || 0) > 0
    ? (doc.discount_type === 'percentage' ? grossSubtotal * (Number(doc.discount_percent) / 100) : Number(doc.discount_percent) * conversionRate)
    : 0
  const discount = lineDiscount + globalDiscount
  const subtotalHt = subtotal - globalDiscount
  const tva = doc.has_tva ? subtotalHt * 0.18 : 0
  const total = Number(doc.total_amount || subtotalHt + tva) * conversionRate
  const grouped = rows.reduce((groups, item) => {
    const category = item.category || 'Articles'
    ;(groups[category] ||= []).push(item)
    return groups
  }, {})
  const categories = Object.entries(grouped)
  const showCategorySubtotal = categories.length > 1
  const ItemRow = ({ children, style }) => <View style={[S.row, style]}>{children}</View>
  const Cell = ({ children, width, align = 'left', last = false }) => <View style={[S.cell, { width }, last && { borderRightWidth: 0 }]}><Text style={[S.cellText, { textAlign: align }]}>{children}</Text></View>
  const TotalLabel = ({ children }) => <View style={S.totalsLabel}><Text style={S.totalsLabelText}>{children}</Text></View>
  const TotalValue = ({ children, bold = false }) => <View style={S.totalsValue}><Text style={[S.totalsValueText, bold && S.totalsValueTextBold]}>{children}</Text></View>
  return <Document><Page size="A4" style={S.page}>
    <View style={[S.header, { borderBottomColor: brand }]}>
      {logoDataUrl && <Image src={logoDataUrl} style={S.logo} />}
      <View style={S.company}><Text style={[S.companyName, { color: brand }]}>{company}</Text><Text style={S.companyDetail}>{profile?.company_address || ''}</Text><Text style={S.companyDetail}>{profile?.professional_phone || profile?.phone || ''} {profile?.email ? `· ${profile.email}` : ''}</Text></View>
    </View>
    <Text style={S.title}>{doc.type === 'quote' ? 'DEVIS' : 'FACTURE'}</Text>
    <View style={S.info}>
      <Text><Text style={S.infoLabel}>Client : </Text>{client.name || '—'}</Text>
      {!!doc.title && <Text><Text style={S.infoLabel}>Objet : </Text>{doc.title}</Text>}
      <Text><Text style={S.infoLabel}>Période : </Text>{date(doc.issue_date || doc.created_at)}</Text>
    </View>
    <View style={[S.table, { borderColor: '#444' }]}> 
      <ItemRow style={{ backgroundColor: mixWithWhite(brand, .08) }}><Cell width={TABLE_COLUMNS.designation} align="center"><Text style={S.head}>Désignation</Text></Cell><Cell width={TABLE_COLUMNS.quantity} align="center"><Text style={S.head}>Qté</Text></Cell><Cell width={TABLE_COLUMNS.unitPrice} align="center"><Text style={S.head}>P. U</Text></Cell><Cell width={TABLE_COLUMNS.amount} align="center" last><Text style={S.head}>Montant</Text></Cell></ItemRow>
      {categories.flatMap(([category, categoryItems]) => [
        ...categoryItems.map((item, index) => <ItemRow key={`${category}-${index}`}><Cell width={TABLE_COLUMNS.designation}>{item.description || 'Prestation'}</Cell><Cell width={TABLE_COLUMNS.quantity} align="center">{item.quantity || 0}</Cell><Cell width={TABLE_COLUMNS.unitPrice} align="right">{money(Number(item.unit_price || 0) * conversionRate)}</Cell><Cell width={TABLE_COLUMNS.amount} align="right" last>{money(item.total * conversionRate)}</Cell></ItemRow>),
        showCategorySubtotal && <ItemRow key={`${category}-subtotal`} style={{ backgroundColor: mixWithWhite(brand, .06), borderBottomWidth: 1.2, borderBottomColor: brand }}><TotalLabel>SOUS-TOTAL {category}</TotalLabel><TotalValue bold>{money(categoryItems.reduce((sum, item) => sum + item.total, 0) * conversionRate)} {currency}</TotalValue></ItemRow>,
      ])}
      <ItemRow style={{ backgroundColor: '#fafafa' }}><TotalLabel>SOUS-TOTAL GLOBAL</TotalLabel><TotalValue>{money(grossSubtotal)} {currency}</TotalValue></ItemRow>
      {discount > .01 && <ItemRow style={{ backgroundColor: '#fafafa' }}><TotalLabel>REMISE</TotalLabel><TotalValue>- {money(discount)} {currency}</TotalValue></ItemRow>}
      {doc.has_tva && <ItemRow style={{ backgroundColor: '#fafafa' }}><TotalLabel>TVA 18%</TotalLabel><TotalValue>{money(tva)} {currency}</TotalValue></ItemRow>}
      <ItemRow style={{ borderBottomWidth: 0, backgroundColor: mixWithWhite(brand, .13) }}><TotalLabel>TTC</TotalLabel><TotalValue bold>{money(total)} {currency}</TotalValue></ItemRow>
    </View>
    <Text style={S.words}>Arrêtée la présente {doc.type === 'quote' ? 'proposition' : 'facture'} à la somme de : {amountToWords(total, currency)}.</Text>
    <Text style={S.signatureDate}>Fait le {date(doc.issue_date || doc.created_at)}</Text>
    <View style={S.signatureRow}>
      <View style={S.signatureCol}>
        <Text style={[S.signatureLabel, { color: brand }]}>ÉMETTEUR</Text>
        <View style={{ height: 8 }} />
        {signatureDataUrl ? <Image src={signatureDataUrl} style={{ width: 110, height: 42, objectFit: 'contain' }} /> : <View style={{ height: 42 }} />}
      </View>
      <View style={S.signatureCol}>
        <Text style={[S.signatureLabel, { color: brand }]}>DESTINATAIRE</Text>
        <View style={{ height: 8 }} />
        <View style={{ height: 42 }} />
      </View>
    </View>
    <View fixed style={[S.footer, { backgroundColor: brand, color: textOnBrand }]}><Text>NIF : {profile?.nif || '—'}</Text></View>
  </Page></Document>
}

export function generateAdministrativePdfBlob(doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1, customization = {}) {
  const { accentColor = '#1E88E5', noColor = false, fontChoice = 'helvetica' } = customization
  return pdf(<AdministrativePdfDocument doc={doc} profile={profile} logoDataUrl={logoDataUrl} signatureDataUrl={signatureDataUrl} currency={currency} conversionRate={conversionRate} accentColor={accentColor} noColor={noColor} fontChoice={fontChoice} />).toBlob()
}

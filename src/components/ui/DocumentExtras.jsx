/**
 * Blocs « Note » (description saisie par l'utilisateur) et « Coordonnées bancaires (RIB) »
 * imprimés sur les documents. Le texte vient de utils/documentExtras.js.
 * - ExtrasPdf  : version react-pdf (PDF généré)
 * - ExtrasHtml : version HTML (aperçu à l'écran)
 */
import { View, Text } from '@react-pdf/renderer'
import { resolveFontFamily } from './pdfFonts'

const fmtMoney = (n) => {
  const num = Number(n) || 0
  const hasDecimals = num !== Math.round(num)
  const [i, d] = num.toFixed(hasDecimals ? 2 : 0).split('.')
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '')
}
const paymentLines = (payment, currency, rate) => payment ? [
  ['DÉJÀ PAYÉ', `${fmtMoney(payment.paid * rate)} ${currency}`],
  ['RESTE À PAYER', `${fmtMoney(payment.remaining * rate)} ${currency}`],
] : []

const TITLES = { note: 'Note', rib: 'Coordonnées bancaires (RIB)' }

export function ExtrasPdf({ note, rib, color = '#111', fontChoice = 'helvetica', size = 9, marginTop = 10, align = 'left' }) {
  if (!note && !rib) return null
  const regular = resolveFontFamily(fontChoice, 'regular')
  const bold = resolveFontFamily(fontChoice, 'bold')
  const block = (key, text) => (
    <View key={key} wrap={false} style={{ marginTop }}>
      <Text style={{ fontSize: size + 1, fontFamily: bold, color, marginBottom: 2, textAlign: align }}>{TITLES[key]}</Text>
      <Text style={{ fontSize: size, fontFamily: regular, color: '#333', lineHeight: 1.3, textAlign: align }}>{text}</Text>
    </View>
  )
  return <View>{note ? block('note', note) : null}{rib ? block('rib', rib) : null}</View>
}

export function ExtrasHtml({ note, rib, color = '#111', size = 9, marginTop = 10 }) {
  if (!note && !rib) return null
  const block = (key, text) => (
    <div key={key} style={{ marginTop }}>
      <div style={{ fontSize: size + 1, fontWeight: 'bold', color, marginBottom: 2 }}>{TITLES[key]}</div>
      <div style={{ fontSize: size, color: '#333', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>{text}</div>
    </div>
  )
  return <div>{note ? block('note', note) : null}{rib ? block('rib', rib) : null}</div>
}

/** Lignes « Déjà payé » et « Reste à payer », à placer juste sous le TOTAL des totaux. */
export function PaymentRowsPdf({ payment, currency = 'XOF', rate = 1, fontChoice = 'helvetica', size = 10, color = '#111' }) {
  if (!payment) return null
  const regular = resolveFontFamily(fontChoice, 'regular')
  const bold = resolveFontFamily(fontChoice, 'bold')
  return (
    <View style={{ marginTop: 3 }}>
      {paymentLines(payment, currency, rate).map(([l, v]) => (
        <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 }}>
          <Text style={{ fontSize: size, fontFamily: bold, color }}>{l} :</Text>
          <Text style={{ fontSize: size, fontFamily: l === 'RESTE À PAYER' ? bold : regular, color }}>{v}</Text>
        </View>
      ))}
    </View>
  )
}

export function PaymentRowsHtml({ payment, currency = 'XOF', rate = 1, size = 10, color = '#111' }) {
  if (!payment) return null
  return (
    <div style={{ marginTop: 3 }}>
      {paymentLines(payment, currency, rate).map(([l, v]) => (
        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', fontSize: size, color }}>
          <span style={{ fontWeight: 'bold' }}>{l} :</span>
          <span style={{ fontWeight: l === 'RESTE À PAYER' ? 'bold' : 'normal' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}

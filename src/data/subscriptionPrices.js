/**
 * Prix d'abonnement statiques par devise (Basic/Pro × Mensuel/Trimestriel/Annuel).
 * Tableau officiel — aucun calcul de conversion.
 * Devises absentes du tableau → fallback USD.
 */
export const SUBSCRIPTION_PRICES = {
  XOF: { monthly: { basic: 3000, pro: 5000 }, '3months': { basic: 8000, pro: 13500 }, yearly: { basic: 30000, pro: 50000 } },
  XAF: { monthly: { basic: 3000, pro: 5000 }, '3months': { basic: 8000, pro: 13500 }, yearly: { basic: 30000, pro: 50000 } },
  EUR: { monthly: { basic: 4.99, pro: 7.99 }, '3months': { basic: 12.99, pro: 19.99 }, yearly: { basic: 49.99, pro: 74.99 } },
  USD: { monthly: { basic: 5.99, pro: 9.99 }, '3months': { basic: 14.99, pro: 24.99 }, yearly: { basic: 49.99, pro: 89.99 } },
  GBP: { monthly: { basic: 3.99, pro: 6.99 }, '3months': { basic: 10.99, pro: 19.99 }, yearly: { basic: 39.99, pro: 69.99 } },
  GNF: { monthly: { basic: 45000, pro: 76500 }, '3months': { basic: 130000, pro: 220000 }, yearly: { basic: 450000, pro: 800000 } },
  CDF: { monthly: { basic: 12500, pro: 20000 }, '3months': { basic: 35000, pro: 55000 }, yearly: { basic: 125000, pro: 200000 } },
  GHS: { monthly: { basic: 60, pro: 100 }, '3months': { basic: 170, pro: 280 }, yearly: { basic: 650, pro: 1000 } },
}

export const FALLBACK_PRICE_CURRENCY = 'USD'

// Devises dont le prix affiche des décimales
const DECIMAL_CURRENCIES = ['EUR', 'USD', 'GBP']

export function getSubscriptionPrice(currency, plan, cycle) {
  const code = (currency || FALLBACK_PRICE_CURRENCY).toUpperCase()
  const table = SUBSCRIPTION_PRICES[code] || SUBSCRIPTION_PRICES[FALLBACK_PRICE_CURRENCY]
  return table?.[cycle]?.[plan]
}

const NNBSP = '\u202F'

function fmtInt(n) {
  return Math.round(n).toLocaleString('fr-FR').replace(/\s/g, NNBSP)
}

function fmtDec(n) {
  return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP)
}

export function formatSubscriptionPrice(amount, currency) {
  const code = (currency || FALLBACK_PRICE_CURRENCY).toUpperCase()
  const num = Number(amount) || 0

  if (code === 'XOF' || code === 'XAF') return `${fmtInt(num)} F`
  if (code === 'GNF') return `${fmtInt(num)} FG`
  if (code === 'CDF') return `${fmtInt(num)} FC`
  if (code === 'GHS') return `${fmtInt(num)} GH₵`

  const hasDecimals = DECIMAL_CURRENCIES.includes(code) && num !== Math.round(num)
  const value = hasDecimals ? fmtDec(num) : fmtInt(num)
  const sym = code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code
  if (code === 'EUR') return `${value}${NNBSP}€`
  return `${sym}${value}`
}

export function formatSubscriptionPerMonth(amount, months, currency) {
  const code = (currency || FALLBACK_PRICE_CURRENCY).toUpperCase()
  const num = (Number(amount) || 0) / months
  const rounded = DECIMAL_CURRENCIES.includes(code)
    ? Math.round(num * 100) / 100
    : Math.round(num)
  return `${formatSubscriptionPrice(rounded, currency)} par mois`
}

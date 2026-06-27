import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Store de devise active — partagé dans toute l'app web.
 * Synchronisé avec user.currency depuis le backend.
 */
const useCurrencyStore = create(
  persist(
    (set, get) => ({
      activeCurrency: 'XOF',  // défaut : Franc CFA

      setCurrency: (code) => set({ activeCurrency: code.toUpperCase() }),

      // Initialiser depuis le profil utilisateur
      initFromUser: (user) => {
        if (user?.currency) {
          set({ activeCurrency: user.currency.toUpperCase() })
        }
      },
    }),
    {
      name: 'currency-storage',
    }
  )
)

export default useCurrencyStore

// ─── Table des symboles ───────────────────────────────────────────────────────

export const CURRENCY_SYMBOLS = {
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

export const CURRENCY_NAMES = {
  XOF: 'Franc CFA (BCEAO)', XAF: 'Franc CFA (BEAC)',
  USD: 'Dollar américain',  EUR: 'Euro',
  GBP: 'Livre sterling',    JPY: 'Yen japonais',
  CNY: 'Yuan chinois',      CHF: 'Franc suisse',
  CAD: 'Dollar canadien',   AUD: 'Dollar australien',
  NZD: 'Dollar néo-zélandais', NGN: 'Naira nigérian',
  GHS: 'Cedi ghanéen',      KES: 'Shilling kényan',
  ZAR: 'Rand sud-africain', EGP: 'Livre égyptienne',
  MAD: 'Dirham marocain',   DZD: 'Dinar algérien',
  TND: 'Dinar tunisien',    INR: 'Roupie indienne',
  BRL: 'Real brésilien',    MXN: 'Peso mexicain',
  RUB: 'Rouble russe',      SAR: 'Riyal saoudien',
  AED: 'Dirham émirien',    TRY: 'Livre turque',
  KRW: 'Won coréen',        THB: 'Baht thaïlandais',
  SGD: 'Dollar singapourien', HKD: 'Dollar de Hong Kong',
  SEK: 'Couronne suédoise', NOK: 'Couronne norvégienne',
  DKK: 'Couronne danoise',  PLN: 'Zloty polonais',
  CZK: 'Couronne tchèque',  HUF: 'Forint hongrois',
  RON: 'Leu roumain',       UAH: 'Hryvnia ukrainienne',
  IDR: 'Roupie indonésienne', MYR: 'Ringgit malaisien',
  PHP: 'Peso philippin',    VND: 'Dong vietnamien',
  PKR: 'Roupie pakistanaise', BDT: 'Taka bangladais',
  ILS: 'Shekel israélien',
}

// Liste complète pour le sélecteur
export const ALL_CURRENCIES = Object.entries(CURRENCY_NAMES).map(([code, name]) => ({
  code,
  name,
  symbol: CURRENCY_SYMBOLS[code] || code,
}))

/**
 * Formater un montant selon la devise.
 * Pour XOF/XAF → pas de décimales, suffixe FCFA
 * Pour les autres → 2 décimales
 */
export function formatAmount(amount, currencyCode = 'XOF') {
  const code = (currencyCode || 'XOF').toUpperCase()
  const num = Number(amount) || 0

  if (code === 'XOF' || code === 'XAF') {
    return `${Math.round(num).toLocaleString('fr-FR').replace(/\s/g, '\u202F')} FCFA`
  }

  const noDecimal = ['JPY', 'KRW', 'VND', 'IDR', 'UGX', 'TZS', 'GNF', 'MMK']
  if (noDecimal.includes(code)) {
    const sym = CURRENCY_SYMBOLS[code] || code
    return `${Math.round(num).toLocaleString('fr-FR').replace(/\s/g, '\u202F')} ${sym}`
  }

  const sym = CURRENCY_SYMBOLS[code] || code
  const formatted = num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')

  const symbolAfter = ['EUR', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON']
  if (symbolAfter.includes(code)) return `${formatted}\u00A0${sym}`
  return `${sym}${formatted}`
}

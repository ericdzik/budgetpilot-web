// Doit rester égal à LOYAL_CLIENT_THRESHOLD côté backend (et Client.loyalClientThreshold mobile)
export const LOYAL_CLIENT_THRESHOLD = 5

export const isLoyalClient = (paidInvoicesCount) =>
  Number(paidInvoicesCount || 0) >= LOYAL_CLIENT_THRESHOLD

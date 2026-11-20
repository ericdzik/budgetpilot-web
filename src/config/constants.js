export const STORAGE_BASE_URL =
  (import.meta.env.VITE_API_URL || 'http://172.20.10.12:8000/api').replace('/api', '/storage')

export const PAYMENT_METHODS = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  transfer: 'Virement',
  check: 'Chèque',
}

export const DOCUMENT_STATUSES = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  partially_paid: 'En-cours de paiement',
  overdue: 'En retard',
}

export const DOCUMENT_TYPES = {
  invoice: 'Facture',
  quote: 'Devis',
}

export const EXPENSE_CATEGORIES = [
  'Fournitures',
  'Transport',
  'Loyer',
  'Électricité',
  'Eau',
  'Internet',
  'Téléphone',
  'Salaires',
  'Marketing',
  'Matières premières',
  'Équipement',
  'Maintenance',
  'Assurance',
  'Taxes',
  'Autres',
]

// Secteurs proposés pour une entreprise (création et profil entreprise)
export const COMPANY_SECTORS = [
  'Agriculture', 'Artisanat', 'Commerce', 'Construction', 'Éducation', 'Finance', 'Immobilier',
  'Industrie', 'Informatique', 'Restauration', 'Santé', 'Services', 'Transport', 'Autre',
]

export const BUSINESS_SECTORS = [
  'Commerce général',
  'Alimentation / Restaurant',
  'Mode / Couture',
  'Coiffure / Esthétique',
  'Artisanat',
  'Bâtiment / Construction',
  'Transport',
  'Agriculture',
  'Élevage',
  'Pêche',
  'Informatique / Tech',
  'Services',
  'Éducation / Formation',
  'Santé',
  'Mécanique / Garage',
  'Électricité / Plomberie',
  'Menuiserie',
  'Photographie / Vidéo',
  'Événementiel',
  'Immobilier',
  'Import / Export',
  'Téléphonie / Électronique',
  'Autre',
]

export const PERIODS = [
  { label: "Aujourd'hui", value: 'day' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Cette année', value: 'year' },
]

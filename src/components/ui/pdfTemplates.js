/**
 * pdfTemplates.js — Registre central des 4 templates PDF
 *
 * Chaque template expose :
 *  - id         : identifiant unique (slug)
 *  - label      : nom affiché dans le sélecteur
 *  - PreviewComponent : composant HTML pour l'aperçu dans la modal
 *  - generateBlob     : fonction async (doc, profile, qr, logo, sig, logoBb, currency, cr) => Blob
 *  - thumbnail  : description courte utilisée pour la miniature (couleur accent, etc.)
 */

import { MinimalPdfDocument, generateMinimalPdfBlob } from './MinimalPdfDocument'
import { CorporatePdfDocument, CorporateTemplate, generateCorporatePdfBlob } from './CorporatePdfDocument'
import { ClassicPdfDocument, ClassicTemplate, generateClassicPdfBlob } from './ClassicPdfDocument'
import { ModernPdfDocument, ModernTemplate, generateModernPdfBlob } from './ModernPdfDocument'

// ─── Import du MinimalTemplate (aperçu HTML) depuis PdfPreviewModal ──────────
// Le MinimalTemplate HTML est défini directement dans PdfPreviewModal.jsx.
// On réexporte ici uniquement ce qui est nécessaire pour le registre.

export const PDF_TEMPLATES = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: '3 colonnes · tableau arrondi · totaux superposés',
    accentColor: '#000000',
    generateBlob: generateMinimalPdfBlob,
    PdfDocumentComponent: MinimalPdfDocument,
    // PreviewComponent est injecté depuis PdfPreviewModal (évite l'import circulaire)
    PreviewComponent: null,
  },
  {
    id: 'corporate',
    label: 'Corporate',
    description: 'Logo + ref · tableau simple · totaux alignés',
    accentColor: '#333333',
    generateBlob: generateCorporatePdfBlob,
    PdfDocumentComponent: CorporatePdfDocument,
    PreviewComponent: CorporateTemplate,
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Émetteur/Destinataire · TOTAL HT/TVA/TTC',
    accentColor: '#555555',
    generateBlob: generateClassicPdfBlob,
    PdfDocumentComponent: ClassicPdfDocument,
    PreviewComponent: ClassicTemplate,
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Nom société grand · 2 boxes · carrés déco',
    accentColor: '#888888',
    generateBlob: generateModernPdfBlob,
    PdfDocumentComponent: ModernPdfDocument,
    PreviewComponent: ModernTemplate,
  },
]

/**
 * Retourne le template par son id, ou 'minimal' par défaut
 * @param {string} id
 * @returns {object}
 */
export function getTemplate(id) {
  return PDF_TEMPLATES.find(t => t.id === id) || PDF_TEMPLATES[0]
}

/**
 * Génère le blob PDF pour le template donné
 * @param {string} templateId
 * @param {object} doc
 * @param {object} profile
 * @param {string|null} qrDataUrl
 * @param {string|null} logoDataUrl
 * @param {string|null} signatureDataUrl
 * @param {string|null} logoBbDataUrl
 * @param {string} currency
 * @param {number} conversionRate
 * @returns {Promise<Blob>}
 */
export function generatePdfBlob(templateId, doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency = 'XOF', conversionRate = 1.0) {
  const tpl = getTemplate(templateId)
  return tpl.generateBlob(doc, profile, qrDataUrl, logoDataUrl, signatureDataUrl, logoBbDataUrl, currency, conversionRate)
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Affiché après login si le profil est incomplet
 * Multi-pages avec barre de progression — inspiré du mobile
 */
export default function WelcomeProfileModal({ open, user, onComplete, onSkip }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  if (!open) return null

  // Calcul des champs manquants
  const isEmpty = (v) => {
    if (v === null || v === undefined) return true
    if (typeof v === 'string') return v.trim() === '' || v === 'null' || v === '0'
    if (typeof v === 'number') return v === 0
    return false
  }

  const FIELDS = [
    { key: 'company_name',       label: "Nom de l'entreprise" },
    { key: 'nif',                label: 'NIF' },
    { key: 'legal_status',       label: 'Statut juridique' },
    { key: 'company_address',    label: 'Adresse' },
    { key: 'professional_phone', label: 'Téléphone pro' },
    { key: 'professional_email', label: 'Email pro' },
    { key: 'logo_path',          label: 'Logo' },
    { key: 'signature_path',     label: 'Signature' },
  ]

  const missingFields = FIELDS.filter(f => isEmpty(user?.[f.key])).map(f => f.label)
  const completedCount = FIELDS.length - missingFields.length
  const percentage = Math.round((completedCount / FIELDS.length) * 100)
  const isComplete = percentage >= 100
  const totalPages = isComplete ? 2 : 3

  const progressColor = percentage < 30 ? '#E53935' : percentage < 70 ? '#FF9800' : '#4CAF50'

  const handleNext = () => setPage(p => Math.min(p + 1, totalPages - 1))
  const handlePrev = () => setPage(p => Math.max(p - 1, 0))

  const handleComplete = () => {
    onComplete?.()
    navigate('/profile/company')
  }

  // ── Pages ──────────────────────────────────────────────────────────────────

  const pages = [
    // Page 0 — Bienvenue + progression
    <div key="welcome" style={{ padding: '32px 28px', textAlign: 'center' }}>
      <img src="/Logo_app2.png" alt="Budget Pilot"
        style={{ width: 72, height: 72, borderRadius: '16px', objectFit: 'cover', marginBottom: '24px' }} />
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111', margin: '0 0 16px' }}>
        {isComplete ? 'Profil Complet !' : 'Bienvenue sur Budget Pilot !'}
      </h2>
      <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
        {isComplete
          ? 'Félicitations ! Votre profil entreprise est complet.'
          : 'Configurons ensemble votre profil entreprise pour profiter de toutes les fonctionnalités.'}
      </p>
      {/* Barre de progression */}
      <div style={{ height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%', width: `${percentage}%`,
          backgroundColor: progressColor, borderRadius: 4,
          transition: 'width 0.3s',
        }} />
      </div>
      <p style={{ fontSize: '14px', color: '#888' }}>Profil complété à {percentage}%</p>
    </div>,

    // Page 1 — Champs manquants (si incomplet)
    ...(!isComplete ? [
      <div key="missing" style={{ padding: '28px', maxHeight: '380px', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: 48 }}>📋</span>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '8px 0 4px' }}>
            Informations à compléter
          </h3>
          <p style={{ fontSize: '14px', color: '#888' }}>
            {missingFields.length} champ{missingFields.length > 1 ? 's' : ''} manquant{missingFields.length > 1 ? 's' : ''}
          </p>
        </div>
        {missingFields.map((field, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px',
            padding: '14px 16px', marginBottom: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '8px',
              backgroundColor: '#E3F2FD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 18 }}>✏️</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>{field}</span>
          </div>
        ))}
      </div>
    ] : []),

    // Page finale — Action
    <div key="action" style={{ padding: '32px 28px', textAlign: 'center' }}>
      <span style={{ fontSize: 56 }}>{isComplete ? '🎉' : '🚀'}</span>
      <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: '20px 0 16px' }}>
        {isComplete ? 'Vous êtes prêt !' : 'Prêt à commencer ?'}
      </h3>
      <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.6, margin: '0 0 32px' }}>
        {isComplete
          ? 'Profitez de toutes les fonctionnalités de Budget Pilot.'
          : 'Complétez votre profil maintenant pour générer des documents professionnels.'}
      </p>
      {isComplete ? (
        <button onClick={onSkip} style={btnPrimary('#4CAF50')}>
          Commencer
        </button>
      ) : (
        <>
          <button onClick={handleComplete} style={{ ...btnPrimary('#1E88E5'), marginBottom: '12px' }}>
            Compléter mon profil
          </button>
          <button onClick={onSkip} style={btnLink}>
            Plus tard
          </button>
        </>
      )}
    </div>,
  ]

  const isFirstPage = page === 0
  const isLastPage = page === totalPages - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px',
        maxWidth: '460px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'fadeInScale 0.2s ease',
        overflow: 'hidden',
      }}>
        {/* Contenu page */}
        {pages[page]}

        {/* Indicateurs de page */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '0 0 12px' }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <div key={i} style={{
              height: 8, borderRadius: 4,
              width: page === i ? 24 : 8,
              backgroundColor: page === i ? '#1E88E5' : '#e0e0e0',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>

        {/* Boutons navigation */}
        {!isLastPage && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 24px 20px',
          }}>
            <button
              onClick={handlePrev}
              disabled={isFirstPage}
              style={{
                ...btnLink,
                visibility: isFirstPage ? 'hidden' : 'visible',
              }}
            >
              ← Précédent
            </button>
            <button onClick={handleNext} style={btnPrimary('#1E88E5')}>
              Suivant →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// ── Styles partagés ──────────────────────────────────────────────────────────

function btnPrimary(color) {
  return {
    display: 'block', width: '100%', padding: '14px',
    backgroundColor: color, color: '#fff',
    border: 'none', borderRadius: '30px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
  }
}

const btnLink = {
  background: 'none', border: 'none',
  fontSize: '14px', color: '#aaa', cursor: 'pointer', padding: '8px',
}

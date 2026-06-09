/**
 * Affiché lors de la soumission d'un formulaire si la limite d'opérations est atteinte
 * Props: open, operationsUsed, operationsLimit, currentPlan ('freemium' | 'basic'), onClose, onUpgrade
 */
export default function OperationsLimitModal({
  open,
  operationsUsed = 0,
  operationsLimit = 10,
  currentPlan = 'freemium',
  onClose,
  onUpgrade,
}) {
  if (!open) return null

  const isFreemium = currentPlan === 'freemium'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px',
        padding: '32px 28px', maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'fadeInScale 0.2s ease',
      }}>
        {/* Icône */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          backgroundColor: '#FFEBEE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 32,
        }}>
          🚫
        </div>

        {/* Titre */}
        <h2 style={{
          textAlign: 'center', fontSize: '22px', fontWeight: '700',
          color: '#111', margin: '0 0 10px',
        }}>
          Limite atteinte
        </h2>

        {/* Message */}
        <p style={{
          textAlign: 'center', fontSize: '14px', color: '#666',
          margin: '0 0 20px', lineHeight: 1.6,
        }}>
          {isFreemium
            ? 'Tu as utilisé toutes tes opérations gratuites ce mois-ci.'
            : 'Tu as utilisé toutes tes opérations Basic ce mois-ci.'}
        </p>

        {/* Compteur visuel */}
        <div style={{
          backgroundColor: 'rgba(229,57,53,0.07)',
          border: '1px solid rgba(229,57,53,0.2)',
          borderRadius: '14px', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', marginBottom: '24px',
        }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          <span style={{ fontSize: '15px', color: '#555' }}>
            <strong style={{ fontSize: '18px', color: '#E53935' }}>{operationsUsed}</strong>
            {' '}/ {operationsLimit} opérations utilisées
          </span>
        </div>

        {/* Message upgrade */}
        <p style={{
          textAlign: 'center', fontSize: '13px', color: '#aaa',
          margin: '0 0 20px', lineHeight: 1.6,
        }}>
          {isFreemium
            ? 'Passe à Basic ou Pro pour continuer à créer des opérations.'
            : 'Passe à Pro pour des opérations illimitées.'}
        </p>

        {/* Bouton principal */}
        <button
          onClick={onUpgrade}
          style={{
            width: '100%', padding: '16px',
            backgroundColor: '#1E88E5', color: '#fff',
            border: 'none', borderRadius: '30px',
            fontSize: '16px', fontWeight: '600', cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          {isFreemium ? 'Voir les offres' : 'Passer en Pro'}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%', background: 'none', border: 'none',
            fontSize: '14px', color: '#aaa', cursor: 'pointer', padding: '8px',
          }}
        >
          Fermer
        </button>
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

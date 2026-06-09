/**
 * Affiché quand il reste ≤ 5 jours avant la fin de l'abonnement
 */
export default function RenewalReminderModal({ open, daysLeft = 0, plan = 'pro', onClose, onRenew }) {
  if (!open) return null

  const planLabel = plan === 'pro' ? 'Pro' : 'Basic'
  const isUrgent = daysLeft <= 2
  const iconBg = isUrgent ? '#FFEBEE' : '#FFF8E1'
  const iconColor = isUrgent ? '#E53935' : '#FFA000'

  const losses = plan === 'pro'
    ? ['Opérations illimitées', 'Données stockées 10 ans', 'Suppression des publicités']
    : ['30 opérations par mois', 'Données stockées 1 an', 'Suppression des publicités']

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
          backgroundColor: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 32,
        }}>
          {isUrgent ? '⚠️' : '⏰'}
        </div>

        {/* Titre */}
        <h2 style={{
          textAlign: 'center', fontSize: '20px', fontWeight: '700',
          color: '#111', margin: '0 0 12px', lineHeight: 1.3,
        }}>
          {daysLeft === 0
            ? "Votre abonnement expire aujourd'hui !"
            : `Votre abonnement expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''} !`}
        </h2>

        {/* Message */}
        <p style={{
          textAlign: 'center', fontSize: '14px', color: '#666',
          margin: '0 0 24px', lineHeight: 1.6,
        }}>
          Votre Offre {planLabel} arrive à expiration. Renouvelez maintenant pour continuer à profiter de toutes les fonctionnalités sans interruption.
        </p>

        {/* Ce que l'utilisateur va perdre */}
        <div style={{
          backgroundColor: '#f5f5f5', borderRadius: '16px',
          padding: '16px', marginBottom: '24px',
        }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#888', margin: '0 0 10px' }}>
            Sans renouvellement vous perdrez :
          </p>
          {losses.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#E53935', fontSize: '16px' }}>−</span>
              <span style={{ fontSize: '13px', color: '#666' }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Bouton Renouveler */}
        <button
          onClick={onRenew}
          style={{
            width: '100%', padding: '16px',
            backgroundColor: '#1E88E5', color: '#fff',
            border: 'none', borderRadius: '30px',
            fontSize: '16px', fontWeight: '600', cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          Renouveler mon abonnement
        </button>

        {/* Fermer */}
        <button
          onClick={onClose}
          style={{
            width: '100%', background: 'none', border: 'none',
            fontSize: '14px', color: '#aaa', cursor: 'pointer', padding: '8px',
          }}
        >
          Plus tard
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

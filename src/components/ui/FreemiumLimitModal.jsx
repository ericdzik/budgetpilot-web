import { Zap } from 'lucide-react'

/**
 * Affiché sur le dashboard quand plan === 'freemium' et visitCount >= 2
 * Présente l'offre Pro pour pousser à l'upgrade
 */
export default function FreemiumLimitModal({ open, onClose, onUpgrade }) {
  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px',
        padding: '28px 24px', maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'fadeInScale 0.2s ease',
      }}>
        {/* Label offre gratuite */}
        <p style={{ fontSize: '14px', color: '#aaa', margin: '0 0 4px' }}>Offre Gratuite</p>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>
          Je teste Budget Pilot
        </h3>

        {/* Fonctionnalités freemium */}
        {['10 opérations par mois', 'Données stockées 6 mois'].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ color: '#1E88E5', fontSize: '16px' }}>✓</span>
            <span style={{ fontSize: '14px', color: '#333' }}>{f}</span>
          </div>
        ))}

        {/* Titre upgrade */}
        <h2 style={{
          textAlign: 'center', fontSize: '26px', fontWeight: '700',
          color: '#111', margin: '24px 0 16px',
        }}>
          Passe à l'offre pro
        </h2>

        {/* Carte Pro recommandée */}
        <div style={{
          border: '1.5px solid #90CAF9', borderRadius: '20px',
          overflow: 'hidden', marginBottom: '16px',
        }}>
          {/* Badge recommandé */}
          <div style={{
            backgroundColor: '#E3F2FD', padding: '8px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '13px', color: '#1E88E5', fontWeight: '600' }}>
              Recommandé
            </span>
          </div>
          {/* Corps bleu */}
          <div style={{
            backgroundColor: '#1E88E5', padding: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>Offre</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 10px', lineHeight: 1.1 }}>
                12 mois
              </p>
              {/* Badge pro */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                backgroundColor: '#f5f5f5', borderRadius: '12px',
                padding: '4px 10px',
              }}>
                <Zap size={12} color="#1E88E5" fill="#1E88E5" />
                <span style={{ fontSize: '11px', color: '#1E88E5', fontWeight: '600' }}>pro</span>
              </div>
            </div>
            <div style={{
              border: '1.5px solid #fff', borderRadius: '30px',
              padding: '12px 18px',
            }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>50 000 F</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{
          textAlign: 'center', fontSize: '13px', color: '#aaa',
          lineHeight: 1.6, margin: '0 0 28px',
        }}>
          Opérations illimitées, Stockage sur 10 ans,{'\n'}Pas de pubs et support prioritaire
        </p>

        {/* Bouton */}
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
          Passer en illimité
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

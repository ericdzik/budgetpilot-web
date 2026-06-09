import { Zap, Check } from 'lucide-react'

/**
 * Affiché une seule fois à la première connexion si billing_cycle === 'welcome'
 * Annonce le 1 mois d'Offre Pro gratuit
 */
export default function WelcomeProModal({ open, onClose }) {
  if (!open) return null

  const features = [
    'Opérations illimitées',
    'Données stockées 10 ans',
    'Suppression des publicités',
    'Support prioritaire VIP',
  ]

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
          backgroundColor: '#E3F2FD',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <span style={{ fontSize: 32 }}>🎉</span>
        </div>

        {/* Titre */}
        <h2 style={{
          textAlign: 'center', fontSize: '22px', fontWeight: '700',
          color: '#111', margin: '0 0 12px', lineHeight: 1.3,
        }}>
          Bienvenue sur Budget Pilot !
        </h2>

        {/* Sous-titre */}
        <p style={{
          textAlign: 'center', fontSize: '14px', color: '#666',
          margin: '0 0 24px', lineHeight: 1.6,
        }}>
          Pour te remercier, tu bénéficies d'un mois d'Offre Pro gratuit pour découvrir toutes les fonctionnalités.
        </p>

        {/* Carte Pro */}
        <div style={{
          backgroundColor: '#1E88E5', borderRadius: '20px',
          padding: '20px', marginBottom: '28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <Zap size={18} color="#fff" fill="#fff" />
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
              Offre Pro — 1 mois gratuit
            </span>
          </div>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Check size={11} color="#fff" strokeWidth={3} />
              </div>
              <span style={{ fontSize: '14px', color: '#fff' }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Bouton */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '16px',
            backgroundColor: '#1E88E5', color: '#fff',
            border: 'none', borderRadius: '30px',
            fontSize: '16px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          Commencer à explorer 🚀
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

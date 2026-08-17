import { useNavigate } from 'react-router-dom'

/**
 * Popup affichée quand un utilisateur gratuit tente d'utiliser
 * une fonctionnalité réservée aux offres Basic et Pro.
 */
export default function PremiumFeatureModal({ open, feature = '', blocking = false, onClose }) {
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '24px',
        padding: '28px 24px', maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'fadeInScale 0.2s ease',
        textAlign: 'center',
      }}>
        {/* Icône couronne */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          backgroundColor: '#E3F2FD',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <img src="/crown.svg" alt="" style={{ width: 34, height: 34 }} />
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 10px' }}>
          Fonctionnalité premium
        </h3>

        <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 8px' }}>
          {feature
            ? `"${feature}" est réservé aux offres Basic et Pro.`
            : 'Cette fonctionnalité est réservée aux offres Basic et Pro.'}
        </p>

        <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
          Abonnez-vous pour en profiter dès maintenant.
        </p>

        <button
          onClick={() => { onClose(); navigate('/subscription') }}
          style={{
            width: '100%', padding: '16px',
            backgroundColor: '#1E88E5', color: '#fff',
            border: 'none', borderRadius: '30px',
            fontSize: '16px', fontWeight: '600', cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          S'abonner
        </button>

        <button
          onClick={blocking ? () => { onClose(); navigate('/dashboard') } : onClose}
          style={{
            width: '100%', background: 'none', border: 'none',
            fontSize: '14px', color: '#aaa', cursor: 'pointer', padding: '8px',
          }}
        >
          {blocking ? 'Retour au dashboard' : 'Fermer'}
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
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9f9f9',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '72px',
        fontWeight: '800',
        color: '#e0e0e0',
        lineHeight: 1,
        marginBottom: '16px',
      }}>
        404
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#222', margin: '0 0 8px' }}>
        Page introuvable
      </h1>
      <p style={{ fontSize: '15px', color: '#888', margin: '0 0 32px', maxWidth: '320px', lineHeight: 1.6 }}>
        Cette page n'existe pas ou a été déplacée.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          backgroundColor: '#E65100',
          color: '#fff',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 28px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Retour au tableau de bord
      </button>
    </div>
  )
}

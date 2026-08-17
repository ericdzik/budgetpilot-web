import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAdminAuthStore from '../../store/adminAuthStore'

function LogoutModal({ onConfirm, onCancel, isLoading }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          padding: '32px',
          width: '100%',
          maxWidth: '420px',
          margin: '0 16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          textAlign: 'center',
        }}
      >
        {/* Icône */}
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          backgroundColor: '#e3f2fd',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>
          Se déconnecter ?
        </h2>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 28px', lineHeight: '1.5' }}>
          Vous allez terminer votre session administrateur. Vous devrez vous reconnecter pour accéder au panneau d'administration.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#f5f5f5',
              color: '#555',
              border: 'none',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#1E88E5',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {isLoading ? 'Déconnexion…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const navigate = useNavigate()
  const { adminLogout, adminUser } = useAdminAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await adminLogout()
      toast.success('Déconnecté avec succès')
      navigate('/admin/login')
    } catch (_) {
      toast.error('Erreur lors de la déconnexion')
      setIsLoggingOut(false)
    }
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* En-tête */}
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>
        Paramètres
      </h1>
      <p style={{ fontSize: '14px', color: '#888', marginBottom: '40px' }}>
        Gérez votre session administrateur
      </p>

      {/* Carte Compte */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #ebebeb',
        padding: '24px',
        marginBottom: '16px',
      }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
          Compte
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            backgroundColor: '#1E88E5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '700', color: '#fff',
            flexShrink: 0,
          }}>
            {(adminUser?.name || 'A')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#111', margin: 0 }}>
              {adminUser?.name || 'Administrateur'}
            </p>
            <p style={{ fontSize: '14px', color: '#888', margin: '2px 0 0' }}>
              {adminUser?.email || ''}
            </p>
          </div>
          <div style={{
            marginLeft: 'auto',
            padding: '4px 14px',
            backgroundColor: '#e3f2fd',
            color: '#1E88E5',
            borderRadius: '50px',
            fontSize: '12px',
            fontWeight: '600',
          }}>
            Admin
          </div>
        </div>
      </div>

      {/* Carte Session */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #ebebeb',
        padding: '24px',
      }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
          Session
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: '500', color: '#111', margin: 0 }}>
              Se déconnecter
            </p>
            <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0' }}>
              Terminer votre session administrateur
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 24px',
              backgroundColor: '#1E88E5',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowModal(false)}
          isLoading={isLoggingOut}
        />
      )}
    </div>
  )
}

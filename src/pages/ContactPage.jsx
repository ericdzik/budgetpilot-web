import { useState } from 'react'
import { toast } from 'react-hot-toast'
import UserBadge from '../components/ui/UserBadge'

export default function ContactPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    const mailto = `mailto:admin@getbudgetpilot.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    window.location.href = mailto
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: 0 }}>
          Contactez-nous
        </h1>
        <UserBadge size={48} />
      </div>

      {/* Corps */}
      <div style={{ flex: 1, padding: '0 28px 40px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>

        {/* Carte info */}
        <div style={{
          backgroundColor: '#e3f2fd', borderRadius: '16px', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', backgroundColor: '#1E88E5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <img src="/iconecontact.svg" alt="" style={{ width: 22, height: 22, filter: 'brightness(0) invert(1)' }} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>Support Budget Pilot</div>
              <div style={{ fontSize: '14px', color: '#555' }}>admin@getbudgetpilot.com</div>
            </div>
          </div>
          <p style={{ fontSize: '14px', color: '#555', margin: 0, lineHeight: 1.6 }}>
            Notre équipe répond généralement sous <strong>24 à 48 heures ouvrées</strong>.
            N'hésitez pas à nous décrire votre problème en détail.
          </p>
        </div>

        {/* Formulaire */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Sujet */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>Sujet</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ex: Problème avec une facture"
              style={{
                padding: '12px 14px', borderRadius: '10px',
                border: '1.5px solid #e0e0e0', fontSize: '15px',
                color: '#111', outline: 'none', width: '100%', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.border = '2px solid #1E88E5'}
              onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
            />
          </div>

          {/* Message */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Décrivez votre problème ou votre question..."
              rows={6}
              style={{
                padding: '12px 14px', borderRadius: '10px',
                border: '1.5px solid #e0e0e0', fontSize: '15px',
                color: '#111', outline: 'none', width: '100%', boxSizing: 'border-box',
                resize: 'vertical', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.border = '2px solid #1E88E5'}
              onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
            />
          </div>

          {/* Bouton */}
          <button
            onClick={handleSend}
            style={{
              backgroundColor: '#1E88E5', color: '#fff',
              border: 'none', borderRadius: '30px',
              padding: '14px 40px', fontSize: '16px', fontWeight: '600',
              cursor: 'pointer', alignSelf: 'flex-start',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Envoyer un email
          </button>
        </div>
      </div>
    </div>
  )
}

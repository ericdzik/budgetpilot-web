import { useState } from 'react'
import UserBadge from '../components/ui/UserBadge'

const FAQS = [
  {
    q: 'Comment créer une facture ou un devis ?',
    a: "Depuis le menu principal, cliquez sur \"Facture\" ou \"Devis\" dans la section Création. Remplissez les informations (client, articles, montants) et enregistrez. Votre document est généré automatiquement en PDF.",
  },
  {
    q: 'Comment enregistrer une dépense ?',
    a: "Depuis le menu, cliquez sur \"Dépense\" dans la section Création. Renseignez la catégorie, le montant et la date. La dépense apparaîtra dans votre historique et vos statistiques.",
  },
  {
    q: 'Comment télécharger un document en PDF ?',
    a: "Ouvrez le document souhaité depuis la section \"Suivi\". Cliquez sur l'icône de téléchargement. Le PDF sera téléchargé directement sur votre appareil.",
  },
  {
    q: "Qu'est-ce que le pack de démarrage Welcome ?",
    a: "Lors de votre inscription, vous bénéficiez automatiquement de 1 mois d'accès Premium gratuit. C'est notre façon de vous remercier et de vous permettre de découvrir toutes les fonctionnalités de Budget Pilot sans engagement.",
  },
  {
    q: 'Quels sont les abonnements disponibles ?',
    a: "Budget Pilot propose plusieurs formules :\n• Mensuel : 5 000 F CFA\n• Trimestriel : 13 500 F CFA (économie de 10%)\n• Annuel : 50 000 F CFA (économie de 17%)\n\nL'abonnement Premium supprime les publicités et donne accès à toutes les fonctionnalités en illimité.",
  },
  {
    q: 'Comment souscrire à un abonnement ?',
    a: "Allez dans Paramètres > Abonnement. Choisissez votre formule et cliquez dessus. Vous serez redirigé vers la page de paiement sécurisé. Une fois le paiement confirmé, votre abonnement est activé immédiatement.",
  },
  {
    q: 'Comment annuler mon abonnement ?',
    a: "Allez dans Paramètres > Abonnement. Si vous avez un abonnement actif, cliquez sur \"Annuler l'abonnement\". Votre accès Premium restera actif jusqu'à la date de renouvellement prévue.",
  },
  {
    q: 'Comment réinitialiser mon mot de passe ?',
    a: "Sur l'écran de connexion, cliquez sur \"Mot de passe oublié ?\". Entrez votre adresse email, vous recevrez un code de réinitialisation. Saisissez ce code et définissez votre nouveau mot de passe.",
  },
  {
    q: 'Puis-je me connecter avec Google ?',
    a: "Oui. Sur l'écran de connexion ou d'inscription, cliquez sur \"Continuer avec Google\". Vos informations de profil (nom, email, photo) seront automatiquement récupérées depuis votre compte Google.",
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: "Oui. Toutes vos données sont hébergées sur des serveurs sécurisés avec chiffrement HTTPS. Nous ne vendons jamais vos données à des tiers. Consultez notre Politique de Confidentialité pour plus de détails.",
  },
  {
    q: 'Comment contacter le support ?',
    a: "Vous pouvez nous contacter par email à admin@getbudgetpilot.com. Nous répondons généralement sous 24 à 48 heures ouvrées. Vous pouvez aussi utiliser le bouton \"Contactez-nous\" dans les Paramètres.",
  },
]

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      onClick={() => setOpen(v => !v)}
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '15px', fontWeight: '600', color: '#111', flex: 1 }}>
          {question}
        </span>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="#1E88E5" strokeWidth="2.5"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {open && (
        <>
          <div style={{ height: '1px', backgroundColor: '#f0f0f0', margin: '12px 0' }} />
          <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
            {answer}
          </p>
        </>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: 0 }}>FAQ</h1>
        <UserBadge size={48} />
      </div>

      <div style={{ flex: 1, padding: '0 28px 40px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '800px' }}>
        {FAQS.map((item, i) => (
          <FaqItem key={i} question={item.q} answer={item.a} />
        ))}
      </div>
    </div>
  )
}

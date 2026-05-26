import { useState } from 'react'
import UserBadge from '../components/ui/UserBadge'

const CGU = `CONDITIONS GÉNÉRALES D'UTILISATION

Dernière mise à jour : Janvier 2025

1. OBJET
Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application Budget Pilot, éditée par Webkory. En utilisant l'application, vous acceptez sans réserve les présentes CGU.

2. DESCRIPTION DU SERVICE
Budget Pilot est une application de gestion financière destinée aux entrepreneurs et petites entreprises. Elle permet de créer des factures, devis, suivre les dépenses et recettes, et visualiser des statistiques financières.

3. ACCÈS AU SERVICE
L'accès à Budget Pilot nécessite la création d'un compte utilisateur. Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute utilisation de votre compte est sous votre responsabilité.

4. UTILISATION ACCEPTABLE
Vous vous engagez à utiliser Budget Pilot uniquement à des fins légales et conformément aux présentes CGU. Il est interdit de :
• Utiliser le service à des fins frauduleuses ou illégales
• Tenter d'accéder aux données d'autres utilisateurs
• Reproduire ou distribuer le contenu de l'application sans autorisation
• Perturber le fonctionnement du service

5. PROPRIÉTÉ INTELLECTUELLE
L'application Budget Pilot, son contenu, son design et ses fonctionnalités sont la propriété exclusive de Webkory. Toute reproduction, modification ou distribution sans autorisation écrite est interdite.

6. DONNÉES PERSONNELLES
Le traitement de vos données personnelles est régi par notre Politique de Confidentialité. En utilisant Budget Pilot, vous consentez à ce traitement.

7. ABONNEMENTS ET PAIEMENTS
Les abonnements Premium sont payants et non remboursables sauf disposition légale contraire. Les tarifs sont affichés dans l'application et peuvent être modifiés avec un préavis de 30 jours.

8. LIMITATION DE RESPONSABILITÉ
Budget Pilot est fourni "tel quel". Webkory ne garantit pas l'absence d'interruptions ou d'erreurs. Notre responsabilité est limitée au montant payé pour l'abonnement en cours.

9. RÉSILIATION
Vous pouvez supprimer votre compte à tout moment depuis les paramètres. Webkory se réserve le droit de suspendre ou supprimer un compte en cas de violation des CGU.

10. MODIFICATIONS
Webkory se réserve le droit de modifier les présentes CGU. Les modifications entrent en vigueur dès leur publication dans l'application.

11. DROIT APPLICABLE
Les présentes CGU sont soumises au droit togolais. Tout litige sera soumis aux tribunaux compétents de Lomé, Togo.

Contact : admin@getbudgetpilot.com`

const PRIVACY = `POLITIQUE DE CONFIDENTIALITÉ

Dernière mise à jour : Janvier 2025

1. RESPONSABLE DU TRAITEMENT
Webkory, éditeur de Budget Pilot, est responsable du traitement de vos données personnelles.
Contact : admin@getbudgetpilot.com

2. DONNÉES COLLECTÉES
Nous collectons les données suivantes :
• Informations de compte : nom, email, numéro de téléphone
• Données d'entreprise : nom de l'entreprise, adresse, NIF, logo, signature
• Données financières : factures, devis, dépenses, recettes
• Données techniques : adresse IP, type d'appareil, logs d'utilisation

3. FINALITÉS DU TRAITEMENT
Vos données sont utilisées pour :
• Fournir et améliorer le service Budget Pilot
• Gérer votre compte et votre abonnement
• Vous envoyer des notifications importantes
• Assurer la sécurité du service
• Respecter nos obligations légales

4. BASE LÉGALE
Le traitement est fondé sur :
• L'exécution du contrat (fourniture du service)
• Votre consentement (communications marketing)
• Nos intérêts légitimes (sécurité, amélioration du service)

5. CONSERVATION DES DONNÉES
Vos données sont conservées pendant la durée de votre abonnement actif, plus 3 ans après la résiliation pour les obligations légales. Les données financières sont conservées 10 ans conformément aux obligations comptables.

6. PARTAGE DES DONNÉES
Nous ne vendons jamais vos données. Elles peuvent être partagées avec :
• Nos prestataires techniques (hébergement : Hostinger, France)
• Les autorités compétentes sur demande légale

7. SÉCURITÉ
Vos données sont protégées par :
• Chiffrement HTTPS pour toutes les communications
• Authentification sécurisée (tokens JWT)
• Serveurs hébergés en France (Hostinger)
• Accès restreint aux données

8. VOS DROITS
Conformément à la réglementation applicable, vous disposez des droits suivants :
• Droit d'accès à vos données
• Droit de rectification
• Droit à l'effacement ("droit à l'oubli")
• Droit à la portabilité
• Droit d'opposition

Pour exercer ces droits : admin@getbudgetpilot.com

9. COOKIES
L'application utilise des tokens d'authentification stockés localement. Aucun cookie de tracking tiers n'est utilisé.

10. MODIFICATIONS
Cette politique peut être mise à jour. Vous serez informé de tout changement significatif via l'application.

Contact : admin@getbudgetpilot.com`

export default function TermsPage() {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', margin: 0 }}>
          Informations légales
        </h1>
        <UserBadge size={48} />
      </div>

      {/* Onglets */}
      <div style={{ padding: '0 28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e0e0e0' }}>
          {["Conditions d'utilisation", 'Confidentialité'].map((label, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                padding: '12px 24px',
                border: 'none', backgroundColor: 'transparent',
                fontSize: '15px', fontWeight: tab === i ? '700' : '500',
                color: tab === i ? '#1E88E5' : '#888',
                cursor: 'pointer',
                borderBottom: tab === i ? '2px solid #1E88E5' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, padding: '0 28px 40px', maxWidth: '800px' }}>
        <div style={{
          backgroundColor: '#fff', borderRadius: '16px',
          padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <pre style={{
            fontSize: '14px', lineHeight: 1.8, color: '#333',
            whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0,
          }}>
            {tab === 0 ? CGU : PRIVACY}
          </pre>
        </div>
      </div>
    </div>
  )
}

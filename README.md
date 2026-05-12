# Budget Pilot Web

Application web de gestion financière pour entrepreneurs africains.

## Stack technique

- **React 19** + **Vite 8**
- **React Router 6** pour le routage
- **Tailwind CSS** pour le design
- **Zustand** pour la gestion d'état
- **Axios** pour les appels API
- **Recharts** pour les graphiques
- **Lucide React** pour les icônes
- **React Hot Toast** pour les notifications

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'app sera disponible sur `http://localhost:5173`

## Build production

```bash
npm run build
```

## Configuration

Créer un fichier `.env` à la racine :

```env
VITE_API_URL=http://147.93.95.204/api
```

## Structure du projet

```
src/
├── components/
│   ├── layout/          # Layouts (Sidebar, Header, etc.)
│   └── ui/              # Composants UI réutilisables
├── config/              # Configuration (API, constantes)
├── pages/               # Pages de l'application
│   ├── auth/            # Pages d'authentification
│   └── ...              # Autres pages
├── services/            # Services API
├── store/               # État global (Zustand)
├── utils/               # Utilitaires (formatters, etc.)
├── router.jsx           # Configuration du routeur
└── main.jsx             # Point d'entrée
```

## Fonctionnalités

- ✅ Authentification (login, register, forgot password)
- ✅ Dashboard avec statistiques et graphiques
- ✅ Gestion des documents (factures, devis)
- ✅ Gestion des clients
- ✅ Gestion des dépenses
- 🚧 Gestion des recettes
- 🚧 Statistiques avancées
- 🚧 Paramètres utilisateur
- 🚧 Gestion des abonnements

## API Backend

L'application consomme l'API Laravel existante sur `http://147.93.95.204/api`

Endpoints principaux :
- `/login`, `/register`, `/logout`
- `/dashboard/stats`, `/dashboard/treasury`
- `/documents`, `/clients`, `/expenses`, `/revenues`
- `/profile`, `/subscription/status`

## Déploiement

L'app peut être déployée sur :
- **Netlify** (recommandé)
- **Vercel**
- **GitHub Pages**
- Tout hébergeur statique

Commande de build : `npm run build`
Dossier de sortie : `dist/`

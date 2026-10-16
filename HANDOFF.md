# BudgetPilot — Passation complète

Document pour reprendre le travail sur une autre machine (Mac) avec Claude Code. Il résume tout ce qui a été fait sur le projet, l'état actuel, et les pièges à connaître. La même copie est placée à la racine de chacun des trois dépôts.

Langue de travail avec l'utilisateur : français. Il préfère des réponses courtes et directes, et veut tester sur un vrai téléphone avant de passer à la suite.

## 1. Le projet

BudgetPilot : application de gestion pour entrepreneurs africains (facturation, devis, dépenses, clients, statistiques). Trois dépôts séparés, pas de monorepo :

| Dépôt | Stack | Rôle |
|---|---|---|
| `budgetpilot-backend` | Laravel 12, PHP 8.2, PostgreSQL | API + espace admin (routes `/api/admin/*`) |
| `budgetpilot-mobile` | Flutter (Dart 3.8+), v2.0.1+31 | App Android/iOS |
| `budgetpilot-web` | React + Vite | Web utilisateur + espace admin |

GitHub : `github.com/ericdzik/budgetpilot-{backend,mobile,web}`.

Production : serveur `147.93.95.204` (HTTP), domaines `getbudgetpilot.com` / `getbudgetpilot-web.com`. Le mobile appelle `http://147.93.95.204/api` (HTTP volontaire, voir section 4), le web `https://getbudgetpilot-web.com/api`.

Identifiants de l'app : Android `com.budget.budgetpilot`, iOS bundle `com.budget.budgetpilot`, App Store id `6760863629` (nom « b-pilot »).

Offre : Gratuit (10 opérations/mois, 6 mois de rétention, pubs), Basic (3000 XOF/mois, 30 ops, 12 mois), Pro (5000 XOF/mois, illimité, 120 mois). TVA par défaut 18 %. Paiement Mobile Money, programme de parrainage, 5 modèles de PDF, multi-devises.

## 2. Ce qui a été fait (chronologique, par thème)

### Préparation du déploiement
- Branches éparpillées consolidées en une branche propre `release/pre-deploy` par dépôt, mergée dans `main` par PR (web PR #1, backend PR #7, mobile PR #19). KKiaPay a été exclu et isolé dans des branches `feature/kkiapay` : ne pas le mélanger au reste.
- Mobile : une branche de sauvegarde `backup/pre-consolidation-0919` existe.
- Web : `package-lock.json` resynchronisé (branche `fix/package-lock`) après un échec du build serveur sur `react-pdf`.
- Nginx : correction du type MIME des fichiers `.mjs` (bloc `location ~* \.mjs$` servant `application/javascript`), appliquée à la main sur le serveur, pas dans un dépôt.
- HTTPS : après essais (middleware `ForceHttps` qui cassait les anciennes versions de l'app appelant par IP, puis expiration de 30 jours des tokens Sanctum), tout a été **retiré à la demande explicite de l'utilisateur** : retour au HTTP + IP. Ne pas réintroduire HTTPS ni d'expiration de token sans qu'il le demande. L'exception ATS iOS dans `Info.plist` est limitée à l'IP du serveur.

### PDF et modèles
- Bugs de rendu de signature corrigés côté mobile (modèles Classique et Moderne).
- Bloc signature du modèle Administratif refait (ÉMETTEUR / DESTINATAIRE, sans noms).
- Interface de personnalisation couleur et police des PDF unifiée entre web et mobile.
- Cohérence premium : le modèle Administratif est premium sur le web comme sur mobile (`PREMIUM_TEMPLATES` dans `PdfPreviewModal.jsx`, commit `fb9f524` sur `main` du web).

### Pagination de l'écran « Suivi » (contournement backend)
- Le mobile ne lit que la page 1 alors que le backend paginait à 20. Comme l'utilisateur ne voulait pas de mise à jour mobile, le correctif est côté backend sur `main` (commit `328f760`) : `DocumentController` et `ExpenseController` renvoient tout (`paginate(max($total, 1))`) avec le même format de réponse.
- Dette technique : le vrai correctif mobile (`_fetchAllPages` dans `history_screen.dart`) existe mais **n'est volontairement pas committé**. Quand une release mobile le livrera, remettre `paginate(20)` côté backend.

### Liens de l'application
- Liens Play Store, App Store et web récupérés. Deux bugs repérés mais non corrigés : `routes/api.php` utilise un mauvais package id (`com.budgetpilot`) dans `update_url`, et les boutons « noter l'app » du mobile et du web ne pointent que vers le Play Store.

### Présentation du 26 septembre
- Doc Claude « Budget Pilot — Parcours de démo (présentation samedi) » (https://claude.ai/code/artifact/42ebba63-9bd9-4111-80ef-2ac8b5a13f26) : trois scénarios minutés (15, 7 et 3 min) calqués sur un PDF de référence fourni par l'utilisateur, avec « Vous faites / Vous dites » par étape, comment choisir, et pense-bête.

### Espace admin (branche `feature/admin-back-office`, terminée, non poussée)
Demandes d'un client reçues par email :
- Export Excel de tous les utilisateurs respectant les filtres actifs : `GET /api/admin/users/export` (`AdminController::exportUsers`), bouton « Exporter Excel » dans `AdminUsersPage.jsx`.
- Colonne Téléphone triable (classement par indicatif) : tri sur `users.phone`.
- Suppression d'une note/action support : `DELETE /api/admin/users/{id}/notes/{noteId}`, icône bleue et dialog de confirmation dans `AdminUserDetailPage.jsx`.
- Filtre Tous / Notes / Actions support sur la timeline « Suivi et Notes » d'une fiche utilisateur.
- La logique de filtres de `AdminController::users()` a été factorisée dans `buildUsersQuery()` (partagée avec l'export).
- Commits : backend `683646d` ; web `1ed014c`, `a479b44`, `44249ad`, `aa25fcd`, `5abbf55`.

### Gamification V1 (branche `feature/gamification-v1`)
Détail et plan complet : doc Claude « BudgetPilot — Plan technique Gamification V1 » (https://claude.ai/code/artifact/dac724f8-607a-41bc-a0d8-3fec6bfdb0db). 12 fonctionnalités en 7 phases.

| Phase | Contenu | État |
|---|---|---|
| 0 | Infra notifications push (FCM) | Faite, testée sur Android réel |
| 1 | #2 Barre de complétion du profil, #10 Message à la 1re personnalisation PDF | Faite, committée |
| 2 | #3 1re facture/devis, #12 1er encaissement, #5 Jalons 10/50/100, #9 Badge client fidèle | Faite, committée |
| 3 | #7 Checklist de démarrage, #4 Rappel de reprise, #8 Bilan mensuel | **À faire (prochaine)** |
| 4 | #1 Notif factures impayées, #11 Rappel de parrainage | À faire |
| 5 | #6 Indicateur simplifié de santé financière | À faire (valider les libellés avec l'utilisateur avant) |
| 6 | Tests et mise en production progressive | À faire |

Commits : backend `114208c` (phase 0), `eb2e289` (1), `abb2e16` (2) ; mobile `f9ebcd9` (0), `6169e24` (1), `b84b070` (2). La branche backend part de `feature/admin-back-office`, la branche mobile part de `main`, la branche web existe sans commit propre.

Pas encore vérifiés visuellement par l'utilisateur : message de félicitations PDF (#10), dialogs « Première facture » / « Client fidèle », badge étoile client fidèle. Le code est écrit et analysé.

## 3. Architecture de la gamification

### Push (Phase 0)
- Backend : tables `device_tokens` et `notification_logs`, `PushNotificationService` (`app/Services`), `POST/DELETE /api/device-tokens`, commande `php artisan notifications:test-push {user_id}`.
- `sendGamificationNotification()` applique les règles : jamais deux fois le même type le même jour, plafond de 2 notifications/semaine partagé entre les types passés en `$sharedCapTypes` (factures impayées + rappel de reprise).
- On utilise `google/auth` + l'API HTTP v1 de FCM, **pas** `kreait/firebase-php` (exige l'extension PHP `sodium`, absente de l'environnement Windows d'origine).
- La clé de compte de service Firebase doit être dans `budgetpilot-backend/storage/app/firebase/firebase-adminsdk.json`. Elle est gitignorée et **absente des dépôts** : la retélécharger (Firebase Console, projet `budgetpilote-8968d` > Paramètres > Comptes de service > Générer une nouvelle clé). Variables `.env` : `FIREBASE_PROJECT_ID=budgetpilote-8968d`, `FIREBASE_CREDENTIALS_FILE=firebase-adminsdk.json`. Ne jamais la committer.
- Mobile : `lib/services/push_notification_service.dart`, initialisé dans `main.dart`, token enregistré au login/register/social login et retiré au logout. Le tap navigue vers `message.data['route']`.
- Pas de file de jobs Laravel : les déclencheurs des phases 3-4 passeront par des commandes planifiées (`Schedule::command(...)` dans `routes/console.php`, modèle : `subscription:check-expired`).

### Complétion du profil (Phase 1)
- `GET /api/profile/completion` : 8 champs à poids égal (logo, signature, NIF, nom/adresse/ville/pays de l'entreprise, téléphone).
- **L'écran Profil réel est `ProfileMenuScreen` (route `/profile`)**, pas `ProfileScreen` (route `/profile/full`, liée nulle part). La carte est dans `profile_menu_screen.dart`.

### Badges (Phase 2)
- `app/Services/GamificationMilestoneService.php` : `checkCreationMilestones()` (appelé par `DocumentController::store`) et `checkPaymentMilestones()` (appelé par `DocumentController::update` au passage à « payé » et par `PaymentController::markAsPaid`). Le backend renvoie une clé `milestones`.
- Deux chemins « marquer payé » côté mobile : `DocumentService.markAsPaid` (PUT `/documents/{id}`, fiche détail et liste) et `PaymentService.markAsPaid` (POST `/documents/{id}/mark-as-paid`, historique). Les deux sont gérés.
- Mobile : `lib/utils/milestone_messages.dart` (`showMilestoneDialogs`), `Client.isLoyal` avec `loyalClientThreshold = 5` (doit rester égal à `LOYAL_CLIENT_THRESHOLD` backend). `ClientController::show` renvoie `paid_invoices_count` en all-time.

## 4. Règles et décisions de l'utilisateur à respecter

- Pas de HTTPS ni d'expiration de token tant qu'il ne le redemande pas.
- Pas de mise à jour mobile pour la pagination : le correctif reste côté backend, et `history_screen.dart` garde son hunk de pagination non committé (utiliser `git add -p` pour committer autre chose dans ce fichier).
- KKiaPay reste isolé dans `feature/kkiapay`.
- Ne jamais committer sans demande, ne jamais pousser sans accord explicite.
- Push iOS volontairement mis de côté (voir section suivante).

## 5. En suspens

- **Rien n'est poussé sur GitHub** pour `feature/gamification-v1` et `feature/admin-back-office`. Il faut pousser depuis l'ancienne machine (le classifieur d'auto mode de Claude Code bloquait `git push`, l'utilisateur peut le faire lui-même en terminal) ou copier les dossiers.
- **Push iOS cassé** : `lib/firebase_options.dart` déclare l'app iOS sous `com.example.frontBudgetPilot` alors que le vrai bundle id est `com.budget.budgetpilot` (sur toutes les branches), et il n'y a pas de `GoogleService-Info.plist`. À corriger dans Firebase Console puis `flutterfire configure`. Android fonctionne.
- Avant la prod : déployer les migrations, `composer install` (`google/auth`), la clé Firebase, et le cron du scheduler Laravel.
- Les deux bugs de liens (section 2) restent à corriger si l'utilisateur le demande.

## 6. Pièges rencontrés

1. **Un tableau PHP vide s'encode en `[]` et non `{}`.** Le champ `milestones` vide faisait planter le parsing Dart (cast en `Map`) alors que l'action backend avait réussi : l'app affichait une erreur mais les données étaient bonnes. Corrigé : `(object) $milestones` en PHP, `is Map ? ... : {}` en Dart. À retenir pour tout champ « objet » pouvant être vide.
2. **Facture déjà payée** : ses articles/montants ne sont plus modifiables (`DocumentController::update` renvoie 422) ; on duplique. `duplicate()` remet `paid_at` à `null` et le statut à `sent`.
3. **Anti-double-clic** sur « marquer payé » : le serveur de dev PHP est lent sur les premières requêtes, l'utilisateur retapait, et le 2e appel était refusé « déjà payé » à raison.
4. **`flutter install`** échoue avec `INSTALL_FAILED_USER_RESTRICTED` tant que l'utilisateur n'a pas accepté la popup sur le téléphone. Faire `flutter build apk --debug` puis `flutter install --debug -d <id>`.
5. **Serveur de dev Laravel** : `php artisan serve --host=0.0.0.0 --port=8001`. Le port 8000 était occupé par un processus Python (uvicorn) qui répondait à la place de Laravel, d'où de fausses erreurs CORS. Les premières requêtes sont souvent lentes ou en timeout : réessayer avant de conclure à une panne, et vérifier qu'un seul processus écoute le port.
6. **IP locale** : elle change souvent. Pour tester sur téléphone en local, mettre l'IP de la machine dans `lib/config/constants.dart` (`_networkUrl`), basculer `baseUrl` dessus et réinstaller. **Remettre `baseUrl = _productionUrl` avant tout commit.** Idem `budgetpilot-web/.env` (suivi par git : remettre `https://getbudgetpilot-web.com`). Le `.env` du backend n'est pas suivi.
7. **L'utilisateur teste avec un autre compte** que ceux utilisés pour les tests en base (`ahonsueric19@gmail.com`, id 5, au lieu de `ahonsueric01@gmail.com`, id 4). Un « Non autorisé » signifie souvent que le document appartient à l'autre utilisateur.
8. Le CORS backend accepte déjà n'importe quelle IP `192.168.x.x` par regex.
9. Composer sous Windows peut dépasser le timeout de 2 min : lancer en arrière-plan.

## 7. Prochaine étape : Phase 3

- **#7 Checklist de démarrage** (sans push) : endpoint qui renvoie l'état de 4 étapes dans cet ordre : créer sa première facture, enregistrer sa première dépense, compléter le profil, ajouter un client. Une seule étape visible à la fois ; la checklist disparaît quand tout est fait. Composant sur `DashboardScreen`/`HomeScreen`.
- **#4 Rappel de reprise** (push) : 7 jours sans opération → « Cela fait une semaine que vous n'avez pas utilisé BudgetPilot. Pensez à enregistrer vos opérations. » Plafond de 2 notifications/semaine partagé avec #1, envoi vers 9h ou selon les habitudes. La logique de « dernière activité » existe dans `AdminController::computeChurnRisk`.
- **#8 Bilan mensuel** (push) : le 1er de chaque mois, récap du mois précédent (facturé, encaissé, à récupérer, dépenses), tap vers le dashboard, dédoublonné par mois via `notification_logs`, hors plafond hebdomadaire.

Phase 4 : `User::subscriptions()` (hasMany) existe déjà pour retrouver le 1er abonnement payé hors `billing_cycle = 'welcome'`.

## 8. Différences Windows → Mac

- Chemins d'origine `C:\eric\budgetpilot\...` ; adapter. `taskkill`, `netstat -ano`, `ipconfig` deviennent `kill`, `lsof -i :8001`, `ifconfig`.
- Android : `adb` dans le PATH, `flutter devices` pour voir le téléphone.
- Pour iOS sur Mac, corriger d'abord le bundle id Firebase (section 5).

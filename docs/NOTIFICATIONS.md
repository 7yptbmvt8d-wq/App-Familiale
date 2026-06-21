# Notifications push (Firebase Cloud Messaging)

Les notifications « app fermée » reposent sur **Firebase Cloud Messaging (FCM)** :
le client enregistre un jeton d'appareil, et des **Cloud Functions** envoient les
push lorsqu'une activité a lieu.

## Ce qui déclenche une notification

| Déclencheur | Qui est notifié | Fonction |
|---|---|---|
| Nouvelle publication / événement | toute la famille (sauf l'auteur) | `onPostCreate` |
| Nouveau « j'aime » | l'auteur de la publication | `onPostUpdate` |
| Nouveau commentaire | l'auteur de la publication | `onPostUpdate` |
| Événement dans les 24 h | toute la famille | `eventReminders` (tous les jours à 9 h, Europe/Paris) |

## Prérequis

- Le projet Firebase doit être sur le **forfait Blaze** (paiement à l'usage).
  Les Cloud Functions et le planificateur (Cloud Scheduler) ne sont pas
  disponibles sur le forfait gratuit Spark. L'usage d'une famille reste
  largement dans la franchise gratuite mensuelle.

## Mise en place (3 étapes)

### 1. Générer la clé VAPID (Web Push)

Firebase Console → **Paramètres du projet** → onglet **Cloud Messaging** →
section **Configuration Web** → **Generate key pair**. Copie la clé publique.

Ajoute-la ensuite comme **secret de dépôt GitHub** nommé `FCM_VAPID_KEY`
(Settings → Secrets and variables → Actions → New repository secret).
Le prochain déploiement Pages l'injectera dans l'app (`VITE_FIREBASE_VAPID_KEY`).
Sans cette clé, le bouton « Activer » des notifications reste masqué ; le reste
de l'app fonctionne normalement.

### 2. Déployer les Cloud Functions + l'index Firestore

```bash
cd functions
npm install
cd ..
# « prod » = alias du vrai projet (voir .firebaserc)
firebase deploy --only functions,firestore:indexes --project prod
```

Les règles Firestore (`firestore.rules`) stockent déjà les jetons dans
`users/{uid}.fcmTokens` (lisible par soi uniquement). Inutile d'y toucher.

### 3. Activer les notifications dans l'app

Sur le téléphone de chaque membre : **Réglages → Notifications → Activer**,
puis accepter la demande d'autorisation du navigateur.

## Notes

- **iOS** : le push web exige que l'app soit **ajoutée à l'écran d'accueil**
  (PWA), sur iOS 16.4 ou plus. Dans Safari : Partager → « Sur l'écran d'accueil ».
- **Android / Chrome / Firefox desktop** : fonctionne directement, app fermée.
- Les jetons d'appareil invalides sont nettoyés automatiquement à l'envoi.
- Les messages sont « data-only » : c'est `public/firebase-messaging-sw.js` qui
  construit la notification (évite les doublons premier plan / arrière-plan).

## Vérifier / déboguer

```bash
firebase functions:log --project prod        # journaux des envois
```

Si rien n'arrive : vérifier que (1) la clé VAPID est bien déployée, (2) le membre
a accepté l'autorisation, (3) le projet est sur Blaze, (4) l'appareil a un jeton
dans `users/{uid}.fcmTokens` (Console Firestore).

# Famille — mémoire familiale

> **Héros unique : préserver et transmettre la mémoire de la famille.**
> Un fil de souvenirs (photos · récits) partagé, privé et sur invitation.
> Ce n'est pas une messagerie. Voir [`docs/MVP.md`](docs/MVP.md) pour le périmètre taillé.

Application **web / PWA** (React · Vite · TypeScript), fidèle au
[`docs/DESIGN_SPEC.md`](docs/DESIGN_SPEC.md) (album vivant, palette terracotta & sable).
Le backend est **abstrait** : un mode `mock` qui tourne sans aucune clé, et un mode
`firebase` câblé sur les **produits Google** (Auth / Firestore / Storage),
**vérifié sur la Emulator Suite**.

---

## Démarrage rapide

```bash
npm install
npm run dev          # http://localhost:5173  (backend mock par défaut)
```

À l'écran de connexion (sur invitation) :

| Méthode | Détail |
|---|---|
| Bouton « Entrer comme Hélène » | session **responsable** (admin) |
| Bouton « Entrer comme Jeanne » | session **membre** |
| Code d'invitation | `LACROIX-2026` (membre) ou `LACROIX-7788` (responsable) puis prénom |

> Données mock persistées dans le `localStorage` (clé `famille:mock:v2`).

### Scripts

```bash
npm run dev          # serveur de dev
npm run build        # build de production (PWA incluse)
npm run preview      # sert le build
npm run typecheck    # tsc --noEmit
npm run icons        # (re)génère les icônes PWA
npm run e2e          # parcours navigateur réel (Playwright) + captures e2e/shots/
npm run emulators    # Firebase Emulator Suite (Auth/Firestore/Storage) + UI :4000
npm run seed:emulator # injecte la famille de démo dans l'émulateur
npm run e2e:firebase # vérif Firebase de bout en bout sur émulateur
```

---

## Fonctionnalités (MVP)

- **Fil de souvenirs** : photos (upload réel + redimensionnement) et récits, avec
  date « quand c'était », favoris ❤ et commentaires.
- **Souvenirs** : « souvenir du jour » (il y a N ans) + grille de tous les souvenirs.
- **Famille** : annuaire / arbre par génération.
- **Onboarding sur invitation** : rôles responsable / membre, génération et révocation
  de codes (responsable).
- **PWA** installable (manifeste + service worker), repli polices système hors-ligne.

Hors périmètre (assumé) : géolocalisation, agenda, chat, coffre documentaire,
cadeaux, défis. Voir [`docs/MVP.md`](docs/MVP.md).

---

## Architecture

```
src/
├─ backend/
│  ├─ types.ts            # contrat unique « Backend » + types métier
│  ├─ index.ts            # sélection mock | firebase (VITE_BACKEND), import différé
│  ├─ mock/               # implémentation locale (localStorage)
│  └─ firebase/           # Auth anonyme / Firestore / Storage (+ connexion émulateur)
├─ store/AppContext.tsx   # provider React : session, abonnement au fil, actions
├─ components/            # primitives (Avatar, Icon, Sheet, PhotoPlaceholder, TabBar…)
├─ features/
│  ├─ auth/               # connexion sur invitation
│  ├─ fil/                # fil + composer (photo/récit) + items
│  ├─ souvenirs/          # souvenir du jour + grille
│  ├─ famille/            # annuaire par génération
│  └─ settings/           # profil + invitations
├─ lib/                   # format (dates FR, « il y a N ans »), image (resize), labels
└─ styles/                # tokens.css (jetons design) + base.css
```

Toute l'UI consomme l'interface `Backend` : changer de mode = changer une variable
d'environnement, sans toucher à l'UI.

---

## Passer en backend Google (Firebase)

### Essayer sans projet ni clé — Emulator Suite

```bash
npm run e2e:firebase          # seed → build → parcours navigateur (tout-en-un)
# … ou en manuel :
npm run emulators             # UI sur http://localhost:4000
npm run seed:emulator
# puis, avec .env : VITE_BACKEND=firebase et VITE_FIREBASE_EMULATOR=true
npm run dev
```

> `src/backend/firebase/app.ts` se connecte aux émulateurs quand
> `VITE_FIREBASE_EMULATOR=true` (ports 9099 / 8080 / 9199).

### Déploiement en production

1. Créer un projet Firebase (**région UE**, ex. `eur3`, pour le RGPD).
2. Activer **Authentication** (connexion anonyme), **Firestore**, **Storage**.
3. `cp .env.example .env`, renseigner `VITE_BACKEND=firebase` + les `VITE_FIREBASE_*`.
4. `firebase deploy --only firestore:rules,storage` (règles fournies).
5. `npm run build` puis héberger `dist/` (Firebase Hosting, etc.).

### Modèle de données Firestore

```
users/{uid}                  → { familyId, memberId }
families/{fid}               → { name }
families/{fid}/members/{uid} → Member
families/{fid}/posts/{pid}   → Post (fil de souvenirs)
inviteCodes/{CODE}           → Invitation (racine ; id = code)
```

> Les invitations sont une **collection racine** : un nouvel arrivant peut lire *son*
> code pour le valider, sans lister les autres familles. L'onboarding crée `users/{uid}`
> **avant** la fiche membre (les règles en dépendent).

---

## Vérification

- `npm run typecheck` → OK
- `npm run build` → OK (build de production + PWA)
- `npm run e2e` → connexion → Fil / Souvenirs / Famille → publication d'un récit →
  **upload photo réel** : **0 erreur applicative**.
- `npm run e2e:firebase` → backend **Firebase** sur émulateur (Auth anonyme,
  Firestore, temps réel `onSnapshot`, règles) : **0 erreur applicative**.

## Prochaines étapes

- **Phase 2** : capsules **audio** (récits enregistrés), souvenirs du jour avec
  rappels, tags de personnes.
- **Phase 3** : capsules vidéo, fiches enrichies, export « livre de souvenirs ».
- Valider le pilote avec la vraie famille (cf. `docs/MVP.md`).

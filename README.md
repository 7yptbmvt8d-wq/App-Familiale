# Famille — infrastructure familiale privée

> Mémoire familiale + géolocalisation + agenda + albums + arbre.
> Pas une messagerie : une **infrastructure familiale privée** — organisation, sécurité, mémoire, transmission.

Prototype **React / Vite / TypeScript** fidèle au [`docs/DESIGN_SPEC.md`](docs/DESIGN_SPEC.md)
(direction « album vivant + géolocalisation en orbite », palette terracotta & sable).
Le backend est **abstrait** : un mode `mock` qui tourne sans aucune clé (simulation
temps réel intégrée) et un mode `firebase` câblé sur les **produits Google**
(Firebase Auth / Firestore / Storage + Google Maps).

---

## Démarrage rapide

```bash
npm install
npm run dev          # http://localhost:5173  (backend mock par défaut)
```

À l'écran de connexion (sur invitation), trois façons d'entrer en mode démo :

| Méthode | Détail |
|---|---|
| Bouton « Entrer comme Hélène » | session **responsable** (admin) |
| Bouton « Entrer comme Léa » | session **mineure** (partage verrouillé) |
| Code d'invitation | `LACROIX-2026` (adulte) ou `ADO-7788` (mineur) puis prénom |

> Les données mock sont persistées dans le `localStorage` du navigateur. Pour repartir
> de zéro : videz le stockage du site (clé `famille:mock:v1`).

### Scripts

```bash
npm run dev        # serveur de dev
npm run build      # build de production (dossier dist/)
npm run preview    # sert le build
npm run typecheck  # tsc --noEmit
npm run e2e        # parcours navigateur réel (Playwright) + captures dans e2e/shots/
```

> `npm run e2e` télécharge Chromium au premier lancement (`npx playwright install chromium`).
> Les polices (Google Fonts) sont chargées via CDN avec repli sur les polices système
> si le réseau est indisponible.

---

## Architecture

```
src/
├─ backend/
│  ├─ types.ts            # contrat unique « Backend » + types métier
│  ├─ index.ts            # sélection mock | firebase (VITE_BACKEND), import différé
│  ├─ mock/               # implémentation locale + moteur de simulation temps réel
│  │  ├─ data.ts          # famille, membres, géorepères, posts, invitations seedés
│  │  └─ MockBackend.ts   # localStorage + setInterval (positions, ETA, statuts)
│  └─ firebase/           # implémentation « produits Google » (Auth/Firestore/Storage)
├─ store/AppContext.tsx   # provider React : session, abonnements live & feed, actions
├─ components/            # primitives (Avatar, Icon, Sheet, PhotoPlaceholder, TabBar…)
├─ features/
│  ├─ auth/               # connexion sur invitation + rôles
│  ├─ home/               # « fil » scrapbook : présence, souvenir, composer, timeline
│  ├─ map/                # carte temps réel : hub en orbite, état du foyer, géorepères
│  ├─ agenda/ albums/ tree/
│  └─ settings/           # profil, partage de localisation, gestion des invitations
├─ lib/                   # geo (haversine, statut, ETA), format (dates FR), labels
└─ styles/                # tokens.css (jetons design) + base.css
```

Toute l'UI consomme l'interface `Backend`. Changer de mode = changer une variable
d'environnement, **aucune ligne d'UI à modifier**.

---

## Couverture fonctionnelle

Périmètre de cette itération : **MVP fonctionnel** (Auth sur invitation + Carte temps réel + Fil).

| Domaine (cahier) | État | Détail |
|---|---|---|
| 2 · Utilisateurs & rôles | ✅ MVP | invitation only, rôles admin/adulte/mineur, génération/révocation de codes (admin) |
| 3 · Localisation temps réel | ✅ MVP | hub en orbite, statuts (maison/déplacement), distance, batterie, vitesse, géorepères |
| 13 · Carte intelligente | ✅ MVP | « état du foyer » (maison vide / présents / dehors) + ETA prochaine arrivée |
| 14–15 · Confidentialité / RGPD | ✅ MVP | partage **verrouillé** pour les mineurs, opt-in/off pour les adultes, règles Firestore |
| 4 · Communication (fil) | ✅ MVP | fil familial, salons, photos (placeholder), favoris, commentaires |
| 9 · Souvenirs | ✅ MVP | « souvenir du jour » (il y a N ans) |
| 5 · Agenda | 🟡 esquissé | événements + anniversaires dérivés des fiches |
| 6 · Albums | 🟡 esquissé | grille polaroïd des photos du fil |
| 8 · Arbre | 🟡 esquissé | regroupement par génération |
| 7·Coffre · 10·Capsules · 11·Cadeaux · 12·Défis | ⬜ à venir | non commencés |

---

## Passer en backend Google (Firebase)

1. Créer un projet Firebase (**région UE**, ex. `eur3`, pour le RGPD).
2. Activer **Authentication** (connexion anonyme), **Firestore**, **Storage**.
3. Copier la config Web :

   ```bash
   cp .env.example .env
   # renseigner VITE_BACKEND=firebase et les VITE_FIREBASE_*
   ```

4. Déployer les règles de sécurité fournies :

   ```bash
   firebase deploy --only firestore:rules   # depuis firestore.rules
   ```

5. `npm run dev` — l'application utilise désormais Firestore en temps réel.

### Modèle de données Firestore

```
users/{uid}                      → { familyId, memberId }
families/{fid}                   → { name, geofences[] }
families/{fid}/members/{uid}     → Member (rôle, partage…)
families/{fid}/locations/{uid}   → Location (maj par l'app mobile)
families/{fid}/posts/{pid}       → Post (fil)
families/{fid}/invitations/{iid} → Invitation
```

Les [`firestore.rules`](firestore.rules) imposent : accès **sur invitation**, isolation
par famille, et **partage de localisation non désactivable pour les mineurs** (un mineur
ne peut jamais passer `sharing` à autre chose que `auto`).

> **Google Maps** : la clé `VITE_GOOGLE_MAPS_API_KEY` est prévue pour brancher une vue
> carte réelle en complément du hub en orbite (prochaine étape).

---

## Design

Tous les jetons (couleurs, rayons, ombres, typographies `Newsreader`/`Figtree`,
animations `fam-orbit`/`fam-pulse`) sont dans `src/styles/tokens.css`, dérivés de
[`docs/DESIGN_SPEC.md`](docs/DESIGN_SPEC.md). Icônes au trait, pas d'emoji.

---

## Vérification

- `npm run typecheck` → OK
- `npm run build` → OK (build de production, 90 modules)
- `npm run e2e` → parcours complet (connexion → 5 onglets → publication → verrou
  mineur) dans un navigateur réel : **0 erreur applicative**.

## Limites connues / prochaines étapes

- Le mode `firebase` est **écrit et typé** mais non exécuté dans cet environnement
  (aucun projet/clé) : à valider sur un vrai projet Firebase.
- Pas d'upload de vraies photos en mode mock (placeholders monospace) ; l'upload
  Storage est implémenté côté `firebase`.
- Carte Google Maps, notifications push (FCM), coffre documentaire, capsules vidéo,
  cadeaux et défis : à implémenter.

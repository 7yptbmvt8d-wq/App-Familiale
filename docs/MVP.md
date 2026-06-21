# MVP « Mémoire familiale » — périmètre taillé

> Décision produit : un **seul héros**. On préserve et on **transmet la mémoire**
> de la famille. Tout le reste est repoussé ou abandonné.
>
> **État : Phase 1 (socle) livrée** — géoloc retirée, fil de souvenirs (photo/récit),
> upload photo réel, 3 onglets (Fil · Souvenirs · Famille), PWA installable.
> Vérifié en navigateur réel sur les deux backends (mock & Firebase émulateur).

**Boucle cœur :** un membre ajoute un souvenir → il vit dans une timeline partagée →
la famille réagit / complète → d'anciens souvenirs ressurgissent (« il y a N ans »).

**Plateforme : Web / PWA d'abord** (installable, accès photo + micro via le navigateur).
Pas d'app native tant qu'on ne fait pas de localisation → itération rapide et pilote
famille immédiat.

---

## Dans le MVP (et rien d'autre)

| Fonction | État | Note |
|---|---|---|
| Onboarding sur invitation | ♻️ garder / simplifier | rôles = **admin / membre** (on supprime « mineur ») |
| Fil de souvenirs : photo · récit · audio | ♻️ + 🆕 | on retire le type « événement » (→ agenda, hors MVP) |
| **Upload photo réel** (Firebase Storage) | 🆕 | le plus important : sans vraies photos, pas de mémoire |
| **Capsule audio** (enregistrer un récit) | 🆕 | le différenciant « transmission », simple via `MediaRecorder` |
| Réactions ❤ + commentaires | ♻️ | la famille complète le souvenir |
| **Souvenirs du jour** (« il y a N ans ») + rappel | ♻️ + 🆕 | la boucle de rétention |
| Annuaire / arbre (lecture) + taguer des personnes | ♻️ + 🆕 léger | relie souvenirs ↔ personnes |

---

## Hors MVP (non-objectifs assumés)

- ❌ **Toute la géolocalisation** : carte, état du foyer, géorepères, ETA.
- ❌ **Suivi des mineurs / partage de position** → supprime le risque RGPD/éthique pour l'instant.
- ❌ Agenda partagé · Chat / salons (« ce n'est pas une messagerie ») · Coffre
  documentaire · Liste de cadeaux · Défis · IA · carte intelligente.
- ❌ **App native** — à reconsidérer seulement si on réintroduit la localisation.

> Pourquoi ce choix : la mémoire est le plus **différenciant** (Google Photos ne fait
> pas la transmission intergénérationnelle), le moins risqué côté RGPD, et **faisable
> sur la base actuelle**. Couper la géoloc retire à la fois le travail le plus dur
> (GPS arrière-plan natif) et le plus gros risque légal.

---

## Réutilisation / coupe dans le code actuel

- **On garde** : fil + composer + réactions/commentaires, souvenir du jour,
  invitations, **tout le backend Firebase vérifié** (Auth / Firestore / Storage /
  règles), le design system (terracotta & sable, scrapbook).
- **On retire** : `features/map`, le moteur de simulation géo du mock, les champs
  `Location` / `sharing`, le verrou mineur, l'onglet « Carte », les géorepères.
- **Navigation cible : Fil · Souvenirs · Famille** (3 onglets au lieu de 5).

---

## Validation — le vrai but

Mettre le pilote devant la **vraie famille** (5–10 personnes, 2 générations) et mesurer :

- **% de membres qui publient** (pas seulement consomment) ;
- nombre de souvenirs / semaine, nombre de commentaires / souvenir ;
- **au moins un grand-parent a enregistré une capsule** ;
- **rétention à 3 semaines** — le « souvenir du jour » crée-t-il l'habitude ?

Hypothèse n°1 à tester : *les gens ajoutent-ils spontanément, ou seulement quand on
les sollicite ?* Si c'est « seulement sollicité », la valeur est dans les **rappels**
(souvenir du jour, « raconte ce moment »), pas dans le fil brut.

---

## Séquencement (phases, pas dates)

1. **Socle** — nettoyer le périmètre (retirer la géoloc), **upload photo réel**,
   onboarding propre, déployer un **pilote web / PWA** sur Firebase.
2. **Différenciant** — **capsules audio**, souvenirs du jour + rappels, tags de personnes.
3. **Transmission** — capsules vidéo, fiches grands-parents enrichies, export
   « livre de souvenirs » (PDF / impression).

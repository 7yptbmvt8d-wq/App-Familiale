# App Famille privée — Spécification esthétique (handoff Claude Code)

Mémoire familiale : fil d'actualité + géolocalisation + agenda + albums + arbre.
Direction retenue : **Album vivant (scrapbook papier) + géolocalisation en hub orbite**.

## Typographie
- **Titres / moments éditoriaux** : `Newsreader` (serif), poids 400–600, souvent en *italique* pour les légendes et titres d'entrée. Google Fonts.
- **Interface / libellés / corps** : `Figtree` (sans), poids 400/500/600/700. Google Fonts.
- **Légendes de placeholder photo** : monospace système (`monospace`).
- Échelle indicative (mobile) : grand titre serif 34px · titre carte 19–20px · corps 13–14px · libellé onglet 10px · meta 9.5–11px.
- Sur-titres en `text-transform:uppercase; letter-spacing:1.5–2.5px; font-weight:700`.

## Palette (terracotta & sable, chaud)
| Rôle | Hex |
|---|---|
| Fond sable (app) | `#F3EADD` |
| Fond papier crème (scrapbook) | `#EFE3D2` |
| Carte / papier blanc chaud | `#FBF6EE` / `#FCFAF4` |
| Sable foncé (avatars, panneaux) | `#EBDFCD` |
| Terracotta (primaire/accent) | `#C4623F` |
| Terre cuite profonde (texte accent, away) | `#A24C32` |
| Ocre / or (catégorie agenda, scotch) | `#C99A4E` |
| Sauge (présent / à la maison) | `#7E8A6A` |
| Encre espresso (texte) | `#2E2620` |
| Texte adouci | `#6B5D4F` |
| Texte tertiaire / meta | `#9A8C7C` |
| Bordures papier | `#D8C7B2` / `#E3D2B6` |

Couleurs supplémentaires : composer en `oklch` à chroma/luminance constants, varier seulement la teinte.

## Codes couleur géolocalisation
- **À la maison / proche** : anneau + texte **sauge** `#7E8A6A`.
- **En déplacement** : anneau + texte **terracotta** `#A24C32` / `#C4623F`.
- **Mineur (partage auto)** : badge rond sombre `#2E2620` avec cadenas crème, libellé `AUTO`. Partage automatique pour les mineurs, sur autorisation pour les adultes.
- Sous chaque prénom : **la distance** (« à la maison », « jardin · 15 m », « Bureau · 4,2 km »).

## Formes & profondeur
- Rayons : cartes 22px · tickets/keepsake 12–14px · pastilles/onglets actifs 11px · avatars 50% · polaroïd 1–3px (presque carré).
- Ombres douces, chaudes, jamais noires pures :
  - carte : `0 1px 3px rgba(46,38,32,.05), 0 10px 26px rgba(46,38,32,.05)`
  - polaroïd : `0 6px 20px rgba(46,38,32,.16)`
  - médaillon géo (focal) : `0 0 0 7px rgba(196,98,63,.12), 0 8px 22px rgba(162,76,50,.3)`
- Anneaux avatar : bordure 2.5px de la couleur de statut.

## Métaphores signature
- **Hub géo en orbite** : médaillon « Maison » central (dégradé terracotta), anneaux pointillés sépia en rotation lente, membres en satellites avec nom + distance.
- **Scrapbook** : polaroïds légèrement inclinés (`rotate(-2.5deg)` / `+4deg`) avec morceaux de scotch translucides, tickets d'événement à perforation pointillée + encoches, souvenirs-documents en papier vieilli.
- **Placeholders image** : `repeating-linear-gradient(135deg, ...)` rayé chaud + légende monospace (ex. `étretat · falaise d'aval`). Remplacer par vraies photos.

## Animations (sobres)
- `fam-orbit` : rotation 360° des anneaux, 42–60s linéaire infini (sens alternés).
- `fam-pulse` : point « en direct » qui pulse (scale 1→1.5, opacity 1→.35), 2.4s.
- `fam-float` : flottement vertical léger (±5px) — optionnel pour éléments papier.

## Navigation
- Onglets pied de page libellés (style iOS) : **Accueil · Carte · Agenda · Albums · Arbre**.
- Fond `rgba(251,246,238,.92)` + `backdrop-filter:blur(12px)`, séparateur `0 -0.5px 0 rgba(46,38,32,.1)`.
- Onglet actif terracotta `#C4623F` (icône pleine + libellé 700) ; inactifs `#9A8C7C` (icône trait 1.8px).

## Icônes
Traits simples uniquement (home, pin goutte, calendrier, photo, arbre = 3 cercles reliés). Pas d'emoji. Trait 1.7–1.9px. Pas de SVG illustratif complexe.

## Principes
- Chaleureux + premium « mémoire précieuse ». Densité modérée, beaucoup de respiration.
- Pas de gradients criards, pas d'emoji, pas de bord arrondi + barre d'accent gauche.
- Cible tactile mobile ≥ 44px. Texte mobile ≥ 13px (hors meta).
- Famille élargie (10–25) : prévoir scroll horizontal pour la présence, regroupements dans l'arbre.

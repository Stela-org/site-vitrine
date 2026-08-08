# Prototypes VIT-WOW : monter l'intensité visuelle de la home

Trois maquettes HTML, **hors build et hors sitemap**. Elles ne sont importées
par aucune page Astro, ne passent par aucun `dist/`, et ne sont référencées
nulle part dans le site. Elles existent pour trancher, pas pour être publiées.

Ouvrez-les en double-cliquant : chaque fichier est autonome (les quatre
graisses de Plus Jakarta Sans sont embarquées en base64, aucune requête réseau,
aucune dépendance à `node_modules`).

| Fichier | Ce qui change | Ce qui ne change pas |
|---|---|---|
| `p1-typo.html` | La typographie seule | Le visuel du hero (téléphone), les animations |
| `p2-produit-vivant.html` | Le visuel du hero seul (carte de tableau de bord) | La typographie, restée celle de production |
| `p3-signature-celeste.html` | P1 + P2 + la constellation qui se dessine | Le contenu, mot pour mot |

**Le contenu est identique dans les trois** : mêmes titres, mêmes phrases,
mêmes trois sections (hero, triptyque, chapitre « En privé, d'abord »). Seule
la forme varie, sinon la comparaison ne voudrait rien dire.

## Les règles tenues dans les trois

- **Palette stricte.** Aucune couleur ajoutée, aucun dégradé nouveau. L'éclat
  vient du contraste (encre contre crème, laiton contre blanc) et du mouvement.
  Le seul dégradé présent est celui du hero, déjà en production.
- **Zéro emoji, zéro caractère étoile en clair.** Chaque étoile est le SVG
  canonique du glyphe Stela, celui de `Glyph.astro`.
- **Mobile d'abord.** Les trois sont vérifiés à 375 px : aucun débordement
  horizontal, cible tactile de 55 px sur le bouton principal.
- **VIT-6.** Rien de ce qui informe n'est animé. Ce qui bouge est décoratif
  (`aria-hidden`) ou porte un `role="img"` avec son texte alternatif, et
  **l'état de repos de chaque animation est son état final** : si le moteur
  d'animation ne joue pas, on voit la page complète, jamais une page vide.
- **Aucune librairie.** CSS pour tout le mouvement, sept lignes de JS vanilla
  pour les deux compteurs, dont la valeur finale est déjà dans le HTML.

## Ce que chacun apporte, et ce qu'il coûte

**P1, la typo qui porte.** Le titre passe de 52 à 70 px sur bureau et gagne une
deuxième voix plus légère : l'affirmation prend enfin la place d'une
affirmation, pour le prix d'une feuille de style. Ce qu'il coûte : presque
rien sur mobile, où le titre plafonne déjà (34 px contre 32), donc le gain se
voit surtout sur grand écran.

**P2, le produit vivant.** La carte de tableau de bord montre le produit au lieu
de le raconter, et un avis qui arrive vaut trois arguments : c'est le prototype
qui change le plus la première impression. Ce qu'il coûte : c'est le plus long
à intégrer, et il engage à tenir la maquette à jour quand l'app bougera.

**P3, la signature céleste.** La constellation qui se dessine entre les sections
donne à la page quelque chose que la concurrence ne peut pas copier sans
changer de marque. Ce qu'il coûte : une bande décorative de plus à faire
défiler, et le seul des trois qui ajoute de la hauteur sans ajouter un mot.

## Captures

`captures/` contient les six captures demandées, en deux versions : la page
entière (`p1-typo-desktop.png`) et le premier écran, celui où le « wahou » se
joue (`p1-typo-desktop-premier-ecran.png`). Bureau à 1280 px, mobile à 375 px
en densité 2. Les captures sont prises **4,2 secondes après le chargement**,
donc après la fin de la séquence : ce qu'on y voit est l'état de repos.

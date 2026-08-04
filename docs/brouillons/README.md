# Brouillons « Alternative à [concurrent] », LOT SEO-GEO-1 §B1

> **NON PUBLIÉ. À VALIDER PAR NICOLAS AVANT TOUTE MISE EN LIGNE.**

## Pourquoi ces fichiers sont ici et pas dans `src/pages/`

Ils nomment des concurrents et citeront leurs prix. La consigne était
explicite : ils ne partent pas en ligne sans relecture.

Le moyen le plus sûr d'y arriver n'est pas un drapeau `draft: true` ni une
règle `noindex`, qui reposent tous deux sur du code qu'un lot suivant peut
modifier par mégarde. Ces fichiers vivent **hors de `src/pages/`**, dans
`docs/`. Astro ne construit que `src/pages/` : ils ne peuvent donc pas
apparaître dans le build, ni dans le sitemap, ni dans `robots.txt`, ni être
indexés. Il n'y a rien à désactiver, donc rien à réactiver par accident.

Les publier demandera un geste délibéré : déplacer le fichier dans
`src/pages/`, le convertir en `.astro`, et le déclarer au sitemap.

## ⚠️ L'état réel des données, à lire avant tout

**Aucun prix concurrent n'est publiable en l'état.** Le dépôt ne contient
aucun relevé tarifaire daté ni sourcé. Ce qui existe :

| Source trouvée | Contenu | Pourquoi c'est inutilisable |
|---|---|---|
| `STELLA-V2.md` (hors dépôt vitrine) | « Malou, Zenchef : devis (~80–150 €) », « Custplace, Guest Suite, Birdeye : 79–400 €+ » | Fourchettes précédées d'un tilde, **sans date, sans source publique**. Ce sont des estimations de cadrage, pas un relevé. |
| `stella-app/docs/PRD-BIS.md` | « Malou le vend 300 €+/mois » | Incise sans date ni source. |

La consigne disait : « n'invente aucun chiffre ; si une donnée manque, laisse
un trou visible plutôt qu'une estimation ». **Chaque prix de ces brouillons est
donc un trou visible**, marqué `[RELEVÉ À FAIRE]`, avec la question exacte à
laquelle répondre et l'endroit où la réponse se trouve.

Reprendre les fourchettes ci-dessus aurait produit des pages qui ont l'air
sourcées et ne le sont pas. Sur des pages qui nomment des sociétés réelles,
c'est le risque à ne pas prendre : un prix faux attribué à un concurrent est
attaquable, et il suffit d'une capture pour le prouver.

## La méthode de relevé, à appliquer une fois

Pour chaque concurrent, sur sa **page de tarifs publique** :

1. Noter l'URL exacte et la **date du jour**.
2. Faire une capture d'écran de la grille, archivée à côté du relevé.
3. Relever le prix d'entrée, ce qu'il inclut, et l'engagement.
4. Si le prix n'est pas public (« sur devis »), l'écrire tel quel : « sur
   devis » est un fait vérifiable et publiable, ce n'est pas un trou.
5. Reporter dans le brouillon, en remplaçant le marqueur par le prix, sa date
   et son URL.

Un relevé se périme. Toute page publiée porte visiblement la date de son
dernier relevé, et se revérifie au moins deux fois par an.

## Règle de rédaction tenue dans ces brouillons

- Aucun jugement sur le concurrent, aucun superlatif sur nous.
- **Chaque page dit ce qui joue en faveur du concurrent.** Le comparatif
  actuel du site est 8-0 en notre faveur : il se lit comme une publicité et ne
  convainc personne. Ces pages ne reproduisent pas ce défaut.
- Ce que nous écrivons sur NOUS est vérifiable sur notre propre site. Ce que
  nous écrirons sur EUX viendra d'une page publique, datée, citée.

# URL-MAP.md : correspondance des URL (base des redirections 301)

> Figée au VIT-1. Sert de contrat pour la migration : aucune URL indexée ne doit
> devenir orpheline. Les 301 techniques seront posées au fil des lots (pages
> créées en VIT-2/VIT-4) et la bascule `avistars.fr` au VIT-4.
>
> Deux origines d'URL :
> - `avistars.fr/*` (ancien domaine GitHub Pages) : 301 vers l'équivalent
>   `www.mystela.fr/*` au VIT-4 (repointage DNS vers Vercel, domaine en redirect).
> - `www.mystela.fr/*` (Vercel) : sert désormais le nouveau site Astro. Les
>   anciens chemins conservés gardent leur URL ; les articles `.html` sont
>   redirigés vers des slugs propres (décision VIT-0 n°6).

## Pages conservées (même chemin, contenu réécrit)
| Ancien chemin | Nouveau chemin | Statut |
|---|---|---|
| `/` | `/` | Réécrit (VIT-1 home minimale, VIT-2 home complète) |
| `/qui-sommes-nous` | `/qui-sommes-nous` | À réécrire (VIT-2) |
| `/cgv` | `/cgv` | À refondre (VIT-2) |
| `/mentions-legales` | `/mentions-legales` | À refondre (VIT-2) |
| `/politique-confidentialite` | `/politique-confidentialite` | À refondre (VIT-2) |
| `/restaurants-{ville}` (x9) | `/restaurants-{ville}` | À réécrire/différencier (VIT-4) |
| `/blog/` | `/blog` | À refondre (VIT-4) |

## Articles de blog : `.html` retiré (301)
Décision VIT-0 n°6 : slugs propres sans `.html`. Chaque ancienne URL `.html`
redirige (301) vers le slug sans extension.
| Ancien chemin | Nouveau chemin |
|---|---|
| `/blog/comment-avoir-plus-avis-google-restaurant.html` | `/blog/comment-avoir-plus-avis-google-restaurant` |
| `/blog/repondre-avis-negatif-google-restaurant.html` | `/blog/repondre-avis-negatif-google-restaurant` |
| `/blog/supprimer-mauvais-avis-google-restaurant.html` | `/blog/supprimer-mauvais-avis-google-restaurant` |
| `/blog/e-reputation-restaurant-guide-complet.html` | `/blog/e-reputation-restaurant-guide-complet` |
| `/blog/qr-code-avis-google-restaurant.html` | `/blog/qr-code-avis-google-restaurant` |
| `/blog/avis-google-restaurant-{ville}.html` (x9) | `/blog/avis-google-restaurant-{ville}` |

## Fichiers techniques
| Fichier | Sort |
|---|---|
| `google038f47dee570e8dc.html` | Conservé à la racine (`public/`). Ne jamais supprimer. |
| meta `google-site-verification` (`_riHssD6...`) | Conservée dans le head (VIT-0 décision 10). |
| `robots.txt`, `sitemap.xml` | Régénérés sur `www.mystela.fr` (sitemap Astro : `sitemap-index.xml`). |
| `CNAME` (avistars.fr) | Retiré de la racine Astro. Préservé sur la branche `legacy-avistars` (voir README). |

## Redirections implémentées (VIT-4, `vercel.json`, 301)
Règles sans contrainte de host : actives sur `www.mystela.fr` ET sur
`avistars.fr` une fois le domaine attaché au projet Vercel (page à page).

- `/blog/e-reputation-restaurant-guide-complet.html` → `/blog/e-reputation-commerce-local-guide` (slug renommé)
- `/blog/qr-code-avis-google-restaurant.html` → `/blog/qr-code-avis-google` (slug renommé)
- `/blog/avis-google-restaurant-:ville.html` → `/restaurants-:ville` (**consolidation** : articles ville thin content → landing ville)
- `/blog/:slug.html` → `/blog/:slug` (guides à slug conservé)
- `/blog/index.html` → `/blog`
- `/restaurants-:ville.html` → `/restaurants-:ville`
- `/qui-sommes-nous.html` → `/`
- `mystela.fr` → `www.mystela.fr` (host)
- `avistars.fr/*` et `www.avistars.fr/*` → `https://www.mystela.fr/` (catch-all fallback)

**Reste manuel (Nicolas, fin de projet)** : attacher `avistars.fr` au projet
Vercel en redirect + Change of Address dans Search Console.

## Décision de consolidation (VIT-4)
Les 9 anciens articles de blog `/blog/avis-google-restaurant-{ville}.html` (quasi
clones, cannibalisation avec les landing villes) ne sont PAS remigrés en articles :
leur contenu et leur SEO sont consolidés dans les pages `/restaurants-{ville}`
(intention commerciale, réellement différenciées), vers lesquelles ils redirigent.
Le blog conserve les guides et les piliers GEO.

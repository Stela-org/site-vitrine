# VIDEOS-PRODUIT.md : intégration des 3 clips produit (VIT-6 §6)

> Les clips sont fournis par Nicolas (compte démo, données fictives). Ce document
> décrit les specs d'encodage, les emplacements et l'intégration via le composant
> `src/components/ProductVideo.astro`, déjà prêt.

## Les 3 clips (muets, 5-10 s, boucle)
| # | Contenu | Emplacement cible | Poster de secours |
|---|---|---|---|
| 1 | Vue client : page d'avis `/r/` + roue cadeau | Hero (peut **remplacer** le mockup CSS `PhoneReview` si le rendu est meilleur, décision à la validation de la home) | `/images/hero-bistro.webp` ou une capture de la page d'avis |
| 2 | Réponse automatique aux avis | Section « réponse auto » de la home (à créer au déroulé) | capture section Avis |
| 3 | Carte Retombées (CA / ROI) | Section campagnes / success stories | capture carte ROI |

« Sans tout dévoiler » : uniquement ces 3 vues. Les autres sections gardent les
mockups CSS stylisés.

## Specs d'encodage (à respecter)
- Deux formats par clip : **WebM (VP9/AV1)** + **MP4 (H.264)**, `< 2 Mo` chacun.
- Muet, sans piste audio. 5-10 s, boucle propre (première = dernière image).
- Dimensions natives ~ celles de l'emplacement (éviter le sur-dimensionnement).
- Un **poster** statique par clip (WebP), image représentative (première frame).
- Fichiers auto-hébergés dans `public/video/` (jamais de hotlink). Nommage
  suggéré : `vue-client.{webm,mp4}`, `reponse-auto.{webm,mp4}`, `roi.{webm,mp4}`.

## Intégration (composant prêt : `ProductVideo.astro`)
```astro
<ProductVideo
  poster="/images/poster-vue-client.webp"
  alt="Aperçu de la page d'avis Stela"
  webm="/video/vue-client.webm"
  mp4="/video/vue-client.mp4"
  width={264} height={520} eager
/>
```
Comportement garanti par le composant :
- **Fallback** : le poster (`<img>`) est TOUJOURS rendu. Sans JS, sans vidéo, ou
  sous `prefers-reduced-motion`, on ne voit que cette image (aucune vidéo chargée).
- **Lazy loading hors viewport** : la vidéo n'est injectée qu'à l'approche du
  viewport (IntersectionObserver, `rootMargin` 250px), jamais au chargement.
- **Autoplay muted loop playsinline** posé par script bundlé (CSP `default-src
  'self'` suffit, vidéos auto-hébergées) ; `aria-hidden`, non focusable.
- Apparition en fondu par-dessus le poster une fois `loadeddata`.

## Contrôle de perf (gate)
- Après ajout des clips : Lighthouse perf **>= 95** maintenu (tolérance annoncée
  2-3 points), poids surveillé (`< 2 Mo`/clip), aucun clip au-dessus de la ligne
  de flottaison en `preload` agressif.
- Vérifier le rendu `prefers-reduced-motion` (poster seul) et JS coupé (poster seul).

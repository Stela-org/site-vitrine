# INDEXNOW.md : soumission automatique des URL (VIT-8)

> IndexNow notifie instantanément les moteurs compatibles (Bing, Yandex, Seznam,
> Naver) qu'une URL a changé, sans attendre le prochain crawl. Google n'utilise
> pas IndexNow (le sitemap + la Search Console restent la voie Google).

## Clé
- Fichier : `public/indexnow-<clé>.txt` (déployé à la racine du site).
  Son **nom porte la clé**, son **contenu EST la clé** : c'est ainsi que Bing
  vérifie que nous possédons bien le domaine. **Source de vérité unique** : le
  script `scripts/indexnow-ping.mjs` lit la clé depuis ce fichier (aucune
  duplication en dur ailleurs).
- Pour changer de clé : remplacer le fichier `public/indexnow-*.txt` (nom +
  contenu identiques). Rien d'autre à modifier.

## Ping automatique à chaque déploiement de production
- `vercel.json` → `buildCommand: "astro build && (node scripts/indexnow-ping.mjs || true)"`.
  Le `|| true` garantit qu'un souci IndexNow ne bloque **jamais** un déploiement.
- `scripts/indexnow-ping.mjs` :
  1. lit la clé (fichier ci-dessus) et le set indexable (sitemap du build) ;
  2. calcule les **URL réellement modifiées** par le dernier commit
     (`git diff HEAD~1 HEAD`, mapping fichier → URL) ; un changement global
     (layout, composant, config, styles) resoumet tout le set indexable ;
  3. POST la liste à `https://api.indexnow.org/indexnow`.
- **Garde-fou d'environnement** : l'envoi réel n'a lieu qu'en production
  (`VERCEL_ENV=production`) ou avec `INDEXNOW_FORCE=1`. En local / preview, le
  script fait un **dry-run** (affiche les URL, n'envoie rien).
- Test local : `npm run indexnow` (dry-run) ; `INDEXNOW_FORCE=1 npm run indexnow`
  pour un envoi réel (à éviter tant que la clé n'est pas en production, sinon la
  vérification du fichier de clé échoue).

## Conséquence pour les emails d'articles (rédacteur automatique)
Le post-scriptum « pensez à soumettre l'URL à Bing » des emails d'articles
devient **obsolète** : la soumission est désormais automatique au déploiement.
Signal de détection pour le rédacteur automatique : la présence d'un fichier
`public/indexnow*.txt` dans ce repo indique qu'IndexNow est actif → ne plus
ajouter le post-scriptum Bing.

## Limite assumée
Sur Vercel, il n'existe pas d'env fiable « SHA du déploiement précédent » : le
diff se fait sur le **dernier commit** (`HEAD~1..HEAD`). En pratique chaque
déploiement de prod correspond à un merge/commit sur `main`, donc le diff couvre
bien les changements livrés. En cas de clone superficiel sans historique, le
script resoumet par sécurité l'ensemble du set indexable (~40 URL, bien en deçà
de la limite IndexNow de 10 000 URL par requête).

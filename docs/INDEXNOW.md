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
- Deux fichiers portent la clé, et il faut remplacer **les deux** :
  `public/indexnow-<clé>.txt`, celui que le glob du script trouve, et
  `public/<clé>.txt`, la forme nue que Bing accepte aussi.

### Rotation de clé : la procédure

Faite le 03/09/2026 (LOT INDEXNOW-KEY-1), elle resservira. Bing avait mis en
cache un échec de vérification sur l'ancienne clé pendant la bascule de domaine
du 23/07 et répondait `403 UserForbiddedToAccessSite` à chaque déploiement,
alors que tout était sain de notre côté. **Une clé neuve force une vérification
neuve**, et c'est le seul remède connu à ce cas.

1. Générer 32 caractères hexadécimaux :
   `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`
2. Supprimer les deux anciens fichiers, créer les deux nouveaux. Le contenu doit
   être **exactement** la clé : 32 octets, **sans retour à la ligne final**.
   `printf '%s' "$CLE" > public/indexnow-$CLE.txt` (Bing compare octet pour octet).
3. Vérifier qu'aucune autre référence ne subsiste : `grep -rn <ancienne-clé>`.
   En principe aucune, le script lit la clé par glob.
4. Ouvrir la PR. **`check:indexnow` échouerait** si `INDEXNOW_SKIP` n'était pas
   posé : pendant la fenêtre de rotation, la production sert encore l'ancienne
   clé et la neuve répond 404 jusqu'à la fusion.
5. Après fusion, lire les logs de build du déploiement de production. Le ping
   doit rendre 200 ou 202 :
   `npx vercel inspect --logs <url-du-deploiement> | grep indexnow`

## Pourquoi la soumission ne peut pas être vérifiée en CI

**Bing filtre les soumissions par origine.** Mesuré le 03/09/2026, avec la même
clé, la même charge utile et dans la même demi-heure :

| Origine | Réponse |
|---|---|
| Build Vercel (production) | **HTTP 202** |
| Runner GitHub Actions (run 33773938) | **HTTP 403** `UserForbiddedToAccessSite` |
| Poste de développement | **HTTP 403** `UserForbiddedToAccessSite` |

Ce n'est ni la clé ni la charge : le script de ping lui-même, lancé avec
`INDEXNOW_FORCE=1` depuis un poste, rend 403 avec exactement le corps que Vercel
envoie pour obtenir 202. Testé aussi avec le `keyLocation` en forme nue, même
résultat, et à plusieurs minutes d'intervalle pour écarter une limitation de
débit.

**Conséquence.** `INDEXNOW_SKIP=1` est posé en permanence dans
`.github/workflows/gardiens.yml`. Ce n'est pas une dette datée : il n'y a rien à
attendre. Aucune annotation `::warning::` n'est posée non plus : une alerte qu'on
voit à chaque pull request pour un fait qui ne changera jamais est une alerte
qu'on ne lit plus.

**Ce que `check:indexnow` vérifie encore** : la cohérence locale de la clé, son
nom contre son contenu, et l'absence d'espace ou de retour à la ligne parasite.

⚠️ **Ce qu'il ne vérifie plus** : la présence du fichier de clé en production.
`INDEXNOW_SKIP` coupe les deux volets réseau d'un seul geste, parce qu'il avait
été conçu pour la fenêtre de rotation, où les deux doivent tomber. En régime
permanent, seul le volet de soumission est concerné par le filtrage d'origine ;
la lecture du fichier de clé en production, elle, passerait très bien depuis un
runner. Séparer les deux drapeaux rendrait ce contrôle à la CI. Non fait, signalé.

**Le ping réel se contrôle dans les logs de build Vercel, qui font foi.**

### Piste pour un lot futur, non ouvert

Le volet de soumission devrait quitter la CI et devenir une **lecture** plutôt
qu'une écriture : `scripts/indexnow-ping.mjs` écrit déjà son résultat dans les
logs de build Vercel, et un gardien qui lit ce résultat, via l'API Vercel, plutôt
que de refaire la soumission, dirait la vérité depuis n'importe quelle origine.
C'est ce qui fermerait vraiment la classe.

## Ping automatique à chaque déploiement de production
- `vercel.json` → `buildCommand: "astro build && node scripts/build-llms-full.mjs && (node scripts/indexnow-ping.mjs || true)"`.
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

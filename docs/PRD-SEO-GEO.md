# PRD-SEO-GEO - Vitrine mystela.fr

**Date** : 2 septembre 2026
**Dépôt** : `site-vitrine` (Astro, Vercel)
**Sources** : Search Console (3 mois au 01/09), Lighthouse 13.4.1 (02/09 11h44), crawl HTTP des 48 URL du sitemap
**Statut** : **CHANTIER CLOS le 03/09/2026**
6 PR fusionnées · `a80d86e` `ff30d9d` `fcbe066` `34d1f6b` `13ad14d` (site-vitrine) · `8179207` (stella-app)

---

## 0. Résumé pour reprise à froid

Le site est techniquement sain (97 perf, 100 SEO, 100 bonnes pratiques, aucune sanction).
Il est invisible parce qu'il est **jeune et sans autorité**, pas parce qu'il est cassé.

**CHANTIER CLOS LE 02/09.** Trois lots livrés en production dans la PR 26
(`a80d86e`) : le 404, les contrastes, l'image hero. Un lot clos sans action, un
abandonné sur mesure, un reporté sur `stella-app`, deux lots séparés ouverts.

Aucun ne changera la position.
Ce qui la changerait : des liens entrants, du contenu qui existe, du temps.

**Sept prémisses sont tombées le 02/09** - six des miennes, une de l'agent :
1. le timeout `llms.txt` (§2.1) - le fichier répond en 69 ms
2. la composition du gate de test (§2.2) - commandes d'un autre dépôt
3. l'indexation « fautive » des URL de test (§2.3) - conforme au robots.txt
4. la lecture géométrique de StickyCta (§3.4) - inexistante
5. le coût du basculement `.is-visible` (§3.4) - transform sur fixed, gratuit
6. le CLS menacé par les attributs d'image (§3.3) - le CSS le protège

Plus une correction de fond apportée par l'agent, que je n'avais pas demandée :
le 404 n'est pas un article mort mais **un article vivant éclipsé**, et ma solution
(b) l'aurait supprimé (§5, lot 1).

Le diagnostic sur les pages `/pour/` passe d'un point (§4.3).

**La septième est celle de l'agent** : sa piste « la minceur explique le refus
d'indexation » ne survit pas à la mesure par famille (§4.4). Elle a coûté un lot -
le lot 6 est abandonné, et c'est la bonne nouvelle : plusieurs heures de rédaction
économisées pour un effet qui aurait été nul.

**Conséquence stratégique** : aucun des six lots ne peut déplacer la position 56,8.
Le signal d'indexation est hors de la page (§4.5). Le seul vrai chantier est
l'autorité (§8).

**Règle de travail issue de ces six cas** : mesurer avant de corriger, et dire quand
la prémisse ne tient pas plutôt que corriger au hasard. Les constats Lighthouse en
particulier doivent être vérifiés : trois d'entre eux étaient des artefacts de son
harnais.

---

## 1. Constat chiffré

### 1.1 Performance de recherche (3 mois, arrêt 01/09/2026)

| Mesure | Valeur |
|---|---|
| Clics | 6 |
| Impressions | 444 |
| CTR | 1,4 % |
| Position moyenne | 56,8 |

Position 56,8 = 6e page de résultats.

### 1.2 Requêtes

| Requête | Impressions | Clics | Nature |
|---|---:|---:|---|
| mystela | - | 3 | marque |
| my stela | - | 2 | marque |
| stela | - | 1 | marque |
| demande d'avis google | 28 | 0 | commerciale |
| demander à ses clients de laisser un avis google | 26 | 0 | commerciale |
| signaler un avis google | 22 | 0 | commerciale |

**Les 6 clics viennent tous de requêtes de marque.** 76 impressions sur les trois
requêtes commerciales, zéro clic.

### 1.3 Indexation

| État | Pages |
|---|---:|
| Indexées | 36 |
| Détectée, actuellement non indexée | 16 |
| Introuvable (404) | 1 |
| Page avec redirection | 2 |
| Explorée, actuellement non indexée | 0 |
| Indexée malgré blocage robots.txt | 0 (tendance décroissante) |

« Détectée, actuellement non indexée » = Google connaît la page et refuse de la prendre.

### 1.4 IA générative (bêta Search Console)

13 impressions sur 3 mois.

| Page | Impressions |
|---|---:|
| `/` | 4 |
| `/blog/gemini-google-business-profile-nouveaute` | 3 |
| `/statistiques-avis-google` | 3 |
| `/tarifs` | 3 |
| `/reponse-automatique-avis` | 1 |

**Le format « données chiffrées et sourcées » produit un résultat mesurable.**
L'argumentaire commercial n'en produit aucun.

### 1.5 Lighthouse (accueil, Moto G Power émulé, 4G lente)

| Catégorie | Score |
|---|---:|
| Performances | 97 |
| Accessibilité | 96 |
| Bonnes pratiques | 100 |
| SEO | 100 |
| Navigation agentique | 2/3 |

FCP 1,6 s · LCP 1,8 s · TBT 100 ms · CLS 0 · SI 3,9 s
Répartition LCP : TTFB 10 ms, délai d'affichage élément 2 320 ms (le H1).

### 1.6 Autres relevés Search Console

- Actions manuelles : **aucune**
- Problèmes de sécurité : **aucun**
- HTTPS : propre
- Ensembles de données : 1 valide, 0 non valide (depuis le 03/08)
- Core Web Vitals : **vide** - trafic insuffisant pour le seuil CrUX, pas un défaut

---

## 2. Assertions infirmées - NE PAS RE-TENTER

### 2.1 `llms.txt` répond correctement

**Ce que j'avais écrit** : « llms.txt ne répond pas, priorité absolue », sur la foi
du message Lighthouse `Fetch of llms.txt failed: Timed out fetching resource`.

**Mesure** :
```
HTTP/2 200
content-type: text/plain; charset=utf-8
content-length: 7650
x-vercel-cache: HIT
temps total : 0.069761s
première ligne du corps : # Stela      (H1 Markdown, conforme)
last-modified : 09:09:01 le 02/09 (Lighthouse a tourné à 11h44)
```

Le fichier existe, Vercel le sert, le type est bon, il est en cache, il répond en
69 ms. **Le timeout est propre au harnais Lighthouse.** Rien à corriger.

Relevés annexes :
- `mystela.fr/llms.txt` → 308 vers www (normal)
- `www.mystela.fr/llms-full.txt` → **404** (convention optionnelle, non créée, à décider)
- `www.mystela.fr/.well-known/` → 308
- `www.mystela.fr/.well-known/security.txt` → 200, 232 ms

### 2.2 Le gate de test de `site-vitrine`

**Ce que j'avais écrit** : `lint:copy`, `lint:colors`, `lint:jsx-space`,
`lint:impersonation`, `lint:silence`, `check:brand`, `scripts/visual-pass.mjs`.

**Réalité** : `lint:colors`, `lint:jsx-space`, `lint:impersonation`, `lint:silence`
et `visual-pass.mjs` appartiennent à **`stella-app`**. Le cliquet couleurs à 172
aussi.

**Gate réel de `site-vitrine`** :
```bash
npm run check    # check:links, check:schema, check:alt, check:overflow + ~15 autres
npm run build
```
`lint:copy` et `check:brand` existent bien ici.

### 2.3 Les URL de test ne sont pas indexées « à tort »

**Ce que j'avais écrit** : « app.mystela.fr/book/test et avis.mystela.fr/test sont
indexées à tort ».

**Mesure** : les deux répondent 200, aucune ne porte de `<meta name="robots">`, et
le robots.txt des deux sous-domaines dit :
```
User-Agent: *
Allow: /r/
Allow: /book/
Disallow: /dashboard
Disallow: /admin
Disallow: /api
Disallow: /welcome
Disallow: /onboarding
```

`/book/` est **explicitement autorisé** et rien n'interdit `/test`.
Google fait exactement ce qu'on lui dit. Le défaut est dans la consigne.

### 2.4 Le diagnostic « pages /pour/ trop similaires » n'est pas confirmé

Seuil que j'avais fixé : 40 %. Médiane mesurée : **41,0 %**.
Ça passe d'un point. Trop mince pour parler de confirmation. Voir §4.2.

---

## 3. Défauts mesurés et corrigeables

### 3.1 Le 404 - un lien cassé qui saigne sur 16 pages

```
https://www.mystela.fr/blog/avis-google-restaurant-paris-lyon
  → 308 vers https://www.mystela.fr/restaurants-paris-lyon
  → 404
```

Crawl des 48 URL du sitemap : 47 en 200, 1 en 308 vers 404.

**Elle est liée depuis 16 pages** : l'index `/blog` + les 15 autres articles, via
leur bloc d'articles liés. Ce n'est pas une URL orpheline.

**Cause** : la redirection legacy `/blog/avis-google-restaurant-:ville` attrape ce
slug par préfixe, `paris-lyon` étant lu comme une « ville ».

**L'article existe.** `src/content/blog/avis-google-restaurant-paris-lyon.md` est
présent parmi les 16 fichiers du dossier. Astro le génère, c'est pour ça qu'il est
dans le sitemap et que 16 pages le citent. Ce n'est pas un article mort : c'est un
article sain **éclipsé** par la redirection.

Corollaire : **les 16 liens internes sont corrects et ne doivent pas être touchés.**

**Le défaut est plus large que cette collision** - la règle redirige n'importe quel
suffixe, y compris vers des pages inexistantes :
```
/blog/avis-google-restaurant-paris          308 -> /restaurants-paris          200
/blog/avis-google-restaurant-brest          308 -> /restaurants-brest          200
/blog/avis-google-restaurant-inexistante    308 -> /restaurants-inexistante    404
```
C'est une fabrique a 404 ouverte.

### 3.2 Quinze défauts de contraste

**CTA - impact conversion** :
- `.btn.btn-primary` (« Essai gratuit 7 jours », 4 occurrences)
- `.btn.btn-primary.plan-cta`
- `#cookie-accept`

**Ambiance - impact lisibilité** :
- `.ps-teaser`, `.rc-badge`, `.rc-reply`, `.eyebrow`, `.feature-stage`,
  `.feature-more`, `.fv-badge`, `.fv-reply-who`, `.int-status.int-live`,
  `.plan-badge`, `.save`
- 2 occurrences sur `<body>`

**Autre défaut d'accessibilité** : 4 liens « Essai gratuit 7 jours » pointent vers
des destinations différentes (`#tarifs`, `/tarifs`, 2 URL Stripe distinctes) avec
le même libellé. Règle « les liens identiques ont la même fonction ».

### 3.3 Image hero - 40 % du poids de la page

| Mesure | Valeur | Source |
|---|---|---|
| Poids servi | 75 600 o | mesure directe 02/09 |
| Économie annoncée | 63,7 Ko | Lighthouse |
| Dimensions réelles du fichier | 1200 x 669 | mesure directe |
| Dimensions déclarées | 300 x 120 | attribut HTML |
| Dimensions affichées | 420 x 234 | Lighthouse (pixels appareil) |
| Boîte CSS réelle | ~210 x 117 | densité 2 |
| Temps de service | 81 ms | mesure directe |

**Les attributs sont faux** : ratio déclaré 2,50, ratio du fichier 1,79.

**Le CLS n'est PAS protégé par ces attributs** - contrairement à ce que j'avais
supposé :
```css
.ps-photo     { height: 120px; position: relative }
.ps-photo img { width: 100%; height: 120px; object-fit: cover }
```
Le CSS fixe la hauteur en dur, il gagne dans tous les cas. **Corriger les attributs
ne peut donc pas casser le CLS.** Le geste est sans risque.

L'image vit dans une maquette de téléphone (`.phone-screen` > `.ps-photo`).
**On sert 1200 x 669 pour une boîte de 210 x 117.**

### 3.4 StickyCta monopolise le fil principal

| Mesure | Valeur |
|---|---|
| Tâche longue | 398 ms (la plus longue) |
| Ajustement de mise en page forcé | 657 ms |
| Temps CPU du script | 797 ms sur 1 554 ms page |
| Style & Layout page entière | 929 ms |

Fichier : `/_astro/StickyCta.astro_ast....C7WzrgGy.js`

**LA PREMISSE LIGHTHOUSE NE TIENT PAS.** Mesure du 02/09 :

Le bundle fait **352 octets**, le voici en entier :
```js
var e = document.getElementById(`sticky-cta`);
if (e) {
  let t = () => { try { if (localStorage.getItem(`stela-consent`)) return !0 } catch {}
                  return /(?:^|;\s*)stela_consent=/.test(document.cookie) },
      n = () => { e.classList.toggle(`is-visible`, window.scrollY > 700 && t()) };
  window.addEventListener(`scroll`, n, { passive: !0 }),
  document.addEventListener(`click`, () => setTimeout(n, 60)), n()
}
```

Recherche sur les 5 bundles de l'accueil :
```
offsetWidth 0 · offsetHeight 0 · offsetTop 0 · getBoundingClientRect 0
clientWidth 0 · clientHeight 0 · scrollHeight 0 · getComputedStyle 0
scrollY 1  (StickyCta uniquement)
```

**Total JS de la page, tous bundles : 4 567 octets.** Attribuer 398 ms de tache
longue et 657 ms de reflow force a 4,5 Ko de JavaScript n'est pas vraisemblable.

Seul motif discutable, modeste : lecture de `window.scrollY` puis `classList.toggle`
a chaque scroll. Lecture puis ecriture, donc invalidation possible - mais l'ecouteur
est `passive`, et le cout depend entierement de ce que fait `.is-visible` en CSS.

**PISTE CLOSE (02/09).** Mesure du CSS :
```css
.sticky-cta            { position: fixed; transform: translateY(110%);
                         transition: transform .25s; backdrop-filter: blur(8px); }
.sticky-cta.is-visible { transform: none; }
```
Le basculement ne change qu'un `transform` sur un element `position: fixed`.
C'est l'animation la moins chere qui existe : composee par le GPU, hors du flux,
zero layout et zero repaint du reste de la page. **Elle ne peut pas produire 657 ms
d'ajustement de mise en page force.**

Verdict : le constat Lighthouse « 398 ms / 657 ms sur StickyCta » est classe
**artefact du harnais**. On n'y revient pas.

**Hypothese signalee, non actionnee** : le composant porte `backdrop-filter: blur(8px)`
sur une barre fixe pleine largeur. Le flou d'arriere-plan est repute couteux a
peindre sur GPU mobile, et Lighthouse tournait sur Moto G Power bride. Ce cout est
**permanent**, independant du basculement : il n'explique pas un pic attribue au
script, mais pourrait expliquer du temps machine sur cette zone.
Le retirer changerait l'aspect visuel : **la charte prime, aucune action proposee.**

### 3.5 Rendu bloqué - 5 CSS + 5 polices

**CSS bloquants** : 18 Ko, 150 ms estimés
`TripleZero` (1,8 Ko) · `ReviewCard` (1,9 Ko) · `Base` (5,1 Ko) · `index` (6,7 Ko) · `ProductVideo` (2,6 Ko)

**Polices** : 5 fichiers `plus-jaka…woff2`, ~65 Ko, chargés en parallèle
→ chemin critique à **1 390 ms**

**Aucune origine préconnectée** (Lighthouse ne trouve pas de candidat non plus).

### 3.6 Animations non composées

5 éléments `.ps-star` animent la propriété `color` (non composable) via `ps-fill`.
Impact CLS potentiel - CLS actuellement à 0, donc non urgent.

### 3.7 DOM

823 éléments, profondeur 12, plus grand nombre d'enfants 36 (`.fv-qr`).
Aucun seuil dépassé. Constat, pas défaut.

---

## 4. Les 16 pages non indexées

### 4.1 Liste et familles

| URL | Famille | Verdict |
|---|---|---|
| `app.mystela.fr/book/test` | test applicatif | lot 5 (`stella-app`) |
| `avis.mystela.fr/test` | test applicatif | lot 5 (`stella-app`) |
| `/pour/coiffeur` | métier | lot 6 |
| `/pour/garage` | métier | lot 6 |
| `/pour/hotel` | métier | lot 6 |
| `/pour/independants` | métier | lot 6 |
| `/pour/institut` | métier | lot 6 |
| `/pour/multi-etablissements` | métier | **déjà distincte** |
| `/blog` | index | non instruit |
| `/blog/avis-google-saisonnalite-marseille-bordeaux-nice` | article | non instruit |
| `/blog/google-business-profile-fin-questions-reponses-ia` | article | non instruit |
| `/diagnostic` | outil | non instruit |
| `/fonctionnalites` | produit | non instruit |
| `/notre-histoire` | institutionnel | non instruit |
| `/presence-plateformes` | produit | non instruit |
| `/restaurants-brest` | ville | non instruit |

### 4.2 Similarité des pages `/pour/`

Méthode : Jaccard sur trigrammes de mots, HTML rendu en production, corps seul,
sans `<script>` / `<style>` / `<svg>`.

**Médiane 41,0 % · min 24,6 % · max 46,0 %**

| Paire | Similarité |
|---|---:|
| hotel / institut | 46,0 % |
| garage / institut | 45,9 % |
| garage / hotel | 45,0 % |
| hotel / coiffeur | 44,4 % |
| coiffeur / garage | 44,2 % |
| coiffeur / institut | 44,3 % |
| independants / institut | 41,7 % |
| coiffeur / independants | 41,0 % |
| garage / independants | 40,8 % |
| hotel / independants | 40,5 % |
| garage / multi-etablissements | 25,5 % |
| independants / multi-etablissements | 25,5 % |
| institut / multi-etablissements | 25,0 % |
| coiffeur / multi-etablissements | 24,7 % |
| hotel / multi-etablissements | 24,6 % |

| Page | Mots rendus | Mots propres |
|---|---:|---:|
| multi-etablissements | 579 | 102 |
| independants | 484 | 50 |
| coiffeur | 470 | 31 |
| hotel | 466 | 34 |
| institut | 453 | 30 |
| garage | 448 | 38 |

### 4.3 Lecture

**Le seuil que j'avais fixé était 40 %. La médiane sort à 41,0 %.**
Ça passe d'un point - trop mince pour parler de confirmation.

La structure dit plus que la médiane :
- `multi-etablissements` est **une vraie page à part** : 24,6-25,5 % contre toutes
  les autres, 102 mots propres.
- Les cinq autres forment **un bloc à 40,5-46,0 %** avec 30 à 50 mots propres.

### 4.4 La minceur n'explique rien - mesure du 02/09

Hypothese testee : les pages refusees seraient plus courtes, moins liees ou moins
structurees que les pages acceptees.

Methode : mots du texte rendu dans `<main>` (nav, header, footer retires), liens
entrants contextuels comptes sur les 48 URL du sitemap et dedoublonnes par page
source, temoins choisis **par appariement de type** et non au hasard.

**14 pages refusees (www)**

| Page | Mots | Entrants | JSON-LD | Date |
|---|---:|---:|---|---|
| `/blog/avis-google-saisonnalite-marseille-bordeaux-nice` | 1515 | 15 | Article, Breadcrumb, FAQ, Org, SoftwareApp | 2026-08-06 |
| `/blog/google-business-profile-fin-questions-reponses-ia` | 1420 | 1 | idem | 2026-07-27 |
| `/restaurants-brest` | 1185 | 10 | Breadcrumb, FAQ, Org, SoftwareApp | - |
| `/notre-histoire` | 774 | 15 | AboutPage, Breadcrumb, Org, SoftwareApp | - |
| `/blog` | 677 | 0 | Org, SoftwareApp | - |
| `/pour/multi-etablissements` | 431 | 8 | Breadcrumb, FAQ, Org, SoftwareApp | - |
| `/fonctionnalites` | 400 | 0 | Breadcrumb, Org, SoftwareApp | - |
| `/pour/independants` | 336 | 8 | idem | - |
| `/pour/coiffeur` | 323 | 8 | idem | - |
| `/pour/hotel` | 322 | 8 | idem | - |
| `/pour/institut` | 310 | 8 | idem | - |
| `/pour/garage` | 307 | 8 | idem | - |
| `/diagnostic` | 235 | 1 | Breadcrumb, FAQ, Org, SoftwareApp | - |
| `/presence-plateformes` | 170 | 4 | Org, SoftwareApp | - |

**6 temoins indexes**

| Page | Mots | Entrants | JSON-LD | Date |
|---|---:|---:|---|---|
| `/restaurants-paris` | 1197 | 9 | Breadcrumb, FAQ, Org, SoftwareApp | - |
| `/blog/qr-code-avis-google` | 1087 | 12 | Article, Breadcrumb, FAQ, Org, SoftwareApp | 2026-06-18 |
| `/tarifs` | 573 | 47 | FAQ, Org, SoftwareApp, WebSite | - |
| `/comparatif` | 424 | 1 | Breadcrumb, FAQ, Org, SoftwareApp | - |
| `/pour/restaurant` | 371 | 8 | idem | - |
| `/collecte-avis-google` | 292 | 13 | idem | - |

**Medianes globales** : refusees 400 mots / 8 entrants, indexees 1143 mots / 8 entrants.

**L'ecart de longueur ne survit pas au decoupage par famille :**

| Famille | Refusees | Position de la refusee parmi ses semblables |
|---|---|---|
| `/pour/` | 6 sur 7 | l'unique indexee (`/pour/restaurant`, 371 mots) est 5e sur 7. **La plus longue de la famille (`multi-etablissements`, 431) est refusee.** Toutes : 8 entrants, meme JSON-LD |
| `/restaurants-` | 1 sur 9 | `brest` (1185 mots, 10 entrants) est **3e plus longue sur 9**. `nice` (1121, 10 entrants) est plus courte et indexee. Balisage identique |
| blog | 2 sur 15 | les deux refusees font 1420 et 1515 mots, **au-dessus de la mediane des 13 indexees** |
| autres | 5 sur 16 | `/diagnostic` (235) refusee, `/sms-fidelisation` (235) indexee. `/guide-google-commercant-local` (175 mots, 1 entrant) est **la plus courte du site et elle est indexee** |

### 4.5 Verdict : le signal est hors de la page

**Ni la minceur, ni le maillage, ni la structure ne separent les deux groupes.**
A l'interieur de chaque famille, la page refusee est indiscernable de ses voisines
acceptees.

L'ecart global de mediane (400 contre 1143) est **un artefact de composition** : le
lot refuse est sature de `/pour/` et de pages produit courtes, le lot indexe de blog
et de pages villes longues. Comparer les groupes revient a comparer des types de
pages.

**Le contre-exemple decisif** : `restaurants-brest`. Neuf pages villes generees par
le meme gabarit, memes 1100-1200 mots, memes 10 entrants, huit indexees et une
refusee. **Aucune propriete mesurable de la page ne peut expliquer ca.**

« Detectee, actuellement non indexee » designe des URL que Google connait et **n'a
pas explorees**. Le signal est donc a chercher hors de la page : budget d'exploration
sur un domaine jeune sans autorite, pas qualite du contenu.

**Consequence directe : reecrire les `/pour/` ne ferait rien indexer.**

---

## 5. Lots

### Lot 1 - Le 404 · LIVRÉ (PR 26, `a80d86e`)

**Décision prise (02/09)** : ni « rediriger vers un autre slug » ni « débrancher
l'article ». L'article existe et doit rester. La correction est **une liste fermée
des neuf villes réelles**.

```jsonc
// AVANT
{ "source": "/blog/avis-google-restaurant-:ville",
  "destination": "https://www.mystela.fr/restaurants-:ville", "permanent": true }

// APRÈS
{ "source": "/blog/avis-google-restaurant-:ville(bordeaux|brest|lyon|marseille|nancy|nantes|nice|paris|rouen)",
  "destination": "https://www.mystela.fr/restaurants-:ville", "permanent": true }
```

**Trois effets** : cesse d'éclipser `paris-lyon` (absent de la liste) · préserve
intégralement les backlinks Avistars (qui pointaient vers de vraies villes) · ferme
la fabrique à 404 au lieu de la déplacer.

**Sur le piège `cleanUrls`** : cette forme ne peut pas créer de boucle. Elle
restreint une règle existante, elle ne se réécrit pas elle-même. Rien ne redirige
`/blog/avis-google-restaurant-paris-lyon` vers lui-même, rien ne redirige
`/restaurants-<ville>` vers `/blog/…`. Le cas des sept règles neutralisées ne
s'applique pas.

**NE PAS toucher aux 16 liens internes.** Ils sont corrects.

**Preuves de production, prises après merge :**
```
--- 1. l'article qui etait en 404
  200  redirections=0  final=.../blog/avis-google-restaurant-paris-lyon
--- 2. les neuf villes
  bordeaux 200 red=1 · brest 200 red=1 · lyon 200 red=1 · marseille 200 red=1
  nancy 200 red=1 · nantes 200 red=1 · nice 200 red=1 · paris 200 red=1
  rouen 200 red=1        (toutes vers /restaurants-<ville>)
--- 3. suffixe invente
  404  redirections=0  final=.../blog/avis-google-restaurant-xyzinvente
```
Les trois sortent ce qui était attendu.

**Gardien ajouté** (non prévu au brief, validé après coup) : `check:brand` refuse
désormais la règle **trop gourmande**, pas seulement la règle morte. Critère retenu :
la forme du chemin. `/:path*` vers `/:path*` rejoue l'URL telle quelle et reste
légitime ; dès que la forme change, le paramètre fabrique une URL qui peut ne pas
exister. Commit isolé `7282366`.

### Lot 2 - Contrastes · LIVRÉ (PR 26, `a80d86e`)

15 sélecteurs (§3.2), CTA d'abord.

**Méthode imposée** :
1. Mesurer et publier le tableau des ratios **avant** toute modification.
2. Signaler les faux positifs Lighthouse s'il y en a - deux prémisses sont déjà
   tombées (§2.1, §3.4).
3. Nouvelles couleurs **uniquement** depuis `config/brand.ts` :
   navy `#15233F` · nuit `#0F1B33` · royal `#2B4C8C` · laiton `#B08A3E`
4. Cible 4,5:1 texte courant, 3:1 texte large (18pt+ ou 14pt gras).
5. Remesurer et publier après.

**Garde-fou** : si respecter le contraste casse l'identité visuelle sur un élément,
le dire plutôt que trancher seul. La charte prime.

**Bonus traité** : les 4 liens « Essai gratuit 7 jours » reçoivent chacun un
`aria-label` contenant le libellé visible - conforme au critère 2.5.3 « Label in
Name », sans toucher au texte affiché.

**Arbitrage rendu le 02/09** : ni A ni B en bloc.
- **surfaces pleines de laiton** -> texte blanc devient navy `#15233F` (4,87)
- **texte laiton sur crème** -> devient royal `#2B4C8C` (6,81 à 7,61)
- l'or reste sur le logo, les étoiles, les surfaces de bouton, les grands nombres

**Résultat mesuré : 14 sélecteurs du brief + 9 traités au-delà + 3 découverts.**

| Sélecteur | Avant | Après |
|---|---:|---:|
| `.rc-badge` | 2,61 | 6,81 |
| `.fv-badge` · `.int-status.int-live` | 2,79 | 7,26 |
| `.ps-teaser` · `.feature-stage` | 2,85 | 7,41 |
| `.eyebrow` · `.fv-reply-who` | 2,92 | 7,61 |
| `.btn-primary` · `.plan-cta` · `#cookie-accept` · `.plan-badge` · `.save` | 3,21 | 4,87 |
| `.feature-more` | 3,21 | 15,62 |
| `.rc-reply` | 14,24 | 14,24 (faux positif Lighthouse) |

**Neuf éléments traités au-delà du brief** : `.plan-wheel`, `.fv-review-teaser`,
`.fv-spark-up`, `.fv-sms-tag`, `.int-more a`, `.calc-range output`, `.plan-perday`,
`.crumbs-back`, `.hub-card-go`.

**Deux défauts que seule la remesure a révélés :**
1. `.nav-links .nav-cta` posait `color:#fff` avec une spécificité supérieure - seul
   bouton resté à 3,21 pendant que les autres passaient à 4,87. Invisible avant
   correction.
2. Le survol du bouton assombrissait : avec un texte foncé, navy sur `#9c7833` ne
   donnait que 3,83. Le survol **éclaircit** désormais vers `var(--gold)` (5,99).

**Trois défauts que seule une correction de méthode a révélés** (§7.4) :
`.plan-perday` sur `/tarifs`, `.crumbs-back` et `.hub-card-go` sur `/fonctionnalites`.

**Non corrigé, justifié** : les étoiles `#E7B008` portent `aria-hidden="true"` ou
`role="img" aria-label`, donc hors du critère 1.4.3 - et le jaune est la convention
Google. Sur le panneau sombre `--ink-deep`, l'or secondaire atteint 4,93 :
`.freeze-more a` **garde l'or**.

**Token ajouté** : `--royal: #2B4C8C` dans `global.css`, importé de `config/brand.ts`
de `stella-app` où il existait déjà.

**Passe visuelle 375 px** : hauteurs identiques au pixel (accueil 16 477 px, tarifs
6 020 px), écart moyen 0,41/255 et 0,32/255, confiné aux bandes des libellés
recolorés. Aucun déplacement de mise en page.

### Lot 3 - Image hero · LIVRÉ (PR 26, `a80d86e`)

**Solution retenue (02/09)**, à appliquer telle quelle :
1. Générer une variante **420 x 234** (le double de la boîte CSS de 210 x 117,
   pour les écrans à haute densité).
2. La servir en `srcset`, avec la 1200 en repli pour les très grands écrans.
3. Porter sur l'`<img>` les **dimensions intrinsèques du fichier servi par défaut**.

Économie attendue : ~63,7 Ko sur 75,6 Ko.

**Le CLS n'est pas en risque** (§3.3) : `.ps-photo img` fixe `height: 120px` en CSS,
qui gagne sur les attributs. Ma contrainte initiale « ne casse pas le CLS » était
fondée sur une supposition fausse. Mesurer quand même, mais sans inquiétude.

**CORRECTION de la cible** : ma boîte de 210 x 117 était fausse. Playwright mesure
**240 x 120 à tous les viewports** (375, 768, 1440 px, densités 2 et 3) - la maquette
téléphone est de largeur fixe, pas fluide. Les bonnes variantes sont donc **480**
(densité 2) et **720** (densité 3), pas 420.

**Résultat mesuré :**

| Densité | Avant | Après | Gain |
|---|---:|---:|---:|
| dpr 3 | 75 600 o | `hero-bistro-720.webp` 37 094 o | **-51 %** |
| dpr 2 | 75 600 o | `hero-bistro-480.webp` 23 218 o | **-69 %** |

| CLS à 2,5 s | Avant | Après |
|---|---:|---:|
| iPhone dpr 3 | 0,0026 | 0,0034 |
| mobile dpr 2 | 0,0002 | 0,0002 |
| bureau dpr 2 | 0,0109 | 0,0097 |

Trois valeurs à deux ordres de grandeur sous le seuil « bon » de 0,1 ; l'écart est
du bruit de mesure. Le CLS n'était pas en risque, comme prévu.

**Preuve de calibrage** : après correction, `naturalWidth = 240` pour l'image
choisie. Avec des descripteurs `w` et un `sizes` déclaré, Chromium divise la taille
réelle par la densité effective - obtenir exactement 240 signifie que le fichier
servi correspond **au pixel près** à la boîte.

**Rendu comparé** sur la maquette entière (482 x 836, densité 2) : écart moyen
0,76/255, soit 0,3 %. C'est le ré-encodage de la photo, rien d'autre.

**Dette assumée** : `sizes="240px"` en dur dans `PhoneReview.astro`. Exact
aujourd'hui parce que la maquette est de largeur fixe, commenté au-dessus. Si elle
devient fluide un jour, cette valeur ment en silence et aucun gardien ne le dira.

### Lot 4 - StickyCta · LOT CLOS SANS ACTION

**Clos le 02/09.** La prémisse Lighthouse ne tient pas (§3.4) : 352 octets de
bundle, 4 567 octets de JS sur toute la page, zéro lecture géométrique, et un
basculement de classe qui ne change qu'un `transform` sur un `position: fixed`.

Constat classé **artefact du harnais Lighthouse**. Aucune correction.

**Ne pas rouvrir** sans une mesure terrain (CrUX ou trace DevTools réelle) montrant
un coût sur cette zone. Une seule hypothèse reste notée sans action : le
`backdrop-filter: blur(8px)`, coût permanent de peinture GPU, que la charte
visuelle interdit de retirer.

### Lot 5 - Tenants de démonstration · dépôt `stella-app`

Le geste juste n'est **pas** d'interdire `/book/`, qui sert le référencement des
vraies pages de réservation. C'est de rendre non indexables les pages dont le tenant
est marqué de démonstration : `noindex` conditionnel sur `config.demo === true` ou
sur un slug de recette.

Un `Disallow` sur les deux chemins actuels marcherait aussi mais ne tiendrait pas au
prochain tenant de test.

Fichier : `app/robots.ts` ou `public/robots.txt` de `stella-app`, à confirmer.

### Lot 6 - Contenu des pages métiers · ABANDONNÉ EN L'ÉTAT

**Abandonné le 02/09 sur mesure.** Les deux hypothèses qui le motivaient sont
tombées :
- la ressemblance : médiane 41,0 % contre seuil 40, marge d'un point (§4.3)
- la minceur : aucune corrélation intra-famille (§4.4, §4.5)

Le contre-exemple `restaurants-brest` est décisif : neuf pages du même gabarit,
mêmes longueur, maillage et balisage, huit indexées et une refusée.

**Réécrire les `/pour/` ne ferait rien indexer.** Ce serait plusieurs heures de
rédaction pour un effet nul sur le problème visé.

**Ce qui reste vrai malgré tout** : cinq pages à 300-430 mots avec 30 à 50 mots
propres restent des pages faibles. Les réécrire peut se justifier pour la conversion
ou pour la clarté commerciale - **pas pour l'indexation**. C'est une décision
produit, plus une décision SEO.

**Le vrai levier est ailleurs** (§8) : autorité et liens entrants.

---

## 6. Blocage d'exécution - iCloud

### 6.1 État mesuré (02/09)

```
find ~/Desktop/STELA -type f -not -path "*/node_modules/*" \
  -exec stat -f "%b %z" {} + | awk '$1==0 && $2>0' | wc -l
→ 7803        (inchangé depuis la veille : le téléchargement n'a jamais démarré)

git status              → ~40 s par appel (seuil fixé : 1 s)
git worktree add        → abandonné après 3 minutes, ~900 fichiers à copier
find récursif sur STELA → dépasse 2 minutes
```

`brctl status` : conteneur `com.apple.CloudDocs` porte
`last-reset: 2026-07-23 20:50:32 (CKUnderlyingErrorContainerReset)`.
Apple a réinitialisé le conteneur le 23 juillet.

**CORRECTION du 02/09 - le téléchargement démarre, il est effondré.**
Trois `git status` d'affilée sur `site-vitrine` :
```
real 4356.14      (72 minutes)
real 0.03
real 0.01
```
Le premier appel matérialise les fichiers, les suivants sont instantanés. Une fois
matérialisés, ils le restent - jusqu'à la prochaine éviction par `optimize-storage`.

La formulation « le téléchargement ne démarre pas » était fausse. La bonne :
**il démarre à un débit qui interdit de travailler.** 72 minutes pour quelques
centaines de fichiers ; `npm run check` en touche des dizaines de milliers.

Corollaire mesuré : `playwright/lib/index.js` (`blocs=0`, taille 35 668 o) n'est pas
revenu en 10 secondes. À l'échelle observée, 10 secondes ne prouvent rien - le
fichier est bien un fantôme, mais on ne peut pas conclure qu'il ne descendra jamais.

### 6.2 Ce qui est réalisable aujourd'hui

**Réalisable** - tout ce qui se mesure depuis la production HTTP :
- crawl, `curl`, analyse du HTML rendu
- mesure des contrastes via Playwright sur les URL de prod
- lecture des bundles JS servis
- mesure du poids des images

**Non réalisable** - tout ce qui écrit sur l'arbre :
- `git worktree add` (900 fichiers > 3 min)
- `astro build` (écrit bien davantage)
- `npm run check` (18 contrôles dont un build complet)
- donc : aucune PR

C'est de l'arithmétique, pas de la prudence.

### 6.3 Sortie d'iCloud - deux chemins

**Chemin runbook** (`docs/runbooks/sortir-un-depot-git-d-un-dossier-synchronise.md`) :
arrêter les sessions, sauvegarder les `.env.local`, confirmer que tout est poussé,
attendre `brctl status` en `caught-up`, `mv ~/Desktop/STELA ~/dev/STELA`,
`git worktree repair` par dépôt.

**Obstacle** : ce runbook suppose qu'iCloud finit par redescendre les fichiers.
Le téléchargement n'a jamais démarré (7803 → 7803). Attendre `caught-up` sur un
service réinitialisé, c'est attendre indéfiniment.

**Chemin alternatif** - les dépôts sont poussés sur GitHub :
```bash
# 1. Sauver d'abord ce qui n'est dans aucun dépôt
wc -c ~/Desktop/STELA/stella-app/.env.local ~/Desktop/STELA/site-vitrine/.env.local
# attendu : 6994 et 1275. Si 0 ou erreur → fichiers évincés,
# les reconstituer depuis Vercel AVANT de bouger quoi que ce soit.

# 2. Clone frais hors iCloud
mkdir -p ~/dev && cd ~/dev && git clone <remote> site-vitrine
```

Un clone frais n'a aucun fichier évincé, aucun doublon, et `git status` répond
instantanément.

**Non récupéré par un clone** : les `.env.local`, et tout travail non poussé dans
les trois worktrees existants (`wt-diag-2`, `wt-diag-2b`, `wt-vit-wow`) - dont
l'état reste inconnu, impossible à lire aujourd'hui.

---

## 7. Contraintes d'exécution

### 7.1 Gate réel de `site-vitrine`

```bash
npm run check    # check:links, check:schema, check:alt, check:overflow + ~15
npm run build
```
Sorties des deux publiées avant la PR.

`lint:colors`, `lint:jsx-space`, `lint:impersonation`, `lint:silence` et
`scripts/visual-pass.mjs` **n'existent pas ici** - ils sont dans `stella-app`.
Le cliquet couleurs à 172 non plus.

### 7.2 Règles de dépôt

- Push direct sur `main` **bloqué par règle serveur** : PR obligatoire.
- Jamais `git reset --hard`.
- Jamais `git add -A` - les fichiers un par un.
- Jamais `pkill` sur un build : un `tsc` tué a laissé un `tsconfig.tsbuildinfo`
  corrompu et produit 3 diagnostics faux.
- Ne pas toucher à `stella-app` depuis ces lots.
- Jamais de `find` récursif sur `~/Desktop/STELA`.
- Toute commande dépassant 3 minutes : abandonner et le dire, ne pas relancer.

### 7.4 Leçons de méthode du 02/09

**Tout script de mesure sur ce dépôt doit émuler `cleanUrls`.**
Le serveur statique de l'agent cherchait `dist/tarifs` et non `dist/tarifs.html` :
cinq pages sur six mesuraient un 404 **sans que rien ne le signale**. Le tableau
sortait vert sur l'accueil et vide ailleurs. Après correction du serveur, trois
défauts supplémentaires sont apparus immédiatement.

**Sur cet arbre iCloud, dix secondes ne prouvent rien.**
Deux conclusions fausses tirées le même jour à la même échelle de temps :
« `git status` ne répondra pas » (il a répondu en 70 minutes) et
« `playwright/lib/index.js` ne redescendra pas » (il faisait partie des 89 minutes
en cours). `blocs=0` était exact dans les deux cas ; la conclusion ne l'était pas.

**Mesurer avant ET après, pas seulement avant.**
`.nav-links .nav-cta` était écrasé par spécificité : invisible avant correction,
trouvé seulement à la remesure. Idem pour le survol du bouton, dont le réflexe
s'inverse avec un texte foncé.

### 7.3 Contraintes de contenu

Interdits par `lint:copy` et `check:brand` : em-dash, emoji, caractères invisibles,
le caractère ✳ en texte (SVG uniquement).

---

## 8. Ce que ces lots ne feront pas

Les lots corrigent des défauts réels. **Aucun ne fera passer le site de la position
57 à la première page.**

Ce que disent les mesures mises bout à bout : la technique est saine - 97 perf,
100 SEO, aucune sanction, HTTPS propre, jeu de données validé. Ce qui manque est
ailleurs.

- **De l'autorité.** Six semaines de domaine, aucun lien entrant connu. C'est le
  levier principal de la position, et aucun correctif technique ne le remplace.
- **Du contenu qui existe.** Google refuse un tiers des pages. Il ne les juge pas
  assez consistantes pour mériter une place.
- **Du temps.** Un domaine récent est traité avec prudence quelle que soit la
  qualité du site.

### Le seul signal qui marche déjà

`/statistiques-avis-google` est la seule page de fond citée par les IA génératives,
et son `Dataset` est validé par Google depuis le 03/08. Le format « données
chiffrées, sourcées, structurées » produit un résultat mesurable là où
l'argumentaire commercial n'en produit aucun.

**Trois sujets** répondent directement aux requêtes vues sans jamais obtenir de clic :
- demande d'avis Google (28 impressions)
- demander à ses clients de laisser un avis (26)
- signaler un avis Google (22)

Dupliquer ce format sur ces sujets vaut probablement mieux que six pages d'arguments.

---

## 8bis. Bilan du chantier au 02/09

### Livré en production - PR 26, `a80d86e`

| Lot | Objet | Résultat mesuré |
|---|---|---|
| 1 | Le 404 | `paris-lyon` en 200 direct · 9 villes en 308 puis 200 · suffixe inventé en 404 direct · gardien anti-règle-gourmande ajouté |
| 2 | Contrastes | 14 sélecteurs du brief + 9 au-delà + 3 découverts · de 2,61-3,21 vers 4,87-15,62 · hauteurs identiques au pixel |
| 3 | Image hero | -51 % en densité 3, **-69 % en densité 2** · CLS inchangé · calibrage prouvé par `naturalWidth = 240` |

Gate complet vert (`EXIT=0`), CI verte, Vercel déployé.

### Clos sans livraison

| Lot | Décision | Motif |
|---|---|---|
| 4 | StickyCta - **clos sans action** | 352 o de bundle, zéro lecture géométrique, un `transform` sur `position:fixed`. Artefact Lighthouse. |
| 6 | Pages métiers - **abandonné** | ni minceur ni ressemblance ne corrèlent ; `restaurants-brest` est décisif (§4.5) |

### Reporté

| Lot | Où | Quoi |
|---|---|---|
| 5 | `stella-app` | `noindex` conditionnel sur les tenants de démonstration |
| - | `site-vitrine` | `npm audit` (nanoid transitif) |
| - | `site-vitrine` | gardien `check:contraste` |

### Ce que le chantier a coûté et rapporté

**Neuf prémisses tombées**, dont trois artefacts Lighthouse sur quatre constats
vérifiés, et une de l'agent qui a économisé la réécriture de six pages.

**Deux erreurs évitées de justesse** : supprimer un article vivant (mon option (b)
sur le 404), et livrer un tableau de contrastes vert avec trois défauts en production
(le serveur statique sans `cleanUrls`).

**Effet attendu sur la position 56,8 : nul.** Le chantier corrige des défauts réels
- un lien cassé sur 16 pages, des CTA illisibles, 52 Ko d'image inutile - mais
aucun n'est la cause de l'invisibilité. Voir §8.

## 8ter. Clôture du chantier - 03/09/2026

### Trois PR fusionnées

| PR | Dépôt | SHA | Contenu |
|---|---|---|---|
| 26 | site-vitrine | `a80d86e` | 404, contrastes, image hero |
| 27 | site-vitrine | `ff30d9d` | CSS/polices, `check:contraste`, npm audit, llms-full, 6 pages `/pour/`, `check:indexnow` |
| 1 | stella-app | `8179207` | `robotsForTenant` + test permanent |
| 29 | site-vitrine | `fcbe066` | bloc métier restaurant, `check:pour` |

### Les cinq gardiens posés

Tous vérifiés dans les deux sens avant livraison - un gardien qu'on n'a pas vu
échouer n'est pas un gardien.

| Gardien | Refuse |
|---|---|
| `check:brand` (renfort) | une règle de redirection trop gourmande, qui fabrique des URL inexistantes |
| `check:contraste` | tout texte sous 4,5:1 (3:1 en texte large), **sans aucune exclusion** |
| `check:indexnow` | un 4xx de soumission (notre configuration) ; avertit sur 5xx (leur service) |
| `build:llms-full` | une section vide, un fichier trop court, la disparition des repères `49 €` / `89 €` |
| `check:pour` | une page métier sous 753 mots, une phrase de 8 mots partagée, une page sans bloc |

### Ce que la PR 27 a réglé

**CSS et polices** : rien fait, et c'est le résultat. Mesure de l'agent - les 5 CSS
finissent à 548 ms pour un FCP à 900 ms, ils ne bloquent rien. Le préchargement des
polices dégradait le FCP de 56 ms pour 113 ms de clignotement gagné : retiré après
7 tirages de chaque côté. `inlineStylesheets: "auto"` est déjà posé, neutralisé par
`assetsInlineLimit: 0` depuis VIT-6 - légal sous la CSP, mais inutile.

**`check:contraste`** : créé, **avec un tableau d'exclusions vide**. Mes deux
exclusions proposées sont tombées pour des raisons opposées - `.ps-place` est
redondante (la maquette porte déjà `role="img"`), `.freeze-more` serait dangereuse
(elle retirerait la surveillance là où la marge est la plus mince du site, 0,43).
Le gardien a trouvé 5 défauts en 3 secondes sur des pages hors de l'échantillon
précédent : `.post-cluster`, `.post-more`, `.founder-role`, `.seo-tag-on`, `.st-num`.

**npm audit** : `npm update nanoid` ciblé, 1 paquet modifié, Astro inchangé,
0 vulnérabilité.

**`/llms-full.txt`** : créé, 12 pages, 5 035 mots. Gardien à trois refus - plancher
par section, plancher global, et des repères qui ne peuvent pas disparaître sans
casse (`49 €`, `89 €`, `Étoile`, `Constellation`). Vérifié dans les deux sens.

**Les 6 pages `/pour/`** : 753 à 896 mots, zéro phrase de 8 mots partagée entre blocs
métier. Trois chiffres sourcés sur six pages - UNEC/ISM pour coiffeur, BrightLocal
2024 pour garage et institut, INSEE 2025 pour hôtel. `independants` et
`multi-etablissements` partent **sans chiffre** : l'agent a écarté une « étude Ifop »
et un « -70 % de clics » qu'il ne pouvait pas remonter à leur source.

**`check:indexnow`** : créé, avec deux classes d'échec séparées - 4xx notre
configuration donc bloquant, 5xx et réseau leur service donc avertissement.

### IndexNow était mort en silence

Découverte de l'agent, non demandée. Logs du déploiement `a80d86e` :
```
indexnow : 48 URL à soumettre (clé indexnow-993e…d6.txt).
indexnow : réponse inattendue HTTP 403 (non bloquant).
{"errorCode":"UserForbiddedToAccessSite"}
```
Le fichier de clé est sain (200, `text/plain`, 32 octets, contenu exact). Le refus
vient de Bing : clé restée sur `avistars.fr`, ou `www.mystela.fr` jamais validé.

Le vrai défaut était `|| true` dans le `buildCommand` : une règle verte et morte,
exactement ce que `check:brand` traque ailleurs. Depuis quand ? Inconnu, les logs
Vercel ne remontent pas assez loin.

### La découverte sur les URL de test

`config.demo === true` était **déjà posé** sur `test`, et `isPublicTenant` le
refusait **déjà** du sitemap et de `/llms.txt`. Google l'a indexé quand même.

**Être absent d'un sitemap n'empêche pas l'indexation** : un sitemap propose des URL,
il n'en interdit aucune. Seul un `noindex` servi par la page l'empêche.

`robotsForTenant` réutilise `isPublicTenant` : une règle, trois consommateurs.
Ni `Disallow` (il interdit d'explorer, pas d'indexer, et fermerait le GEO ouvert
exprès au lot GEO-2), ni liste de slugs (fausse au prochain tenant).

### POUR-1 - le dernier reliquat, PR 29

**`/pour/restaurant` : 381 -> 1 038 mots.** Le piège de duplication était réel - les
9 pages villes tiennent déjà la concurrence locale, le tourisme et la saisonnalité ;
le blog tient la collecte, la réponse aux avis négatifs et Paris contre Lyon ; la
page elle-même parlait déjà du QR sur la table.

Le bloc traite donc **le service comme unité de temps** : le coup de feu où une salle
de 60 couverts en libère 15 en un quart d'heure sans qu'une main soit libre, contre
un salon qui libère une cliente toutes les 40 minutes. L'addition qu'on vient de
vérifier. Et l'objection propre au métier : « on va me noter sur l'attente d'un
samedi soir complet ».

**Chiffre sourcé** : 24 % des clients d'un commerce de bouche attendent qu'on leur
demande un avis le jour même, 48 % sous deux à trois jours. BrightLocal, Local
Consumer Review Survey 2024, lue sur sa page d'origine. C'est **le délai le plus
court de tous les secteurs** de cette enquête, ce qui justifie que la restauration
soit traitée autrement que les six autres.

| Page | Mots | dont bloc métier |
|---|---:|---:|
| `restaurant` | **1038** | 657 |
| `coiffeur` | 896 | 563 |
| `garage` | 852 | 538 |
| `hotel` | 844 | 513 |
| `multi-etablissements` | 828 | 385 |
| `independants` | 799 | 452 |
| `institut` | **753** | 435 |

Phrases de 8 mots partagées entre deux blocs métier : **0**.
Entre le bloc restaurant et les 9 pages villes : **0**.

### `check:pour` - plancher à 753, volontairement fragile

**753 est le minimum réel des sept**, pas un chiffre rond. Un seuil à 700 laisserait
53 mots de marge pour raboter sans rien casser ; un seuil au réel refuse la première
régression.

Contrepartie assumée et écrite dans le fichier : **retirer un mot à `institut` fait
tomber la CI.** C'est la discipline de `lint:colors`, dont la baseline ne bouge que
sur décision humaine. Si les sept progressent, le nombre monte, jamais l'inverse.

**Aucune des six autres pages n'a eu besoin d'être retouchée** : la PR 27 n'avait
rien laissé en dessous.

Vérifié dans les trois sens, chaque fois en nommant la page fautive : `institut`
amputé à 625 mots, un paragraphe du garage recopié dans l'hôtel (23 phrases
partagées détectées), et `restaurant` retiré de `METIERS`.

### Le bug qui a cassé la CI - à retenir

Le premier push a fait tomber la CI **par le fichier de workflow lui-même**, pas par
un gardien. L'étape était nommée :
```yaml
- name: check pour (pages metier : plancher de mots et unicite)
```
**En YAML, un scalaire non quoté contenant `: ` est lu comme une clé de mapping.**
GitHub a refusé le fichier entier, la run est tombée en 0 seconde, aucun gardien n'a
tourné.

**Le piège** : `npm run check` ne lit jamais le workflow, un gate local vert ne le
voit pas. Et le tableau des checks affichait Vercel en vert sans afficher les
gardiens - une absence, pas une erreur rouge.

Corrigé en reformulant le nom sans deux-points plutôt qu'en le quotant : le fichier
n'en quote aucun autre, et une exception de syntaxe se serait oubliée.

### Ce qui reste ouvert

| Point | Nature | Chez qui |
|---|---|---|
| ~~`INDEXNOW_SKIP`~~ | **RÉGLÉ le 03/09** - voir ci-dessous | - |
| Plancher 753 fragile | par construction - une retouche de copie fera tomber la CI, il faudra une décision, pas un contournement | discipline `lint:colors` |
| Les 16 pages non indexées | hors de portée du code (§4.5) | chantier autorité |

### IndexNow - réglé par rotation de clé (PR 30, `34d1f6b`)

Le 403 venait d'un **cache Bing sur l'ancienne clé** : Bing avait mémorisé un échec
de vérification (sans doute pendant la bascule de domaine du 23/07) et ne revenait
pas dessus malgré un fichier sain. Une clé neuve a forcé une vérification neuve.

```
2026-09-03T15:40:08  indexnow : 49 URL à soumettre (clé indexnow-f9140f78….txt)
2026-09-03T15:40:08  indexnow OK : 49 URL soumises (HTTP 202)
```

**Mais le volet « soumission » de `check:indexnow` ne peut pas vivre en CI.**
Mesuré le 03/09, même clé, même charge utile, même demi-heure :

| Origine | Réponse |
|---|---|
| Vercel, build de production | **202** |
| Machine locale | 403 |
| Runner GitHub Actions | 403 |

**Bing filtre par origine.** Un gardien qui refait la soumission depuis la CI
serait rouge en permanence alors que la production fonctionne. `INDEXNOW_SKIP`
n'est donc plus une dette datée : c'est un fait structurel, documenté comme tel.
Trace : run CI 33773938.

Piste si un jour on veut la vérification en CI : lire le résultat du ping dans
les logs de build Vercel au lieu de refaire la soumission. Lot à part, non ouvert.

**Rien d'autre. Pas de dette silencieuse, pas de contournement non signalé.**

## 9. Journal des décisions

| Date | Décision | Motif |
|---|---|---|
| 02/09 | `llms.txt` : rien à corriger | mesuré 200 / 69 ms / H1 conforme |
| 02/09 | Gate = `npm run check` | les autres commandes sont dans `stella-app` |
| 02/09 | URL de test : lot séparé `stella-app` | robots.txt autorise `/book/`, défaut dans la consigne |
| 02/09 | 404 : liste fermée de 9 villes | l'article existe, les 16 liens sont corrects, la règle est une fabrique à 404 |
| 02/09 | StickyCta : mesure seulement | 4 567 o de JS total, zéro lecture géométrique |
| 02/09 | Pages `/pour/` : rien dans ce lot | médiane 41,0 % contre seuil 40, marge trop mince |
| 02/09 | 404 : liste fermée **validée par Nicolas** | corrige aussi la fabrique à 404, non demandé mais juste |
| 02/09 | StickyCta : **lot clos sans action** | `.is-visible` ne change qu'un transform sur fixed, 3e artefact |
| 02/09 | Image hero : CLS non menacé | `.ps-photo img` fixe `height:120px` en CSS, il gagne |
| 02/09 | `backdrop-filter` : signalé, non touché | charte visuelle prime sur une hypothèse non mesurée |
| 02/09 | **Lot 6 abandonné en l'état** | ni minceur ni ressemblance ne corrèlent (§4.4) ; `restaurants-brest` est décisif |
| 02/09 | iCloud : le téléchargement démarre | 72 min au 1er `git status`, 30 ms au 2e ; effondré, pas mort |
| 02/09 | Contrastes reportés | `playwright/lib/index.js` est un fantôme iCloud, `blocs=0` |
| 02/09 | **PR 26 fusionnée** `a80d86e` | lots 1, 2, 3 livrés en production, gate vert, 3 preuves prises |
| 02/09 | Contrastes : A sur surfaces pleines, B sur texte sur crème | aucune option gratuite, le laiton ne porte pas de petit texte |
| 02/09 | Gardien anti-règle-gourmande gardé | le dépôt corrige des classes de défaut ; `check:brand` portait déjà son jumeau |
| 02/09 | Image hero : cible 240x120, pas 210x117 | mesure Playwright à 3 viewports, maquette de largeur fixe |
| 02/09 | `npm audit` et `check:contraste` : lots séparés | hors périmètre, aucun ne bloque la CI |
| 03/09 | **PR 27 `ff30d9d` fusionnée** | 6 points soldés, gate vert |
| 03/09 | **PR 1 `8179207` fusionnée** sur stella-app | `robotsForTenant`, 2747 tests verts |
| 03/09 | CSS et polices : **rien fait** | mesure - CSS finis 352 ms avant le FCP, préchargement dégrade le FCP |
| 03/09 | `check:contraste` sans aucune exclusion | `.ps-place` redondante, `.freeze-more` dangereuse à exclure |
| 03/09 | 2 pages `/pour/` sans chiffre | aucune source solide trouvée, refus d'inventer |
| 03/09 | IndexNow mort depuis une date inconnue | 403 Bing, `\|\| true` masquait l'échec |
| 03/09 | **PR 29** - POUR-1 | `/pour/restaurant` 381 -> 1038 mots, `check:pour` posé sur les 7 |
| 03/09 | Plancher `check:pour` à 753, pas 700 | le minimum réel refuse la première régression ; fragilité assumée |
| 03/09 | Bug YAML dans `gardiens.yml` | `: ` non quoté = clé de mapping, la CI tombe en 0 s sans qu'aucun gardien tourne |
| 03/09 | **PR 30 `34d1f6b`** - rotation clé IndexNow | 403 -> 202 en prod, cache Bing sur l'ancienne clé |
| 03/09 | `INDEXNOW_SKIP` devient structurel | Bing filtre par origine : 202 depuis Vercel, 403 depuis CI et local |
| 03/09 | **PR 31 `13ad14d`** - le saut devient un fait mesuré | plus d'annotation ::warning::, procédure de rotation documentée |
| 03/09 | Contrôle de présence de la clé perdu en CI | `INDEXNOW_SKIP` coupe les deux volets réseau ; séparer les drapeaux le rendrait, non fait, écrit dans docs/INDEXNOW.md |
| 03/09 | **Chantier clos** | 6 PR, 0 dette silencieuse |

## 10. En attente

- [x] ~~Mesure des contrastes~~ - faite et livrée 02/09 (lot 2)
- [ ] **Sortie d'iCloud** - `site-vitrine` complet (0 fichier évincé), `stella-app`
      à 5 332 dont 5 100 de cache `.next` jetable et 3 231 dans `.git/objects`.
      Coût payé : 70 min + 89 min de matérialisation. Le déménagement vers `~/dev`
      supprime la taxe définitivement au lieu de la reporter à la prochaine éviction.
- [x] ~~Mesure de l'image hero~~ - faite 02/09, §3.3
- [x] ~~Mesure du coût CSS de `.is-visible`~~ - faite 02/09, lot 4 clos
- [ ] État des 3 worktrees (`wt-diag-2`, `wt-diag-2b`, `wt-vit-wow`)
- [x] ~~Brief de contenu du lot 6~~ - lot abandonné 02/09 sur mesure (§4.4)
- [ ] **Décider du vrai levier** : autorité et liens entrants (§8), seul chantier
      capable de déplacer la position 56,8
- [ ] Décision sur `/llms-full.txt` (404, convention optionnelle)
- [ ] **Lot séparé** : `npm audit` - `nanoid <3.3.18` (high), transitif
      `astro@7.1.3 > vite@8.1.5 > postcss@8.5.26`. Non exécuté par le workflow, ne
      bloque aucune PR. `npm audit fix` toucherait `package-lock.json`.
- [ ] **Lot séparé** : gardien `check:contraste`. Le lot 2 a corrigé des occurrences,
      pas une classe de défaut : rien n'empêche un futur `color: var(--brass)` sur du
      petit texte.

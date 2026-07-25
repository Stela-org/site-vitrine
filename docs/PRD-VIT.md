# PRD-VIT.md : Refonte totale du site vitrine Stela

> Lot VIT-0, produit le 24/07/2026. Repo `avistar-info/site-vitrine`.
> Basé sur `AUDIT-VIT.md`. Tout le travail se fait sur branche ; la production
> (`www.mystela.fr`) ne bouge qu'après validation superviseur et merge.
> Règle de rédaction du site : phrases complètes, français correct, **jamais de
> tiret cadratin** ; marque « Stela » (un seul L) partout.

## Vision

Construire le meilleur site de sa catégorie en France : moteur de croissance
Google **clé-en-main et 100 % conforme** pour les commerces locaux. Trois
maîtres-mots : simplicité, cohérence, hiérarchie visuelle. Pensé dès la
première ligne pour la performance commerciale (pub + organique) et la
visibilité SEO/GEO/AEO (moteurs classiques ET moteurs IA). La conformité EST le
différenciant : elle se raconte, elle ne s'excuse pas.

## Positionnement (à décliner sur tout le site)

- Promesse : « Le moteur de croissance Google clé-en-main et 100 % conforme des
  commerces locaux. »
- Différenciants vs Dokaa (factuels, sourcés, zéro dénigrement) : prix
  transparents + essai gratuit self-serve (eux : démo obligatoire, prix cachés) ;
  100 % conforme aux règles Google (eux : roue cadeau non conforme) ;
  multi-secteurs (eux : mono-restauration) ; contenu GEO pionnier (eux : zéro) ;
  contenu complet sans JavaScript (eux : page blanche sans JS).
- Interdits absolus (hérités de la V1 Avistars, cf. AUDIT §2) : aucun review
  gating, aucune « interception » d'insatisfaits, aucun claim de volume
  (« +300 % »), aucune garantie chiffrée non tenue.

---

## Décisions d'architecture (proposées, à valider au démarrage VIT-1)

### Framework : **Astro** (recommandé)

Justification vs Next :
- **Zéro JS par défaut** : Astro génère du HTML statique ; le contenu est
  intégralement lisible sans JavaScript (mandat non négociable du lot, et
  contre-exemple direct de Dokaa). Next (React) embarque un runtime JS même pour
  du contenu statique.
- **Islands d'hydratation** : le motion design (révélations au scroll, mockups
  animés, morph) s'ajoute en îlots ciblés (`client:visible`), en progressive
  enhancement strict, sans alourdir le reste.
- **Content collections + MDX** : idéal pour le blog (14 articles migrés + piliers
  GEO + calendrier éditorial), avec schema typé et génération de sitemap.
- **Lighthouse ≥ 95 « gratuit »** : sortie statique légère, parfaite pour le SEO
  et la pub.
- **Séparation des responsabilités** : la vitrine (marketing/contenu) reste
  distincte de l'app Next (`app.mystela.fr`, produit). Pas de couplage.

Alternative Next.js rejetée : plus lourde pour un site de contenu, runtime React
inutile ici, pas d'avantage décisif puisque la vitrine ne partage pas d'état avec
l'app. (À reconsidérer seulement si un besoin fort de composants React partagés
avec l'app émerge.)

### Hébergement et domaine
- Cible : **Vercel** (cohérence avec l'app, domaines custom + SSL auto + 301
  natifs). Domaine canonique **unique** : `https://www.mystela.fr`.
- Redirections : `mystela.fr` → `www.mystela.fr`, `http` → `https`, et
  `avistars.fr` → `www.mystela.fr` (301, cf. VIT-4).

### Tracking (proposition, à valider VIT-1)
- **PostHog** (déjà dans la stack de l'app) : analytics produit unifiée
  vitrine ↔ app, hébergement EU possible, respect RGPD, bannière cookies
  minimale. Retrait total de l'ancien GA `G-WK8JTW04WF` et des webhooks n8n.
- Option : GA4 (nouvelle propriété `www.mystela.fr`) en complément si besoin
  publicité (audiences Google Ads). À décider ensemble.

---

## Lots ordonnés

Chaque lot finit par le **GATE commun** (voir plus bas). Cases à cocher =
critères d'acceptation vérifiables.

### VIT-1 : Fondations (framework, migration, purge, canonique, tracking)
Socle technique et propreté. Aucune régression d'URL.

- [x] Framework Astro initialisé (build vert, sortie statique).
- [x] `README.md` documenté : build, dev, deploy, charte, règles de conformité.
- [x] Charte importée depuis `stella-app/docs/design/stela/` (couleurs, logo
      laiton `#B08A3E`, Plus Jakarta Sans, favicons) ; tokens centralisés.
- [x] `lint:copy` en place (0 tiret cadratin) + script de contrôle marque
      (codename double L / `Avistars` / `avistars.fr` = 0 en surface visible).
- [x] Canonique unique `https://www.mystela.fr` sur toutes les pages.
- [x] Purge conformité : 0 review gating sur le site déployé (ancien contenu
      isolé dans `legacy/`, non déployé, supprimé au VIT-4).
- [x] Purge Avistars : marque, domaine, email, liens `buy.stripe.com`, GA
      `G-WK8JTW04WF`, n8n retirés du site (déplacés dans `legacy/`).
- [~] Tracking : mécanisme PostHog + GA4 + Consent Mode v2 + bannière en place.
      **Reste à faire** : renseigner les identifiants (`ANALYTICS`) une fois les
      propriétés créées. Tant qu'ils sont vides, aucun script de mesure ne charge.
- [x] `google038f47dee570e8dc.html` conservé (`public/`) + meta
      `google-site-verification` conservée (décision 10).
- [x] `robots.txt` (+ bots IA) + `llms.txt` (présentation Stela, offres, prix,
      FAQ) publiés.
- [x] Table de correspondance des URL figée (`docs/URL-MAP.md`), base des 301.
- [ ] **Déploiement** : configurer le projet Vercel `site-vitrine` en preset
      Astro (build `astro build`, output `dist`), Lighthouse >= 95, puis merge
      `lot-vit-1` -> `main` après validation superviseur.

### VIT-2 : Pages cœur (accueil, fonctionnalités, tarifs, segments)
Le tunnel commercial. 1 URL = 1 intention, slugs FR propres.

- [ ] **Accueil** : promesse claire, preuve sociale à chaque section, CTA unique
      répété (« Essayer gratuitement »), emplacement vidéo produit incarnée,
      mockups fidèles au vrai produit (dashboard, page d'avis, réponse auto).
- [x] **6 pages fonctionnalités** (1 slug = 1 mot-clé) : `/collecte-avis-google`,
      `/reponse-automatique-avis`, `/avis-multi-plateformes`, `/analyse-des-avis`,
      `/centralisation-reservations`, `/sms-fidelisation`.
- [x] **Page tarifs** (`/tarifs`) 100 % transparente : Étoile 49 €/mois,
      Constellation 89 €/mois, toggle annuel = 2 mois offerts, essai gratuit,
      sans engagement. CTA → `app.mystela.fr`.
- [x] **Pages segments** (`/pour/*`) : indépendants, multi-établissements,
      restaurant, coiffeur, institut, garage (extensible via `content/segments.ts`).
- [x] Aucun Payment Link statique : CTA vers l'inscription self-serve.
- [x] Mockups produit fidèles à l'app réelle : composant `AppMockup` avec les
      libellés EXACTS de `stella-app/config/moduleLabels.ts` (espaces + modules).
- [x] Sécurité (exigence supervisée) : `vercel.json` (CSP stricte, HSTS,
      X-Frame-Options/frame-ancestors, Referrer-Policy, Permissions-Policy),
      analytics bundlé compatible CSP, `npm audit` dans le gate, 0 vulnérabilité.
- [x] Redirections `vercel.json` : `mystela.fr` → www, `avistars.fr/*` → www
      (catch-all provisoire, remplacé par le mapping page à page au VIT-4).
- [~] **Vraie image OG 1200x630** : PNG généré (`og-default.png`) + source SVG.
      Rendu texte via `sips` non vérifié visuellement ; export propre à confirmer.

### VIT-3 : SEO / GEO / AEO technique
La couche de visibilité, traitée comme un livrable, pas un vernis.

- [x] Schema.org : `Organization`, `WebSite`, `SoftwareApplication` + `Offer`
      (prix réels), `FAQPage` + `BreadcrumbList` par page. `Article` reste pour
      VIT-4 (blog). Validation structurelle automatisée (`check:schema`, 63 blocs) ;
      Rich Results Test officiel = étape manuelle sur le preview.
- [x] Blocs Q&A courts et citables sur chaque page (home, fonctionnalités,
      segments, tarifs), alignés sur le schema `FAQPage`.
- [x] `sitemap.xml` sur `www.mystela.fr`, sans hreflang bidon, avec priorités par
      intention (home 1.0, tarifs 0.9, fonctionnalités 0.8, segments 0.7) + lastmod.
- [x] Maillage interne : nav (dropdowns Fonctionnalités + Pour qui), cartes de la
      home liées aux pages, liens croisés en pied de page fonctionnalités/segments.
      Articles reliés au VIT-4.
- [x] Contenu 100 % visible sans JavaScript (nav en `<details>`, toggle prix CSS,
      0 script externe). Vérifié.
- [x] Harmonisation des ancres de nav vers les pages dédiées (Fonctionnalités et
      Pour qui = menus de pages ; Tarifs = `/tarifs`).
- [x] Nouveau garde-fou `check:schema` (JSON-LD parsé + champs minimaux) ajouté au
      gate, après `check:links`.

### VIT-4 : Contenu (blog, villes, piliers GEO, comparatif, migration 301)
Le capital éditorial et la reprise SEO.

- [x] Migration des articles existants, **réécrits sans gating**, re-brandés Stela :
      5 guides (`repondre-avis-negatif-google-restaurant`, `comment-avoir-plus-avis-google-restaurant`,
      `supprimer-mauvais-avis-google-restaurant` recadré, `e-reputation-commerce-local-guide`,
      `qr-code-avis-google`). Les 9 articles de blog « ville » (thin content,
      cannibalisation) sont **consolidés** dans les landing pages villes (301).
- [x] 9 pages villes **réellement différenciées** (`/restaurants-{ville}`) via
      `content/cities.ts` : contexte local factuel par ville (quartiers réels,
      tissu commercial), aucun chiffre inventé. Intention commerciale distincte
      du blog (informationnel) pour éviter la cannibalisation.
- [x] **3 piliers GEO** étoffés (1200-1800 mots, exemples par secteur, méthode
      pas à pas, tableau récapitulatif) : recommandé par ChatGPT/Gemini/Perplexity,
      GEO ou SEO, mesurer sa visibilité IA.
- [x] **Page comparative « Stela vs Dokaa »** : factuelle, sourcée (lien règles
      Google), zéro dénigrement (points non vérifiables = « à vérifier »).
- [x] **Calendrier éditorial 12 semaines** livré (`docs/CALENDRIER-EDITORIAL.md`).
- [x] **301 page à page** dans `vercel.json` (sans host, donc actif sur www ET sur
      avistars.fr une fois le domaine attaché) : guides renommés, articles ville →
      landing ville, `.html` → URL propre, `qui-sommes-nous` → home ; fallback
      catch-all avistars → home. **Reste manuel** : attacher `avistars.fr` au projet
      Vercel + Change of Address Search Console (Nicolas, fin de projet).

### VIT-5 : Polish (motion, mockups animés, success stories, a11y, page présence)
Finition haut de gamme.

- [x] Motion design : révélations au scroll + mockups animés **100 % CSS**
      (`animation-timeline: view()`), donc **zéro JavaScript** : contenu visible
      par défaut si non supporté ou JS coupé (contre-exemple Dokaa évité).
      Désactivé sous `prefers-reduced-motion`. Micro-interactions (hover cartes/
      boutons) déjà en place. 0 impact Lighthouse (aucun JS ajouté).
- [x] Success stories : **structure prête** (`content/stories.ts`, `metric` =
      chiffre réel en titre) ; tableau vide volontairement ; la home affiche un
      état honnête « à venir » tant qu'aucun cas réel n'est saisi (aucun faux chiffre).
- [x] Accessibilité : lien d'évitement, `:focus-visible` global, landmarks
      (`header`/`main`/`footer`/`nav` étiquetés), `aria-label` sur le logo, le
      mockup (`role=img`) et le toggle tarifaire, un seul `h1` par page,
      `lang=fr`, dropdowns clavier natifs (`<details>`).
- [x] Page « présence sur 20+ plateformes » (`/presence-plateformes`) en
      **noindex** + hors sitemap, angle « visible aussi dans ChatGPT via Bing ».
      À publier (retirer le noindex) quand la gestion de présence sortira.

---

## GATE commun (fin de CHAQUE lot, avant merge)

- [ ] Build vert.
- [ ] `lint:copy` : 0 tiret cadratin.
- [ ] Grep de contrôle : `Stella` / `Avistars` / `avistars.fr` = 0 en surface
      visible (le codename interne « Stella » reste interdit à l'affichage).
- [ ] Lighthouse ≥ 95 (perf, SEO, best practices, a11y) sur les pages du lot.
- [ ] Contenu vérifié lisible **sans JavaScript**.
- [ ] Aucun discours de review gating réintroduit.
- [ ] Validation superviseur explicite avant merge sur `main` / mise en prod.

---

## Décisions (tranchées le 24/07/2026)

1. **CTA d'inscription** : `https://app.mystela.fr`. NB : stella-app n'a pas de
   route publique `/signup` (auth par `/login`, onboarding post-auth) ; on
   deep-linke la racine de l'app. URL centralisée (`SITE.appUrl`), 1 ligne à
   changer le jour où une route d'inscription dédiée existe.
2. **Payment Link** : AUCUN `buy.stripe.com` sur la vitrine. Prix affichés,
   achat 100 % dans l'app.
3. **Offre annuelle** : OUI (toggle mensuel/annuel, « 2 mois offerts »). Supports
   physiques : NON sur la page tarifs, simple mention « QR codes et supports
   fournis » dans les features.
4. **Tracking** : PostHog + GA4 (nouvelle propriété www.mystela.fr), Consent Mode
   v2 + bannière minimale. Ancien `G-WK8JTW04WF` supprimé.
5. **Framework** : **Astro** validé.
6. **URLs blog** : slugs propres sans `.html`, 301 de chaque ancienne URL.
7. **Charte or** : `#B08A3E` = étoile/logo (intouchable), `#C8992E` = accent or
   secondaire. Documenté dans `docs/CHARTE.md`.

## Priorité VIT-1 : purge d'abord, déploiement immédiat

`www.mystela.fr` sert AUJOURD'HUI l'ancien site Avistars (non conforme) via
Vercel. VIT-1 est donc prioritaire et se termine par un **déploiement réel** :
dès que fondations + purge sont validées, on merge pour que le domaine ne serve
plus une seule page Avistars, même si VIT-2 (pages cœur) n'est pas fini. La home
VIT-1 est minimale mais complète (promesse, prix, CTA, conformité, Q&A).

---

## Journal (daté, à compléter à chaque lot)

| Date | Lot | Événement |
|---|---|---|
| 24/07/2026 | VIT-0 | Audit + PRD produits sur branche `lot-vit-0`. Validés. |
| 24/07/2026 | VIT-0 | 7 décisions tranchées (voir ci-dessus). |
| 24/07/2026 | VIT-1 | Fondations Astro livrées sur `lot-vit-1` : purge Avistars/gating, canonique www.mystela.fr, 2 verifications Google conservées, schema.org (Organization/SoftwareApplication/Offer/FAQPage), Consent Mode v2 + bannière (clés à renseigner), robots + llms.txt, home minimale, 404, sitemap, garde-fous lint:copy + check:brand, charte + URL-map. Build vert, contenu sans JS vérifié. Snapshot `legacy-avistars` créé. |
| 24/07/2026 | VIT-1 | Validé superviseur (Lighthouse local 94/95/100/100). Mergé en local dans `main` (non poussé, en attente du réglage preset Astro sur Vercel). |
| 24/07/2026 | VIT-2 | Sur `lot-vit-2` : `vercel.json` (redirections www + avistars catch-all, en-têtes sécurité CSP/HSTS/etc.), analytics bundlé compatible CSP, `npm audit` dans le gate. 6 pages fonctionnalités + `/tarifs` + 6 pages segments (`/pour/*`), mockups fidèles (libellés réels de l'app), schema FAQPage + BreadcrumbList par page, maillage interne (nav + footer), OG 1200x630. 15 pages, gate vert, contenu sans JS, 0 script externe. |
| 24/07/2026 | VIT-2 | Validé superviseur (Lighthouse tarifs 99/95/100/100). 2 corrections : (1) BLOQUANT `cleanUrls:true` + `trailingSlash:false` dans `vercel.json` (build format "file" + liens sans extension = 404 sans cleanUrls) + nouveau test de gate `check:links` (chaque href interne servable, canonicals sans extension). (2) Vraies pages légales `/mentions-legales`, `/cgv`, `/politique-confidentialite` (entité Nicolas Anquetin / VGN Company, marque Stela, hébergeur Vercel, contact@mystela.fr), en noindex + hors sitemap ; la confidentialité inclut la section API Google Business Profile (données lues, but, stockage, jamais revendues/pub, conformité Google API Services User Data Policy + Limited Use) pour la future validation OAuth. 18 pages, gate complet vert (lint:copy + check:brand + audit + build + check:links). |
| 24/07/2026 | VIT-2 | Validé. Mergé `lot-vit-2` → `main` et **poussé** (déploiement Vercel de Stela sur www.mystela.fr, fin de l'ancien site Avistars en prod). Domaines redirect avistars.fr ajoutés par Nicolas en fin de projet (acté). |
| 24/07/2026 | VIT-3 | Sur `lot-vit-3` : schema `WebSite` ajouté + garde-fou `check:schema` (63 blocs JSON-LD validés) ; sitemap avec priorités par intention + lastmod ; maillage interne (nav en dropdowns `<details>` sans JS vers les pages dédiées, cartes home liées aux fonctionnalités, liens croisés) ; harmonisation des ancres de nav ; Q&A citables confirmés ; no-JS vérifié. Gate complet vert (lint:copy + check:brand + audit + build 18 pages + check:links 737 + check:schema 63). |
| 24/07/2026 | VIT-3 | Validé superviseur (prod vérifiée : Stela servi, cleanUrls OK, en-têtes sécurité actifs, 0 discours interdit). Mergé `lot-vit-3` → `main` et poussé. |
| 24/07/2026 | VIT-4 | Sur `lot-vit-4`, **échantillon de calage du ton** : infra blog + 1 article migré + 1 pilier GEO + comparative + calendrier. Gate vert (22 pages). Échantillon présenté. |
| 24/07/2026 | VIT-4 | Échantillon validé (ton, structure « En bref », angle comparative). Déroulé complet : 3 piliers GEO étoffés (1200-1800 mots) ; 5 guides migrés (dont `supprimer-mauvais` recadré, titre honnête sans promesse de suppression) ; 9 pages villes différenciées (`content/cities.ts`, contexte local factuel) ; consolidation des 9 articles ville → landing villes ; mapping 301 page à page dans `vercel.json` (10 redirects). Gate complet vert : lint:copy + check:brand + audit 0 + build **37 pages** + check:links **1660** + check:schema **137 blocs**. |
| 24/07/2026 | VIT-4 | Presque validé. 2 corrections : (1) longueur des piliers GEO respectée pour les 3 (geo-ou-seo +tableau signaux Google/IA +3 cas secteurs → ~1379 mots ; mesurer-visibilite +protocole mensuel +grille 0-27 +exemple 3 mois → ~1306 mots) ; (2) meta descriptions des 9 villes rendues **uniques** (angle local). Gate vert. Mergé `lot-vit-4` → `main` et **poussé**. |
| 24/07/2026 | VIT-5 | Sur `lot-vit-5` : motion design 100 % CSS (révélations scroll + mockups animés, `animation-timeline`, zéro JS, reduced-motion) ; success stories (structure prête, état honnête « à venir ») ; passe a11y ; page `/presence-plateformes` en noindex + hors sitemap. Gate complet vert : lint:copy + check:brand + audit 0 + build **38 pages** + check:links **1698** + check:schema **139 blocs**, 0 script externe sur la home. |
| 24/07/2026 | VIT-5 | Validé superviseur (Lighthouse 99/95 avec motion, noindex `presence-plateformes` confirmé). Mergé `lot-vit-5` → `main` et **poussé** (déployé sur www.mystela.fr). |
| 24/07/2026 | CLÔTURE | **PRD VIT clos.** Les 6 lots (VIT-0 à VIT-5) sont livrés, validés et en production sur www.mystela.fr : refonte Astro complète (accueil, 6 fonctionnalités, tarifs, 6 segments, 9 villes différenciées, blog 8 articles dont 3 piliers GEO, comparatif Stela vs Dokaa, légales), purge intégrale Avistars/gating, SEO/GEO (schema, Q&A citables, sitemap, maillage), sécurité (CSP/HSTS + `npm audit`), garde-fous de gate (lint:copy, check:brand, check:links, check:schema), motion 100 % CSS et accessibilité. **Restent des étapes manuelles hors code (Nicolas)** : renseigner les clés `ANALYTICS` (GA4/PostHog), attacher `avistars.fr` au projet Vercel en redirect + Change of Address Search Console, fournir la vidéo produit de l'accueil, remplir les success stories avec des cas réels instrumentés, et publier `/presence-plateformes` (retirer le noindex) quand la gestion de présence sortira. |
| 24/07/2026 | VIT-6 | **Lot design & émotion** (rouvre le PRD). Échantillon nouvelle home (hero + 2 sections) sur `lot-vit-6`, poussé en preview : hero vivant (mockup téléphone `/r/` fidèle + étoiles qui se remplissent + carte d'avis flottante + mini roue SVG), preuve sociale (cartes d'avis illustratives anonymisées), conformité en rupture (fond encre, « Zéro filtrage » laiton géant). Motion 100 % CSS, no-JS, 0 script externe, gate technique vert. **Point d'arrêt : validation de la DA avant de dérouler le reste.** |
| 24/07/2026 | VIT-6 §6 | Ajout des **3 clips produit** (fournis par Nicolas, compte démo). Composant `ProductVideo.astro` prêt (poster fallback toujours visible, lazy IntersectionObserver, autoplay muted loop playsinline, `prefers-reduced-motion` = poster seul, vidéos auto-hébergées couvertes par CSP `default-src 'self'`). Specs + emplacements dans `docs/VIDEOS-PRODUIT.md`. Clip 1 (vue client) peut remplacer le mockup CSS du hero, décision à la validation de la home. En attente des fichiers. |
| 24/07/2026 | VIT-6 | **DA validée** (garder l'intensité de motion). Généralisation au site : mini-visuels produit sur les 6 cartes fonctionnalités (`MiniMockup`, libellés réels) ; section stories rendue visuelle avec la carte `Retombées (CA · ROI)` (`ROICard`, « données d'exemple ») ; carte Constellation magnétique (bord dégradé laiton, léger scale) + badge « vous économisez X € par an » (annuel) + rappel roue cadeau, sur home et `/tarifs` ; matière visuelle sur les pages villes (photo QR sur table) et segments (carte d'avis). Images `webp` (180 Ko au total), **0 fichier JS** dans le build (100 % statique), 0 script externe. Gate vert : build **38 pages**, check:links **1699**, check:schema **139**, audit 0. **Point d'arrêt final : passe visuelle superviseur (desktop + 375px) avant merge.** |

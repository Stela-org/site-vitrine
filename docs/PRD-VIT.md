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
| 24/07/2026 | VIT-6 | **DA validée** (garder l'intensité de motion). Généralisation au site : mini-visuels produit sur les 6 cartes fonctionnalités (`MiniMockup`, libellés réels) ; section stories rendue visuelle avec la carte `Retombées (CA · ROI)` (`ROICard`, « données d'exemple ») ; carte Constellation magnétique (bord dégradé laiton, léger scale) + badge « vous économisez X € par an » (annuel) + rappel roue cadeau, sur home et `/tarifs` ; matière visuelle sur les pages villes (photo QR sur table) et segments (carte d'avis). Images `webp` (180 Ko au total). Gate vert. Passe visuelle superviseur (desktop validé). |
| 24/07/2026 | VIT-7 | **Boost marketing, autorité, tunnel d'achat** sur `lot-vit-7`. (1) `/notre-histoire` (récit fondateurs Nicolas Anquetin + Corentin Janin avec photos réelles, 170+ restaurants génération précédente, choix du 100 % conforme, schema AboutPage + Person), nav + footer. (2) E-E-A-T : auteur réel « Nicolas Anquetin, cofondateur » + bio sur chaque article, schema `author` Person relié à `/notre-histoire` + `sameAs` (LinkedIn, societe.com) dans Organization. (3) Lead magnet `/guide-google-commercant-local` : form no-JS (honeypot + consentement), double opt-in RGPD sans stockage (jeton HMAC), fonctions `api/lead-subscribe.js` + `api/lead-confirm.js` (Resend, env-guarded), pages merci/confirme noindex ; doc `docs/LEAD-MAGNET.md`. (4) `/statistiques-avis-google-france` : données 100 % sourcées, tableaux citables, schema `Dataset` + `FAQPage`. (5) Tarifs : bloc perte -31 % AVANT les cartes, « moins de 3 € par jour » (Constellation), « Comparez-nous » → `/stela-vs-dokaa`. (6) **Tunnel 2 clics** : helper `signupUrl()` centralisé (plan/billing/utm_source=vitrine/utm_campaign) sur TOUS les CTA (fin du « mur de connexion » racine), sync mensuel/annuel des liens de plan, CTA sticky mobile (`StickyCta`, une instance, jamais sur la bannière consentement). (7) `/.well-known/security.txt`. (8) Décision Nicolas : **GO garantie 30 jours** (tarifs sous les cartes + rappel CTA final home + CGV §5) ; témoignages historiques **abandonnés**. Gate complet vert : build **43 pages**, check:links **2690 + 0 orpheline**, check:schema **153**, **check:overflow OK (10 pages)**, audit 0. Confirmé visuellement. **Point d'arrêt : passe superviseur avant merge.** |
| 24/07/2026 | VIT-6 | **Dernier lot avant merge (3 points).** (1) Favicon : `favicon.ico` régénéré (16/32/48) depuis le glyphe laiton Stela (`scripts/build-favicon.mjs`) + `apple-touch-icon` (180) + manifest (app-icon 512 any/maskable) + liens PNG dans le head. Garde-fou : `check:brand` interdit désormais l'empreinte SHA-256 du favicon Avistars. (2) Pages villes orphelines : bloc « Nos villes » (9 liens) au footer (global) + maillage `/pour/restaurant` → 9 villes ; `check:links` échoue désormais si une URL du sitemap a 0 lien entrant (0 orpheline confirmé). (3) Punch marketing : `StatBand` (10 min · 6 langues · 30 s · 24h/24 · 100 %, compteurs animés, chiffre final toujours dans le DOM, count-up global dans Base) remplace la bande neutre ; signature « triple zéro » (`TripleZero` : 0 engagement · 0 carte requise · 0 filtrage) en motif récurrent (hero, tarifs, CTA final). Aucun claim de résultat inventé ; « 20+ plateformes » réservé à la page presence noindex. Gate complet vert : build **38**, check:links **2202 + 0 orpheline**, check:schema **139**, **check:overflow OK**, audit 0. Confirmé visuellement. **Point d'arrêt : passe finale avant merge.** |
| 24/07/2026 | VIT-6 | **Passe superviseur : 2 bloquants + 2 ajustements corrigés.** (1) Overflow mobile 375px : cause = `hero-visual` en flex-row au mobile (téléphone + carte côte à côte forçaient une piste de 415px) → `flex-direction: column` + `max-width`. Nouveau garde-fou `npm run check:overflow` (Playwright, 7 pages x 320/375/768/1280, `scrollWidth<=innerWidth`), **vert**. (2) Reveals = écran blanc : les reveals pilotaient l'opacité (défaut Dokaa) → **reveals désormais transform-only** (`translateY`), le contenu est toujours peint. (3) Toggle tarifs : knob glissant supprimé (chevauchait le badge) → option active en fond plein, plus de chevauchement à aucune taille. (4) Carte d'avis du hero décalée (le haut du téléphone reste lisible). Section « Résultats clients » remaniée sans faux cas : 2 stats sourcées (94 % BrightLocal, -31 % HBS) en gros chiffres animés (count-up PE, chiffre final toujours dans le DOM), mini-calculateur de projection (fonctionnel sans JS + interactif), ligne de crédibilité (170 restaurants, génération précédente), CTA conservé. **GA4** `G-V320LSDY9Q` branché (consent mode v2, chargé après consentement, CSP OK). **Correctif CSP** : Astro inlinait les scripts (bloqués par `script-src 'self'`) → `vite.build.assetsInlineLimit: 0` force des scripts externes servis en 'self'. Gate complet vert : build **38 pages**, check:links **1699**, check:schema **139**, **check:overflow OK**, audit 0. Confirmé visuellement (captures 375/1280). **Point d'arrêt : nouvelle passe visuelle complète avant merge.** |
| 25/07/2026 | VIT-7 CORR. | **Correction critique d'architecture du tunnel d'achat** (l'audit VIT-2 s'était trompé : l'achat initial se fait SUR LA VITRINE, pas dans l'app). (1) Les 4 **Payment Links Stripe LIVE** (suffixes 9Zm0f/g/h/i, récupérés sur la branche héritée) centralisés dans `STRIPE_LINKS` + helper `stripeLink(plan,billing,campaign)` (UTM `vitrine`) ; les boutons de plan (home + `/tarifs`) pointent dessus, le toggle mensuel/annuel bascule chaque bouton sur le bon lien via `data-href-*` (vérifié Playwright : Constellation mensuel 9Zm0h → annuel 9Zm0i). L'helper `signupUrl()` vers `app/signup` **supprimé**. (2) CTA génériques « Essayer gratuitement » (nav, footer, sticky, hero, blog, features, segments, villes, etc.) → **section tarifs** ; tunnel = toute page → `/tarifs` → Stripe = **2 clics**. (3) **Claim faux corrigé partout** : « 0 carte requise » supprimé (l'essai Stripe demande la carte) → triple zéro devient « 0 engagement · 0 filtrage · 0 rendez-vous imposé » ; FAQ (home + tarifs) + CGV + comparatif reformulés « essai gratuit de 7 jours, sans engagement, annulable en un clic ». (4) **Prix annuels réels** actés : Étoile **468 €/an** (39 €/mois), Constellation **948 €/an** (79 €/mois) ; « 2 mois offerts »/« vous économisez 178 € » supprimés → badge **« -120 € par an »** + prix mensuel équivalent + total annuel ; schema `Offer` annuel ajouté. (5) E-E-A-T point 10 : auteur des articles = **Corentin Janin, cofondateur** (byline + bio + schema Person). (6) Garantie 30 jours conservée, formulation sobre (tarifs + rappel CTA final + CGV §5). (7) **Nouveau garde-fou `check:stripe`** : vérifie la présence des 4 liens LIVE exacts, des montants de référence (49/89/39/79/468/948, 7 jours) sur `/tarifs`, le double lien mensuel/annuel des boutons, la règle 2 clics sur chaque page, et l'absence de tout lien mort `app/signup`. Gate complet vert : lint:copy + check:brand + audit 0 + build **43 pages** + check:links **2876 + 0 orpheline** + check:schema **153** + **check:stripe OK** + **check:overflow OK (10 pages)**. **Point d'arrêt : passe superviseur avant merge.** |
| 25/07/2026 | VIT-8 | **Lot de clôture.** (1) **IndexNow** : clé générée, fichier de clé `public/indexnow-<clé>.txt` (nom = clé, contenu = clé, source de vérité unique) ; script `scripts/indexnow-ping.mjs` qui, à chaque déploiement de production, calcule les URL modifiées (`git diff HEAD~1 HEAD`, mapping fichier → URL, resoumission complète si changement global) et les POST à l'API IndexNow (Bing/Yandex…) ; branché via `vercel.json` (`buildCommand: astro build && (node scripts/indexnow-ping.mjs || true)`, jamais bloquant) ; garde-fou d'environnement (envoi réel seulement en prod, dry-run en local/preview) ; `npm run indexnow` pour tester. Doc `docs/INDEXNOW.md`. Conséquence : le post-scriptum Bing des emails d'articles devient obsolète (signal = présence de `public/indexnow*.txt`). (2) `sameAs` : TODO visible ajoutée dans `site.ts` (URL LinkedIn + societe.com à confirmer par Nicolas), non bloquant. Gate complet vert : lint:copy + check:brand + audit 0 + build **43 pages** + check:links **2876 + 0 orpheline** + check:schema **153** + check:stripe + check:overflow ; ping vérifié en dry-run (mapping fichier → URL correct, aucune loc `.xml` parasite). **PRD vitrine réellement clos.** |
| 25/07/2026 | VIT-8 +2 | Micro-ajouts avant merge : (1) `sameAs` confirmés par Nicolas (SIREN 921060737) → annuaire-entreprises.data.gouv.fr + pappers.fr (placeholders remplacés, pas de LinkedIn pour l'instant). (2) Accessibilité/SEO : les 2 `<img>` en `alt=""` (photo `hero-bistro` du mockup home signalée par Bing Live URL + vignette auteur du byline blog) reçoivent un alt descriptif ; nouveau garde-fou **`check:alt`** (échoue si une `<img>` du build n'a pas d'alt non vide) ajouté au gate. Gate complet vert : lint:copy + check:brand + audit 0 + build 43 + check:links 2876/0 + check:schema 153 + check:stripe + **check:alt (28 img)** + check:overflow. |

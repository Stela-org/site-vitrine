# site-vitrine — Site vitrine Stela

Site marketing de **Stela** (`www.mystela.fr`), construit en **Astro** (statique,
SEO/GEO first, contenu 100 % lisible sans JavaScript). Déployé sur **Vercel**.

## Développement
```bash
npm install
npm run dev        # serveur local
npm run build      # build statique -> dist/
npm run preview    # prévisualise dist/
npm run check      # GATE : lint:copy + check:brand + build
```

## Garde-fous (GATE)
- `npm run lint:copy` : 0 tiret cadratin (—) dans src/public/docs.
- `npm run check:brand` : 0 « Avistars » / codename à double L en surface.
- Contrôle manuel : aucun discours de review gating (filtrage des avis par la
  note, interception d'insatisfaits). La conformité Google est le positionnement.
- Contenu vérifié lisible sans JavaScript ; Lighthouse >= 95.
- `npm run check:overflow` : garde-fou anti-scroll horizontal (Playwright, 7 pages
  x 4 largeurs 320/375/768/1280, `scrollWidth <= innerWidth`). À lancer avant merge.
  Nécessite le navigateur : `npx playwright install chromium` (une fois).

## Architecture
- `src/config/site.ts` : source unique (marque, couleurs, URLs, prix, analytics).
- `src/layouts/Base.astro` : head (canonical, verifications Google, schema.org,
  Consent Mode v2), chrome (Nav, Footer, CookieBanner).
- `src/pages/` : pages. `public/` : assets, robots.txt, llms.txt, verification.
- `docs/` : AUDIT-VIT, PRD-VIT, CHARTE, URL-MAP.
- `legacy/` : ancien site Avistars, conservé pour le mapping 301 (VIT-4), non
  déployé. Sera supprimé au VIT-4.

## Déploiement (Vercel)
Projet `site-vitrine`, framework **Astro**, build `astro build`, output `dist`.
Domaine canonique : `https://www.mystela.fr`.

## Branches
- `main` : production (déployée par Vercel sur www.mystela.fr).
- `legacy-avistars` : snapshot de l'ancien site statique. Sert de source pour
  GitHub Pages / `avistars.fr` tant que le repointage DNS (VIT-4) n'est pas fait.
- `lot-vit-*` : lots de refonte en cours.

## Tracking
GA4 (propriété www.mystela.fr) + PostHog, avec Google Consent Mode v2 et bannière
minimale. Les identifiants se renseignent dans `ANALYTICS` (`src/config/site.ts`) ;
tant qu'ils sont vides, aucun script de mesure n'est chargé.

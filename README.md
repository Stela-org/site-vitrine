# site-vitrine — Site vitrine Stela

Site marketing de **Stela** (`www.mystela.fr`), construit en **Astro** (statique,
SEO/GEO first, contenu 100 % lisible sans JavaScript). Déployé sur **Vercel**.

## Développement
```bash
npm install
npm run dev        # serveur local
npm run build      # build statique -> dist/
npm run preview    # prévisualise dist/
npm run check      # GATE : les onze gardiens, du plus rapide au plus lent
```

## Garde-fous (GATE)
Les onze gardiens s'exécutent **automatiquement à chaque push et chaque pull
request** via `.github/workflows/gardiens.yml`. Le tableau « quel gardien couvre
quoi », le partage bloquant / alerte et la marche à suivre quand l'un échoue sont
dans **[`docs/GARDIENS.md`](docs/GARDIENS.md)**.

En local, `npm run check` lance la chaîne complète. Les trois gardiens navigateur
(`check:cookies`, `check:devis`, `check:overflow`) exigent le navigateur :
`npx playwright install chromium`, une fois.

Contrôles qui restent manuels :
- aucun discours de review gating (filtrage des avis par la note, interception
  d'insatisfaits). La conformité Google est le positionnement ;
- contenu lisible sans JavaScript ; Lighthouse >= 95.

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

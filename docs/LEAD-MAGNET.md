# LEAD-MAGNET.md : guide gratuit + double opt-in (VIT-7)

> Seul point de collecte d'emails du site. Landing `/guide-google-commercant-local`,
> fonctions serverless dans `api/`. Double opt-in RGPD sans stockage (jeton HMAC).

## Flux
1. `/guide-google-commercant-local` : formulaire (email + consentement + honeypot).
   Fonctionne **sans JS** (POST natif vers `/api/lead-subscribe`).
2. `api/lead-subscribe.js` : honeypot + validation email + consentement. Génère un
   **jeton HMAC** (email + horodatage signés), envoie un email de confirmation
   (Resend) avec un lien vers `api/lead-confirm`, puis redirige vers `/merci`.
3. `api/lead-confirm.js` : vérifie le jeton (signature + fenêtre 48 h,
   `timingSafeEqual`), envoie le guide (lien PDF) par email, redirige vers
   `/confirme`.

`/merci` et `/confirme` sont en **noindex** et hors sitemap.

## Variables d'environnement (à créer côté Vercel)
| Variable | Rôle |
|---|---|
| `LEAD_HMAC_SECRET` | Secret de signature du jeton double opt-in (chaîne aléatoire longue). **Obligatoire.** |
| `RESEND_API_KEY` | Clé API Resend pour l'envoi des emails. **Obligatoire.** |
| `LEAD_FROM` | Expéditeur, défaut `Stela <contact@mystela.fr>` (domaine à vérifier chez Resend). Optionnel. |
| `LEAD_GUIDE_URL` | URL du PDF envoyé. **Optionnel** : par défaut, le PDF servi en statique `https://www.mystela.fr/guides/guide-google-commercant-local.pdf` (généré par `npm run build:guide`). Ne définir que pour pointer un autre fichier. |

Seules **`LEAD_HMAC_SECRET` + `RESEND_API_KEY`** sont nécessaires : sans elles,
l'endpoint répond « Service non configuré » (aucune fuite, aucun envoi). Le PDF
est fourni par défaut, plus besoin de renseigner `LEAD_GUIDE_URL`.

## Le PDF du guide (VIT-8, post-clôture)
- Contenu source : `scripts/guide-google-commercant-local.html` (charte Stela,
  contenu original réorganisé à partir du guide et des piliers du site, auteur
  Corentin Janin).
- Génération : `npm run build:guide` (Playwright/chromium → `public/guides/guide-google-commercant-local.pdf`, 8 pages A4).
- Servi automatiquement à la racine statique → devient la valeur par défaut de `LEAD_GUIDE_URL`.
- Pour mettre à jour le guide : éditer le HTML source, relancer `npm run build:guide`, committer le PDF.

## À fournir / faire (Nicolas)
- **Le PDF** du guide, déposé (ex. `public/guide/…pdf`) ou hébergé, et
  `LEAD_GUIDE_URL` renseigné.
- **Domaine Resend** vérifié (SPF/DKIM) pour `contact@mystela.fr`.
- **Rate limit fort** : le honeypot + le consentement + la validation serveur
  filtrent l'essentiel, mais un rate limit par IP/email nécessite un store
  (Vercel KV ou Upstash Redis). À brancher dans `api/lead-subscribe.js` avant la
  mise en avant publicitaire.

## Déploiement
Les fonctions `api/*.js` sont des Serverless Functions Vercel (runtime Node),
déployées automatiquement en plus du site statique Astro. Vérifier après le
premier déploiement que `POST /api/lead-subscribe` répond (302 vers `/merci`).
La CSP autorise déjà ce POST (`form-action 'self'`).

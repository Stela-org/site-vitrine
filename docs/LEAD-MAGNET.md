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
| `LEAD_FROM` | Expéditeur, défaut `Stela <contact@mystela.fr>` (domaine à vérifier chez Resend). |
| `LEAD_GUIDE_URL` | URL publique du PDF du guide (fourni par Nicolas), défaut `…/guide/le-guide-google-du-commercant-local.pdf`. |

Sans `LEAD_HMAC_SECRET` + `RESEND_API_KEY`, l'endpoint répond « Service non
configuré » (aucune fuite, aucun envoi).

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

# LEAD-MAGNET.md : guide gratuit + simple opt-in (VIT-9)

> Seul point de collecte d'emails du site. Landing `/guide-google-commercant-local`,
> fonctions serverless dans `api/`, logique partagée dans `lib/leads.js`.
> **Simple opt-in** : une seule case de consentement obligatoire (non pré-cochée).

## Circuit complet
**Formulaire → guide + CRM → visible dans la console admin → campagnes.**

1. **Formulaire** (`src/pages/guide-google-commercant-local.astro`) : **prénom + email**
   + **une case de consentement obligatoire, non pré-cochée** :
   « Je souhaite recevoir le guide et les conseils Stela par email (désinscription en un clic). »
   Sans la case : ni envoi, ni lead. Fonctionne **sans JS** (POST natif). Honeypot anti-bot.
2. **`api/lead-subscribe.js`** (via `lib/leads.js`) :
   - honeypot + validation email + consentement + **rate limit** (par email et par IP) ;
   - **planifie la relance J+3 EN PREMIER** (email 2, `scheduled_at: "in 3 days"` côté Resend,
     aucun cron) pour récupérer son **id Resend**, puis **envoie le guide immédiatement**
     (email 1) dont le lien de désinscription **porte cet id** (signé HMAC) ;
   - **pousse le lead vers le CRM** : `POST https://app.mystela.fr/api/leads`,
     `Authorization: Bearer ${LEADS_INGEST_SECRET}` (env, jamais en dur),
     payload `{ email, first_name, source:"guide-google", marketing_consent:true, consented_at }`,
     **fire-and-forget + 1 retry** : un échec CRM ne bloque JAMAIS l'envoi du guide ;
   - redirige vers `/guide-google-commercant-local/merci` (noindex, hors sitemap).
3. **Console admin (app.mystela.fr)** : le lead apparaît dans le CRM, où il alimente les
   **campagnes** (segmentation, relances). La vitrine ne stocke rien en propre.
4. **Désinscription** (`api/lead-unsubscribe.js`) : lien signé **HMAC** présent dans chaque
   email → vérifie le jeton (email + id de relance, sans expiration) → **annule la relance
   J+3 encore en attente** (Resend `POST /emails/:id/cancel`, sans bruit si déjà partie) →
   `POST /api/leads` avec `marketing_consent:false` → page `/desinscrit`.
   Ainsi un lead désinscrit **ne reçoit jamais** la relance planifiée après coup.

## Les deux emails (charte Stela)
Gabarit unique dans `lib/leads.js` : fond crème, carte blanche, **bouton laiton**,
**logo image hébergée** (`/images/logo-monogramme-512.png`, jamais le glyphe étoile en texte),
pied légal + **lien de désinscription**. Salutation **au prénom** quand il existe
(« Bonjour Camille, »), neutre sinon.
- **Email 1 (immédiat)** : livraison du guide (PDF) + mini-pitch + CTA essai 7 jours.
- **Email 2 (J+3, planifié)** : relance douce orientée passage à l'action.

## Variables d'environnement (Vercel)
| Variable | Rôle |
|---|---|
| `LEAD_HMAC_SECRET` | Signature du jeton de **désinscription**. **Obligatoire.** |
| `RESEND_API_KEY` | Clé API Resend (envoi + planification J+3). **Obligatoire.** |
| `LEADS_INGEST_SECRET` | Secret partagé vitrine↔CRM (header `Authorization: Bearer`). Même valeur des deux côtés. **Requis pour alimenter le CRM** (sinon guide envoyé, lead non poussé). |
| `LEAD_FROM` | Expéditeur, défaut `Stela <contact@mystela.fr>`. Optionnel. |
| `LEAD_GUIDE_URL` | URL du PDF. Optionnel : par défaut le PDF statique `https://www.mystela.fr/guides/guide-google-commercant-local.pdf`. |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Store du **rate limit**. Optionnel mais **fortement recommandé avant toute mise en avant publicitaire** : sans lui, le rate limit se désactive (le formulaire n'est jamais bloqué). |

Sans `LEAD_HMAC_SECRET` + `RESEND_API_KEY`, l'endpoint répond « Service non configuré »
(aucune fuite, aucun envoi).

## Rate limit
`lib/leads.js` → `rateLimit(key)` via Upstash Redis REST (`INCR` + `EXPIRE NX`).
Fenêtres : **3 demandes / h par email**, **10 / h par IP**. Dépassement → page de succès
affichée sans envoi ni push (pas d'indice pour un attaquant). Si Upstash n'est pas
configuré, le garde-fou se désactive proprement (ne bloque jamais un vrai lead).

## Le PDF du guide
- Source : `scripts/guide-google-commercant-local.html` (charte Stela, contenu original,
  auteur Corentin Janin). **7 pages A4**, page de closing renforcée (offre + essai 7 jours).
- Génération : `npm run build:guide` (Playwright/chromium → `public/guides/...pdf`).
- Servi en statique → valeur par défaut de `LEAD_GUIDE_URL`. Pour mettre à jour :
  éditer le HTML, relancer `npm run build:guide`, committer le PDF.

## Annulation de la relance J+3 à la désinscription
Pour éviter qu'un lead désinscrit reçoive quand même la relance planifiée :
- l'id Resend de la relance est **capturé** (retour de `sendEmail`) puis **encodé signé**
  dans le lien de désinscription du guide (le jeton HMAC couvre email + id, non falsifiable).
  Il n'est **pas** transmis au CRM : seul le lien en a besoin ;
- à la désinscription, `api/lead-unsubscribe.js` appelle **`POST /emails/:id/cancel`** de
  Resend (endpoint officiel d'annulation d'un envoi planifié) **avant** de marquer le lead
  désinscrit. Si l'email est déjà parti, Resend renvoie une erreur → on continue sans bruit.

## Délivrabilité (arriver dans la boîte principale, pas dans Promotions)
- **Expéditeur** : « Corentin de Stela <contact@mystela.fr> » (une personne, pas une marque).
- **HTML minimal, façon personne à personne** : pas de carte, pas de bouton, pas de logo en
  tête ; texte court, 2 liens texte maximum (le PDF + un lien tarifs), aucun émoji, ton sobre,
  signature texte « Corentin, cofondateur de Stela », désinscription en une ligne discrète.
- **En-têtes de désinscription** sur les deux emails (via Resend `headers`) :
  `List-Unsubscribe: <url>` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058).
  L'endpoint `api/lead-unsubscribe.js` accepte le **POST One-Click** (répond 200) en plus du
  clic navigateur (GET → page `/desinscrit`).

## À fournir / faire (Nicolas)
- **`LEADS_INGEST_SECRET`** posé identique sur la vitrine ET l'app (le endpoint CRM
  `POST /api/leads` est prêt et validé côté superviseur).
- **Domaine Resend** vérifié (SPF/DKIM) pour `contact@mystela.fr`.
- **Upstash Redis** (URL + token) avant toute campagne publicitaire payante.

## Déploiement
Fonctions `api/*.js` = Serverless Functions Vercel (runtime Node), déployées avec le site
statique. `lib/leads.js` est bundlé automatiquement (hors `/api`, donc non routé).
La CSP autorise le POST (`form-action 'self'`). Après déploiement, vérifier que
`POST /api/lead-subscribe` répond 303 vers `/merci`.

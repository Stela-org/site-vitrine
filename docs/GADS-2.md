# LOT GADS-2 : Suivi avancé des conversions (enhanced conversions)

## Ce que ça fait

Les 3 conversions de la vitrine remontent à GA4, puis sont importées dans Google
Ads. Sans donnée d'identification, Google ne recolle pas un clic publicitaire et
une conversion différée (autre appareil, autre session, quelques jours plus
tard) : ces conversions sont perdues et l'algorithme d'enchères est moins bien
nourri.

Le lot joint à chaque conversion, **quand l'email est connu**, une **empreinte
SHA-256** de cet email. Aucun email en clair ne part vers Google, jamais.

| Page | Événement | Source de l'email |
|---|---|---|
| `/merci-essai` | `essai_demarre` | session Stripe Checkout, via `/api/checkout-email` |
| `/pour/multi-etablissements` | `demande_devis` | champ email du formulaire de devis |
| `/guide-google-commercant-local/merci` | `guide_telecharge` | champ email du formulaire du guide, reporté en `sessionStorage` |

Si l'email n'est pas disponible, **l'événement part sans**, jamais de valeur
inventée, jamais de valeur de repli.

## Ce qui n'a PAS changé

- Aucun tag `AW-` ajouté au site. Les conversions restent **importées depuis
  GA4** : c'est le bon montage, il ne change pas.
- Aucun nouveau tracker, aucune dépendance npm.
- Le mécanisme de consentement (file `window.stelaQueue`, Consent Mode v2,
  bannière) est **inchangé**. L'empreinte emprunte la même file que le reste :
  elle hérite donc de la même garantie, plutôt que d'ouvrir un second chemin où
  le consentement pourrait être oublié.

## Configuration manuelle requise (hors code)

### 0. ⚠️ GA4 : activer la collecte de données fournies par l'utilisateur

**C'est le réglage bloquant : sans lui, tout le reste du lot n'apporte
strictement rien.**

Constaté au banc d'essai (`npm run check:cookies`, réseau réel, CSP de
production) : la page calcule bien l'empreinte et la déclare correctement à
gtag, le `dataLayer` contient
`["set","user_data",{"sha256_email_address":"1ce20d…"}]`, mais **rien ne part
sur le réseau**. `window.google_tag_data.upd` est absent : gtag.js n'a pas
chargé son module de données utilisateur, et **ignore `user_data` en silence**,
sans erreur, sans avertissement. Le module n'est livré que si le réglage
ci-dessous est actif.

> GA4 → Admin → Paramètres des données → Collecte de données →
> **Collecte de données fournies par l'utilisateur** → activer.

Puis, dans Google Ads → Objectifs → Conversions → la conversion importée →
activer les **conversions avancées**.

Après activation, `npm run check:cookies` affiche « empreinte SHA-256 observée
sur le réseau, suivi avancé pleinement actif » au lieu de son avertissement.

### 1. Variable d'environnement Vercel

| Nom | Valeur | Portée |
|---|---|---|
| `STRIPE_SECRET_KEY` | clé secrète Stripe **live** (`sk_live_…`) | Production |

Une clé **restreinte** suffit et est préférable : seule la permission
**Checkout Sessions → lecture** est nécessaire.

### 2. success_url des 4 Payment Links Stripe

Dans le tableau de bord Stripe, pour **chacun** des 4 Payment Links (Étoile
mensuel/annuel, Constellation mensuel/annuel), régler la page de confirmation
sur :

```
https://www.mystela.fr/merci-essai?session_id={CHECKOUT_SESSION_ID}
```

`{CHECKOUT_SESSION_ID}` est un littéral : Stripe le remplace lui-même. Les
Payment Links concernés sont listés dans `src/config/site.ts`.

## Pourquoi l'empreinte est calculée côté serveur pour Stripe

L'exigence du lot est qu'aucun email en clair ne parte vers Google. Pour les deux
formulaires, la page détient la saisie : le hachage a lieu dans le navigateur
(`crypto.subtle`, `src/lib/track.ts`).

Pour Stripe, l'email est chez Stripe. Le renvoyer au navigateur pour l'y hacher
le ferait transiter en clair sur le réseau et vivre dans la mémoire de la page.
`/api/checkout-email` hache donc directement et ne renvoie **que** l'empreinte :
strictement plus protecteur, pour le même résultat côté Google.

## Diagnostiquer une conversion partie sans empreinte

Chaque `essai_demarre` porte un paramètre `ec_statut` à faible cardinalité, sans
aucune donnée personnelle. Sans lui, une conversion sans empreinte serait
indiscernable d'un suivi avancé qui sous-performe : on accuserait le dispositif
alors que la cause serait un délai ou une configuration absente.

| `ec_statut` | Signification | Action |
|---|---|---|
| `ok` | Empreinte obtenue, suivi avancé nominal | rien |
| `timeout` | `/api/checkout-email` n'a pas répondu en 4 s | vérifier la latence de la fonction et de l'API Stripe |
| `sans_session` | Pas de `?session_id` dans l'URL | la `success_url` des Payment Links n'est pas configurée (§2) |
| `api_vide` | L'API a répondu sans empreinte | `STRIPE_SECRET_KEY` absente, session non aboutie, ou email illisible |
| `erreur` | Appel en échec (réseau ou 5xx) | consulter les journaux de la fonction Vercel |

Dans GA4 : Explorations → dimension personnalisée `ec_statut` sur l'événement
`essai_demarre`. Une proportion notable de `timeout` ou `sans_session` est un
problème de **configuration**, jamais un problème de suivi avancé.

Attention si ce code évolue : `fetch` ne rejette **que** sur panne réseau, jamais
sur un statut 4xx/5xx. Le tri explicite `if (!r.ok) throw` est ce qui empêche une
API en erreur serveur d'être comptabilisée `api_vide`, donc confondue avec le cas
normal où Stripe n'a pas d'email.

## CSP : un domaine ajouté, un domaine volontairement refusé

Vérifié au banc d'essai, pas supposé. Deux domaines Google étaient bloqués par
la CSP de production ; le navigateur les refusait **en silence**, exactement
comme lors du lot FIX-CSP-GA4.

| Domaine | Directive | Décision |
|---|---|---|
| `https://stats.g.doubleclick.net` | `connect-src` | **Ajouté.** C'est le chemin de mesure inter-appareils (Google Signals) : celui qui permet de recoller un clic publicitaire et une conversion survenue plus tard sur un autre appareil, soit l'objet même de ce lot. Bloqué, il passait de `AUCUNE réponse` à `204` une fois autorisé. |
| `https://www.google.<tld>/ads/ga-audiences` | `img-src` | **Non ajouté, volontairement.** Il s'agit de constitution de listes de remarketing, pas de mesure de conversion : hors périmètre GADS-2. L'autoriser imposerait d'ouvrir `img-src` à toutes les extensions nationales de Google (`.fr`, `.com`, `.de`…), pour un gain nul sur les conversions. `check:cookies` continue de le signaler comme violation non bloquante. |

## Gardiens

- `npm run check:analytics` (dans `npm run check`), échoue si le hachage
  disparaît du bundle, si `sha256_email_address` n'est plus câblé, ou si un email
  en clair apparaît dans un appel de conversion.
- `npm run check:cookies` (Playwright, réseau réel, hors `npm run check`)
  preuve de bout en bout : sous la **CSP de production**, après acceptation, le
  hit `/g/collect` part, **aboutit en 2xx**, porte l'empreinte, et aucune requête
  Google ne contient d'email en clair.

## Vérification en production (GA4 DebugView)

1. Ouvrir `https://www.mystela.fr/guide-google-commercant-local?debug_mode=1`
   dans un navigateur où le consentement n'a pas encore été donné.
2. Saisir un email de test, valider le formulaire, arriver sur `/merci`.
3. Cliquer « Accepter » sur la bannière.
4. GA4 → Admin → **DebugView** : l'événement `guide_telecharge` doit apparaître.
5. Onglet Réseau : la requête `/g/collect` doit être en **2xx**, et la console ne
   doit afficher **aucune** violation `Content-Security-Policy`.
6. Google Ads → Objectifs → Conversions : la conversion importée doit afficher
   l'état des données d'identification après quelques jours de collecte.

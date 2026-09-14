// LOT PARRAIN-1 §A - le code de PARRAINAGE, côté vitrine.
//
// ══════════════════════════════════════════════════════════════════════════
// POURQUOI UN FICHIER À PART DE `src/lib/partner.ts`
// ══════════════════════════════════════════════════════════════════════════
// Les deux mécanismes partagent le paramètre d'URL `?p=` et le champ Stripe
// `client_reference_id`, et ils ne font pas la même chose : un PARTENAIRE est
// un contrat d'apport avec une commission, un PARRAIN est un client qui envoie
// un confrère. `lib/partners/*` est tenu par un autre lot ; il est LU ici, pas
// modifié.
//
// Ce qui les distingue sans ambiguïté, c'est le PRÉFIXE `ref_` : un code
// partenaire est un slug libre (`^[a-z0-9-]{2,32}$`, qui refuse le tiret bas),
// un code de parrainage huit caractères précédés de `ref_`. Le webhook lit le
// même champ et tranche sur ce préfixe.
//
// ══════════════════════════════════════════════════════════════════════════
// COOKIE, ET PAS `localStorage`
// ══════════════════════════════════════════════════════════════════════════
// Le partenaire vit en `localStorage` 90 jours. Le parrainage vit en COOKIE 30
// jours, comme le lot le demande - et ce n'est pas qu'une préférence : un
// cookie first-party voyage entre les sous-domaines du site, là où le
// `localStorage` est cloisonné par origine. Finalité strictement
// fonctionnelle (attribuer un parrainage), aucun tiers, aucune mesure
// d'audience : pas de bannière à demander pour celui-là.

export const REFERRAL_PARAM = "p";
export const REFERRAL_COOKIE = "stela-referral";
export const REFERRAL_PREFIX = "ref_";
/** Trente jours, en secondes. */
export const REFERRAL_TTL_S = 30 * 24 * 60 * 60;
/** Alphabet sans ambiguïté (pas de 0/O ni 1/I/l), huit caractères. */
export const REFERRAL_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

/**
 * Valide un code brut (sans préfixe). REJETTE plutôt que RÉPARE : un code
 * « réparé » serait valide mais DIFFÉRENT de celui du parrain, et créditerait
 * quelqu'un d'autre. Un lien mal recopié ne doit rien faire, visiblement.
 */
export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return REFERRAL_RE.test(code) ? code : null;
}

/** Le code porté par une query string (« ?p=ref_ABCD2345 »), sinon null. */
export function referralCodeFromSearch(search: string): string | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }
  const raw = params.get(REFERRAL_PARAM);
  if (typeof raw !== "string" || !raw.trim().toLowerCase().startsWith(REFERRAL_PREFIX)) return null;
  return normalizeReferralCode(raw.trim().slice(REFERRAL_PREFIX.length));
}

/** La valeur envoyée à Stripe : le code, préfixé, pour que le webhook tranche. */
export function toClientReference(code: string): string {
  return `${REFERRAL_PREFIX}${code}`;
}

/**
 * Ajoute le code à une URL Stripe. Les paramètres existants sont conservés.
 *
 * ATTENTION : UN `client_reference_id` DÉJÀ POSÉ N'EST JAMAIS ÉCRASÉ, contrairement à
 * `decorateStripeUrl` du partenaire. C'est la règle de priorité entre les deux
 * mécanismes, et elle va dans un seul sens : un PARTENAIRE est un contrat
 * d'apport avec une commission due ; un parrainage est un cadeau. Si les deux
 * s'appliquent, le contrat gagne. Sans cette règle, l'ordre d'exécution de
 * deux écouteurs déciderait qui est payé.
 */
export function decorateStripeUrl(href: string, code: string | null): string {
  const valid = normalizeReferralCode(code);
  if (!valid) return href;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  if (url.hostname !== "buy.stripe.com") return href;
  if (url.searchParams.get("client_reference_id")) return href;
  url.searchParams.set("client_reference_id", toClientReference(valid));
  return url.toString();
}

/** Écrit le cookie 30 jours. `SameSite=Lax` : le retour depuis Stripe le garde. */
export function writeReferralCookie(code: string, doc: { cookie: string } = document): void {
  const valid = normalizeReferralCode(code);
  if (!valid) return;
  try {
    doc.cookie = `${REFERRAL_COOKIE}=${valid}; Max-Age=${REFERRAL_TTL_S}; Path=/; SameSite=Lax`;
  } catch {
    /* cookies refusés : l'achat reste possible, sans parrainage */
  }
}

/** Lit le code du cookie, ou null. PURE sur la chaîne, donc testable. */
export function referralCodeFromCookie(cookieString: string): string | null {
  for (const part of (cookieString ?? "").split(";")) {
    const [name, ...rest] = part.split("=");
    if (name.trim() === REFERRAL_COOKIE) return normalizeReferralCode(rest.join("="));
  }
  return null;
}

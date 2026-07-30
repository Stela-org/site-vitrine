// Code partenaire (LOT PARTNER-1v). Un partenaire diffuse une URL du site avec
// ?p=SONCODE : le code est mémorisé 90 jours en localStorage (last-touch), puis
// ajouté à l'URL Stripe AU MOMENT DU CLIC sur un bouton d'achat.
//
// Deux choix structurants :
//  - le HTML statique n'est JAMAIS réécrit : les Payment Links restent nus dans
//    le markup, la décoration se fait au clic. Sans JavaScript, le lien marche
//    normalement (sans code) : aucune régression du tunnel d'achat.
//  - localStorage first-party à finalité strictement fonctionnelle (attribution
//    d'un apporteur), pas de mesure d'audience, pas de tiers, pas de bannière.
//
// Ce fichier ne contient QUE de la logique pure + un accès localStorage : il est
// importé à la fois par le script du site et par le check du gate (Node lit le
// TypeScript directement, cf. scripts/check-partner.mjs).

/** Clé de stockage du code partenaire. */
export const PARTNER_KEY = "stela-partner";
/** Paramètre d'URL diffusé par les partenaires. */
export const PARTNER_PARAM = "p";
/** Paramètre attendu par Stripe (remonte dans la session Checkout). */
export const STRIPE_PARAM = "client_reference_id";
/** Durée de validité du code : 90 jours, en millisecondes. */
export const PARTNER_TTL_MS = 90 * 24 * 60 * 60 * 1000;
/** Format accepté : slug de 2 à 32 caractères, minuscules, chiffres, tirets. */
export const PARTNER_RE = /^[a-z0-9-]{2,32}$/;

/**
 * Valide et normalise un code brut. Insensible à la casse (« ClubPro » vaut
 * « clubpro »), espaces de bord ignorés. Tout ce qui sort du format est REJETÉ
 * (retourne null) : jamais de code tronqué ni « réparé », pour qu'un lien mal
 * diffusé se voie plutôt que de créer une attribution fantôme.
 */
export function normalizePartnerCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toLowerCase();
  return PARTNER_RE.test(code) ? code : null;
}

/** Extrait un code valide d'une query string (« ?p=clubpro »), sinon null. */
export function partnerCodeFromSearch(search: string): string | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }
  return normalizePartnerCode(params.get(PARTNER_PARAM));
}

/**
 * Ajoute le code à une URL Stripe. Les paramètres existants (utm_*) sont
 * conservés ; un client_reference_id déjà présent est écrasé. Une URL qui n'est
 * pas un Payment Link Stripe revient inchangée.
 */
export function decorateStripeUrl(href: string, code: string | null): string {
  const valid = normalizePartnerCode(code);
  if (!valid) return href;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  if (url.hostname !== "buy.stripe.com") return href;
  url.searchParams.set(STRIPE_PARAM, valid);
  return url.toString();
}

type StoredPartner = { code: string; ts: number };

/** Mémorise un code (last-touch : un nouveau code remplace l'ancien). */
export function writePartnerCode(code: string, now: number = Date.now()): void {
  const valid = normalizePartnerCode(code);
  if (!valid) return;
  const payload: StoredPartner = { code: valid, ts: now };
  try {
    localStorage.setItem(PARTNER_KEY, JSON.stringify(payload));
  } catch {
    /* stockage indisponible (Safari privé) : l'achat reste possible, sans code */
  }
}

/** Décode une valeur stockée : null si illisible, invalide ou périmée. */
export function parseStoredPartner(raw: string | null, now: number = Date.now()): string | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const { code, ts } = data as Partial<StoredPartner>;
  if (typeof ts !== "number" || !Number.isFinite(ts)) return null;
  if (now - ts > PARTNER_TTL_MS || now < ts - 60000) return null; // périmé, ou horloge incohérente
  return normalizePartnerCode(code);
}

/** Lit le code mémorisé encore valide, sinon null (et purge ce qui est périmé). */
export function readPartnerCode(now: number = Date.now()): string | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PARTNER_KEY);
  } catch {
    return null;
  }
  const code = parseStoredPartner(raw, now);
  if (!code && raw) {
    try {
      localStorage.removeItem(PARTNER_KEY);
    } catch {
      /* rien à faire */
    }
  }
  return code;
}

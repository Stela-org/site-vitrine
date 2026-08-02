// Module client partagé (bundlé par Astro, servi en 'self' : CSP stricte OK).
// Deux responsabilités, et rien d'autre :
//  1. lire / écrire / effacer le choix de consentement (localStorage + cookie
//     first-party de repli, 6 mois) ;
//  2. offrir `track()` aux pages, SANS jamais charger quoi que ce soit.
//
// Règle du lot GADS-1 : aucune requête vers un domaine Google tant que le
// visiteur n'a pas accepté. `track()` ne connaît donc pas gtag : il empile dans
// une file portée par window, et c'est la bannière (CookieBanner.astro) qui
// branche `window.stelaSend` APRÈS acceptation, puis vide la file. En cas de
// refus, la bannière branche un `stelaSend` neutre : la file est jetée, plus
// rien ne s'accumule.
//
// Ajout du lot GADS-2 : le suivi avancé des conversions. Quand la page connaît
// l'email du visiteur, on en joint l'empreinte SHA-256 à la conversion pour que
// Google puisse recoller un clic publicitaire et une conversion différée. Le
// hachage se fait ici, dans le navigateur ; l'email en clair ne part jamais.
// L'empreinte emprunte la MÊME file que le reste : pas de second canal, donc pas
// de second endroit où le consentement pourrait être oublié.

export type TrackParams = Record<string, unknown>;

type StelaWindow = Window & {
  stelaSend?: (name: string, params?: TrackParams) => void;
  stelaQueue?: Array<[string, TrackParams]>;
};

/**
 * LOT GADS-2, clé RÉSERVÉE transportant l'empreinte SHA-256 de l'email dans les
 * paramètres d'un événement. Ce n'est PAS un paramètre d'événement GA4 : la
 * bannière la retire des paramètres et la traduit en `gtag("set", "user_data",
 * { sha256_email_address })` juste avant d'émettre l'événement.
 *
 * Pourquoi passer par les paramètres plutôt que par un canal à part : la file
 * d'attente `window.stelaQueue` est le SEUL chemin qui garantit qu'aucune donnée
 * ne part avant le consentement. Faire voyager l'empreinte dans cette même file,
 * c'est hériter de cette garantie sans la réécrire. En cas de refus, la file est
 * jetée : l'empreinte l'est avec.
 */
export const EMAIL_HASH_KEY = "__stela_email_sha256";

/** Clé de report de l'empreinte d'une page à la suivante (même onglet). */
const EMAIL_HASH_STASH = "stela-uid";

/**
 * Normalisation Google avant hachage : minuscules et espaces retirés.
 * Retourne "" si l'entrée ne ressemble pas à une adresse email, on préfère ne
 * RIEN envoyer plutôt qu'envoyer l'empreinte d'une saisie incomplète, qui ne
 * correspondrait à aucun compte Google et polluerait la mesure.
 */
export function normalizeEmail(raw: string): string {
  const v = String(raw || "").replace(/\s+/g, "").toLowerCase();
  return /^[^@]+@[^@]+\.[^@]+$/.test(v) ? v : "";
}

/**
 * SHA-256 de l'email normalisé, en hexadécimal minuscule, le format attendu par
 * `sha256_email_address`. Le hachage a lieu ICI, dans le navigateur (Web Crypto),
 * AVANT tout envoi : l'email en clair ne quitte jamais la page.
 *
 * Retourne null si l'email est invalide ou si Web Crypto est indisponible
 * (`crypto.subtle` n'existe qu'en contexte sécurisé : absent en http:// nu). Un
 * null fait partir l'événement SANS donnée d'identification, jamais avec une
 * valeur de repli inventée.
 */
export async function hashEmail(raw: string): Promise<string | null> {
  const email = normalizeEmail(raw);
  if (!email) return null;
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null; // contexte non sécurisé : on part sans, jamais avec un faux.
  }
}

/** Empreinte valide ? 64 caractères hexadécimaux, et rien d'autre. */
export function isEmailHash(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
}

/**
 * Met l'empreinte de côté pour la page SUIVANTE du même onglet. Cas d'usage : le
 * formulaire est sur une page et la conversion se mesure sur la page de merci
 * qui suit la redirection. On stocke l'EMPREINTE, jamais l'email, et jamais dans
 * l'URL (qui fuirait dans le Referer et les journaux serveur).
 */
export function stashEmailHash(hash: string | null): void {
  if (!isEmailHash(hash)) return;
  try {
    sessionStorage.setItem(EMAIL_HASH_STASH, hash);
  } catch {
    /* stockage indisponible : la conversion partira sans empreinte */
  }
}

/** Relit l'empreinte mise de côté ET l'efface : elle ne sert qu'une fois. */
export function takeEmailHash(): string | null {
  try {
    const v = sessionStorage.getItem(EMAIL_HASH_STASH);
    sessionStorage.removeItem(EMAIL_HASH_STASH);
    return isEmailHash(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Signale une conversion en y joignant l'empreinte de l'email quand elle existe.
 * `hash` à null (email absent, invalide, ou Web Crypto indisponible) : l'événement
 * part quand même, simplement sans donnée d'identification.
 */
export function trackWithEmailHash(name: string, hash: string | null, params: TrackParams = {}): void {
  track(name, isEmailHash(hash) ? { ...params, [EMAIL_HASH_KEY]: hash } : params);
}

/** Clé du choix de consentement (localStorage). */
export const CONSENT_KEY = "stela-consent";
/** Cookie first-party de repli (Safari privé bloque localStorage). */
export const CONSENT_COOKIE = "stela_consent";
/** 6 mois, en secondes. */
export const CONSENT_MAX_AGE = 15552000;

/** "granted" | "denied" | null (aucun choix exprimé). */
export function readConsent(): string | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v) return v;
  } catch {
    /* Safari privé : on retombe sur le cookie */
  }
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function writeConsent(value: string): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* Safari privé */
  }
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax`;
}

/** Retrait du consentement : le choix est oublié, la bannière reviendra. */
export function clearConsent(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* Safari privé */
  }
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * Signale un événement de conversion. Ne charge rien, ne bloque rien.
 * Avant consentement : mis en file. Après refus : ignoré définitivement.
 */
export function track(name: string, params: TrackParams = {}): void {
  const w = window as StelaWindow;
  if (w.stelaSend) {
    w.stelaSend(name, params);
    return;
  }
  (w.stelaQueue = w.stelaQueue || []).push([name, params]);
}

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

export type TrackParams = Record<string, unknown>;

type StelaWindow = Window & {
  stelaSend?: (name: string, params?: TrackParams) => void;
  stelaQueue?: Array<[string, TrackParams]>;
};

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

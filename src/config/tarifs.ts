// LOT PRIX-1 : LA GRILLE TARIFAIRE, DANS UN MODULE SANS AUCUNE DÉPENDANCE.
//
// POURQUOI CE FICHIER EXISTE, ALORS QUE `site.ts` LE RÉ-EXPORTE.
// Le gardien `check:stripe` doit LIRE ces valeurs au lieu de les recopier :
// un gardien qui duplique ce qu'il surveille finit par défendre la version
// d'avant, et c'est exactement ce qui a failli arriver au changement de grille
// (il vérifiait que le build contenait les liens 49 €, désactivés depuis).
//
// Or il s'exécute dans Node nu, qui lit le TypeScript mais résout les imports
// en ESM strict : `site.ts` importe `../lib/sameAs` sans extension, et Node
// refuse. D'où ce module SANS LE MOINDRE IMPORT. Ne lui en ajoutez jamais un :
// le gardien du tunnel d'achat cesserait de pouvoir le charger.
//
// Toutes les pages continuent d'importer depuis `site.ts`, qui ré-exporte.

export const STRIPE_LINKS = {
  // LOT PRIX-1 : nouveaux liens Étoile (29 € / 228 €), créés en Live le
  // 14/09/2026. Les anciens (…9Zm0f / …9Zm0g, 49 € / 468 €) sont passés
  // `active: false` dans Stripe : plus personne ne peut s'y abonner, et les
  // abonnés d'avant restent sur leur prix. Ne pas les remettre ici.
  etoile: {
    monthly: "https://buy.stripe.com/9B6bJ14qE5WBb9namC9Zm0j",
    yearly: "https://buy.stripe.com/fZudR97CQ5WBdhvcuK9Zm0k",
  },
  // Constellation : INCHANGÉE, liens et prix. Interdit du lot.
  constellation: {
    monthly: "https://buy.stripe.com/6oUfZh3mA84J6T72Ua9Zm0h",
    yearly: "https://buy.stripe.com/28E5kD8GU84Jdhv9iy9Zm0i",
  },
  // Polaire n'a PAS d'annuel, et l'absence de clé le dit au COMPILATEUR :
  // `stripeLink("polaire", "yearly")` ne compile pas. Ce n'est pas un oubli de
  // configuration, c'est la décision produit : l'accompagnement démarre le jour
  // de la souscription et se juge au mois. Le lien est aussi SANS ESSAI, à la
  // différence des quatre autres : on ne donne pas sept jours de temps humain.
  polaire: {
    monthly: "https://buy.stripe.com/28E8wP7CQ84J3GVbqG9Zm0l",
  },
} as const;

export type PlanId = keyof typeof STRIPE_LINKS;
export type Billing = "monthly" | "yearly";

// Lien de paiement d'un plan pour une période, avec UTM (les Payment Links
// Stripe conservent les paramètres ?utm_*). NB : pas de ?prefilled_email ici,
// la vitrine ne capte aucun email avant le checkout (double opt-in guide à part).
// Le second paramètre est typé PAR PLAN (`keyof (typeof STRIPE_LINKS)[P]`) et
// non par le type `Billing` global : c'est ce qui fait que
// `stripeLink("polaire", "yearly")` est une ERREUR DE COMPILATION et non un
// `undefined` qui se transformerait, à l'exécution, en une URL
// « undefined?utm_source=vitrine » menant à une page 404 de Stripe. Un lien de
// paiement mort est la panne la plus chère d'une vitrine : elle ne se voit
// nulle part, sauf dans le chiffre d'affaires.
export function stripeLink<P extends PlanId>(
  plan: P,
  billing: keyof (typeof STRIPE_LINKS)[P],
  campaign = "site",
): string {
  const p = new URLSearchParams();
  p.set("utm_source", "vitrine");
  p.set("utm_campaign", campaign);
  return `${STRIPE_LINKS[plan][billing]}?${p.toString()}`;
}

// Tunnel « 2 clics » : toute page → section Tarifs → Stripe Checkout. Les CTA
// génériques (« Essayer gratuitement ») pointent ICI, jamais vers un lien de
// plan direct (le choix du plan EST l'entrée de l'essai).

// Offres, source de vérité : montants RÉELS vérifiés dans Stripe (décision actée).
// Mensuel : Étoile 29 €, Constellation 89 €, Polaire 139 €. Annuel : Étoile
// 228 €/an (19 €/mois), Constellation 948 €/an (79 €/mois) → 120 € d'économie/an
// dans les deux cas. Polaire n'a pas d'annuel.
// L'achat se fait sur la vitrine (STRIPE_LINKS). Le gate check:stripe verrouille
// ces montants ET vérifie que chaque lien répond : un changement Stripe force une
// mise à jour consciente de la vitrine plutôt qu'une panne silencieuse.
//
// LOT PRIX-1 : Étoile passe de 49 € à 29 € (19 € en annuel). Elle devient une
// offre d'appel assumée. Les quatre bénéfices sont réécrits pour ça : ils disent
// ce que le gérant OBTIENT, jamais ce que l'outil fait.
export const PLANS = [
  {
    id: "etoile",
    name: "Étoile",
    monthly: 29,
    yearlyPerMonth: 19, // 228 €/an
    yearlyTotal: 228,
    yearlySave: 120, // 12 x 29 - 228
    tagline: "Récoltez plus d'avis Google et répondez sans effort.",
    features: [
      "Plus d'avis Google, sans jamais trier vos clients",
      "Vos réponses écrites en 10 secondes",
      "Un client déçu ? On le rattrape avant qu'il parte",
      "Votre note face à vos trois voisins",
      "Vos QR codes et affichettes prêts à imprimer",
    ],
  },
  {
    id: "constellation",
    name: "Constellation",
    monthly: 89,
    yearlyPerMonth: 79, // 948 €/an
    yearlyTotal: 948,
    yearlySave: 120, // 12 x 89 - 948
    tagline: "Soyez vu partout et faites revenir vos clients.",
    features: [
      "Tout ce qu'il y a dans Étoile, et en plus :",
      "Vos avis Google, TripAdvisor et TheFork au même endroit",
      "Vous apparaissez dans ChatGPT et les autres IA",
      "Toutes vos réservations réunies au même endroit",
      "Se relie à votre caisse (Square, Zelty, TheFork) pour mesurer ce que ça rapporte",
      "Des SMS et WhatsApp pour faire revenir vos clients",
    ],
    highlight: true,
  },
  {
    // LOT PRIX-1 : l'offre d'accompagnement. Elle vend peu, et ce n'est pas un
    // défaut : elle rend le 89 € évident. Ce qu'elle ajoute n'est pas un droit
    // logiciel (l'accès est celui de Constellation) mais du temps humain, et
    // les quatre bénéfices le disent en résultat, jamais en tâche.
    id: "polaire",
    name: "Polaire",
    eyebrow: "L'étoile qui guide",
    monthly: 139,
    // `null` et non 0 : il n'y a PAS d'annuel. Un 0 se lirait « gratuit ».
    yearlyPerMonth: null,
    yearlyTotal: null,
    yearlySave: null,
    noTrial: true,
    tagline: "L'étoile qui guide : Corentin s'occupe de votre fiche et de votre configuration.",
    features: [
      "Votre fiche Google configurée pour vous dès le premier jour",
      "Vos photos et vos actualités publiées chaque semaine",
      "Un point de 20 minutes par mois sur vos chiffres",
      "Tout Constellation, sans rien à faire",
    ],
    highlight: false,
  },
] as const;

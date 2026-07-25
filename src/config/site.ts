// Source unique de configuration du site vitrine Stela.
// Marque, couleurs, URLs, prix : tout dérive d'ici, jamais en dur dans les pages
// (cohérence + changement en 1 endroit). Aligné sur stella-app/config/brand.ts.

export const SITE = {
  brand: "Stela", // UN SEUL L en surface. Le nom à deux L reste un codename interne.
  tagline: "Vos avis, vos étoiles.",
  positioning:
    "Le moteur de croissance Google clé-en-main et 100 % conforme des commerces locaux.",

  // Domaine canonique unique.
  url: "https://www.mystela.fr",
  // Application (accès des clients déjà inscrits). L'ACHAT initial ne passe PAS
  // par ici : il se fait SUR LA VITRINE via les Payment Links Stripe (voir
  // STRIPE_LINKS). Flux réel : bouton de plan → Stripe Checkout (essai 7 jours)
  // → webhook → email de première connexion → création des identifiants → wizard.
  appUrl: "https://app.mystela.fr",

  email: "contact@mystela.fr",

  // Profils officiels (schema.org sameAs), confirmés par Nicolas (SIREN 921060737).
  // Pas de page LinkedIn entreprise pour l'instant : à ajouter ici le jour venu.
  sameAs: [
    "https://annuaire-entreprises.data.gouv.fr/entreprise/921060737",
    "https://www.pappers.fr/entreprise/921060737",
  ],

  // Vérifications Google Search Console : le FICHIER (public/google...html) ET
  // la balise meta ci-dessous sont conservés tous les deux (VIT-0 décision 10).
  googleSiteVerification: "_riHssD6JYmAWnuKsHPJfztC6RASpMns50XERQ7LObo",
} as const;

// Essai : durée réelle demandée au checkout Stripe. Affichée partout (« essai
// gratuit de 7 jours »). La carte EST demandée au checkout (essai Stripe) : ne
// jamais promettre « sans carte » (voir corrections VIT-7).
export const TRIAL_DAYS = 7;

// Payment Links Stripe LIVE : SOURCE DE VÉRITÉ du tunnel d'achat.
// (branche héritée « legacy », ancien index.html : ETOILE/CONST × MONTH/YEAR).
// L'achat se fait SUR LA VITRINE : bouton de plan → ces liens → Stripe Checkout.
// NE JAMAIS les remplacer par un lien vers l'app : ce sont les liens LIVE actifs.
// Les 4 suffixes exacts (…9Zm0f/g/h/i) sont vérifiés par le gate check:stripe.
export const STRIPE_LINKS = {
  etoile: {
    monthly: "https://buy.stripe.com/4gM6oH9KY4Sx2CRdyO9Zm0f",
    yearly: "https://buy.stripe.com/3cI00j2iw0Ch91f0M29Zm0g",
  },
  constellation: {
    monthly: "https://buy.stripe.com/6oUfZh3mA84J6T72Ua9Zm0h",
    yearly: "https://buy.stripe.com/28E5kD8GU84Jdhv9iy9Zm0i",
  },
} as const;

export type PlanId = "etoile" | "constellation";
export type Billing = "monthly" | "yearly";

// Lien de paiement d'un plan pour une période, avec UTM (les Payment Links
// Stripe conservent les paramètres ?utm_*). NB : pas de ?prefilled_email ici,
// la vitrine ne capte aucun email avant le checkout (double opt-in guide à part).
export function stripeLink(plan: PlanId, billing: Billing, campaign = "site"): string {
  const p = new URLSearchParams();
  p.set("utm_source", "vitrine");
  p.set("utm_campaign", campaign);
  return `${STRIPE_LINKS[plan][billing]}?${p.toString()}`;
}

// Tunnel « 2 clics » : toute page → section Tarifs → Stripe Checkout. Les CTA
// génériques (« Essayer gratuitement ») pointent ICI, jamais vers un lien de
// plan direct (le choix du plan EST l'entrée de l'essai).
export const TARIFS_URL = "/tarifs";

// Tracking (VIT-0 décision 4) : PostHog + GA4 (nouvelle propriété), avec Google
// Consent Mode v2 (défaut « denied ») et bannière minimale. L'ancien GA
// G-WK8JTW04WF est SUPPRIMÉ. Les identifiants ci-dessous sont à renseigner quand
// les propriétés seront créées : tant qu'ils sont vides, aucun script de mesure
// n'est chargé (aucun tracker mort, aucune bannière inutile).
export const ANALYTICS = {
  ga4Id: "G-V320LSDY9Q", // flux « Vitrine Stela », www.mystela.fr
  posthogKey: "", // pas de clé au lancement (GA4 seul)
  posthogHost: "https://eu.i.posthog.com",
} as const;

export const analyticsEnabled = () => Boolean(ANALYTICS.ga4Id || ANALYTICS.posthogKey);

// Charte (source : stella-app/docs/design/stela/). Décision VIT-0 n°7 :
// #B08A3E = étoile / logo (INTOUCHABLE), #C8992E = accent or secondaire.
export const COLORS = {
  ink: "#15233F", // bleu encre (texte, logo)
  inkDeep: "#1D3158",
  brass: "#B08A3E", // étoile / logo, intouchable
  gold: "#C8992E", // accent or secondaire
  cream: "#F7F4EF", // fond crème
  surface: "#FFFFFF",
  border: "#ECE6DC",
  textSecondary: "#4A5568",
  textMuted: "#6C6558",
} as const;

// Offres, source de vérité : montants RÉELS vérifiés dans Stripe (décision actée).
// Mensuel : Étoile 49 €, Constellation 89 €. Annuel : Étoile 468 €/an (39 €/mois),
// Constellation 948 €/an (79 €/mois) → dans les deux cas 120 € d'économie/an.
// L'achat se fait sur la vitrine (STRIPE_LINKS). Le gate check:stripe verrouille
// ces montants : un changement Stripe force une mise à jour consciente de la vitrine.
export const PLANS = [
  {
    id: "etoile",
    name: "Étoile",
    monthly: 49,
    yearlyPerMonth: 39, // 468 €/an
    yearlyTotal: 468,
    yearlySave: 120, // 12 x 49 - 468
    tagline: "L'essentiel pour collecter et répondre, en toute conformité.",
    features: [
      "Collecte d'avis Google conforme (aucun filtre sur la note)",
      "Réponses assistées par IA",
      "Récupération client automatisée",
      "Tableau de bord et QR codes fournis",
    ],
  },
  {
    id: "constellation",
    name: "Constellation",
    monthly: 89,
    yearlyPerMonth: 79, // 948 €/an
    yearlyTotal: 948,
    yearlySave: 120, // 12 x 89 - 948
    tagline: "Toute la croissance locale, multi-plateformes et multi-canal.",
    features: [
      "Tout Étoile, plus :",
      "Avis multi-plateformes",
      "Visibilité IA (GEO) et réservation",
      "SMS et WhatsApp, analyse des retours, insights",
      "Roue cadeau 100 % conforme (le lot après l'avis)",
    ],
    highlight: true,
  },
] as const;

export const NAV_LINKS = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/#conformite", label: "Conformité" },
] as const;

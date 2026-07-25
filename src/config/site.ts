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
  // Application (parcours d'inscription et d'achat 100 % self-serve dans l'app).
  // NB (VIT-1) : stella-app n'expose pas encore de route publique « /signup »
  // dédiée ; la racine route l'utilisateur vers la connexion / l'onboarding.
  // Le jour où une route d'inscription dédiée existe, changer cette seule ligne.
  appUrl: "https://app.mystela.fr",

  email: "contact@mystela.fr",

  // Vérifications Google Search Console : le FICHIER (public/google...html) ET
  // la balise meta ci-dessous sont conservés tous les deux (VIT-0 décision 10).
  googleSiteVerification: "_riHssD6JYmAWnuKsHPJfztC6RASpMns50XERQ7LObo",
} as const;

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

// Offres, source de vérité : stella-app (Étoile 49 €, Constellation 89 €,
// annuel = 2 mois offerts). Prix AFFICHÉS ici ; l'achat se fait dans l'app.
export const PLANS = [
  {
    id: "etoile",
    name: "Étoile",
    monthly: 49,
    yearlyPerMonth: 41, // 490 €/an ≈ 2 mois offerts
    yearlySave: 98, // 12 x 49 - 490
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
    yearlyPerMonth: 74, // 890 €/an ≈ 2 mois offerts
    yearlySave: 178, // 12 x 89 - 890
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

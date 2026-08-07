// Source unique de configuration du site vitrine Stela.
// Marque, couleurs, URLs, prix : tout dérive d'ici, jamais en dur dans les pages
// (cohérence + changement en 1 endroit). Aligné sur stella-app/config/brand.ts.

export const SITE = {
  brand: "Stela", // UN SEUL L en surface. Le nom à deux L reste un codename interne.
  tagline: "Vos avis, vos étoiles.",
  positioning:
    "Le moteur de croissance Google clé-en-main et 100 % conforme des commerces locaux.",

  // LOT SEO-GEO-1 §A1 : la phrase EXTRACTIBLE, distincte du positionnement.
  //
  // Le positionnement ci-dessus vend : il est écrit pour un lecteur qu'on veut
  // convaincre. Celle-ci est écrite pour être CITÉE par un moteur de réponse,
  // hors de son contexte, à quelqu'un qui n'a jamais entendu parler de nous.
  // Trois exigences qui n'ont rien à voir avec du marketing :
  //   1. elle nomme la CATÉGORIE (« un logiciel de gestion des avis clients »),
  //      sans quoi un modèle ne sait pas dans quelle réponse nous ranger ;
  //   2. elle reste VRAIE isolée, donc pas de superlatif ni de promesse de
  //      résultat, qu'une citation sortie du contexte transformerait en
  //      affirmation invérifiable ;
  //   3. elle porte le seul point qui nous distingue vraiment et qui se
  //      vérifie : nous ne filtrons pas les avis selon la note.
  //
  // Elle vit en HTML RÉEL sur la page d'accueil (les moteurs de réponse ne
  // lisent pas tous llms.txt, et beaucoup ignorent le JSON-LD seul), et la même
  // chaîne alimente le JSON-LD et llms.txt : trois surfaces, une seule phrase,
  // impossible à faire diverger.
  definition:
    "Stela est un logiciel français de gestion des avis clients pour les commerces locaux : il invite chaque client à laisser un avis Google après sa visite, y répond en quelques secondes grâce à l'IA, et aide le commerçant à reconquérir les clients mécontents.",

  // Domaine canonique unique.
  url: "https://www.mystela.fr",
  // Application (accès des clients déjà inscrits). L'ACHAT initial ne passe PAS
  // par ici : il se fait SUR LA VITRINE via les Payment Links Stripe (voir
  // STRIPE_LINKS). Flux réel : bouton de plan → Stripe Checkout (essai 7 jours)
  // → webhook → email de première connexion → création des identifiants → wizard.
  appUrl: "https://app.mystela.fr",

  email: "contact@mystela.fr",

  // Prise de rendez-vous (CTA secondaire des blocs de closing). rel="noopener".
  calendarUrl: "https://calendar.app.google/hchodXwU2y3PhpeW8",

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

// Porte d'entrée du client DÉJÀ inscrit (lien « Se connecter » de la nav).
// Dérivée de SITE.appUrl : la vitrine ne connaît qu'un seul domaine d'app.
// La route est bien /login (groupe Next `app/(auth)/login`, dont les
// parenthèses ne paraissent pas dans l'URL), et surtout PAS /signup : l'achat
// se fait sur la vitrine via les Payment Links, et check:stripe fait tomber le
// build si une page pointe vers app.mystela.fr/signup.
export const LOGIN_URL = `${SITE.appUrl}/login`;

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
    tagline: "Récoltez plus d'avis Google et répondez sans effort.",
    features: [
      "Plus d'avis Google, sans jamais trier vos clients",
      "Vos réponses écrites toutes seules en 10 secondes",
      "Un client déçu ? On le rattrape avant qu'il parte",
      "Votre tableau de bord et vos QR codes prêts à l'emploi",
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
] as const;

// Nova : l'assistante IA de Stela (rédige les réponses aux avis dans le produit).
// Nommée et vendue sur la vitrine (champ lexical stellaire sobre).
export const NOVA = {
  name: "Nova",
  pitch: "Nova, votre assistante, écrit la réponse en 10 secondes. Vous relisez, vous envoyez.",
} as const;

// Écosystème couvert par Stela : liste RÉELLE (source de vérité du claim
// « XX canaux et plateformes »). Le chiffre affiché DOIT égaler CHANNELS.length
// (garde-fou check:channels). Compté honnêtement ; `status` sépare livré / bientôt.
// kind : "plateforme" (visibilité/avis), "canal" (collecte/relation), "capacite".
export const CHANNELS = [
  // Plateformes de visibilité et d'avis
  { name: "Google Recherche", kind: "plateforme", status: "live" },
  { name: "Google Maps", kind: "plateforme", status: "live" },
  { name: "Fiche Google Business Profile", kind: "plateforme", status: "live" },
  { name: "Waze", kind: "plateforme", status: "live" },
  { name: "Assistant Google", kind: "plateforme", status: "live" },
  { name: "Bing", kind: "plateforme", status: "live" },
  { name: "ChatGPT", kind: "plateforme", status: "live" },
  { name: "Microsoft Copilot", kind: "plateforme", status: "live" },
  { name: "Google Gemini", kind: "plateforme", status: "live" },
  { name: "Perplexity", kind: "plateforme", status: "live" },
  { name: "TripAdvisor", kind: "plateforme", status: "live" },
  // TheFork : partenaire officiel (accord signé juillet 2026). Décision fondateur
  // (VIT-10) : affiché « Disponible » sur tout le site → statut « live », aligné
  // avec la section Intégrations. Il est présenté via sa carte dédiée (caisses &
  // réservation), donc exclu de la 1re grille plateformes pour éviter un doublon.
  { name: "TheFork", kind: "plateforme", status: "live" },
  // Canaux de collecte et de relation client
  { name: "Page d'avis Stela", kind: "canal", status: "live" },
  { name: "QR codes", kind: "canal", status: "live" },
  { name: "SMS", kind: "canal", status: "live" },
  { name: "Email", kind: "canal", status: "live" },
  { name: "WhatsApp", kind: "canal", status: "live" },
  { name: "Roue cadeau conforme", kind: "canal", status: "live" },
  { name: "Réservations centralisées", kind: "canal", status: "live" },
  { name: "Messages après visite", kind: "canal", status: "live" },
  { name: "Campagnes marketing", kind: "canal", status: "live" },
  { name: "Récapitulatifs par email", kind: "canal", status: "live" },
  // Capacités produit
  { name: "Réponses IA Nova", kind: "capacite", status: "live" },
  { name: "Analyse des avis par IA", kind: "capacite", status: "live" },
  { name: "Application mobile (PWA)", kind: "capacite", status: "live" },
  { name: "SEO local", kind: "capacite", status: "live" },
  { name: "GEO (visibilité dans les IA)", kind: "capacite", status: "live" },
] as const;

export const CHANNELS_COUNT = CHANNELS.length;

// Clips produit courts (fournis plus tard par le superviseur). Emplacements PRÊTS :
// tant que la liste d'un slot est vide, AUCUNE section vidéo n'est rendue (pas de
// placeholder disgracieux). Pour activer : déposer webm/mp4 dans public/video/ +
// un poster réel, puis renseigner l'entrée ici. Composant : ProductVideo.astro.
export type ProductClip = { poster: string; alt: string; webm?: string; mp4?: string; width: number; height: number };
export const PRODUCT_VIDEOS: { home: ProductClip | null; fonctionnalites: ProductClip | null } = {
  home: null,
  fonctionnalites: null,
};

// Liens de navigation principaux (navbar). Parcours court et évident.
export const NAV_LINKS = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/blog", label: "Blog" },
  { href: "/notre-histoire", label: "Notre histoire" },
] as const;

// Contenu des 6 pages fonctionnalités (1 URL = 1 mot-clé FR). Les mockups
// réutilisent le VOCABULAIRE RÉEL de l'app stella-app (config/moduleLabels.ts) :
// espaces « Ma réputation / Mes clients / Mon rayonnement » et libellés de
// modules exacts (« Avis publics », « Retours privés », « Ma page d'avis »...).

export type Faq = { q: string; a: string };
export type Step = { t: string; d: string };

export type Feature = {
  slug: string;
  keyword: string; // intention de recherche
  navLabel: string; // libellé court pour le maillage interne
  title: string; // <title>
  metaDescription: string;
  h1: string;
  lead: string;
  benefits: { t: string; d: string }[];
  steps: Step[];
  faq: Faq[];
  // Mockup : le module de l'app mis en avant + le contenu du panneau.
  mockup: { module: string; heading: string; rows: { label: string; value: string }[] };
  // Angle SEO (VIT-9c) : section « chaque réponse travaille pour votre
  // visibilité », avec un mini avant/après (mots-clés locaux soulignés).
  seo?: {
    title: string;
    intro: string;
    before: string;
    afterTokens: { t: string; kw?: boolean }[];
  };
};

export const FEATURES: Feature[] = [
  {
    slug: "collecte-avis-google",
    keyword: "collecte d'avis Google",
    navLabel: "Collecte d'avis Google",
    title: "Collecte d'avis Google conforme | Stela",
    metaDescription:
      "Collectez plus d'avis Google grâce à une page d'avis et des QR codes, sans filtrer une seule note. 100 % conforme aux règles de Google.",
    h1: "Collectez plus d'avis Google, en toute conformité",
    lead:
      "Une page d'avis à votre nom, des QR codes pour votre équipe, et chaque client invité à s'exprimer publiquement. Sans jamais filtrer selon la note.",
    benefits: [
      { t: "Une page d'avis à votre marque", d: "Votre page « Ma page d'avis » guide chaque client vers votre fiche Google en un geste." },
      { t: "QR codes pour toute l'équipe", d: "Depuis « Équipe & QR », générez des QR codes à poser en salle, sur l'addition ou en caisse." },
      { t: "Zéro filtrage", d: "Tous les clients sont invités à laisser un avis public. Aucun tri selon la note, jamais." },
    ],
    steps: [
      { t: "Connectez votre fiche Google", d: "Reliez votre établissement en quelques minutes." },
      { t: "Diffusez vos QR codes", d: "En salle, sur l'addition, par SMS après la visite." },
      { t: "Suivez vos avis", d: "Les nouveaux avis apparaissent dans « Avis publics »." },
    ],
    faq: [
      { q: "Stela filtre-t-il les avis selon la note ?", a: "Non, jamais. Chaque client est invité à laisser un avis public sur Google. Filtrer les avis selon la satisfaction est interdit par Google." },
      { q: "Faut-il du matériel ?", a: "Non. Vous recevez vos QR codes et supports directement, à imprimer ou à afficher. Aucun achat obligatoire." },
    ],
    mockup: {
      module: "Ma page d'avis",
      heading: "Ma page d'avis",
      rows: [
        { label: "Lien public", value: "app.mystela.fr/r/votre-etablissement" },
        { label: "QR code", value: "Actif" },
        { label: "Invitations envoyées (7 j)", value: "128" },
      ],
    },
  },
  {
    slug: "reponse-automatique-avis",
    keyword: "réponse automatique aux avis",
    navLabel: "Réponse automatique",
    title: "Réponse automatique aux avis Google | Stela",
    metaDescription:
      "Répondez à tous vos avis Google automatiquement, avec des réponses rédigées par l'IA à votre ton et validées en un clic.",
    h1: "Nova répond à vos avis, vous validez",
    lead:
      "Nova, votre assistante, écrit la réponse en 10 secondes, dans votre ton. Vous relisez, vous envoyez. Ou vous laissez Nova publier pour vous.",
    benefits: [
      { t: "Nova, votre assistante", d: "Elle s'appuie sur votre établissement pour des réponses justes et personnelles, en 10 secondes." },
      { t: "Validées en un clic", d: "Depuis « Avis publics », relisez et publiez, ou activez la réponse automatique." },
      { t: "Rien n'est oublié", d: "Chaque avis reçoit une réponse, y compris les avis positifs." },
    ],
    steps: [
      { t: "Un nouvel avis arrive", d: "Il s'affiche dans « Avis publics »." },
      { t: "Nova propose une réponse", d: "Adaptée au contenu et à la note de l'avis, en 10 secondes." },
      { t: "Vous validez ou automatisez", d: "En un clic, ou en laissant Nova publier seule." },
    ],
    faq: [
      { q: "Puis-je relire avant publication ?", a: "Oui. Vous pouvez valider chaque réponse manuellement, ou activer la publication automatique quand vous êtes en confiance." },
      { q: "Les réponses sont-elles génériques ?", a: "Non. Chaque réponse est rédigée à partir du contenu de l'avis et de votre établissement, dans votre ton." },
    ],
    mockup: {
      module: "Avis publics",
      heading: "Avis publics",
      rows: [
        { label: "Marie L.  ★★★★★", value: "Réponse proposée par l'IA" },
        { label: "Karim B.  ★★★★☆", value: "Réponse proposée par l'IA" },
        { label: "Réponse automatique", value: "Activée" },
      ],
    },
    seo: {
      title: "Chaque réponse travaille pour votre visibilité",
      intro:
        "Quand Nova répond à un avis, elle glisse naturellement les mots que vos clients tapent sur Google (« pizzeria à Belleville », « coiffeur ouvert le samedi »). Google lit vos réponses : chacune renforce votre fiche dans les recherches et dans les réponses des IA. C'est du référencement local (le fameux « SEO »), fait pour vous, à chaque réponse.",
      before: "Merci pour votre visite, à bientôt !",
      afterTokens: [
        { t: "Merci pour votre visite dans notre " },
        { t: "pizzeria à Belleville", kw: true },
        { t: ", au plaisir de vous revoir pour une " },
        { t: "pizza au feu de bois", kw: true },
        { t: " !" },
      ],
    },
  },
  {
    slug: "avis-multi-plateformes",
    keyword: "avis multi-plateformes",
    navLabel: "Avis multi-plateformes",
    title: "Avis multi-plateformes centralisés | Stela",
    metaDescription:
      "Regroupez et répondez à vos avis Google, TripAdvisor et aux plateformes de votre secteur au même endroit.",
    h1: "Tous vos avis, toutes plateformes, au même endroit",
    lead:
      "Google, TripAdvisor et les plateformes de votre secteur réunis dans « Avis publics ». Vous suivez et répondez sans changer d'outil.",
    benefits: [
      { t: "Une seule boîte de réception", d: "Vos avis de toutes les plateformes arrivent au même endroit." },
      { t: "Réponses centralisées", d: "Répondez partout depuis Stela, avec l'aide de l'IA." },
      { t: "Vue d'ensemble", d: "Votre note et vos volumes par plateforme, en un coup d'oeil." },
    ],
    steps: [
      { t: "Connectez vos plateformes", d: "Google et les plateformes de votre secteur." },
      { t: "Recevez tout au même endroit", d: "Les avis se regroupent dans « Avis publics »." },
      { t: "Répondez partout", d: "Sans jongler entre les sites." },
    ],
    faq: [
      { q: "Quelles plateformes sont prises en charge ?", a: "Google en premier, puis les plateformes clés de votre secteur. Le paramétrage s'adapte à votre métier." },
      { q: "Est-ce disponible dans l'offre Étoile ?", a: "La centralisation multi-plateformes fait partie de l'offre Constellation." },
    ],
    mockup: {
      module: "Avis publics",
      heading: "Avis publics",
      rows: [
        { label: "Google", value: "4,7 · 312 avis" },
        { label: "TripAdvisor", value: "4,5 · 88 avis" },
        { label: "Filtrer par plateforme", value: "Toutes" },
      ],
    },
  },
  {
    slug: "analyse-des-avis",
    keyword: "analyse des avis",
    navLabel: "Analyse des retours",
    title: "Analyse sémantique de vos avis | Stela",
    metaDescription:
      "Comprenez ce qui revient dans vos avis et vos retours privés : tendances, points forts et points à améliorer, résumés par l'IA.",
    h1: "Comprenez ce que vos clients vous disent vraiment",
    lead:
      "Stela lit vos avis et vos retours privés, et en tire les tendances. Vous savez quoi améliorer, sans tout relire.",
    benefits: [
      { t: "Les tendances qui comptent", d: "Ce qui revient le plus, en positif comme en négatif." },
      { t: "Retours privés utiles", d: "Les messages privés de « Retours privés » nourrissent l'analyse." },
      { t: "Des priorités claires", d: "« Points à améliorer » transforme le bruit en actions." },
    ],
    steps: [
      { t: "Vos avis sont analysés", d: "Publics et privés, en continu." },
      { t: "L'IA résume les thèmes", d: "Accueil, attente, propreté, qualité..." },
      { t: "Vous agissez sur les priorités", d: "Depuis « Points à améliorer »." },
    ],
    faq: [
      { q: "Sur quoi porte l'analyse ?", a: "Sur vos avis publics et vos retours privés. L'IA en dégage les thèmes récurrents et les points à améliorer." },
      { q: "Les retours privés sont-ils publics ?", a: "Non. Un retour privé reste un canal privé entre le client et vous, jamais un avis public masqué." },
    ],
    mockup: {
      module: "Points à améliorer",
      heading: "Points à améliorer",
      rows: [
        { label: "Temps d'attente", value: "Cité 14 fois ce mois" },
        { label: "Accueil", value: "Point fort · 41 mentions" },
        { label: "Priorité suggérée", value: "Attente le week-end" },
      ],
    },
  },
  {
    slug: "centralisation-reservations",
    keyword: "centralisation des réservations",
    navLabel: "Réservations",
    title: "Centralisation des réservations | Stela",
    metaDescription:
      "Regroupez vos réservations et déclenchez automatiquement l'invitation à laisser un avis après la visite.",
    h1: "Vos réservations centralisées, vos avis en plus",
    lead:
      "Retrouvez vos réservations dans un seul endroit et laissez Stela inviter chaque client à s'exprimer après sa visite.",
    benefits: [
      { t: "Une vue unique", d: "Vos réservations regroupées dans « Réservations »." },
      { t: "Relance après visite", d: "L'invitation à laisser un avis part automatiquement au bon moment." },
      { t: "Moins d'outils", d: "Vous suivez tout depuis Stela." },
    ],
    steps: [
      { t: "Connectez vos réservations", d: "Les sources de votre secteur." },
      { t: "Suivez-les au même endroit", d: "Dans « Réservations »." },
      { t: "L'avis suit la visite", d: "Invitation envoyée automatiquement." },
    ],
    faq: [
      { q: "Quelles sources sont compatibles ?", a: "Les systèmes de réservation courants de votre secteur. Le paramétrage dépend de votre métier." },
      { q: "Est-ce inclus dans Étoile ?", a: "La centralisation des réservations fait partie de l'offre Constellation." },
    ],
    mockup: {
      module: "Réservations",
      heading: "Réservations",
      rows: [
        { label: "Aujourd'hui", value: "24 couverts · 9 réservations" },
        { label: "Table de Durand · 20h", value: "Confirmée" },
        { label: "Invitation avis après visite", value: "Automatique" },
      ],
    },
  },
  {
    slug: "sms-fidelisation",
    keyword: "SMS et fidélisation",
    navLabel: "SMS et fidélisation",
    title: "SMS et fidélisation client | Stela",
    metaDescription:
      "Faites revenir vos clients avec des messages après visite et des campagnes SMS et WhatsApp, sans effort.",
    h1: "Faites revenir vos clients, sans y penser",
    lead:
      "Des messages après visite et des campagnes SMS et WhatsApp pour garder le lien et remplir vos périodes creuses.",
    benefits: [
      { t: "Messages après visite", d: "Un mot au bon moment depuis « Messages après visite »." },
      { t: "Campagnes ciblées", d: "SMS et WhatsApp pour vos temps forts, depuis « Campagnes »." },
      { t: "Fiches clients", d: "Vos clients regroupés dans « Fiches clients » pour mieux les relancer." },
    ],
    steps: [
      { t: "Le client passe", d: "Sa fiche se met à jour dans « Fiches clients »." },
      { t: "Un message part", d: "Après la visite, ou lors d'une campagne." },
      { t: "Il revient", d: "Vous gardez le lien, sans effort." },
    ],
    faq: [
      { q: "Par quels canaux ?", a: "SMS et WhatsApp, selon votre configuration et votre secteur." },
      { q: "Est-ce conforme au RGPD ?", a: "Oui. Les messages respectent le consentement et le droit de désinscription." },
    ],
    mockup: {
      module: "Campagnes",
      heading: "Campagnes",
      rows: [
        { label: "Absents depuis 60 jours", value: "213 clients" },
        { label: "Canal", value: "SMS + WhatsApp" },
        { label: "Statut", value: "Programmée demain 11h" },
      ],
    },
  },
];

export const featureSlugs = () => FEATURES.map((f) => f.slug);

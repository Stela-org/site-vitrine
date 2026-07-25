// Pages segments : par profil (indépendant, multi-établissements) et par secteur
// (restaurant, coiffeur, institut, garage, extensible). 1 URL = 1 intention.

export type Segment = {
  slug: string;
  kind: "profil" | "secteur";
  navLabel: string;
  title: string;
  metaDescription: string;
  h1: string;
  lead: string;
  points: { t: string; d: string }[];
  faq: { q: string; a: string }[];
};

export const SEGMENTS: Segment[] = [
  {
    slug: "independants",
    kind: "profil",
    navLabel: "Indépendants",
    title: "Stela pour les commerces indépendants",
    metaDescription:
      "La réputation Google clé-en-main pour un commerce indépendant : collecte conforme, réponses IA, prix transparent et essai gratuit de 7 jours.",
    h1: "Pour les indépendants qui n'ont pas de temps à perdre",
    lead:
      "Un seul établissement, tout géré depuis votre téléphone. Vous collectez des avis, vous répondez et vous fidélisez, sans y passer vos soirées.",
    points: [
      { t: "Simple dès le premier jour", d: "Tout est pré-réglé pour votre secteur. Vous êtes prêt en quelques minutes." },
      { t: "Un prix clair", d: "49 € par mois pour commencer, sans engagement. Vous voyez le prix avant d'essayer." },
      { t: "Conforme, donc tranquille", d: "Aucun filtrage des avis : votre fiche Google reste protégée." },
    ],
    faq: [
      { q: "Faut-il des compétences techniques ?", a: "Non. L'onboarding est guidé et tout est pré-rempli pour votre métier." },
      { q: "Puis-je arrêter quand je veux ?", a: "Oui. L'abonnement est sans engagement, résiliable à tout moment." },
    ],
  },
  {
    slug: "multi-etablissements",
    kind: "profil",
    navLabel: "Multi-établissements",
    title: "Stela pour les groupes et multi-établissements",
    metaDescription:
      "Pilotez la réputation de plusieurs établissements depuis un seul compte : vue consolidée, conformité et réponses IA à grande échelle.",
    h1: "Pilotez plusieurs établissements depuis un seul endroit",
    lead:
      "Une vue consolidée de vos points de vente, des réponses IA à grande échelle et la même conformité partout.",
    points: [
      { t: "Vue consolidée", d: "Suivez la note et les volumes de chaque établissement, et le total du groupe." },
      { t: "Cohérence de marque", d: "Le même ton de réponse et les mêmes standards partout." },
      { t: "Conformité à l'échelle", d: "Aucun filtrage des avis, sur tous vos établissements." },
    ],
    faq: [
      { q: "Un compte par établissement ?", a: "Un seul compte pilote l'ensemble. Chaque établissement garde sa page et ses données." },
      { q: "Adapté aux réseaux et franchises ?", a: "Oui. Stela est multi-tenant dès l'origine, pensé pour les groupes." },
    ],
  },
  {
    slug: "restaurant",
    kind: "secteur",
    navLabel: "Restaurant",
    title: "Stela pour les restaurants",
    metaDescription:
      "Plus d'avis Google pour votre restaurant, sans filtrer les notes. Réponses IA, réservations centralisées et relances après visite.",
    h1: "Pour les restaurants qui veulent une meilleure réputation",
    lead:
      "Collectez des avis en salle et après la visite, répondez automatiquement et centralisez vos réservations.",
    points: [
      { t: "Avis en salle", d: "QR codes sur la table et l'addition, invitations après le repas." },
      { t: "Réservations", d: "Regroupez vos réservations et déclenchez l'avis après la visite." },
      { t: "Réponses à votre ton", d: "L'IA répond à chaque avis, du service du midi au dernier couvert." },
    ],
    faq: [
      { q: "Comment collecter sans gêner le service ?", a: "Un QR code sur la table ou l'addition suffit. Le client laisse son avis quand il le souhaite." },
      { q: "Et les avis négatifs ?", a: "Ils restent publics. Stela vous aide à y répondre, jamais à les cacher." },
    ],
  },
  {
    slug: "coiffeur",
    kind: "secteur",
    navLabel: "Coiffeur",
    title: "Stela pour les salons de coiffure",
    metaDescription:
      "Développez la réputation de votre salon de coiffure : avis Google conformes, réponses IA et relances de fidélisation.",
    h1: "Pour les salons de coiffure qui veulent se faire connaître",
    lead:
      "Transformez chaque passage en avis, gardez le lien entre deux rendez-vous et faites revenir vos clients.",
    points: [
      { t: "Un avis après la coupe", d: "Invitation envoyée au bon moment, sans effort pour l'équipe." },
      { t: "Fidélisation", d: "Des messages pour rappeler le prochain rendez-vous." },
      { t: "Toute l'équipe", d: "Des QR codes par poste, pour impliquer chaque coiffeur." },
    ],
    faq: [
      { q: "Utile pour un petit salon ?", a: "Oui. L'offre de départ à 49 € par mois convient à un salon indépendant." },
      { q: "Puis-je relancer mes clients ?", a: "Oui, par SMS ou WhatsApp, dans le respect du consentement." },
    ],
  },
  {
    slug: "institut",
    kind: "secteur",
    navLabel: "Institut",
    title: "Stela pour les instituts de beauté",
    metaDescription:
      "Plus d'avis et plus de fidélité pour votre institut de beauté : collecte conforme, réponses IA et relances automatiques.",
    h1: "Pour les instituts qui soignent leur réputation",
    lead:
      "Collectez des avis après chaque soin, répondez automatiquement et gardez le lien avec vos clientes et clients.",
    points: [
      { t: "Avis après le soin", d: "Une invitation discrète, au bon moment." },
      { t: "Relances douces", d: "Rappelez le prochain soin sans harceler." },
      { t: "Image soignée", d: "Des réponses à votre ton, à chaque avis." },
    ],
    faq: [
      { q: "Comment éviter d'être intrusif ?", a: "Les messages sont espacés et respectent le désabonnement. Vous gardez la main sur la fréquence." },
      { q: "Est-ce conforme au RGPD ?", a: "Oui. La collecte et les relances respectent le consentement." },
    ],
  },
  {
    slug: "garage",
    kind: "secteur",
    navLabel: "Garage",
    title: "Stela pour les garages et l'automobile",
    metaDescription:
      "Renforcez la confiance envers votre garage : avis Google conformes, réponses IA et relances après intervention.",
    h1: "Pour les garages qui veulent inspirer confiance",
    lead:
      "La confiance se gagne sur les avis. Collectez-les après chaque intervention et répondez à chacun.",
    points: [
      { t: "Avis après intervention", d: "Invitation envoyée à la restitution du véhicule." },
      { t: "Confiance visible", d: "Une note solide et des réponses sérieuses rassurent." },
      { t: "Relances entretien", d: "Rappelez la prochaine révision au bon moment." },
    ],
    faq: [
      { q: "Utile face à la concurrence locale ?", a: "Oui. Une meilleure note et des avis récents améliorent votre visibilité locale sur Google." },
      { q: "Et les avis négatifs ?", a: "Ils restent publics. Stela vous aide à répondre de façon professionnelle." },
    ],
  },
];

export const segmentSlugs = () => SEGMENTS.map((s) => s.slug);
export const profils = () => SEGMENTS.filter((s) => s.kind === "profil");
export const secteurs = () => SEGMENTS.filter((s) => s.kind === "secteur");

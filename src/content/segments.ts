// Pages segments : par profil (indépendant, multi-établissements) et par secteur
// (restaurant, coiffeur, institut, garage, hôtel, extensible). 1 URL = 1
// intention. VIT-15 : chaque segment porte de quoi bâtir une vraie landing
// métier (avis d'exemple dans le vocabulaire du métier, tagline, icône pour
// l'aiguillage de la home).

export type SegmentReview = { text: string; reply: string };

export type Segment = {
  slug: string;
  kind: "profil" | "secteur";
  navLabel: string;
  icon: string; // pictogramme de la carte métier sur la home (aiguillage)
  tagline: string; // phrase courte pour la carte métier
  title: string;
  metaDescription: string;
  h1: string;
  lead: string;
  heroReview: SegmentReview; // avis d'exemple mis en avant dans le hero métier
  reviewExamples: SegmentReview[]; // 2 avis d'exemple du métier (section preuve)
  points: { t: string; d: string }[];
  faq: { q: string; a: string }[];
  surDevis?: boolean; // tarification sur devis (multi-établissements) : pas de grille 49/89 sur la landing
};

export const SEGMENTS: Segment[] = [
  {
    slug: "independants",
    kind: "profil",
    navLabel: "Indépendants",
    icon: "🏪",
    tagline: "Un commerce, tout depuis votre téléphone.",
    title: "Stela pour les commerces indépendants",
    metaDescription:
      "La réputation Google clé-en-main pour un commerce indépendant : collecte conforme, réponses IA, prix transparent et essai gratuit de 7 jours.",
    h1: "Pour les indépendants qui n'ont pas de temps à perdre",
    lead:
      "Un seul établissement, tout géré depuis votre téléphone. Vous collectez des avis, vous répondez et vous fidélisez, sans y passer vos soirées.",
    heroReview: {
      text: "Accueil vraiment sympa et service rapide, je recommande sans hésiter.",
      reply: "Merci beaucoup pour votre visite et votre confiance, à très bientôt !",
    },
    reviewExamples: [
      { text: "Très bon accueil, on se sent tout de suite à l'aise.", reply: "Merci ! Ravis de vous compter parmi nos clients fidèles." },
      { text: "Rapide, sérieux et à l'écoute. Rien à redire.", reply: "Un grand merci pour votre retour, au plaisir de vous revoir." },
    ],
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
    icon: "🏢",
    tagline: "Plusieurs points de vente, un seul pilotage.",
    title: "Stela pour les groupes et multi-établissements",
    metaDescription:
      "Pilotez la réputation de plusieurs établissements depuis un seul compte : vue consolidée, conformité et réponses IA à grande échelle.",
    h1: "Pilotez plusieurs établissements depuis un seul endroit",
    lead:
      "Une vue consolidée de vos points de vente, des réponses IA à grande échelle et la même conformité partout.",
    heroReview: {
      text: "Même qualité d'accueil dans chacune de leurs adresses, c'est appréciable.",
      reply: "Merci ! Nos équipes appliquent les mêmes standards dans chaque établissement.",
    },
    reviewExamples: [
      { text: "Peu importe l'adresse où je vais, le service est constant.", reply: "Merci ! La cohérence entre nos points de vente est notre priorité." },
      { text: "Enseigne fiable, on sait à quoi s'attendre.", reply: "Merci pour votre fidélité à l'ensemble de nos établissements." },
    ],
    points: [
      { t: "Vue consolidée", d: "Suivez la note et les volumes de chaque établissement, et le total du groupe." },
      { t: "Cohérence de marque", d: "Le même ton de réponse et les mêmes standards partout." },
      { t: "Conformité à l'échelle", d: "Aucun filtrage des avis, sur tous vos établissements." },
    ],
    faq: [
      { q: "Un compte par établissement ?", a: "Un seul compte pilote l'ensemble. Chaque établissement garde sa page et ses données." },
      { q: "Adapté aux réseaux et franchises ?", a: "Oui. Stela est multi-tenant dès l'origine, pensé pour les groupes." },
    ],
    surDevis: true,
  },
  {
    slug: "restaurant",
    kind: "secteur",
    navLabel: "Restaurant",
    icon: "🍽️",
    tagline: "Plus d'avis en salle et après le repas.",
    title: "Stela pour les restaurants",
    metaDescription:
      "Plus d'avis Google pour votre restaurant, sans filtrer les notes. Réponses IA, réservations centralisées et relances après visite.",
    h1: "Pour les restaurants qui veulent une meilleure réputation",
    lead:
      "Collectez des avis en salle et après la visite, répondez automatiquement et centralisez vos réservations.",
    heroReview: {
      text: "Cuisine généreuse et service attentionné, on reviendra sans hésiter.",
      reply: "Merci ! Ravis que le repas vous ait plu, à très vite en salle.",
    },
    reviewExamples: [
      { text: "Réservation en deux clics et table prête à l'heure.", reply: "Merci Karim, la terrasse vous attend dès les beaux jours." },
      { text: "Parfait pour un dîner en famille, les enfants ont adoré le dessert.", reply: "Un grand merci, on transmet le compliment au chef pâtissier !" },
    ],
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
    icon: "✂️",
    tagline: "Un avis après chaque coupe, sans effort.",
    title: "Stela pour les salons de coiffure",
    metaDescription:
      "Développez la réputation de votre salon de coiffure : avis Google conformes, réponses IA et relances de fidélisation.",
    h1: "Pour les salons de coiffure qui veulent se faire connaître",
    lead:
      "Transformez chaque passage en avis, gardez le lien entre deux rendez-vous et faites revenir vos clients.",
    heroReview: {
      text: "Coupe et couleur parfaites, on ressort avec le sourire. Salon impeccable.",
      reply: "Merci ! Ravis que le résultat vous plaise, toute l'équipe du salon vous dit à bientôt.",
    },
    reviewExamples: [
      { text: "Coiffeuse à l'écoute, résultat exactement comme je voulais.", reply: "Merci ! Ravis que la coupe vous plaise, à bientôt au salon." },
      { text: "Accueil chaleureux et cadre très agréable.", reply: "Merci beaucoup, au plaisir de vous revoir pour votre prochain rendez-vous." },
    ],
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
    icon: "💅",
    tagline: "Un avis après le soin, une image soignée.",
    title: "Stela pour les instituts de beauté",
    metaDescription:
      "Plus d'avis et plus de fidélité pour votre institut de beauté : collecte conforme, réponses IA et relances automatiques.",
    h1: "Pour les instituts qui soignent leur réputation",
    lead:
      "Collectez des avis après chaque soin, répondez automatiquement et gardez le lien avec vos clientes et clients.",
    heroReview: {
      text: "Soin très relaxant et esthéticienne aux petits soins, un vrai moment.",
      reply: "Merci ! Ravis que ce moment vous ait fait du bien, à bientôt à l'institut.",
    },
    reviewExamples: [
      { text: "Cadre apaisant et prestations de qualité.", reply: "Merci ! Votre bien-être est au cœur de notre institut." },
      { text: "Très professionnelle, je recommande les yeux fermés.", reply: "Un grand merci pour votre confiance, à très vite." },
    ],
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
    icon: "🔧",
    tagline: "La confiance se gagne sur les avis.",
    title: "Stela pour les garages et l'automobile",
    metaDescription:
      "Renforcez la confiance envers votre garage : avis Google conformes, réponses IA et relances après intervention.",
    h1: "Pour les garages qui veulent inspirer confiance",
    lead:
      "La confiance se gagne sur les avis. Collectez-les après chaque intervention et répondez à chacun.",
    heroReview: {
      text: "Diagnostic clair, réparation rapide et tarif honnête. Je recommande.",
      reply: "Merci ! Ravis d'avoir remis votre véhicule en route, bonne route à vous.",
    },
    reviewExamples: [
      { text: "Devis transparent et intervention nickel.", reply: "Merci ! La transparence, c'est notre engagement à chaque passage." },
      { text: "Accueil pro et véhicule prêt dans les temps.", reply: "Merci pour votre confiance, à la prochaine révision." },
    ],
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
  {
    slug: "hotel",
    kind: "secteur",
    navLabel: "Hôtel",
    icon: "🏨",
    tagline: "Un avis après le séjour, Google et TripAdvisor.",
    title: "Stela pour les hôtels",
    metaDescription:
      "Plus d'avis pour votre hôtel sur Google et TripAdvisor : collecte après le séjour, réponses IA et relances, en toute conformité.",
    h1: "Pour les hôtels qui soignent chaque séjour",
    lead:
      "Collectez un avis après le départ, réunissez Google et TripAdvisor et répondez à chaque voyageur, dans sa langue.",
    heroReview: {
      text: "Chambre au calme, lit très confortable et accueil aux petits soins. On reviendra.",
      reply: "Merci ! Ravis que votre séjour vous ait plu, au plaisir de vous accueillir à nouveau.",
    },
    reviewExamples: [
      { text: "Personnel adorable et petit-déjeuner copieux.", reply: "Merci ! Nous transmettons vos compliments à toute l'équipe." },
      { text: "Emplacement idéal et chambre impeccable.", reply: "Un grand merci, au plaisir de vous revoir lors d'un prochain séjour." },
    ],
    points: [
      { t: "Avis après le séjour", d: "Invitation envoyée au départ, au bon moment." },
      { t: "Google et TripAdvisor", d: "Vos avis réunis là où les voyageurs regardent." },
      { t: "Réponses à votre ton", d: "L'IA répond à chaque avis, en français comme à l'étranger." },
    ],
    faq: [
      { q: "Gérez-vous les avis TripAdvisor ?", a: "Oui. Vos avis Google et TripAdvisor se centralisent au même endroit." },
      { q: "Et les avis en langue étrangère ?", a: "Nova comprend et répond dans la langue du voyageur, avec votre ton." },
    ],
  },
];

export const segmentSlugs = () => SEGMENTS.map((s) => s.slug);
export const profils = () => SEGMENTS.filter((s) => s.kind === "profil");
export const secteurs = () => SEGMENTS.filter((s) => s.kind === "secteur");

// Pages villes /restaurants-{ville} : landing pages localisées et RÉELLEMENT
// différenciées. Chaque ville a un contexte local factuel (quartiers réels,
// tissu commercial), pas un clone. Aucun chiffre inventé : uniquement des
// éléments géographiques et de contexte vérifiables et généraux.
// Décision VIT-4 : ces landing pages (intention commerciale « avis Google
// restaurant {ville} ») CONSOLIDENT les anciens articles de blog de ville
// (thin content, cannibalisation) qui redirigent (301) vers elles.

export type City = {
  slug: string; // /restaurants-{slug}
  name: string; // "Paris"
  prep: string; // "à Paris"
  region: string;
  intro: string; // angle local propre à la ville
  metaDesc: string; // meta description UNIQUE, reprend l'angle local (SEO)
  quartiers: string[]; // quartiers réels, pour ancrer le contenu
  contexte: string; // phrase de contexte local factuelle
  legacyLanding: string; // ancienne URL .html landing (301)
  legacyArticle: string; // ancien article de blog ville (301 -> cette page)
};

export const CITIES: City[] = [
  {
    slug: "paris",
    name: "Paris",
    prep: "à Paris",
    region: "Île-de-France",
    intro: "À Paris, la concurrence entre restaurants est immense et un client choisit souvent en quelques secondes, sur la note et les avis récents.",
    metaDesc: "Face à la concurrence parisienne, collectez plus d'avis Google pour votre restaurant, du Marais à Montmartre. Réponses IA, prix transparents, essai gratuit.",
    quartiers: ["le Marais", "Montmartre", "le Quartier latin", "Bastille", "les Batignolles"],
    contexte: "Entre les habitués de quartier et un flux touristique constant, une fiche Google claire et des avis frais font toute la différence d'une rue à l'autre.",
    legacyLanding: "/restaurants-paris.html",
    legacyArticle: "/blog/avis-google-restaurant-paris.html",
  },
  {
    slug: "lyon",
    name: "Lyon",
    prep: "à Lyon",
    region: "Auvergne-Rhône-Alpes",
    intro: "Capitale de la gastronomie, Lyon a une clientèle exigeante qui lit les avis avant de réserver, du bouchon traditionnel à la table moderne.",
    metaDesc: "Des bouchons de la Presqu'île aux tables de la Croix-Rousse, développez les avis Google de votre restaurant lyonnais, en toute conformité. Essai gratuit.",
    quartiers: ["la Presqu'île", "le Vieux Lyon", "la Croix-Rousse", "la Part-Dieu", "Confluence"],
    contexte: "Sur un marché où la réputation culinaire compte autant que le bouche-à-oreille, des avis récents et sincères pèsent lourd.",
    legacyLanding: "/restaurants-lyon.html",
    legacyArticle: "/blog/avis-google-restaurant-lyon.html",
  },
  {
    slug: "marseille",
    name: "Marseille",
    prep: "à Marseille",
    region: "Provence-Alpes-Côte d'Azur",
    intro: "À Marseille, entre le Vieux-Port et les quartiers qui vivent au rythme de la mer, la saisonnalité touristique fait bouger fortement la fréquentation.",
    metaDesc: "Du Vieux-Port au Panier, collectez des avis Google toute l'année pour votre restaurant marseillais : réponses IA, essai gratuit.",
    quartiers: ["le Vieux-Port", "le Panier", "Notre-Dame-du-Mont", "les Goudes", "la Joliette"],
    contexte: "Un afflux estival important rend d'autant plus utile une collecte d'avis régulière toute l'année, pour ne pas dépendre d'une seule saison.",
    legacyLanding: "/restaurants-marseille.html",
    legacyArticle: "/blog/avis-google-restaurant-marseille.html",
  },
  {
    slug: "bordeaux",
    name: "Bordeaux",
    prep: "à Bordeaux",
    region: "Nouvelle-Aquitaine",
    intro: "Ville de vin et de gastronomie, Bordeaux attire une clientèle locale fidèle et de nombreux visiteurs, du centre classé aux quais réaménagés.",
    metaDesc: "Soignez la réputation Google de votre restaurant bordelais, des Chartrons aux quais : avis clients, réponses IA, essai gratuit.",
    quartiers: ["les Chartrons", "Saint-Pierre", "Saint-Michel", "les Quais", "la Bastide"],
    contexte: "Dans une ville où l'art de vivre est un argument, la note Google et la qualité des réponses aux avis participent à l'image d'un établissement.",
    legacyLanding: "/restaurants-bordeaux.html",
    legacyArticle: "/blog/avis-google-restaurant-bordeaux.html",
  },
  {
    slug: "nice",
    name: "Nice",
    prep: "à Nice",
    region: "Provence-Alpes-Côte d'Azur",
    intro: "À Nice, la Promenade des Anglais et le Vieux-Nice concentrent un tourisme intense, avec une clientèle souvent de passage qui décide sur les avis.",
    metaDesc: "Avec une clientèle de passage entre le Vieux-Nice et la Promenade des Anglais, captez l'avis juste après la visite. Collecte conforme, essai gratuit.",
    quartiers: ["le Vieux-Nice", "le port", "Cimiez", "la Promenade des Anglais", "Libération"],
    contexte: "Avec beaucoup de clients de passage, obtenir un avis juste après la visite est décisif pour bâtir une réputation solide.",
    legacyLanding: "/restaurants-nice.html",
    legacyArticle: "/blog/avis-google-restaurant-nice.html",
  },
  {
    slug: "nantes",
    name: "Nantes",
    prep: "à Nantes",
    region: "Pays de la Loire",
    intro: "Ville dynamique et jeune, Nantes a une clientèle très connectée qui consulte spontanément les avis en ligne avant de sortir.",
    metaDesc: "À Nantes, une clientèle jeune et connectée consulte les avis avant de sortir : soignez votre présence Google, du Bouffay à l'île de Nantes. Essai gratuit.",
    quartiers: ["le Bouffay", "l'île de Nantes", "Graslin", "Talensac", "Chantenay"],
    contexte: "Auprès d'une population habituée au numérique, une présence en ligne soignée et des avis récents sont particulièrement déterminants.",
    legacyLanding: "/restaurants-nantes.html",
    legacyArticle: "/blog/avis-google-restaurant-nantes.html",
  },
  {
    slug: "brest",
    name: "Brest",
    prep: "à Brest",
    region: "Bretagne",
    intro: "À Brest, ville portuaire et étudiante, la fidélité de la clientèle locale se construit sur la durée, et les avis y jouent un rôle de confiance.",
    metaDesc: "À Brest, ville portuaire et étudiante, chaque avis compte pour se démarquer. Collectez-les auprès de tous vos clients, sans filtrage. Essai gratuit.",
    quartiers: ["Siam", "Recouvrance", "Saint-Martin", "le port de commerce", "les Quatre-Moulins"],
    contexte: "Sur un marché plus resserré qu'une grande métropole, chaque avis compte davantage pour se démarquer localement.",
    legacyLanding: "/restaurants-brest.html",
    legacyArticle: "/blog/avis-google-restaurant-brest.html",
  },
  {
    slug: "rouen",
    name: "Rouen",
    prep: "à Rouen",
    region: "Normandie",
    intro: "À Rouen, entre le centre médiéval et les quais de Seine, un tissu de restaurants indépendants se partage une clientèle locale attentive aux avis.",
    metaDesc: "À Rouen, une bonne réputation Google aide un restaurant indépendant à se distinguer des chaînes, du centre médiéval aux quais de Seine. Essai gratuit.",
    quartiers: ["le Vieux-Rouen", "le centre", "Saint-Marc", "la rive gauche", "les quais"],
    contexte: "Dans une ville de taille moyenne, une réputation en ligne bien tenue permet à un indépendant de se distinguer des chaînes.",
    legacyLanding: "/restaurants-rouen.html",
    legacyArticle: "/blog/avis-google-restaurant-rouen.html",
  },
  {
    slug: "nancy",
    name: "Nancy",
    prep: "à Nancy",
    region: "Grand Est",
    intro: "À Nancy, autour de la place Stanislas, une clientèle locale et étudiante fréquente des établissements qui se jouent beaucoup sur la réputation de quartier.",
    metaDesc: "Autour de la place Stanislas, la réputation de quartier fait le plein : collectez plus d'avis Google pour votre restaurant nancéien. Conforme, essai gratuit.",
    quartiers: ["la place Stanislas", "la Ville-Vieille", "Saint-Sébastien", "le centre", "Nancy-Thermal"],
    contexte: "Dans un centre-ville vivant, la note Google et la fraîcheur des avis orientent une part importante des choix.",
    legacyLanding: "/restaurants-nancy.html",
    legacyArticle: "/blog/avis-google-restaurant-nancy.html",
  },
];

export const citySlugs = () => CITIES.map((c) => c.slug);

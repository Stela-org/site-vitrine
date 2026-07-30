// Pages villes /restaurants-{ville} : landing pages localisées et RÉELLEMENT
// différenciées. Chaque ville a un contexte local factuel (quartiers réels,
// tissu commercial), pas un clone. Aucun chiffre inventé : uniquement des
// éléments géographiques et de contexte vérifiables et généraux.
// Décision VIT-4 : ces landing pages (intention commerciale « avis Google
// restaurant {ville} ») CONSOLIDENT les anciens articles de blog de ville
// (thin content, cannibalisation) qui redirigent (301) vers elles.
//
// LOT VIT-16 (audit du 31 juillet 2026) : les pages faisaient environ 480 mots
// dont ~84 % de texte commun, soit le profil exact d'une « doorway page » que
// Google déclasse. Chaque ville porte désormais son propre contenu long :
// quartiers et leur typologie de restauration, marché local, enjeux d'avis,
// et une FAQ locale intégrée au bloc FAQPage de la page.
//
// RÈGLE DE RÉDACTION, non négociable : aucun témoignage inventé, aucune
// statistique fabriquée, aucun nom d'établissement cité. Uniquement de la
// géographie, du contexte urbain et des usages de restauration vérifiables,
// formulés qualitativement. En cas de doute sur un fait, on ne l'écrit pas.

export type City = {
  slug: string; // /restaurants-{slug}
  name: string; // "Paris"
  prep: string; // "à Paris"
  region: string;
  gentile: string; // "parisien", pour varier les formulations
  intro: string; // angle local propre à la ville
  metaDesc: string; // meta description UNIQUE, reprend l'angle local (SEO)
  quartiers: string[]; // quartiers réels, pour ancrer le contenu
  contexte: string; // phrase de contexte local factuelle
  /** Quartiers commentés : nom + typologie de restauration réelle du secteur. */
  quartiersDetail: { nom: string; texte: string }[];
  /** Spécificités du marché local de la restauration (3 paragraphes). */
  marche: string[];
  /** Enjeux d'avis Google propres au contexte de la ville (2 paragraphes). */
  enjeux: string[];
  /** FAQ locale, injectée dans le bloc FAQPage de la page. */
  faqLocale: { q: string; a: string }[];
  legacyLanding: string; // ancienne URL .html landing (301)
  legacyArticle: string; // ancien article de blog ville (301 -> cette page)
};

export const CITIES: City[] = [
  {
    slug: "paris",
    name: "Paris",
    prep: "à Paris",
    region: "Île-de-France",
    gentile: "parisien",
    intro: "À Paris, la concurrence entre restaurants est immense et un client choisit souvent en quelques secondes, sur la note et les avis récents.",
    metaDesc: "Face à la concurrence parisienne, collectez plus d'avis Google pour votre restaurant, du Marais à Montmartre. Réponses IA, prix transparents, essai gratuit.",
    quartiers: ["le Marais", "Montmartre", "le Quartier latin", "Bastille", "les Batignolles"],
    contexte: "Entre les habitués de quartier et un flux touristique constant, une fiche Google claire et des avis frais font toute la différence d'une rue à l'autre.",
    quartiersDetail: [
      {
        nom: "Le Marais",
        texte: "Sur quelques rues seulement se croisent des adresses de restauration rapide à emporter, des bistrots installés depuis longtemps et des tables plus contemporaines. La densité y est telle qu'un passant compare plusieurs fiches Google avant de traverser la rue. La clientèle mêle Parisiens du week-end et visiteurs étrangers, ce qui donne des avis rédigés dans plusieurs langues sur une même fiche.",
      },
      {
        nom: "Montmartre et les Abbesses",
        texte: "Le haut de la butte vit d'un tourisme très dense, avec des terrasses qui tournent vite et des clients rarement revus. Quelques rues plus bas, vers les Abbesses et Lamarck, le tissu redevient celui d'un quartier résidentiel, avec des habitués et des tables de quartier. Deux logiques d'avis coexistent donc à dix minutes de marche l'une de l'autre.",
      },
      {
        nom: "Le Quartier latin",
        texte: "Autour de la rue Mouffetard et des facultés, la restauration est marquée par une clientèle étudiante, des formules du midi et une forte offre de cuisines du monde. Le prix affiché et la rapidité du service pèsent lourd dans les commentaires, davantage que le décor.",
      },
      {
        nom: "Les Batignolles et Bastille",
        texte: "Ces secteurs concentrent une bistronomie de quartier qui vit surtout de sa clientèle résidentielle et du bouche-à-oreille local. Les avis y sont plus détaillés, souvent rédigés par des clients revenus plusieurs fois, et une note qui glisse se ressent vite sur les réservations du soir.",
      },
    ],
    marche: [
      "Paris est probablement le marché de restauration le plus dense de France, et cette densité change la nature du référencement local. Sur une recherche « restaurant » depuis un téléphone, un client se voit proposer des dizaines d'établissements dans un rayon de marche de cinq minutes. Le classement dans cette liste dépend en grande partie de la distance, de la pertinence de la fiche et du signal d'avis, c'est-à-dire du nombre d'avis, de la note et de leur fraîcheur.",
      "L'autre particularité parisienne est l'internationalisation de la clientèle. Une fiche reçoit couramment des avis en anglais, en espagnol ou en mandarin, y compris pour une adresse de quartier. Répondre dans la langue de l'avis, ou au moins dans un français simple et courtois, envoie un signal de sérieux au lecteur suivant, qui est souvent un futur client venu d'ailleurs.",
      "Enfin, Paris est la ville où la livraison et la vente à emporter pèsent le plus lourd dans l'activité d'une partie des établissements. Ces commandes échappent en général à la collecte d'avis, alors qu'elles représentent parfois une part significative du chiffre. Penser à inviter aussi ces clients, par un message ou un support glissé dans la commande, ouvre un gisement d'avis que la plupart des concurrents laissent de côté.",
    ],
    enjeux: [
      "Le premier enjeu parisien est le volume. Les concurrents installés cumulent parfois plusieurs centaines d'avis, ce qui rend une fiche jeune difficile à départager. La réponse n'est pas d'acheter des avis, pratique interdite et sanctionnée par Google, mais d'installer une collecte régulière auprès de tous les clients, à chaque service, pour que le compteur progresse de façon continue et crédible.",
      "Le second enjeu est la volatilité. Avec une rotation de clientèle élevée, un seul avis négatif publié un samedi soir peut peser sur la note pendant des semaines si rien ne vient l'équilibrer. Une collecte continue amortit ces à-coups, et une réponse publique posée dans les jours qui suivent montre au lecteur que l'établissement traite les retours au lieu de les subir.",
    ],
    faqLocale: [
      {
        q: "Faut-il répondre aux avis en anglais laissés par des touristes à Paris ?",
        a: "Oui, c'est même un réflexe utile dans les quartiers touristiques. Une réponse dans la langue de l'avis rassure les lecteurs étrangers qui consultent votre fiche, et montre que l'établissement accueille volontiers une clientèle internationale. À défaut, une réponse courte et claire en français vaut toujours mieux que pas de réponse du tout.",
      },
      {
        q: "Comment se démarquer quand les restaurants voisins ont des centaines d'avis ?",
        a: "En jouant la régularité plutôt que le volume immédiat. Google valorise la fraîcheur des avis autant que leur nombre : une fiche qui reçoit des avis chaque semaine se défend bien face à une fiche mieux dotée mais figée. Sollicitez chaque client, à chaque service, sans jamais trier selon la satisfaction.",
      },
      {
        q: "La saisonnalité touristique change-t-elle la façon de collecter les avis à Paris ?",
        a: "Elle change surtout le moment de la sollicitation. En haute saison, le QR code en salle ou sur l'addition capte un client qui ne reviendra pas. Hors saison, un message envoyé après la visite fonctionne mieux auprès des habitués du quartier. Les deux canaux sont complémentaires sur une année complète.",
      },
      {
        q: "Un restaurant de quartier a-t-il intérêt à soigner sa fiche Google à Paris ?",
        a: "Oui, particulièrement. Dans les arrondissements résidentiels, la recherche locale sur téléphone remplace largement le passage devant la vitrine. Une fiche complète, avec des photos à jour, des horaires justes et des avis récents, capte une clientèle de proximité qui ne vous aurait pas trouvé autrement.",
      },
    ],
    legacyLanding: "/restaurants-paris.html",
    legacyArticle: "/blog/avis-google-restaurant-paris.html",
  },
  {
    slug: "lyon",
    name: "Lyon",
    prep: "à Lyon",
    region: "Auvergne-Rhône-Alpes",
    gentile: "lyonnais",
    intro: "Capitale de la gastronomie, Lyon a une clientèle exigeante qui lit les avis avant de réserver, du bouchon traditionnel à la table moderne.",
    metaDesc: "Des bouchons de la Presqu'île aux tables de la Croix-Rousse, développez les avis Google de votre restaurant lyonnais, en toute conformité. Essai gratuit.",
    quartiers: ["la Presqu'île", "le Vieux Lyon", "la Croix-Rousse", "la Part-Dieu", "Confluence"],
    contexte: "Sur un marché où la réputation culinaire compte autant que le bouche-à-oreille, des avis récents et sincères pèsent lourd.",
    quartiersDetail: [
      {
        nom: "La Presqu'île",
        texte: "Entre Bellecour et les Terreaux, on trouve à la fois des bouchons traditionnels, des brasseries de grande capacité et des enseignes nationales. La clientèle y est mixte : salariés le midi, sorties et spectacles le soir. Le service du midi se joue beaucoup sur la rapidité, ce qui ressort systématiquement dans les commentaires.",
      },
      {
        nom: "Le Vieux Lyon",
        texte: "Le quartier Saint-Jean, inscrit au patrimoine mondial de l'UNESCO avec le reste du site historique lyonnais, attire un flux touristique dense et concentré sur quelques rues. Les tables y affichent souvent une carte traditionnelle. La forte proportion de clients de passage rend la collecte d'avis sur place, avant que le client ne quitte la ville, particulièrement déterminante.",
      },
      {
        nom: "La Croix-Rousse",
        texte: "Sur les pentes et le plateau, la restauration est plus indépendante, souvent à petite capacité, avec une clientèle de quartier fidèle et un marché quotidien qui rythme la vie du secteur. Les avis y sont écrits par des habitués, plus circonstanciés, et le bouche-à-oreille de voisinage compte autant que la fiche Google.",
      },
      {
        nom: "La Part-Dieu et Confluence",
        texte: "Ces deux pôles fonctionnent à l'heure du bureau et du commerce. Autour de la Part-Dieu, la clientèle d'affaires cherche un déjeuner rapide et fiable à proximité immédiate de la gare et des tours. À Confluence, l'offre est plus récente et davantage tournée vers les familles et les sorties de fin de semaine.",
      },
    ],
    marche: [
      "Lyon vit avec une réputation gastronomique qui précède chaque établissement, et cela crée une exigence particulière chez le lecteur d'avis. Le label des bouchons lyonnais, les halles municipales et la tradition des mères lyonnaises installent une grille de lecture chez le client : il compare autant la cuisine que la fidélité à une tradition. Un avis lyonnais commente souvent le plat, sa préparation et sa justesse, pas seulement l'accueil.",
      "La ville accueille aussi de grands rendez-vous professionnels et un tourisme d'affaires régulier, ce qui crée des pics de fréquentation très marqués sur certaines semaines. Un établissement qui ne collecte des avis que pendant ces pics obtient une courbe en dents de scie, peu lisible pour Google. Étaler la collecte sur toute l'année donne un signal beaucoup plus solide.",
      "La géographie lyonnaise ajoute une difficulté pratique : entre les deux fleuves, les pentes et les quartiers de collines, deux adresses distantes de quelques centaines de mètres ne captent pas du tout le même flux piéton. La recherche locale sur téléphone, qui pondère fortement la distance, accentue encore cet effet. Une fiche bien renseignée est le seul levier qui reste quand la géographie ne joue pas en votre faveur.",
    ],
    enjeux: [
      "Le premier enjeu lyonnais tient à l'écart entre la promesse et l'attente. Une carte annoncée comme traditionnelle sera jugée sur ce terrain, et les avis négatifs portent fréquemment sur ce décalage plutôt que sur un défaut de service. Répondre en expliquant le choix de la maison, sans polémiquer, désamorce ce type de commentaire aux yeux du lecteur suivant.",
      "Le second enjeu est la coexistence de deux clientèles sur une même fiche : le touriste de passage dans le Vieux Lyon et l'habitué du plateau. Les deux ne notent pas les mêmes choses. Une collecte auprès de tous les clients, sans sélection, donne une note représentative et évite qu'une seule de ces populations ne détermine à elle seule votre image en ligne.",
    ],
    faqLocale: [
      {
        q: "Un bouchon traditionnel doit-il communiquer différemment sur ses avis Google ?",
        a: "Le fond ne change pas, mais le vocabulaire compte. Décrire clairement la carte et le style de la maison dans la fiche et dans les réponses aux avis aide le client à savoir où il met les pieds. Beaucoup de commentaires négatifs viennent d'une attente mal calée, pas d'un problème en cuisine.",
      },
      {
        q: "Comment gérer les pics de fréquentation liés aux salons professionnels ?",
        a: "En collectant les avis toute l'année, pas seulement pendant les pics. Une collecte continue lisse la courbe et évite qu'une semaine de forte affluence, où le service est sous tension, ne pèse trop lourd dans votre note globale.",
      },
      {
        q: "Faut-il demander un avis à un client qui a mal noté un plat sur place ?",
        a: "Oui. Tous les clients doivent être invités à s'exprimer publiquement, y compris ceux qui ont émis une réserve. Sélectionner les clients selon leur satisfaction est contraire aux règles de Google et fait peser un risque réel sur la fiche. La bonne réponse à un avis critique est une réponse publique soignée.",
      },
      {
        q: "Le Vieux Lyon impose-t-il un rythme de collecte particulier ?",
        a: "Dans un secteur très touristique, l'avis se capte pendant la visite ou juste après, avant que le client ne reprenne la route. Un QR code sur la table ou l'addition est le moyen le plus direct. Pour une clientèle de quartier, un message envoyé plus tard dans la journée fonctionne mieux.",
      },
    ],
    legacyLanding: "/restaurants-lyon.html",
    legacyArticle: "/blog/avis-google-restaurant-lyon.html",
  },
  {
    slug: "marseille",
    name: "Marseille",
    prep: "à Marseille",
    region: "Provence-Alpes-Côte d'Azur",
    gentile: "marseillais",
    intro: "À Marseille, entre le Vieux-Port et les quartiers qui vivent au rythme de la mer, la saisonnalité touristique fait bouger fortement la fréquentation.",
    metaDesc: "Du Vieux-Port au Panier, collectez des avis Google toute l'année pour votre restaurant marseillais : réponses IA, essai gratuit.",
    quartiers: ["le Vieux-Port", "le Panier", "Notre-Dame-du-Mont", "les Goudes", "la Joliette"],
    contexte: "Un afflux estival important rend d'autant plus utile une collecte d'avis régulière toute l'année, pour ne pas dépendre d'une seule saison.",
    quartiersDetail: [
      {
        nom: "Le Vieux-Port",
        texte: "Le pourtour du port concentre les terrasses les plus visibles de la ville et une offre largement tournée vers le poisson et les spécialités provençales. La clientèle est majoritairement de passage, avec une pointe très forte en été et lors des escales de croisière. Les avis y sont nombreux mais souvent courts, écrits dans la foulée du repas.",
      },
      {
        nom: "Le Panier",
        texte: "Dans les ruelles du plus ancien quartier de la ville, les établissements sont de petite capacité et travaillent avec peu de couverts. Une mauvaise soirée se voit immédiatement dans les avis, faute de volume pour la diluer. C'est aussi un secteur où la photo de la fiche Google joue un rôle important, car le client choisit en marchant.",
      },
      {
        nom: "Notre-Dame-du-Mont et le cours Julien",
        texte: "Ce secteur est le plus jeune de la ville en matière de restauration, avec une offre mêlant cuisines du monde, formats à partager et bars à manger. La clientèle est locale, sort en semaine comme le week-end, et se renseigne systématiquement en ligne avant de choisir. Les avis y sont plus longs et plus critiques qu'ailleurs.",
      },
      {
        nom: "Les Goudes, la Joliette et Euroméditerranée",
        texte: "Deux réalités opposées. Vers les Goudes et les calanques, l'activité est très saisonnière et dépend de la météo comme du week-end. Autour de la Joliette et d'Euroméditerranée, la clientèle est celle des bureaux, avec un service du midi qui doit être rapide et régulier pour fidéliser des salariés qui reviennent chaque semaine.",
      },
    ],
    marche: [
      "La restauration marseillaise vit une saisonnalité plus marquée que la plupart des grandes villes françaises. L'été, les croisières et le tourisme balnéaire gonflent la fréquentation des secteurs littoraux et du centre. L'hiver, ces mêmes établissements retombent sur une clientèle locale nettement plus réduite. Cette respiration annuelle se lit directement dans la courbe des avis, et Google, lui, regarde la fraîcheur en continu.",
      "La ville a aussi une culture forte de la spécialité, autour du poisson et des plats provençaux, avec des attentes précises côté client. Un plat annoncé sous un nom traditionnel sera comparé à une référence que le client a en tête. C'est un terrain sur lequel la description de la fiche Google et les réponses aux avis servent à poser clairement ce que la maison propose.",
      "Marseille est enfin une ville très étendue, où les quartiers fonctionnent presque comme des villes distinctes. Un habitant du sud de la ville ne descend pas au Panier pour dîner un soir de semaine. La conséquence est directe pour la recherche locale : votre concurrence réelle est celle de votre secteur, pas celle de la commune entière, et c'est à cette échelle que se joue votre classement.",
    ],
    enjeux: [
      "L'enjeu numéro un est de ne pas laisser la fiche s'endormir en basse saison. Un établissement qui ne collecte que de juin à septembre affiche, en février, des avis vieux de plusieurs mois au moment précis où la clientèle locale, elle, cherche encore où sortir. Une collecte régulière à l'année évite ce trou d'air et sécurise le début de saison suivante.",
      "L'enjeu numéro deux concerne les clients de passage, qui laissent des avis très rapidement mais ne reviendront pas. Il faut donc capter l'avis pendant la visite, par un QR code en salle ou sur l'addition, plutôt que d'espérer une sollicitation ultérieure. Sur les secteurs de bureaux, l'inverse est vrai : le message après la visite fonctionne mieux auprès d'habitués.",
    ],
    faqLocale: [
      {
        q: "Comment maintenir un flux d'avis en dehors de la saison touristique ?",
        a: "En s'appuyant sur la clientèle locale, qui reste présente toute l'année. Un message envoyé après la visite ou une invitation remise en fin de repas suffisent à garder un rythme régulier. L'objectif est d'éviter que la fiche n'affiche, en plein hiver, des avis datant de l'été précédent.",
      },
      {
        q: "Les avis laissés par des croisiéristes ont-ils le même poids ?",
        a: "Pour Google, un avis publié par un compte réel compte, quelle que soit l'origine du client. Ces avis sont souvent courts et rédigés en langue étrangère. Y répondre poliment, même brièvement, améliore la lecture de la fiche par les visiteurs suivants, qui arrivent souvent dans les mêmes conditions.",
      },
      {
        q: "Un restaurant de bord de mer très saisonnier peut-il utiliser Stela toute l'année ?",
        a: "Oui, et c'est justement l'intérêt. L'abonnement continue de faire vivre la fiche hors saison, avec les réponses aux avis et la relance de la clientèle locale, pour ouvrir la saison suivante avec une note solide plutôt qu'une page figée.",
      },
      {
        q: "Faut-il des supports d'avis en plusieurs langues à Marseille ?",
        a: "La page d'avis Google s'affiche déjà dans la langue du téléphone du client, donc le support physique reste simple. Ce qui change, c'est la réponse : soigner les réponses aux avis étrangers vaut le coup dans les secteurs les plus touristiques du centre et du port.",
      },
    ],
    legacyLanding: "/restaurants-marseille.html",
    legacyArticle: "/blog/avis-google-restaurant-marseille.html",
  },
  {
    slug: "bordeaux",
    name: "Bordeaux",
    prep: "à Bordeaux",
    region: "Nouvelle-Aquitaine",
    gentile: "bordelais",
    intro: "Ville de vin et de gastronomie, Bordeaux attire une clientèle locale fidèle et de nombreux visiteurs, du centre classé aux quais réaménagés.",
    metaDesc: "Soignez la réputation Google de votre restaurant bordelais, des Chartrons aux quais : avis clients, réponses IA, essai gratuit.",
    quartiers: ["les Chartrons", "Saint-Pierre", "Saint-Michel", "les Quais", "la Bastide"],
    contexte: "Dans une ville où l'art de vivre est un argument, la note Google et la qualité des réponses aux avis participent à l'image d'un établissement.",
    quartiersDetail: [
      {
        nom: "Les Chartrons",
        texte: "Ancien quartier du négoce du vin, devenu un secteur de brunchs, de bistrots et de caves à manger. La clientèle y est largement bordelaise, sensible au produit et à la carte des vins. Les avis mentionnent souvent le conseil reçu en salle, ce qui fait de la formation de l'équipe un sujet de réputation à part entière.",
      },
      {
        nom: "Saint-Pierre",
        texte: "Au cœur du centre classé au patrimoine mondial de l'UNESCO, les places et ruelles concentrent une densité de terrasses très forte et une clientèle en grande partie touristique. La concurrence se joue à quelques mètres, et la fiche Google, consultée sur place, fait souvent basculer le choix entre deux terrasses voisines.",
      },
      {
        nom: "Saint-Michel et les Capucins",
        texte: "Autour du marché des Capucins, l'offre est plus populaire et cosmopolite, avec des cuisines du monde et des formats simples. La clientèle est mélangée, locale en semaine, plus large le week-end de marché. Le rapport qualité prix domine largement le contenu des avis dans ce secteur.",
      },
      {
        nom: "Les quais, les Bassins à flot et la Bastide",
        texte: "Les quais réaménagés et les Bassins à flot ont vu apparaître des adresses récentes et de plus grande capacité, tournées vers les sorties et les familles. Sur la rive droite, à la Bastide, le tissu reste plus résidentiel et la fréquentation dépend davantage des habitants du secteur que du passage.",
      },
    ],
    marche: [
      "Bordeaux est indissociable de l'œnotourisme, et cela irrigue toute la restauration de la ville. Une part notable de la clientèle vient pour un week-end autour du vin, souvent en provenance de Paris grâce à la liaison ferroviaire rapide, et enchaîne visites de propriétés et repas en ville. Ces visiteurs préparent leur séjour en ligne, comparent les fiches Google en amont et réservent avant même d'arriver.",
      "L'autre trait du marché bordelais est l'importance donnée à l'accord entre la table et la cave. Le client attend un conseil, et le juge. C'est une opportunité de différenciation dans les avis, car un commentaire élogieux sur un conseil de vin est un argument commercial que peu de concurrents savent provoquer, et qu'aucune photo ne remplace.",
      "Le tramway et la piétonnisation d'une large partie du centre ont par ailleurs modifié les habitudes de déplacement des Bordelais, qui circulent facilement d'un quartier à l'autre en soirée. Un établissement peut donc capter une clientèle qui ne vit pas dans son secteur, à condition d'être visible au moment de la recherche. C'est exactement ce que produit une fiche Google active, avec des avis récents et des photos à jour.",
    ],
    enjeux: [
      "Le premier enjeu bordelais est la préparation à distance du séjour. Beaucoup de clients choisissent leur table depuis une autre région, plusieurs jours avant. La fiche doit donc être irréprochable en amont : horaires exacts, photos récentes, avis frais et réponses présentes. Une fiche à l'abandon élimine l'établissement d'une sélection faite à cinq cents kilomètres de là.",
      "Le second enjeu est le contraste entre le centre très touristique et les quartiers résidentiels. Dans le premier, il faut capter l'avis avant le départ du client. Dans le second, la fidélisation prime et la collecte peut s'appuyer sur des clients qui reviennent. Un même établissement bordelais mène souvent les deux batailles selon la saison.",
    ],
    faqLocale: [
      {
        q: "Les avis Google influencent-ils vraiment les visiteurs venus pour l'œnotourisme ?",
        a: "Fortement, car ces séjours se préparent en ligne, souvent plusieurs jours à l'avance et depuis une autre région. La fiche Google est consultée avant la réservation, au même titre que les photos et la carte. Des avis récents et des réponses soignées pèsent donc dès la phase de recherche.",
      },
      {
        q: "Comment valoriser une carte des vins dans sa réputation en ligne ?",
        a: "En invitant simplement tous les clients à s'exprimer, sans orienter le contenu de l'avis. Un conseil de salle réussi ressort spontanément dans les commentaires. Vous pouvez ensuite mettre ce point en avant dans vos réponses publiques, qui sont lues par les visiteurs suivants.",
      },
      {
        q: "Faut-il traiter différemment les avis du centre classé et ceux des quartiers résidentiels ?",
        a: "Le traitement reste le même, mais le moment de la sollicitation change. Dans le centre touristique, l'avis se demande pendant la visite. Dans les quartiers résidentiels, un message envoyé après le repas fonctionne mieux, car le client garde un lien avec l'établissement.",
      },
      {
        q: "Un restaurant bordelais peut-il proposer une remise contre un avis ?",
        a: "Non, jamais. Récompenser un avis est contraire aux règles de Google, quel que soit le montant, et expose la fiche à une sanction. La collecte doit rester une invitation neutre adressée à tous les clients, sans contrepartie et sans sélection selon la note attendue.",
      },
    ],
    legacyLanding: "/restaurants-bordeaux.html",
    legacyArticle: "/blog/avis-google-restaurant-bordeaux.html",
  },
  {
    slug: "nice",
    name: "Nice",
    prep: "à Nice",
    region: "Provence-Alpes-Côte d'Azur",
    gentile: "niçois",
    intro: "À Nice, la Promenade des Anglais et le Vieux-Nice concentrent un tourisme intense, avec une clientèle souvent de passage qui décide sur les avis.",
    metaDesc: "Avec une clientèle de passage entre le Vieux-Nice et la Promenade des Anglais, captez l'avis juste après la visite. Collecte conforme, essai gratuit.",
    quartiers: ["le Vieux-Nice", "le port", "Cimiez", "la Promenade des Anglais", "Libération"],
    contexte: "Avec beaucoup de clients de passage, obtenir un avis juste après la visite est décisif pour bâtir une réputation solide.",
    quartiersDetail: [
      {
        nom: "Le Vieux-Nice",
        texte: "Entre le cours Saleya et les ruelles de la vieille ville, l'offre va de la spécialité niçoise à emporter aux tables assises à forte rotation. La clientèle est très majoritairement de passage, souvent étrangère, et décide sur place en comparant les fiches et les cartes affichées. Les avis y arrivent vite et repartent aussi vite dans le flux.",
      },
      {
        nom: "Le port et le quartier du Lympia",
        texte: "Le secteur du port accueille des tables plus installées, davantage tournées vers le poisson et vers une clientèle locale de fin de semaine. Le rythme y est moins effréné que dans la vieille ville, et les avis sont plus circonstanciés, écrits par des clients qui prennent le temps de détailler leur repas.",
      },
      {
        nom: "La Promenade des Anglais et le carré d'or",
        texte: "L'axe hôtelier concentre les brasseries et les établissements liés au tourisme d'affaires et de congrès. La clientèle est internationale et exigeante sur la constance du service. Une fiche Google dans plusieurs langues, avec des horaires parfaitement à jour, y est un outil de travail quotidien.",
      },
      {
        nom: "Libération et Cimiez",
        texte: "Autour du marché de la Libération, on retrouve une restauration de quartier, appuyée sur les producteurs locaux et une clientèle niçoise fidèle. Cimiez, plus résidentiel et calme, fonctionne surtout à la réputation de proximité. Ce sont les secteurs où la relation client sur la durée compte le plus.",
      },
    ],
    marche: [
      "Nice combine trois flux de clientèle qui ne se comportent pas de la même façon : le tourisme de loisir, très marqué en saison, le tourisme d'affaires lié aux congrès et à l'aéroport, et une clientèle niçoise qui vit la ville à l'année. Un même établissement peut voir sa fréquentation basculer d'un profil à l'autre selon le mois, avec des attentes et des avis qui changent en conséquence.",
      "La ville a aussi une identité culinaire propre et défendue, autour des spécialités niçoises, avec une reconnaissance locale des maisons qui respectent ces recettes. Cela crée une attente précise chez le client averti, et un terrain de comparaison permanent. Décrire honnêtement sa carte évite une bonne partie des malentendus qui finissent en avis mitigés.",
      "La proximité de l'aéroport et de la frontière italienne complète ce tableau, avec une clientèle qui arrive parfois pour deux jours seulement et organise tout depuis son téléphone. Pour ces visiteurs, la fiche Google n'est pas un support parmi d'autres : c'est le point d'entrée unique, celui qui décide de la réservation comme du trajet à pied jusqu'à votre porte.",
    ],
    enjeux: [
      "Le premier enjeu niçois est le temps très court dont vous disposez. Un client de passage quitte la ville dans les jours qui suivent et n'ouvrira probablement jamais un email de relance. L'avis doit donc être proposé pendant la visite, au moment de l'addition, quand le souvenir est frais et le téléphone déjà en main.",
      "Le second enjeu est la lecture multilingue de votre fiche. Les avis en anglais, en italien ou en allemand sont fréquents et pèsent sur la décision de visiteurs qui partagent le même profil. Répondre à ces avis, même simplement, améliore nettement l'impression laissée par la fiche à un lecteur étranger qui hésite entre deux adresses.",
    ],
    faqLocale: [
      {
        q: "Comment obtenir un avis d'un client qui ne reviendra jamais ?",
        a: "En le sollicitant pendant sa visite. Un QR code sur la table, sur l'addition ou sur le comptoir permet de laisser un avis en quelques secondes, tant que le client est encore sur place. C'est le canal le plus efficace face à une clientèle de passage.",
      },
      {
        q: "Les avis en langue étrangère pénalisent-ils la fiche d'un restaurant niçois ?",
        a: "Non, ils l'enrichissent. Google affiche les avis avec une traduction, et un lecteur étranger accorde du crédit aux avis rédigés dans sa langue. Le seul point d'attention est d'y répondre, pour montrer que l'établissement s'adresse aussi à cette clientèle.",
      },
      {
        q: "Le tourisme d'affaires change-t-il la façon de gérer sa réputation ?",
        a: "Il déplace le curseur vers la fiabilité. Un client en déplacement veut des horaires exacts, une localisation juste et un service constant. Ces éléments reviennent souvent dans les avis liés aux congrès, et une fiche à jour évite les commentaires négatifs qui n'ont rien à voir avec la cuisine.",
      },
      {
        q: "Faut-il collecter des avis hors saison à Nice ?",
        a: "Oui. La clientèle niçoise vit la ville toute l'année, et c'est elle qui alimente la fiche en janvier. Une collecte continue évite d'afficher, au moment où la saison redémarre, des avis qui datent tous de l'été précédent.",
      },
    ],
    legacyLanding: "/restaurants-nice.html",
    legacyArticle: "/blog/avis-google-restaurant-nice.html",
  },
  {
    slug: "nantes",
    name: "Nantes",
    prep: "à Nantes",
    region: "Pays de la Loire",
    gentile: "nantais",
    intro: "Ville dynamique et jeune, Nantes a une clientèle très connectée qui consulte spontanément les avis en ligne avant de sortir.",
    metaDesc: "À Nantes, une clientèle jeune et connectée consulte les avis avant de sortir : soignez votre présence Google, du Bouffay à l'île de Nantes. Essai gratuit.",
    quartiers: ["le Bouffay", "l'île de Nantes", "Graslin", "Talensac", "Chantenay"],
    contexte: "Auprès d'une population habituée au numérique, une présence en ligne soignée et des avis récents sont particulièrement déterminants.",
    quartiersDetail: [
      {
        nom: "Le Bouffay",
        texte: "Le quartier médiéval concentre la plus forte densité de restaurants et de bars du centre, avec des rues piétonnes très fréquentées le soir et le week-end. La clientèle est jeune, sort en groupe et choisit souvent en marchant, téléphone en main. Une fiche avec des photos récentes y a un effet direct sur le nombre d'entrées.",
      },
      {
        nom: "Graslin et le centre",
        texte: "Autour de la place Graslin et du théâtre, on trouve des brasseries installées de longue date et une clientèle plus large, familles comprises, notamment avant ou après une sortie culturelle. Le service y est jugé sur la régularité, et les avis mentionnent fréquemment le respect des horaires annoncés.",
      },
      {
        nom: "L'île de Nantes",
        texte: "Le secteur, profondément transformé, mêle lieux culturels, écoles, bureaux et adresses récentes aux formats plus contemporains. La clientèle est composite : étudiants et salariés le midi, sorties le soir et le week-end. C'est le quartier où les concepts nouveaux apparaissent le plus vite, donc celui où la comparaison en ligne est la plus vive.",
      },
      {
        nom: "Talensac et Chantenay",
        texte: "Autour du marché de Talensac, la restauration s'appuie sur le produit et sur une clientèle de proximité. À Chantenay, quartier plus populaire et en évolution, l'offre reste ancrée dans la vie de voisinage. Dans les deux cas, la réputation se construit sur la durée avec des habitués plutôt que sur le passage.",
      },
    ],
    marche: [
      "Nantes se distingue par une clientèle jeune et très à l'aise avec le numérique, portée par une importante population étudiante et par un tissu de services. Concrètement, la recherche sur téléphone précède presque systématiquement la sortie, et la fiche Google fait office de vitrine principale, souvent avant le site de l'établissement lui-même.",
      "La ville bénéficie aussi d'une saison culturelle et estivale marquée, avec des événements qui attirent un public venu d'autres régions pendant plusieurs semaines. Ces périodes créent un afflux de nouveaux clients qui découvrent les adresses par la carte Google, et donc une opportunité de collecte plus dense, à condition d'être organisé avant que la période ne commence.",
      "Le Nantais se déplace enfin volontiers d'un quartier à l'autre pour une bonne adresse, aidé par un réseau de tramway dense et une ville compacte. Cela élargit votre zone de chalandise réelle bien au-delà de votre rue, mais cela vous met aussi en concurrence avec des établissements que vous ne voyez jamais. Sur ce terrain, la fiche Google est le seul endroit où la comparaison se fait vraiment.",
    ],
    enjeux: [
      "Le premier enjeu nantais est la vitesse de comparaison. Devant une rue entière de terrasses, le client compare trois fiches en moins d'une minute. Le nombre d'avis, la note et la date du dernier avis sont les trois signaux visibles immédiatement. Une fiche dont le dernier avis remonte à plusieurs mois est écartée sans même être ouverte.",
      "Le second enjeu est la fidélisation d'une clientèle jeune qui change vite d'habitudes. Collecter l'avis est une première étape, mais garder le lien après la visite compte tout autant. Un message envoyé plus tard, sans contrepartie liée à l'avis, permet de faire revenir un client qui vous avait simplement oublié. Sur un marché où les nouvelles adresses ouvrent vite, cette relance vaut souvent plus qu'une campagne de communication, parce qu'elle s'adresse à des gens qui connaissent déjà votre cuisine.",
    ],
    faqLocale: [
      {
        q: "Pourquoi la date du dernier avis compte-t-elle autant à Nantes ?",
        a: "Parce que la clientèle compare plusieurs fiches en quelques secondes avant de choisir une adresse. Un avis récent signale un établissement en activité et rassure. Une fiche dont le dernier avis date de plusieurs mois donne l'impression d'un endroit délaissé, même si la salle est pleine tous les soirs.",
      },
      {
        q: "Comment tirer parti des périodes d'affluence culturelle et estivale ?",
        a: "En préparant la collecte avant la période, pas pendant. Les supports doivent être en place et l'équipe rodée dès le premier jour d'affluence, pour transformer ce flux de nouveaux clients en avis récents qui serviront ensuite toute l'année.",
      },
      {
        q: "Une clientèle étudiante laisse-t-elle des avis utiles ?",
        a: "Oui, et elle le fait volontiers, généralement depuis son téléphone et dans la foulée du repas. Ces avis mentionnent souvent le rapport qualité prix et l'ambiance, deux critères déterminants pour les lecteurs suivants dans les quartiers de sortie.",
      },
      {
        q: "Faut-il un QR code ou un message après la visite à Nantes ?",
        a: "Les deux se complètent. Le QR code capte les clients de passage dans les rues piétonnes, le message après la visite s'adresse aux habitués des quartiers résidentiels. Dans tous les cas, l'invitation doit être adressée à tous les clients, sans filtrage selon la satisfaction.",
      },
    ],
    legacyLanding: "/restaurants-nantes.html",
    legacyArticle: "/blog/avis-google-restaurant-nantes.html",
  },
  {
    slug: "brest",
    name: "Brest",
    prep: "à Brest",
    region: "Bretagne",
    gentile: "brestois",
    intro: "À Brest, ville portuaire et étudiante, la fidélité de la clientèle locale se construit sur la durée, et les avis y jouent un rôle de confiance.",
    metaDesc: "À Brest, ville portuaire et étudiante, chaque avis compte pour se démarquer. Collectez-les auprès de tous vos clients, sans filtrage. Essai gratuit.",
    quartiers: ["Siam", "Recouvrance", "Saint-Martin", "le port de commerce", "les Quatre-Moulins"],
    contexte: "Sur un marché plus resserré qu'une grande métropole, chaque avis compte davantage pour se démarquer localement.",
    quartiersDetail: [
      {
        nom: "La rue de Siam et le centre",
        texte: "L'artère principale de la ville concentre les commerces et une restauration de centre-ville, entre brasseries, crêperies et enseignes. La clientèle est locale, avec un service du midi porté par les salariés du secteur. La régularité du service à l'heure du déjeuner ressort très souvent dans les commentaires.",
      },
      {
        nom: "Saint-Martin",
        texte: "Quartier vivant et apprécié pour ses bars et ses petites adresses, Saint-Martin attire une clientèle plutôt jeune, étudiante et habituée des lieux. Les établissements y sont de taille modeste, et la réputation se joue au bouche-à-oreille autant qu'en ligne, les deux se nourrissant l'un l'autre.",
      },
      {
        nom: "Le port de commerce",
        texte: "Le port est le pôle des sorties du soir, avec des adresses tournées vers les produits de la mer, des bars et des lieux de concert. La fréquentation dépend beaucoup des soirées et des événements, ce qui crée des pics ponctuels où la collecte d'avis peut être particulièrement productive.",
      },
      {
        nom: "Recouvrance et les Quatre-Moulins",
        texte: "Sur la rive droite, le tissu est plus résidentiel et l'offre plus quotidienne, adossée à la vie de quartier. La clientèle revient régulièrement, ce qui rend la relation dans la durée plus déterminante que la captation d'un flux de passage.",
      },
      {
        nom: "Le Moulin-Blanc et le littoral",
        texte: "Vers la plage du Moulin-Blanc et le port de plaisance, la fréquentation dépend de la météo, des week-ends et des vacances scolaires, avec une clientèle familiale et régionale. Les établissements de ce secteur connaissent donc une activité en dents de scie, ce qui rend la régularité de la collecte d'avis plus difficile à tenir, et d'autant plus payante quand elle l'est.",
      },
    ],
    marche: [
      "Brest est un marché plus resserré qu'une grande métropole, et cela change complètement l'arithmétique de la réputation. Le nombre d'avis à atteindre pour figurer parmi les mieux notés d'un secteur est plus accessible, mais chaque avis pèse aussi plus lourd dans la moyenne. Une série de trois commentaires négatifs se rattrape moins vite qu'à Paris ou à Lyon.",
      "La ville vit par ailleurs au rythme de son université, de ses écoles et de son activité maritime, avec de grands rendez-vous nautiques qui reviennent régulièrement et attirent un public venu de loin. Ces périodes sont des fenêtres de visibilité importantes pour un établissement, à condition que la fiche soit prête et la collecte déjà en place lorsque le public arrive.",
      "Le climat joue par ailleurs un rôle qu'il serait absurde d'ignorer : les terrasses ne portent pas l'activité comme dans le Sud, et la fréquentation se reporte davantage sur la salle et sur les habitudes de la clientèle locale. Cela rend la relation client dans la durée plus déterminante que la captation d'un flux saisonnier, et donc la collecte d'avis auprès des habitués d'autant plus stratégique.",
    ],
    enjeux: [
      "Le premier enjeu brestois est l'effet de levier de chaque avis. Sur un marché de taille moyenne, passer de quelques dizaines à plus d'une centaine d'avis change la lecture de la fiche par un client qui hésite. Une collecte systématique, service après service, produit cet écart en quelques mois, sans aucune pratique interdite.",
      "Le second enjeu est la fidélité. La clientèle locale revient, et elle se souvient de la façon dont un établissement répond publiquement à une critique. Une réponse posée et factuelle à un avis négatif est lue par des habitants qui, eux, resteront dans le quartier des années. C'est aussi pour cela qu'il ne faut jamais laisser un commentaire critique sans réponse : dans une ville où tout le monde se croise, le silence est interprété comme un aveu, alors qu'une explication courte et honnête referme le sujet.",
    ],
    faqLocale: [
      {
        q: "Sur un marché comme Brest, combien d'avis faut-il pour se démarquer ?",
        a: "Il n'existe pas de seuil officiel communiqué par Google, et il faut se méfier des chiffres avancés sans source. Ce qui est certain, c'est que la comparaison se fait entre établissements du même secteur : l'objectif utile est de se situer dans le haut du panier local, avec des avis récents et réguliers.",
      },
      {
        q: "Comment profiter des grands événements maritimes pour sa réputation ?",
        a: "En ayant les supports de collecte en place avant l'événement. Le public présent pendant ces périodes découvre la ville et cherche où manger via la carte Google. Les avis obtenus à ce moment continueront de travailler pour vous longtemps après.",
      },
      {
        q: "La clientèle étudiante est-elle utile pour la note d'un restaurant brestois ?",
        a: "Oui, elle est particulièrement active en ligne et laisse volontiers un avis depuis son téléphone. Comme partout, la règle reste la même : inviter tous les clients à s'exprimer, sans sélectionner selon la satisfaction supposée.",
      },
      {
        q: "Faut-il répondre à tous les avis quand on en reçoit peu ?",
        a: "Oui, c'est même plus facile et plus payant qu'ailleurs. Quand le volume est modéré, répondre à chaque avis est réaliste et donne à la fiche une image d'établissement attentif, ce qui compte beaucoup auprès d'une clientèle de proximité.",
      },
    ],
    legacyLanding: "/restaurants-brest.html",
    legacyArticle: "/blog/avis-google-restaurant-brest.html",
  },
  {
    slug: "rouen",
    name: "Rouen",
    prep: "à Rouen",
    region: "Normandie",
    gentile: "rouennais",
    intro: "À Rouen, entre le centre médiéval et les quais de Seine, un tissu de restaurants indépendants se partage une clientèle locale attentive aux avis.",
    metaDesc: "À Rouen, une bonne réputation Google aide un restaurant indépendant à se distinguer des chaînes, du centre médiéval aux quais de Seine. Essai gratuit.",
    quartiers: ["le Vieux-Rouen", "le centre", "Saint-Marc", "la rive gauche", "les quais"],
    contexte: "Dans une ville de taille moyenne, une réputation en ligne bien tenue permet à un indépendant de se distinguer des chaînes.",
    quartiersDetail: [
      {
        nom: "Le Vieux-Rouen et le Gros-Horloge",
        texte: "Le centre historique, avec ses maisons à colombages et sa cathédrale, concentre le flux touristique de la ville. Les rues piétonnes accueillent des terrasses et des adresses très visibles, où la clientèle de passage domine en journée. La photo et la note de la fiche Google font une grande partie du travail de vitrine.",
      },
      {
        nom: "Le centre commerçant et Saint-Marc",
        texte: "Autour des rues commerçantes et du marché Saint-Marc, la restauration s'adresse d'abord aux Rouennais, avec des formules du midi et une clientèle de salariés et de commerçants. La régularité et le respect du temps de service comptent davantage ici que l'originalité de la carte.",
      },
      {
        nom: "Les quais de Seine",
        texte: "Les quais réaménagés accueillent des sorties, des promenades et de grands rendez-vous maritimes qui reviennent régulièrement et attirent un public nombreux venu de toute la région. Les établissements du secteur connaissent donc des périodes de très forte affluence, entrecoupées de semaines beaucoup plus calmes.",
      },
      {
        nom: "La rive gauche et Saint-Sever",
        texte: "Plus résidentielle et commerçante, la rive gauche vit surtout de sa population et de ses actifs. L'offre y est quotidienne et la fidélité prime. Une bonne réputation en ligne y sert moins à capter un flux qu'à rassurer un habitant qui hésite entre deux adresses de son quartier.",
      },
    ],
    marche: [
      "Rouen est une ville de taille moyenne avec un patrimoine fort et une proximité immédiate avec la région parisienne, ce qui lui vaut une clientèle de week-end venue pour la cathédrale, l'histoire de la ville et les bords de Seine. Ce public prépare sa venue en ligne et arrive avec une liste d'adresses déjà repérées sur la carte Google.",
      "Le tissu local reste largement composé d'indépendants, face à des enseignes nationales bien installées dans les zones commerçantes. Pour un indépendant, la fiche Google est le terrain où la partie est la plus jouable : elle ne coûte rien à tenir correctement, et une note solide adossée à des avis récents compense un budget de communication sans commune mesure avec celui d'une chaîne.",
      "La ville est enfin traversée par la Seine, avec une vie qui n'est pas la même sur les deux rives, et un centre où l'essentiel des trajets se fait à pied. Pour un restaurant, cela signifie que la recherche locale se joue sur un périmètre très court : être le bon résultat dans les cinq minutes de marche autour de soi compte davantage que d'être connu à l'échelle de la ville.",
    ],
    enjeux: [
      "Le premier enjeu rouennais est de tenir la fiche entre deux périodes d'affluence. Les grands événements des quais amènent un public considérable, puis la ville retrouve son rythme. Une collecte continue permet d'entrer dans la période suivante avec une fiche vivante, plutôt qu'avec un bloc d'avis tous datés du même mois.",
      "Le second enjeu est la comparaison avec les chaînes. Sur une recherche locale, un indépendant apparaît à côté d'enseignes qui cumulent des milliers d'avis. Le classement local tient toutefois compte de la proximité et de la pertinence, et une fiche d'indépendant bien tenue, avec des réponses personnalisées, se distingue précisément là où la chaîne reste impersonnelle. Un client qui lit deux réponses successives, l'une manifestement automatique et l'autre visiblement écrite par le patron, fait très vite la différence.",
    ],
    faqLocale: [
      {
        q: "Comment un restaurant indépendant peut-il rivaliser avec une chaîne à Rouen ?",
        a: "En jouant sur ce que la chaîne fait mal : des réponses personnalisées aux avis, des photos réelles de la salle et des plats, une fiche à jour. Le classement local tient compte de la proximité et de la pertinence, pas seulement du volume d'avis accumulé au niveau national.",
      },
      {
        q: "Les grands événements des quais valent-ils la peine d'être préparés côté avis ?",
        a: "Oui. Ces périodes amènent un public venu de toute la région, qui découvre des adresses via la carte Google. Avoir les supports de collecte prêts avant l'événement transforme cette affluence en avis récents utiles pendant les mois qui suivent.",
      },
      {
        q: "Faut-il collecter des avis auprès de la clientèle du midi ?",
        a: "Absolument, c'est même une part de clientèle souvent négligée. Les habitués du déjeuner reviennent chaque semaine et laissent des avis fiables sur la régularité du service, un critère très lu par les nouveaux clients.",
      },
      {
        q: "Un avis négatif fait-il beaucoup de dégâts sur une petite fiche rouennaise ?",
        a: "Il pèse davantage que sur une fiche à plusieurs centaines d'avis, mécaniquement. C'est pourquoi la meilleure protection est le volume régulier : plus la collecte est continue, moins un commentaire isolé déplace la moyenne, et une réponse publique soignée limite son effet sur les lecteurs.",
      },
    ],
    legacyLanding: "/restaurants-rouen.html",
    legacyArticle: "/blog/avis-google-restaurant-rouen.html",
  },
  {
    slug: "nancy",
    name: "Nancy",
    prep: "à Nancy",
    region: "Grand Est",
    gentile: "nancéien",
    intro: "À Nancy, autour de la place Stanislas, une clientèle locale et étudiante fréquente des établissements qui se jouent beaucoup sur la réputation de quartier.",
    metaDesc: "Autour de la place Stanislas, la réputation de quartier fait le plein : collectez plus d'avis Google pour votre restaurant nancéien. Conforme, essai gratuit.",
    quartiers: ["la place Stanislas", "la Ville-Vieille", "Saint-Sébastien", "le centre", "Nancy-Thermal"],
    contexte: "Dans un centre-ville vivant, la note Google et la fraîcheur des avis orientent une part importante des choix.",
    quartiersDetail: [
      {
        nom: "La place Stanislas et ses abords",
        texte: "Inscrite au patrimoine mondial de l'UNESCO avec les places Carrière et d'Alliance, la place Stanislas est le point de passage obligé des visiteurs. Les brasseries qui l'entourent travaillent une clientèle de passage, avec de grandes terrasses et une carte lisible. Le service y est jugé sur la rapidité et la constance, et les avis y arrivent en volume dès les beaux jours.",
      },
      {
        nom: "La Ville-Vieille",
        texte: "Autour de la Grande-Rue et de la porte de la Craffe, on trouve des adresses plus petites et plus intimes, où la bistronomie et les cartes courtes sont bien représentées. La clientèle est locale, vient sur recommandation et prend le temps de détailler son expérience dans les avis, ce qui en fait un secteur où la qualité rédactionnelle des réponses compte.",
      },
      {
        nom: "Le quartier de la gare et le centre commerçant",
        texte: "Entre la gare et les rues commerçantes du centre, la restauration s'adresse aux voyageurs et aux salariés, avec des formules du midi et une forte contrainte de temps. La fiche Google y est consultée dans l'urgence, souvent quelques minutes avant le repas, ce qui rend les horaires exacts et la localisation précise décisifs.",
      },
      {
        nom: "Saint-Sébastien, Nancy-Thermal et les quartiers résidentiels",
        texte: "Autour du marché couvert Saint-Sébastien et dans les secteurs résidentiels, la restauration vit du voisinage et des habitués. Le développement du site thermal a amené une fréquentation nouvelle sur ce secteur. Ici, la réputation se construit lentement, sur des clients qui reviennent, et un avis récent vaut souvent une recommandation entre voisins.",
      },
    ],
    marche: [
      "Nancy tient une bonne part de son attractivité de son patrimoine, avec un ensemble classé au patrimoine mondial de l'UNESCO au centre de la ville et un héritage Art nouveau, celui de l'École de Nancy, encore lisible dans les décors de plusieurs établissements du centre. Cette identité attire un tourisme culturel de courte durée, souvent sur un week-end, qui repère ses adresses en ligne avant d'arriver.",
      "La ville est aussi universitaire, avec une population étudiante importante qui fait vivre les brasseries et les adresses abordables du centre, et proche de l'axe Metz Luxembourg, ce qui amène une clientèle professionnelle en semaine. Ces publics se superposent sur une même fiche : le visiteur du week-end, l'étudiant du jeudi soir et le cadre en déplacement ne jugent pas le même service.",
      "Nancy est enfin une ville compacte, où le centre se parcourt à pied et où les quartiers se touchent. Un client qui cherche un restaurant sur son téléphone voit donc apparaître, dans la même liste, des établissements aux styles très différents situés à quelques rues les uns des autres. La fiche Google devient l'endroit où votre positionnement doit être immédiatement lisible, sous peine d'être comparé à des adresses qui ne jouent pas le même jeu.",
    ],
    enjeux: [
      "Le premier enjeu nancéien est saisonnier et météorologique. Les terrasses du centre, très exposées dès le printemps, génèrent un pic d'avis concentré sur quelques mois. Un établissement qui ne collecte qu'à cette période présente en février une fiche figée, au moment où la clientèle locale, elle, sort toujours. Une collecte à l'année corrige ce déséquilibre.",
      "Le second enjeu est la cohabitation de publics aux attentes différentes sur une seule fiche. Un avis d'étudiant sur le rapport qualité prix et un avis de visiteur sur le cadre patrimonial coexistent dans la même liste. Inviter tous les clients à s'exprimer, sans en sélectionner aucun, donne une note représentative de la réalité de la salle plutôt que du seul public le plus enclin à écrire.",
    ],
    faqLocale: [
      {
        q: "Les terrasses de la place Stanislas suffisent-elles à remplir sans travailler ses avis ?",
        a: "L'emplacement amène du passage, mais il ne protège de rien. Un visiteur qui hésite entre plusieurs terrasses voisines ouvre les fiches Google et compare les notes et les avis récents. Sur un secteur aussi fréquenté, l'écart se joue précisément là.",
      },
      {
        q: "Comment gérer l'effet saisonnier des terrasses sur la collecte d'avis ?",
        a: "En collectant aussi hors saison, auprès de la clientèle locale qui continue de sortir. L'objectif est d'éviter qu'en plein hiver la fiche n'affiche que des avis datant de l'été. Un message envoyé après la visite prend le relais quand les terrasses se vident.",
      },
      {
        q: "La clientèle étudiante et la clientèle patrimoniale s'annulent-elles dans la note ?",
        a: "Non, elles se complètent, à condition de solliciter tout le monde. Le risque n'est pas d'avoir deux publics, c'est de n'en solliciter qu'un seul : la note devient alors le reflet d'une partie de la salle seulement, et elle surprend les clients de l'autre catégorie.",
      },
      {
        q: "Un restaurant près de la gare a-t-il des points de vigilance particuliers ?",
        a: "Oui, la précision de la fiche. Un voyageur consulte les horaires et la localisation quelques minutes avant de venir, souvent avec un train à prendre. Un horaire erroné ou une fermeture non signalée génère des avis négatifs qui ne portent pas du tout sur la cuisine.",
      },
    ],
    legacyLanding: "/restaurants-nancy.html",
    legacyArticle: "/blog/avis-google-restaurant-nancy.html",
  },
];

export const citySlugs = () => CITIES.map((c) => c.slug);

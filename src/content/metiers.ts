// Contenu métier des pages /pour/ (LOT SEO-FIX-2).
//
// POURQUOI CE FICHIER EXISTE. Les six pages /pour/ faisaient 300 à 430 mots, dont
// 30 à 50 propres au métier : le reste était le même gabarit répété. La mesure du
// 02/09/2026 a montré que ce n'est PAS ce qui les empêche d'être indexées
// (restaurants-brest est identique à ses huit soeurs indexées et Google le refuse
// quand même). On les répare donc pour la seule bonne raison : ce sont des pages
// commerciales faibles, et un coiffeur qui les lit doit reconnaitre son métier.
//
// LA RÈGLE D'ÉCRITURE. Chaque bloc doit être IMPOSSIBLE à écrire pour un autre
// métier. Pas « votre secteur » ni « vos clients » : le bac, l'ordre de
// réparation, le check-out, la cabine. Un paragraphe qui marcherait aussi bien
// sur une autre page n'a rien à faire ici.
//
// LES CHIFFRES. Quatre pages sur six portent un chiffre sourcé, et deux n'en
// portent aucun. C'est volontaire : sur les indépendants et les
// multi-établissements, aucune donnée sectorielle solide n'a été trouvée, et un
// chiffre plausible avec une source approximative sur une page commerciale est
// exactement ce qui se retourne contre nous. Une page sans chiffre mais avec du
// vrai vocabulaire vaut mieux.

export type Metier = {
  introTitre: string;
  etapesTitre: string;
  intro: string[];
  moment: { titre: string; texte: string[] };
  objection: { titre: string; texte: string[] };
  etapes: { t: string; d: string }[];
  chiffre?: { valeur: string; phrase: string; source: string };
};

export const METIERS: Record<string, Metier> = {
  coiffeur: {
    introTitre: "Ce qu'un salon a de particulier",
    etapesTitre: "Du fauteuil à l'avis publié",
    intro: [
      "Un salon vit au rythme du planning. Entre deux couleurs, il y a le temps de pose, le passage au bac, le brushing de la cliente d'avant qui n'est pas encore partie et celle de 15 h qui arrive en avance. Personne, dans ce créneau, n'a la main libre pour ouvrir Google et demander un avis.",
      "C'est le premier problème de la réputation en coiffure : le moment où la cliente est le plus contente est aussi celui où vous êtes le plus occupé. Le coup de miroir, la mèche qu'on replace, le « c'est exactement ce que je voulais » : trois secondes plus tard vous encaissez, elle est partie, et l'avis n'existera jamais.",
      "Le second problème est que la coiffure se juge sur la durée. Une couleur se voit vraiment au deuxième shampoing, un balayage au bout de quinze jours, une coupe quand la cliente arrive à la refaire seule. Une demande envoyée trop tôt attrape l'émotion de la sortie du salon ; envoyée au bon moment, elle attrape le jugement.",
    ],
    moment: {
      titre: "Le bon moment pour demander un avis dans un salon",
      texte: [
        "Pas au fauteuil, pas à la caisse. Le lendemain, quand la cliente s'est recoiffée elle-même et a constaté que la coupe retombe bien. C'est là qu'elle a un avis à donner, et pas seulement une politesse à rendre.",
        "Stela envoie la demande à ce moment-là, automatiquement, sans que vous ayez à y penser entre deux clientes. Vous choisissez le délai une fois, il s'applique ensuite à tout le monde.",
        "Les coiffeurs à domicile et les salons à fauteuils partagés fonctionnent pareil : la demande part au nom du salon, ou au nom du professionnel qui a réalisé la prestation, selon ce que vous réglez à l'installation.",
      ],
    },
    objection: {
      titre: "« Et si une couleur ratée me vaut une étoile ? »",
      texte: [
        "C'est la crainte de tous les salons, et c'est justement pour ça qu'on ne trie pas. Un salon qui ne collecte que les avis de ses clientes contentes finit avec dix avis parfaits et un profil que Google peut sanctionner. Un salon qui collecte tout finit avec deux cents avis et une moyenne de 4,7, où le 2 étoiles de la cliente déçue passe pour ce qu'il est : un accident.",
        "Le volume est votre protection, pas le filtrage. Et une couleur ratée à laquelle vous répondez publiquement en proposant une retouche vaut mieux, aux yeux de la suivante, qu'un mur d'avis sans une seule ombre.",
      ],
    },
    etapes: [
      { t: "La cliente règle sa prestation", d: "Rien à faire de votre côté : la coupe, la couleur ou le brushing est encaissé comme d'habitude." },
      { t: "Le lendemain, la demande part", d: "Un message court, au nom du salon, avec le lien direct vers votre fiche Google." },
      { t: "L'avis arrive, la réponse est prête", d: "Nova rédige une réponse qui reprend la prestation citée. Vous relisez, vous envoyez." },
      { t: "La cliente déçue est rattrapée", d: "Un retour tiède déclenche une proposition de retouche avant qu'elle ne cherche un autre salon." },
    ],
    chiffre: {
      valeur: "111 200",
      phrase: "établissements de coiffure en activité en France, en salon ou à domicile. Dans une même rue, votre fiche Google est souvent le seul critère qui vous distingue du salon d'en face.",
      source: "UNEC et Institut Supérieur des Métiers, chiffres clés 2025, d'après données INSEE",
    },
  },

  institut: {
    introTitre: "Ce que la cabine change à tout",
    etapesTitre: "De la fin du soin à l'avis",
    intro: [
      "En institut, tout se passe en cabine, et la cabine est un lieu fermé. La cliente arrive habillée, ressort démaquillée ou les cheveux relevés, souvent un peu ailleurs après un modelage. Lui tendre un téléphone à ce moment-là pour lui demander un avis public, c'est mal lire la situation.",
      "Le vocabulaire du métier dit déjà pourquoi : un protocole de soin du visage, une cure de six séances, une épilation, une pose de semi-permanent, des extensions de cils. Ce sont des prestations dont le résultat se juge après, parfois plusieurs jours après, et dont certaines ne se racontent pas volontiers en public.",
      "Une demande d'avis en institut doit donc être discrète dans sa forme et patiente dans son moment. C'est l'inverse exact de ce que fait une tablette posée sur le comptoir.",
    ],
    moment: {
      titre: "Quand solliciter une cliente qui sort de cabine",
      texte: [
        "Le soir même ou le lendemain, quand la cliente a revu sa peau dans son miroir à elle, sous sa lumière à elle. Pas à la sortie de cabine, où elle n'a encore rien vu.",
        "Pour une cure, la demande n'a de sens qu'après la séance qui donne le résultat, pas après la première. Stela sait attendre le bon rendez-vous plutôt que de compter les passages.",
      ],
    },
    objection: {
      titre: "« Mes clientes ne veulent pas dire publiquement ce qu'elles font chez moi »",
      texte: [
        "C'est vrai, et la réponse n'est pas d'insister. Un avis n'a jamais besoin de nommer la prestation : « accueil parfait, je ressors détendue et je reviendrai » vaut exactement autant, pour la cliente suivante et pour Google, qu'un avis qui détaille un protocole.",
        "Le message que Stela envoie ne mentionne jamais le soin réalisé. Il invite, il ne raconte pas. Et une cliente qui préfère ne rien écrire ne reçoit pas de relance.",
      ],
    },
    etapes: [
      { t: "La séance se termine", d: "La cliente quitte la cabine sans qu'on lui ait rien demandé." },
      { t: "Le lendemain, l'invitation part", d: "Un message sobre, qui ne nomme pas la prestation, avec le lien vers votre fiche." },
      { t: "Vous répondez sans y passer la soirée", d: "Nova propose une réponse dans le ton de l'institut. Vous corrigez si besoin." },
      { t: "Une cliente réservée est relancée en privé", d: "Un retour mitigé revient vers vous, jamais sur la place publique." },
    ],
    chiffre: {
      valeur: "sous une semaine",
      phrase: "c'est le délai dans lequel les clients des métiers de la beauté et du bien-être attendent qu'on leur demande un avis. Au-delà, l'expérience s'efface et la demande devient une corvée.",
      source: "BrightLocal, Local Consumer Review Survey 2024",
    },
  },

  garage: {
    introTitre: "Pourquoi la mécanique se juge par procuration",
    etapesTitre: "De la restitution du véhicule à l'avis",
    intro: [
      "Un garage ne vend pas un produit qu'on peut juger sur pièce. L'automobiliste laisse sa voiture le matin, la récupère le soir, et ne saura pas dire si le diagnostic était juste, si la pièce montée était la bonne, si les deux heures de main-d'oeuvre facturées correspondent au travail fait.",
      "Alors il se fie à ce que les autres ont écrit. C'est le fond du problème de réputation en mécanique : la compétence n'est pas vérifiable par le client, donc elle se juge par procuration, sur une fiche Google, avant même le premier appel.",
      "Le métier a en plus une particularité que la plupart des logiciels d'avis ignorent : entre le devis et la facture, il y a des gens qui ne deviennent jamais clients. Un automobiliste qui refuse un devis de distribution à 1 200 euros n'a rien acheté, mais il a une opinion, et rien ne l'empêche de la publier.",
    ],
    moment: {
      titre: "À quel moment un automobiliste sait juger votre travail",
      texte: [
        "Pas à la restitution du véhicule. À ce moment-là, le client paie une facture qu'il n'avait pas prévue et regarde sa montre. Quelques jours plus tard, quand il a roulé et constaté que le bruit a disparu, il a un vrai avis à donner.",
        "Stela cale la demande sur la restitution puis attend. Le délai se règle une fois, et il n'est pas le même pour une vidange que pour une réparation lourde.",
        "Pour un contrôle technique ou une contre-visite, la demande part après le passage, jamais entre les deux : personne ne note un garage au milieu d'une procédure inachevée.",
      ],
    },
    objection: {
      titre: "« Je vais me faire noter par des gens qui n'ont rien fait réparer »",
      texte: [
        "Ça arrive, et vous ne pouvez pas l'empêcher : Google laisse écrire qui veut. Ce que vous pouvez faire, c'est ne pas laisser ces avis-là être les seuls.",
        "Un garage qui demande systématiquement un avis à ses vrais clients noie mécaniquement le devis refusé. Un garage qui ne demande jamais rien laisse sa fiche aux seuls mécontents, parce qu'eux prennent le temps d'écrire sans qu'on le leur demande.",
        "Et à un avis qui reproche un prix, une réponse publique qui détaille ce que couvrait le devis est lue par tous les suivants. C'est là que Stela vous fait gagner du temps : la réponse est écrite, vous n'avez qu'à la valider.",
      ],
    },
    etapes: [
      { t: "Le véhicule est restitué", d: "L'ordre de réparation est soldé, la facture est réglée, rien d'autre à faire." },
      { t: "Quelques jours plus tard, la demande part", d: "Le temps que le client roule et juge le travail, pas la facture." },
      { t: "La réponse est prête à valider", d: "Nova reprend l'intervention citée dans l'avis, sans jargon et sans promesse." },
      { t: "Un client tiède revient vers l'atelier", d: "Plutôt que d'aller raconter ailleurs qu'il a été mal reçu." },
    ],
    chiffre: {
      valeur: "trois jours à une semaine",
      phrase: "c'est le délai que les clients des métiers techniques jugent normal pour une demande d'avis. Plus court, ils n'ont pas encore éprouvé le travail ; plus long, ils ont oublié.",
      source: "BrightLocal, Local Consumer Review Survey 2024",
    },
  },

  hotel: {
    introTitre: "Pourquoi un hôtel couvert d'avis en manque quand même",
    etapesTitre: "Du départ du client à l'avis",
    intro: [
      "Un hôtel est déjà couvert d'avis, et c'est précisément le problème. Booking, Expedia, TripAdvisor : chaque plateforme a sa note, son échelle, son propre calcul, et aucune ne parle à l'autre. Le directeur passe sa semaine à répondre trois fois à la même remarque sur le petit-déjeuner.",
      "Pendant ce temps, la recherche qui compte le plus se fait ailleurs. Quelqu'un qui cherche un hôtel dans votre ville depuis son téléphone tombe d'abord sur une carte, avec des notes Google. Cette note-là, beaucoup d'hôteliers la subissent sans jamais la travailler, parce que leurs efforts sont absorbés par les OTA.",
      "Il y a aussi une question d'argent. Un client qui vous trouve sur Google et réserve en direct ne coûte pas de commission. Votre fiche Google est le seul canal de la liste où le client qui arrive est entièrement à vous.",
    ],
    moment: {
      titre: "Ni au check-out, ni trois semaines plus tard",
      texte: [
        "Surtout pas au check-out. Le client rend sa clé, il a un train, une réunion ou quatre heures de route, et la dernière chose qu'il veut est un formulaire.",
        "Un ou deux jours après le départ, il est rentré, il a rangé sa valise, et le séjour est devenu un souvenir qu'il sait résumer. C'est le moment où l'on obtient un avis rédigé plutôt qu'une note lâchée.",
        "Pour un séjour long ou une clientèle affaires qui revient chaque mois, la demande ne se répète pas à chaque nuitée : elle se déclenche une fois, puis se met en veille.",
      ],
    },
    objection: {
      titre: "« J'ai déjà Booking et TripAdvisor, pourquoi Google en plus ? »",
      texte: [
        "Parce que ce ne sont pas les mêmes voyageurs. Sur Booking, le client compare des hôtels dans une liste que Booking a triée. Sur Google, il cherche « hôtel » et un nom de ville, et il choisit sur la carte avant même d'avoir vu une plateforme.",
        "Et parce que la réservation qui suit ne vous coûte rien. Chaque point de note gagné sur Google fait venir des clients dont vous gardez la totalité du prix de la nuitée.",
        "Stela ne remplace pas vos plateformes : il centralise les avis qui en viennent, et il travaille en plus celle que personne ne travaillait.",
      ],
    },
    etapes: [
      { t: "Le client quitte l'établissement", d: "Le check-out se fait comme d'habitude, sans rien lui demander." },
      { t: "Un à deux jours après, l'invitation part", d: "Par email ou par SMS, au nom de l'hôtel, avec le lien vers votre fiche Google." },
      { t: "Les avis de toutes vos plateformes arrivent au même endroit", d: "Google, TripAdvisor et les autres, dans un seul écran, avec une réponse proposée pour chacun." },
      { t: "Un séjour raté remonte avant d'être publié", d: "Le temps de rattraper le client, parfois avant même qu'il soit rentré." },
    ],
    chiffre: {
      valeur: "14 886",
      phrase: "hôtels recensés en France. Sur une carte, le voyageur n'en compare jamais plus de cinq, et il les choisit sur la note avant de lire un seul descriptif.",
      source: "INSEE, Parc et fréquentation des hôtels, données annuelles 2025",
    },
  },

  independants: {
    introTitre: "Quand on est seul, la réputation est la tâche qui saute",
    etapesTitre: "Du réglage initial au premier avis",
    intro: [
      "Quand on tient seul sa boutique, la réputation en ligne n'est pas une tâche parmi d'autres : c'est la tâche qui saute. Il y a le rideau à lever, la caisse à ouvrir, le réassort, la livraison qui arrive au mauvais moment, le client qui attend pendant que le téléphone sonne. Le soir, il reste la comptabilité.",
      "Le paradoxe est cruel. Un indépendant connaît ses clients par leur prénom, sait qui aime quoi, rend des services qu'aucune chaîne ne rendra jamais, et se retrouve avec onze avis Google pendant que l'enseigne du bout de la rue en affiche quatre cents.",
      "La différence ne tient pas à la qualité du commerce. Elle tient à ce qu'une chaîne a quelqu'un dont c'est le métier de demander, et pas vous.",
    ],
    moment: {
      titre: "Demander sans avoir à y penser",
      texte: [
        "Le bon moment, quand on est seul, est celui où l'on ne peut justement pas parler : vous encaissez, le client suivant attend derrière, et l'occasion passe.",
        "C'est pour ça que la demande doit partir toute seule. Vous la réglez une fois, à l'installation, et elle s'exécute ensuite sans vous, y compris le samedi à 18 h et pendant vos congés.",
        "Et si vous préférez demander de vive voix quand le moment s'y prête, le QR code posé près de la caisse fait le même travail, sans écran à sortir ni adresse à taper.",
      ],
    },
    objection: {
      titre: "« Je n'ose pas demander un avis à mes clients »",
      texte: [
        "C'est la gêne la plus répandue chez les indépendants, et elle vient d'une confusion : demander un avis n'est pas demander un service. La plupart des clients contents ne laissent pas d'avis simplement parce que personne ne le leur a proposé.",
        "Un message envoyé au nom du commerce, court et sans relance insistante, retire la gêne des deux côtés. Le client répond s'il veut, quand il veut, sans vous avoir en face de lui.",
        "Et vous ne trierez jamais : tout le monde reçoit la même invitation. C'est la seule façon d'être tranquille avec Google, et c'est aussi la seule qui soit honnête vis-à-vis de vos clients.",
      ],
    },
    etapes: [
      { t: "Vous réglez une fois", d: "Le message, le délai et le lien vers votre fiche sont prêts en quelques minutes." },
      { t: "La demande part toute seule", d: "Y compris les jours où vous n'avez pas levé les yeux de la caisse." },
      { t: "Vous répondez en une minute", d: "Nova écrit la réponse, vous la relisez sur votre téléphone entre deux clients." },
      { t: "Un client déçu vous revient", d: "Directement, plutôt que sur une fiche que toute la rue consulte." },
    ],
  },

  "multi-etablissements": {
    introTitre: "À partir de trois adresses, le problème change",
    etapesTitre: "Du groupe jusqu'à chaque point de vente",
    intro: [
      "À partir de trois points de vente, le problème change de nature. Ce n'est plus « comment obtenir des avis », c'est « comment obtenir la même chose partout ». Un établissement collecte, l'autre a oublié, le troisième répond avec un ton qui ne ressemble pas à la marque.",
      "La tête de réseau s'en aperçoit toujours trop tard, souvent par une note qui décroche sur une seule adresse et qui tire la moyenne de l'enseigne. Entre-temps, personne n'avait de vue d'ensemble : chaque directeur voyait sa fiche, et personne ne voyait le réseau.",
      "S'ajoute la question de la parole. Une réponse publique à un avis engage la marque entière, pas seulement l'établissement qui l'écrit. Laisser chaque site répondre librement, c'est accepter que la marque parle de dix façons différentes.",
    ],
    moment: {
      titre: "Le même geste sur tous vos établissements",
      texte: [
        "Le réglage se fait une fois, au niveau du groupe, et descend sur chaque adresse. Un établissement qui ouvre hérite du paramétrage sans qu'on ait à le refaire.",
        "Chaque directeur garde la main sur son quotidien et voit ses avis, mais le cadre ne dépend plus de lui. C'est ce qui rend le résultat comparable d'un site à l'autre.",
      ],
    },
    objection: {
      titre: "« Je ne veux pas qu'on réponde n'importe quoi au nom de l'enseigne »",
      texte: [
        "C'est la bonne inquiétude. Une réponse publique maladroite sur une adresse est lue comme la position de toute la marque.",
        "Nova rédige à partir du ton que vous définissez une fois pour le groupe, et la réponse reste soumise à validation. Vous choisissez qui valide : le directeur d'établissement, l'animateur réseau, ou vous.",
        "Et la vue consolidée montre ce qu'aucune fiche prise isolément ne montre : quel établissement décroche, sur quel sujet, et depuis quand.",
      ],
    },
    etapes: [
      { t: "Vos établissements sont raccordés", d: "Une fiche Google par adresse, rattachée à un seul compte de groupe." },
      { t: "Le cadre descend du groupe", d: "Message, délai et ton de réponse sont définis une fois, appliqués partout." },
      { t: "Chaque site travaille, vous voyez l'ensemble", d: "Note, volume et délai de réponse par établissement, et le total du réseau." },
      { t: "Un établissement qui décroche se voit tout de suite", d: "Avant que sa note ne tire celle de l'enseigne." },
    ],
  },
};

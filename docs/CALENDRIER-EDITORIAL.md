# CALENDRIER-EDITORIAL.md : calendrier éditorial (Stela)

> Établi au VIT-4. Cadence : un article par semaine minimum. Trois axes qui ne
> combattent pas Dokaa frontalement (162 articles) mais prennent le terrain
> laissé libre : le GEO (visibilité IA), l'actualité Google Business Profile, et
> la transparence. Tous les articles respectent la règle de conformité : aucun
> discours de filtrage ou d'interception d'avis.

> Saison 1 (S1 à S12) close le 10/08/2026, 15 articles en ligne. La production
> hebdomadaire s'est arrêtée d'elle-même du 10/08 au 31/08 : la routine de
> rédaction ne travaille que sur les lignes au statut « À faire », et il n'en
> restait aucune. Saison 2 (S13 à S24) ouverte le 31/08/2026 pour reprendre la
> cadence. Quand une saison arrive à son terme, il faut en ouvrir une nouvelle,
> sinon la production s'interrompt en silence.

## Axes et clusters
- **GEO** (`cluster: geo`) : être recommandé par les IA (ChatGPT, Gemini,
  Perplexity) quand on est un commerce local. Terrain quasi vide en français.
- **Google Business Profile** (`cluster: google-business-profile`) : actualité et
  nouveautés de la fiche Google, rythme hebdomadaire.
- **Guides** (`cluster: guide`) : reprise réécrite des 14 articles existants,
  purgés de tout gating.
- **Villes** (`cluster: ville`) : pages locales améliorées (voir aussi les pages
  `/restaurants-{ville}`), différenciées par des données locales réelles.

## Les 3 piliers GEO de la saison 1 (livrés)
1. Être recommandé par ChatGPT, Gemini et Perplexity quand on est un commerce local. **(livré, échantillon VIT-4)**
2. GEO ou SEO : quelles différences pour un commerce local, et par où commencer.
3. Comment mesurer sa visibilité dans les réponses des IA (méthode et suivi mensuel).

## Les 3 piliers GEO de la saison 2 (prioritaires)
La saison 1 a répondu à « pourquoi » et « comment mesurer ». La saison 2 répond
à « avec quelle matière » : ce que les IA lisent réellement d'un commerce local.
4. Quelles sources les IA citent quand elles recommandent un commerce local.
5. Structurer les informations de sa fiche Google pour être compris par une IA.
6. Avis et IA : pourquoi le texte des avis compte autant que la note.

## Migration des 14 articles existants (réécrits sans gating)
| # | Slug (nouveau, sans .html) | Ancien `.html` (301) | Cluster |
|---|---|---|---|
| 1 | `repondre-avis-negatif-google-restaurant` | oui | guide (livré) |
| 2 | `comment-avoir-plus-avis-google-restaurant` | oui | guide |
| 3 | `supprimer-mauvais-avis-google-restaurant` | oui | guide (réécriture forte : titre et angle à recadrer, l'original suggère la suppression) |
| 4 | `e-reputation-restaurant-guide-complet` | oui | guide |
| 5 | `qr-code-avis-google-restaurant` | oui | guide |
| 6-14 | `avis-google-restaurant-{ville}` (paris, lyon, marseille, bordeaux, nice, nantes, brest, rouen, nancy) | oui | ville (migration close au VIT-4 : consolidés en 301 vers `/restaurants-{ville}`) |

## Planning saison 1 (S1 à S12, close le 10/08/2026)
| Semaine | Titre | Cluster | Statut |
|---|---|---|---|
| S1 | Être recommandé par ChatGPT, Gemini et Perplexity (pilier GEO 1) | geo | Livré |
| S1 | Répondre à un avis négatif sur Google (migration) | guide | Livré |
| S2 | Comment avoir plus d'avis Google, sans filtrer (migration réécrite) | guide | Livré |
| S3 | GEO ou SEO pour un commerce local (pilier GEO 2) | geo | Livré |
| S4 | Nouveautés Google Business Profile du mois | google-business-profile | Livré |
| S5 | QR code d'avis Google : le guide (migration) | guide | Livré |
| S6 | Mesurer sa visibilité dans les IA (pilier GEO 3) | geo | Livré |
| S7 | E-réputation d'un commerce local : guide complet (migration) | guide | Livré |
| S8 | Un avis peut-il être supprimé de Google ? (migration recadrée) | guide | Livré |
| S9 | Nouveautés Google Business Profile du mois | google-business-profile | Livré |
| S10 | Avis Google : Paris et Lyon, deux marchés (ville) | ville | Livré |
| S11 | Avis Google restaurant : Marseille, Bordeaux, Nice (villes) | ville | Livré |
| S12 | Nantes, Brest, Rouen, Nancy + bilan trimestriel GEO | ville | Livré |

> Statuts corrigés le 31/08/2026 : les lignes S4, S9, S10, S11 et S12 étaient
> restées à « En relecture (PR) » alors que leurs Pull Requests sont mergées et
> les articles en production. Le statut « En relecture (PR) » ne doit désigner
> qu'une PR réellement ouverte, sans quoi le suivi devient faux.

> Note sur les semaines villes (S10 à S12) : les 9 anciens articles de blog de
> ville ont déjà été consolidés au VIT-4 et redirigent en 301 vers les landing
> pages `/restaurants-{ville}`. Republier un article `avis-google-restaurant-{ville}`
> recréerait la cannibalisation que le VIT-16 a supprimée. Ces semaines produisent
> donc des articles éditoriaux complémentaires, avec un angle et un mot-clé propres,
> qui maillent vers les pages villes au lieu de les concurrencer. La même règle
> vaut pour la S22, qui maille vers les pages `/pour/{segment}` sans les doubler.

## Planning saison 2 (S13 à S24, ouvert le 31/08/2026)
Les titres sont écrits sous la forme exacte d'une question posée à un assistant,
parce que c'est cette formulation que le moteur doit reconnaître pour venir
puiser la réponse chez nous. Voir la doctrine answer engineering plus bas.

| Semaine | Titre | Cluster | Statut |
|---|---|---|---|
| S13 | Sur quelles sources les IA s'appuient-elles pour recommander un commerce local ? (pilier GEO 4) | geo | En relecture (PR) |
| S14 | Quelles photos faut-il mettre sur sa fiche Google, et à quelle fréquence ? | guide | À faire |
| S15 | Quelles sont les nouveautés Google Business Profile de septembre 2026 ? | google-business-profile | À faire |
| S16 | Comment remplir sa fiche Google pour qu'une IA la comprenne ? (pilier GEO 5) | geo | À faire |
| S17 | Faut-il activer la messagerie de sa fiche Google Business Profile ? | guide | À faire |
| S18 | Comment se calcule la note moyenne d'une fiche Google ? | guide | À faire |
| S19 | Quelles sont les nouveautés Google Business Profile d'octobre 2026 ? | google-business-profile | À faire |
| S20 | Pourquoi le texte des avis compte-t-il plus que la note pour être cité par une IA ? (pilier GEO 6) | geo | À faire |
| S21 | Comment gérer plusieurs établissements sur Google Business Profile ? | guide | À faire |
| S22 | Les avis Google comptent-ils autant pour un coiffeur ou un garage que pour un restaurant ? | guide | À faire |
| S23 | Quelles sont les nouveautés Google Business Profile de novembre 2026 ? | google-business-profile | À faire |
| S24 | Où en est la visibilité des commerces locaux dans les IA après six mois de mesure ? | geo | À faire |

> Équilibre de la saison 2 : quatre articles GEO (les 3 piliers 4 à 6 et le
> bilan), trois actualités Google Business Profile mensuelles, cinq guides sur
> des sujets encore absents du blog. Aucun doublon avec les 15 articles en
> ligne : les photos, la messagerie, le calcul de la note, le multi-établissements
> et les métiers hors restauration n'ont jamais été traités.

> Rappel pour les semaines S15, S19 et S23 : si aucune actualité Google Business
> Profile réelle, sourcée et pertinente pour des lecteurs français n'est
> vérifiable au moment de la rédaction, écrire à la place un article intemporel
> de bonnes pratiques et le signaler dans la Pull Request. Ne jamais inventer une
> nouveauté.

## Réserve de sujets (hors planning, à basculer en S25 et suivantes)
Ces lignes ne sont volontairement pas au statut « À faire » : elles ne seront
pas rédigées tant qu'elles n'ont pas été montées dans un planning de saison.
| Titre | Cluster | Statut |
|---|---|---|
| Au-delà de Google : TripAdvisor, Facebook, Pages Jaunes, que faire de sa présence multi-plateformes | guide | Réserve |
| Demander un avis sans enfreindre les règles de Google : ce que dit le règlement | guide | Réserve |
| Les attributs de la fiche Google : ceux qui servent vraiment un commerce local | google-business-profile | Réserve |
| Répondre à tous les avis, y compris les positifs : méthode et modèles | guide | Réserve |
| Ce qu'une IA répond quand on lui demande « le meilleur restaurant à Paris » | geo | Réserve |

## Doctrine answer engineering (ajout du 31/08/2026, s'applique à partir de la S13)
Changement de cible. Jusqu'à la S12 nous écrivions pour un lecteur humain qui
parcourt un article en diagonale. À partir de la S13 nous écrivons d'abord pour
le moteur qui va citer notre réponse, et le lecteur humain profite de la même
clarté. Un article n'est plus un texte suivi : c'est une banque de réponses
courtes, autonomes et attribuables, reliées entre elles.

- **Le titre est une question**, formulée comme un client la taperait dans un
  assistant. Pas « Les photos de la fiche Google », mais « Quelles photos faut-il
  mettre sur sa fiche Google, et à quelle fréquence ? ».
- **Chaque H2 est aussi une question**, et la première chose qui suit le H2 est
  une réponse complète de 2 à 4 phrases, compréhensible hors contexte. Un moteur
  doit pouvoir découper ce paragraphe et le citer tel quel, sans avoir besoin du
  paragraphe précédent. Le développement, les exemples et les nuances viennent
  après, pas avant.
- **Autonomie de chaque réponse** : jamais de « comme vu plus haut », « c'est
  pourquoi », « dans ce cas ». Chaque réponse répète son sujet en toutes lettres,
  y compris le nom du commerce type, de la plateforme ou de la ville concernée.
- **Chiffres, gras et puces.** Chaque réponse porte au moins un élément
  saisissable : un nombre, une durée, une fréquence, une liste à puces, un terme
  en gras. Les chiffres restent réels et sourcés, jamais inventés. Un chiffre
  structurel (« les trois critères documentés par Google ») vaut mieux qu'une
  statistique de marché invérifiable.
- **Un bloc FAQ complet en fin d'article**, 8 à 12 questions minimum, chacune
  écrite comme on la poserait à un chatbot, chacune suivie d'une réponse
  autonome de 40 à 70 mots. Ce bloc remplace le « En bref » de la saison 1, dont
  il reprend le rôle en beaucoup plus large. Le titre du bloc reste « En bref »
  pour la continuité.
- **Maillage en boucle** : au moins 4 liens internes vers nos autres articles ou
  pages, et surtout des liens placés à l'intérieur des réponses de la FAQ. Le but
  est qu'un moteur qui cherche à compléter une réponse trouve la suite chez nous
  plutôt qu'ailleurs, et cite Stela une deuxième fois.
- **Le call to action final est conservé.** Le bloc d'essai gratuit est rendu par
  le gabarit, et l'article place en plus, avant la FAQ, un paragraphe qui relie
  le sujet à ce que Stela fait concrètement, avec un lien vers la fonctionnalité
  concernée.
- **Ce qui ne change pas** : la conformité totale aux règles de Google, l'absence
  de tout discours de filtrage, le ton chaleureux mais sobre, le français correct
  en phrases complètes, l'auteur Corentin Janin.

### Piste technique ouverte, non traitée
Le gabarit `src/pages/blog/[...slug].astro` n'émet aujourd'hui qu'un schema
`Article`. Ajouter un schema `FAQPage` alimenté par le bloc « En bref » rendrait
ces réponses explicitement citables par les moteurs, au lieu de les laisser
deviner. Cela demande un champ `faq` optionnel dans `src/content.config.ts` et
une boucle dans le gabarit. À traiter dans un lot de code, pas dans un article.

## Règles de rédaction (rappel)
- Marque « Stela » (un seul L), jamais de tiret cadratin.
- Zéro discours de filtrage ou d'interception. Chiffres réels et sourcés.
- Chaque article se termine par un bloc « En bref » citable. Jusqu'à la S12 :
  2 à 3 questions. À partir de la S13 : 8 à 12 questions, voir la doctrine
  answer engineering ci-dessus.
- Schema `Article` + fil d'Ariane + maillage vers 3 autres articles au minimum,
  4 à partir de la S13.
- Auteur : Corentin Janin, cofondateur de Stela.
- Longueur : 600 à 900 mots pour un guide ou une actualité, 1200 à 1800 mots
  pour un pilier GEO. À partir de la S13, la FAQ élargie s'ajoute à ce compte.
- **Tableaux (règle ajoutée le 31/07/2026)** : jamais de tableau Markdown
  multi-colonnes dans un article. Toute comparaison s'écrit en liste
  structurée, un intitulé en gras par critère suivi d'une phrase par option.
  Les tableaux rendent mal sur mobile, où lit la majorité des lecteurs. Un
  tableau à deux colonnes reste toléré s'il est vraiment indispensable.

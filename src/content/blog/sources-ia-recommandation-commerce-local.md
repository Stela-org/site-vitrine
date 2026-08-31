---
title: "Sur quelles sources les IA s'appuient-elles pour recommander un commerce local ?"
metaTitle: "Sources des IA pour recommander un commerce local"
description: "Fiche Google, avis, site, annuaires : les sources que ChatGPT, Gemini et Perplexity lisent pour citer un commerce local, et comment les tenir à jour."
pubDate: 2026-08-31
keyword: "sources IA recommandation commerce local"
cluster: "geo"
---

Quand un client demande à un assistant « un bon restaurant italien près de la gare de Nantes », la réponse ne sort pas de nulle part. Elle est assemblée à partir de sources précises, presque toujours les mêmes, et que vous pouvez pour la plupart alimenter vous-même. Cet article liste ces sources une par une, dit laquelle pèse le plus, et donne pour chacune la vérification à faire.

## Quelles sources une IA utilise-t-elle pour recommander un commerce local ?

Une intelligence artificielle qui recommande un commerce local s'appuie sur **cinq familles de sources** : la fiche Google Business Profile de l'établissement, les avis publics de ses clients, son site internet, les annuaires et plateformes tierces, et enfin la presse ou les blogs locaux qui le mentionnent. La fiche Google et les avis pèsent le plus lourd, parce qu'ils sont structurés, datés et associés à une adresse précise. Les trois autres familles servent surtout à confirmer ou à contredire ce que les deux premières racontent.

Ces cinq familles n'ont pas le même coût d'entretien. La fiche et les avis se travaillent en continu et dépendent de vous. Le site se travaille une fois puis se corrige. Les annuaires demandent une passe de vérification par an. Les mentions de presse, elles, ne se commandent pas.

## Pourquoi la fiche Google Business Profile est-elle la source principale ?

La fiche Google Business Profile est la source principale parce qu'elle est la seule qui donne à une machine, au même endroit, le nom exact, l'adresse, la catégorie d'activité, les horaires, les attributs de service et la note moyenne d'un établissement. Aucune autre source ne réunit ces informations sous une forme aussi normalisée. Google documente d'ailleurs que le classement local repose sur **trois critères** : la pertinence, la distance et la notoriété de l'établissement, détaillés dans son [aide sur le classement local](https://support.google.com/business/answer/7091).

Concrètement, une fiche incomplète prive l'assistant des éléments qui permettent de vous citer sur une demande précise :

- **La catégorie principale** décide des questions sur lesquelles vous êtes éligible. Un établissement rangé en « restaurant » et non en « restaurant italien » ne sortira pas sur la demande italienne.
- **Les horaires**, y compris les horaires exceptionnels des jours fériés, décident des demandes du type « ouvert dimanche soir ».
- **Les attributs** (terrasse, accès en fauteuil roulant, végétarien, réservation) décident des demandes assorties d'une contrainte, qui sont les plus fréquentes dans une conversation avec un assistant.
- **Les photos récentes** confirment que l'établissement est en activité.

Notre guide des [bonnes pratiques de la fiche Google Business Profile](/blog/bonnes-pratiques-fiche-google-business-profile) reprend ce travail champ par champ.

## Les avis clients servent-ils vraiment de source aux IA ?

Oui, les avis clients sont la deuxième source des assistants, et ils jouent un rôle que la fiche ne peut pas tenir : ils fournissent le **vocabulaire**. Une fiche dit qu'un restaurant existe, sert des pizzas et ouvre à 19 heures. Seuls les avis disent qu'on y est bien reçu en famille, que le service est rapide le midi ou que la terrasse est calme. Quand un assistant écrit « une adresse conviviale, appréciée pour son accueil », il reprend des mots qu'il a lus quelque part, et cet endroit est presque toujours la zone d'avis.

Trois propriétés des avis comptent plus que leur nombre :

- **Leur fraîcheur.** Un flux régulier signale un établissement en activité. Une série d'avis tous vieux de deux ans raconte l'inverse.
- **Leur diversité de vocabulaire.** Vingt avis qui disent seulement « très bien » donnent moins de matière que dix avis qui décrivent un plat, une ambiance et un service.
- **Leur représentativité.** Une collecte ouverte à tous les clients produit une description fidèle. Une collecte partielle produit une description fausse, en plus d'enfreindre les [règles de Google sur les avis](https://support.google.com/business/answer/2622994).

C'est le mécanisme que détaille notre article sur le fait d'[être recommandé par ChatGPT, Gemini et Perplexity](/blog/etre-recommande-par-chatgpt-commerce-local).

## Est-ce que les trois assistants lisent les mêmes sources ?

Non, les trois assistants ne lisent pas exactement les mêmes sources, et c'est pourquoi ils ne donnent pas les mêmes réponses sur une même question. Voici ce qui les distingue, sachant que ces dispositifs évoluent vite et méritent d'être revérifiés chaque trimestre.

- **Gemini** est adossé à l'écosystème Google. Les données de votre fiche Google Business Profile et de Google Maps lui sont directement accessibles. C'est l'assistant sur lequel une fiche bien tenue produit l'effet le plus immédiat.
- **ChatGPT** dispose d'une recherche web et cite alors ses sources. Il dépend donc de ce qui est publiquement lisible sur le web à propos de votre établissement, votre site compris. OpenAI documente ses robots d'exploration sur sa [page dédiée aux bots](https://platform.openai.com/docs/bots).
- **Perplexity** a été conçu dès l'origine pour répondre en citant des sources apparentes. Il valorise donc les pages qui répondent de façon nette et vérifiable, et il rend la source visible au lecteur, ce qui en fait le meilleur terrain d'observation pour savoir d'où vient une citation.

Puisque les réponses divergent, la mesure doit porter sur les trois. Notre méthode de relevé mensuel est décrite dans [comment mesurer sa visibilité dans les réponses des IA](/blog/mesurer-visibilite-ia-commerce-local).

## Faut-il autoriser les robots des IA à explorer son site ?

Oui, dans la quasi-totalité des cas, un commerce local a intérêt à laisser les robots des intelligences artificielles explorer son site, puisque l'objectif est précisément d'être cité. Ces robots s'identifient et se contrôlent depuis le fichier `robots.txt` de votre site. Les trois noms à connaître sont **GPTBot** pour OpenAI, **Google-Extended** pour les usages IA de Google, documenté dans la [liste des robots Google](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers), et **PerplexityBot** pour Perplexity.

Le piège habituel n'est pas de les bloquer volontairement : c'est de les bloquer sans le savoir, parce qu'un thème de site ou une extension a posé une règle restrictive par défaut. La vérification prend une minute : ouvrez `votresite.fr/robots.txt` dans un navigateur et cherchez ces trois noms. S'ils y figurent avec un `Disallow: /`, vous êtes invisible pour ces assistants.

## Les annuaires et les autres plateformes comptent-ils encore ?

Oui, mais pas pour la raison que l'on croit. Les annuaires et plateformes tierces comptent moins comme source de description que comme source de **cohérence**. Un assistant qui trouve deux adresses différentes ou deux numéros de téléphone différents pour un même établissement perd en confiance, et préfère souvent citer un concurrent sur lequel il n'a aucun doute.

La règle tient en une phrase : votre nom, votre adresse et votre téléphone doivent être écrits **strictement à l'identique** partout où ils apparaissent, à la virgule près. Un « 12 rue de la Paix » ici et un « 12 r. de la Paix » là suffisent à créer une ambiguïté. Nos pages sur les [avis multi-plateformes](/avis-multi-plateformes) traitent ce sujet de la présence dispersée.

## Comment savoir quelle source une IA a utilisée pour parler de moi ?

Il suffit de le lui demander, et c'est la manipulation la plus utile de cet article. Posez votre question habituelle à l'assistant, puis enchaînez avec : « Sur quelles sources t'appuies-tu pour dire cela ? ». Perplexity affiche ses sources par défaut, ChatGPT en mode recherche les liste, Gemini les indique souvent quand on insiste.

Vous obtenez alors une information rare : la liste exacte des pages qui vous décrivent aux yeux d'une machine. Si une source périmée ou fausse remonte, vous savez quoi corriger en priorité. Si la seule source citée est un annuaire que vous ne mettez jamais à jour, vous savez que votre site et votre fiche ne font pas leur travail.

## Que faire en priorité quand on n'a que vingt minutes ?

Vingt minutes suffisent pour traiter les quatre points qui déterminent la plupart des citations. Dans cet ordre :

1. **Vérifiez la catégorie principale de votre fiche Google** et corrigez-la si elle est trop générique. C'est l'action au meilleur rapport effort sur effet.
2. **Vérifiez vos horaires**, y compris les horaires exceptionnels des trois prochains mois.
3. **Ouvrez votre `robots.txt`** et assurez-vous que GPTBot, Google-Extended et PerplexityBot ne sont pas bloqués.
4. **Relancez votre collecte d'avis** si votre avis le plus récent a plus de deux semaines.

Le quatrième point est le seul qui ne se règle pas en une fois : il demande un flux. C'est exactement ce que fait la [collecte d'avis Google de Stela](/collecte-avis-google), en invitant tous les clients à s'exprimer publiquement, sans aucune sélection selon la satisfaction supposée, comme les règles de Google l'exigent. Un flux d'avis régulier et sincère est la seule source que vos concurrents ne peuvent pas copier, et c'est celle que les assistants lisent le plus volontiers. Vous pouvez [essayer gratuitement pendant 7 jours](/tarifs).

## En bref

**Sur quelles sources les IA s'appuient-elles pour recommander un commerce local ?** Sur cinq familles de sources : la fiche Google Business Profile, les avis publics des clients, le site internet de l'établissement, les annuaires et plateformes tierces, et les mentions dans la presse ou les blogs locaux. La fiche et les avis pèsent le plus, car ils sont structurés, datés et rattachés à une adresse précise.

**Quelle est la source la plus importante pour être cité par ChatGPT ou Gemini ?** La fiche Google Business Profile. Elle est la seule à réunir sous forme normalisée le nom, l'adresse, la catégorie, les horaires et les attributs de service. Une catégorie principale mal choisie ou des horaires faux suffisent à vous rendre inéligible à toute une famille de questions.

**Les avis Google servent-ils à quelque chose pour la visibilité dans les IA ?** Oui, ils fournissent le vocabulaire avec lequel les assistants vous décrivent. La fiche dit ce que vous êtes, les avis disent comment c'est. Sans avis récents et variés, une intelligence artificielle n'a aucune matière pour vous recommander sur une demande précise comme « convivial » ou « rapide le midi ».

**ChatGPT, Gemini et Perplexity donnent-ils les mêmes réponses ?** Non. Gemini est adossé à l'écosystème Google et exploite directement la fiche Google Business Profile. ChatGPT dépend de sa recherche web et de ce qui est publiquement lisible. Perplexity affiche ses sources par défaut. Il faut donc mesurer sa présence sur les trois, comme l'explique notre [méthode de suivi mensuel](/blog/mesurer-visibilite-ia-commerce-local).

**Faut-il bloquer les robots des IA sur son site ?** Non, un commerce local a intérêt à les laisser passer, puisque le but est d'être cité. Vérifiez dans votre fichier `robots.txt` que GPTBot, Google-Extended et PerplexityBot ne sont pas interdits. Le blocage est le plus souvent involontaire, posé par défaut par un thème ou une extension.

**Combien de temps faut-il pour qu'une correction soit prise en compte ?** Comptez plusieurs semaines. Les assistants ne relisent pas votre fiche en temps réel et travaillent sur des données mises à jour par cycles. Une correction d'horaires ou de catégorie faite aujourd'hui se reflète progressivement, ce qui rend le relevé mensuel plus pertinent qu'une vérification quotidienne.

**Comment savoir quelles pages une IA cite à mon sujet ?** Posez votre question habituelle à l'assistant, puis demandez-lui sur quelles sources il s'appuie. Perplexity les affiche par défaut, ChatGPT les liste en mode recherche. Vous obtenez la liste des pages qui vous décrivent aux yeux d'une machine, et donc celles à corriger en priorité.

**Est-ce que le nombre d'avis suffit à être recommandé ?** Non. La fraîcheur et la richesse du vocabulaire comptent autant que le volume. Dix avis récents et détaillés donnent plus de matière à un assistant que cinquante avis anciens réduits à « très bien ». Un flux régulier vaut mieux qu'un pic ponctuel suivi d'un long silence.

**Faut-il être présent sur d'autres plateformes que Google ?** C'est utile, mais surtout pour la cohérence. Votre nom, votre adresse et votre téléphone doivent être identiques à la virgule près partout. Une adresse écrite de deux façons différentes crée une ambiguïté, et un assistant préfère citer un établissement sur lequel il n'a aucun doute.

**Le référencement classique sert-il encore si les clients passent par une IA ?** Oui, les deux reposent sur les mêmes fondations : une fiche à jour, des avis sincères et un contenu clair. La différence tient au résultat, une place dans une liste face à une citation dans une réponse rédigée. Notre article [GEO ou SEO pour un commerce local](/blog/geo-ou-seo-commerce-local) détaille cette distinction.

**Peut-on payer pour être cité par une intelligence artificielle ?** Non, il n'existe aujourd'hui aucun emplacement publicitaire permettant d'acheter une citation dans la réponse d'un assistant. La seule voie est le travail de fond sur les sources que les assistants lisent, à commencer par la fiche Google et un flux d'avis régulier, ouvert à tous les clients.

**Que faire si une IA donne une information fausse sur mon établissement ?** Corrigez l'information à la source plutôt que de discuter avec l'assistant. Mettez à jour votre fiche Google, votre site et les annuaires concernés, puis vérifiez à nouveau quelques semaines plus tard. Si l'erreur vient d'un avis inexact, répondez publiquement pour rétablir les faits, comme expliqué dans notre guide sur [la réponse aux avis négatifs](/blog/repondre-avis-negatif-google-restaurant).

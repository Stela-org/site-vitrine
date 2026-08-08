// LOT DIAG-1 : diagnostic gratuit d'une fiche Google, sans rendez-vous.
//
// ⚠️ API PLACES *LEGACY* (maps.googleapis.com/maps/api/place), CHOIX ASSUME.
// Google classe cette API « Legacy » et pousse a migrer vers Places API (New).
// On y reste pour UNE raison precise : `reviews_sort=newest` n'existe QUE en
// legacy. Places API (New) renvoie 5 avis tries par PERTINENCE, sans option de
// tri : la date du dernier avis y deviendrait une supposition, et ce diagnostic
// ne dit que ce qu'il mesure.
//
// LE JOUR OU GOOGLE COUPE LA LEGACY : le constat « dernier avis redige » tombe,
// et lui seul. La note, le volume d'avis, le site, le telephone, les horaires,
// les photos et le statut existent a l'identique dans Places API (New) : ils
// survivent a la migration. Le score devra alors etre renormalise sur 75 au
// lieu de 100 (la fraicheur pese 25 points, voir POIDS ci-dessous).
//
// CE QUE PLACES N'EXPOSE PAS, ET QUI N'APPARAITRA DONC JAMAIS ICI :
//   • les REPONSES du proprietaire aux avis. Aucun champ, ni en legacy ni en
//     New (verifie sur la reference de l'objet Review). Donc aucun « taux de
//     reponse », qui serait une invention pure.
//   • la DESCRIPTION ecrite par le commercant. `editorial_summary` est la
//     description redigee par GOOGLE, reservee aux lieux notables et absente
//     pour la quasi-totalite des commerces locaux, meme parfaitement remplis.
//     L'utiliser reprocherait une description manquante a une fiche impeccable.
//   • les vues, recherches et clics (Business Profile Insights, OAuth), les
//     posts, les produits, les questions/reponses, et la distribution des notes.
const BASE = "https://maps.googleapis.com/maps/api/place";

// Champs demandes au Details. Volontairement clos : chaque champ a un cout de
// SKU, et un champ qu'on n'affiche pas est de l'argent jete.
const DETAILS_FIELDS = [
  "name",
  "formatted_address",
  "rating",
  "user_ratings_total",
  "reviews",
  "website",
  "formatted_phone_number",
  "opening_hours",
  "photos",
  "business_status",
].join(",");

// Places plafonne le tableau `photos` a 10. On ne peut donc JAMAIS annoncer
// « vous avez 14 photos » : au-dela de 10 on dit « au moins 10 ».
export const PHOTOS_PLAFOND = 10;

const JOUR_MS = 24 * 60 * 60 * 1000;

// ————————————————————————————————————————————————————————————————
// 1. Appels Places. La cle ne quitte jamais le serveur.
// ————————————————————————————————————————————————————————————————

async function placesFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const json = await res.json();
    return { json, error: null };
  } catch (e) {
    return { json: null, error: e instanceof Error ? e.message : "Places injoignable." };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Recherche par texte libre (« nom + ville »). Text Search et non Find Place :
 * l'ecran de desambiguisation a besoin de PLUSIEURS candidats avec leur adresse,
 * ce que Find Place ne rend pas de facon fiable. Find Place aurait ete moins
 * cher ; diagnostiquer le mauvais etablissement coute plus.
 */
export async function chercherEtablissements(q) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { data: [], error: "cle_absente" };
  const url = `${BASE}/textsearch/json?query=${encodeURIComponent(q)}&language=fr&region=fr&key=${key}`;
  const { json, error } = await placesFetch(url);
  if (error) return { data: [], error: "places_injoignable" };
  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") return { data: [], error: "places_erreur" };
  const results = (json.results ?? []).slice(0, 5);
  return {
    data: results.map((r) => ({
      placeId: r.place_id,
      nom: r.name,
      adresse: r.formatted_address ?? null,
    })).filter((c) => c.placeId && c.nom),
    error: null,
  };
}

/**
 * Details d'une fiche, reduits AUSSITOT en metriques derivees.
 *
 * RGPD : le tableau `reviews` contient des NOMS D'AUTEURS (donnee personnelle).
 * Il ne sort pas de cette fonction et n'est jamais mis en cache : on n'en garde
 * qu'une date. Rien d'autre du tableau ne survit a ce `return`.
 */
export async function mesurerFiche(placeId) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { data: null, error: "cle_absente" };
  const url =
    `${BASE}/details/json?place_id=${encodeURIComponent(placeId)}` +
    `&fields=${DETAILS_FIELDS}&reviews_sort=newest&language=fr&key=${key}`;
  const { json, error } = await placesFetch(url);
  if (error) return { data: null, error: "places_injoignable" };
  if (json.status !== "OK") return { data: null, error: "places_erreur" };
  return { data: derivierMetriques(json.result ?? {}), error: null };
}

/**
 * Brut Places -> metriques derivees. Fonction PURE : c'est elle qui decide ce
 * qui est mesurable, et c'est la seule frontiere ou passent les donnees d'avis.
 */
export function derivierMetriques(r) {
  const avis = Array.isArray(r.reviews) ? r.reviews : [];
  // `reviews_sort=newest` trie par date : le premier est le plus recent. Mais un
  // avis NOTE SANS TEXTE ne remonte pas dans ce tableau alors qu'il compte dans
  // user_ratings_total. D'ou le mot « redige », partout, dans les constats.
  const dernier = avis.length > 0 && Number.isFinite(avis[0].time) ? avis[0].time * 1000 : null;
  const photos = Array.isArray(r.photos) ? r.photos.length : 0;
  return {
    nom: typeof r.name === "string" ? r.name : null,
    adresse: typeof r.formatted_address === "string" ? r.formatted_address : null,
    note: Number.isFinite(r.rating) ? r.rating : null,
    nbAvis: Number.isFinite(r.user_ratings_total) ? r.user_ratings_total : 0,
    dernierAvisRedigeAt: dernier ? new Date(dernier).toISOString() : null,
    site: Boolean(r.website),
    telephone: Boolean(r.formatted_phone_number),
    horaires: Boolean(r.opening_hours && (r.opening_hours.periods || r.opening_hours.weekday_text)),
    photos,
    photosPlafonnees: photos >= PHOTOS_PLAFOND,
    statut: typeof r.business_status === "string" ? r.business_status : "OPERATIONAL",
  };
}

// ————————————————————————————————————————————————————————————————
// 2. Score et constats. PURS : aucun appel reseau, aucune horloge implicite
//    (`maintenant` est un parametre, pour que le resultat soit reproductible).
// ————————————————————————————————————————————————————————————————

// Repartition des 100 points. La fraicheur et la note pesent le plus parce que
// ce sont les deux signaux qu'un commercant peut deplacer, et ceux que Google
// regarde. La completude vaut 30 : elle est facile a corriger, donc peu
// discriminante, mais son absence coute cher.
export const POIDS = { fraicheur: 25, note: 25, volume: 20, completude: 30 };

export const noteFr = (n) => n.toFixed(1).replace(".", ",");
// Espace insecable fine des milliers : « 2 843 avis », jamais « 2843 ».
export const nbFr = (n) => Number(n).toLocaleString("fr-FR");

const joursDepuis = (iso, maintenant) =>
  iso ? Math.floor((maintenant.getTime() - new Date(iso).getTime()) / JOUR_MS) : null;

function pointsFraicheur(jours) {
  if (jours === null) return 0;
  if (jours <= 30) return 25;
  if (jours <= 90) return 18;
  if (jours <= 180) return 10;
  if (jours <= 365) return 4;
  return 0;
}
function pointsNote(note) {
  if (note === null) return 0;
  if (note >= 4.6) return 25;
  if (note >= 4.3) return 21;
  if (note >= 4.0) return 16;
  if (note >= 3.5) return 9;
  return 3;
}
function pointsVolume(n) {
  if (n >= 200) return 20;
  if (n >= 100) return 17;
  if (n >= 50) return 14;
  if (n >= 20) return 10;
  if (n >= 5) return 5;
  return 0;
}
function pointsCompletude(m) {
  return (m.site ? 10 : 0) + (m.telephone ? 8 : 0) + (m.horaires ? 7 : 0) + (m.photos >= 3 ? 5 : m.photos > 0 ? 2 : 0);
}

/**
 * Constats formules en IMPACT, jamais en jargon, et HONNETES DANS LES DEUX
 * SENS : une bonne fiche recoit de bons constats et le diagnostic le dit. Un
 * outil qui trouve toujours un probleme se grille au premier commercant serieux.
 */
export function diagnostiquer(m, maintenant = new Date()) {
  const jours = joursDepuis(m.dernierAvisRedigeAt, maintenant);
  const score = Math.min(
    100,
    pointsFraicheur(jours) + pointsNote(m.note) + pointsVolume(m.nbAvis) + pointsCompletude(m),
  );
  const constats = [];
  // LOT DIAG-2 : chaque constat porte une CLE stable. La section « ce que Stela
  // y changerait » se branche dessus et JAMAIS sur le texte : un jour ou une
  // phrase sera reecrite, le mapping ne doit pas tomber en silence.
  const ajouter = (ton, cle, texte) => constats.push({ ton, cle, texte });

  // Statut : le constat le plus fort, il passe devant tout le reste.
  if (m.statut === "CLOSED_PERMANENTLY") {
    ajouter("fort", "statut", "Votre fiche est marquée « définitivement fermée » sur Google. Tant qu'elle l'est, elle n'apparaît plus dans les résultats locaux : c'est à corriger avant tout le reste.");
  } else if (m.statut === "CLOSED_TEMPORARILY") {
    ajouter("fort", "statut", "Votre fiche est marquée « temporairement fermée ». Google cesse de la proposer aux clients qui cherchent autour d'eux.");
  }

  // Fraicheur du dernier avis REDIGE.
  if (jours === null) {
    ajouter("attention", "fraicheur", "Aucun avis rédigé n'est visible sur votre fiche. Google n'a rien de récent à lire, et un client qui hésite non plus.");
  } else if (jours <= 30) {
    // « date de 0 jour » : trouve en sondant de vraies fiches, jamais en
    // relisant le code. Un avis du jour meme se dit autrement.
    const quand = jours === 0 ? "d'aujourd'hui" : `de ${jours} jour${jours > 1 ? "s" : ""}`;
    ajouter("bon", "fraicheur", `Votre dernier avis rédigé date ${quand} : Google voit une fiche vivante, et vos clients aussi.`);
  } else if (jours <= 90) {
    ajouter("attention", "fraicheur", `Votre dernier avis rédigé date de ${Math.round(jours / 30)} mois. La fiche reste crédible, mais elle ralentit.`);
  } else {
    ajouter("fort", "fraicheur", `Votre dernier avis rédigé date de ${Math.round(jours / 30)} mois : Google lit une fiche inactive, et la fait reculer face à des concurrents qui en reçoivent chaque semaine.`);
  }

  // Note.
  if (m.note === null) {
    ajouter("attention", "note", "Votre fiche n'a pas encore de note. C'est le premier signal que regarde un client qui ne vous connaît pas.");
  } else if (m.note >= 4.6) {
    ajouter("bon", "note", `Votre note de ${noteFr(m.note)} sur 5 est excellente. Elle vous place devant la plupart des établissements de votre catégorie.`);
  } else if (m.note >= 4.3) {
    ajouter("bon", "note", `Votre note de ${noteFr(m.note)} sur 5 est bonne. Elle rassure sans réserve un client qui hésite.`);
  } else if (m.note >= 4.0) {
    ajouter("attention", "note", `Votre note de ${noteFr(m.note)} sur 5 passe, mais c'est le seuil où beaucoup de clients comparent avec le voisin.`);
  } else {
    ajouter("fort", "note", `Votre note de ${noteFr(m.note)} sur 5 fait hésiter : en dessous de 4, un client qui compare deux adresses choisit rarement la vôtre. Sur Google Maps, les clients peuvent filtrer les établissements notés 4,0 et plus : en dessous, vous n'apparaissez plus dans ces recherches.`);
  }

  // Volume.
  if (m.nbAvis === 0) {
    ajouter("attention", "volume", "Votre fiche ne porte aucun avis. Google a besoin de volume pour vous classer, et un client pour vous croire.");
  } else if (m.nbAvis < 20) {
    ajouter("attention", "volume", `Vous avez ${nbFr(m.nbAvis)} avis. C'est peu pour peser dans les résultats locaux : une note haute sur peu d'avis rassure moins qu'une note correcte sur cent.`);
  } else if (m.nbAvis >= 100) {
    ajouter("bon", "volume", `Vos ${nbFr(m.nbAvis)} avis constituent un socle solide, difficile à rattraper pour un concurrent qui démarre.`);
  } else {
    ajouter("bon", "volume", `Vous avez ${nbFr(m.nbAvis)} avis : le socle est là, il demande à être entretenu.`);
  }

  // Completude : un seul constat groupe, sinon la liste devient un inventaire.
  const manques = [];
  if (!m.site) manques.push("le site web");
  if (!m.telephone) manques.push("le téléphone");
  if (!m.horaires) manques.push("les horaires");
  if (m.photos === 0) manques.push("les photos");
  if (manques.length === 0) {
    const photos = m.photosPlafonnees ? `au moins ${PHOTOS_PLAFOND} photos` : `${m.photos} photo${m.photos > 1 ? "s" : ""}`;
    ajouter("bon", "completude", `Votre fiche est complète : site, téléphone, horaires et ${photos}. Google a tout ce qu'il faut pour vous proposer.`);
  } else {
    const liste = manques.length === 1 ? manques[0] : `${manques.slice(0, -1).join(", ")} et ${manques.at(-1)}`;
    ajouter("attention", "completude", `Il manque ${liste} sur votre fiche. Chaque information absente est une raison de plus, pour Google, de proposer un autre établissement.`);
  }

  return { score, constats, jours };
}

// LOT DIAG-2 : seuil de la note « rouge ». En dessous, la note COMMANDE le
// verdict quel que soit le score, et l'arithmetique de la moyenne s'affiche.
export const NOTE_ROUGE = 4;

/**
 * Combien d'avis 5 etoiles pour ramener la moyenne a 4,0 ?
 *
 * n = total x (4 - note), arrondi au superieur. C'est de l'arithmetique sur
 * deux chiffres PUBLICS, pas une projection : on enonce ce qu'il faudrait,
 * jamais ce que Google fera. Rend `null` des que le calcul n'a pas de sens
 * (pas de note, note deja a 4 ou au-dessus, aucun avis).
 *
 * Le calcul exact : pour passer de M a 4 avec n avis a 5, il faut
 * (T x M + 5n) / (T + n) >= 4, soit n >= T x (4 - M). L'approximation par
 * defaut de Google (la moyenne affichee est arrondie au dixieme) rend un
 * resultat a quelques unites pres : d'ou « environ » partout ou il s'affiche.
 */
export function avisPourAtteindre4(note, nbAvis) {
  if (!Number.isFinite(note) || !Number.isFinite(nbAvis)) return null;
  if (note >= NOTE_ROUGE || nbAvis <= 0) return null;
  // ⚠️ Le `toFixed(6)` n'est pas une coquetterie : en binaire, 4 - 3.9 vaut
  // 0.10000000000000009, donc 1000 avis donnaient 101 au lieu de 100 — un avis
  // fantome, sur le chiffre le plus scrute de toute la page. On coupe le bruit
  // de la virgule flottante AVANT d'arrondir au superieur.
  return Math.ceil(Number((nbAvis * (NOTE_ROUGE - note)).toFixed(6)));
}

/**
 * Verdict global, du meme ton que les constats.
 *
 * LOT DIAG-2 — LA NOTE COMMANDE LE TITRE. Le cas reel : une fiche a 84/100 avec
 * une note de 3,7 recevait « Votre fiche tient la route », ce qui contredisait
 * le seul constat qui coute de l'argent. Le score moyenne quatre dimensions
 * dont trois sont de l'hygiene de fiche (fraicheur, volume, completude) : une
 * fiche impeccablement tenue avec une mauvaise note obtient donc un bon score.
 * L'hygiene est un fait, la note est de l'argent. Le score reste affiche, mais
 * il ne peut plus contredire le constat business.
 */
export function verdict(score, m = null) {
  const noteRouge = m && Number.isFinite(m.note) && m.note < NOTE_ROUGE;
  if (noteRouge) {
    // Deux formulations : la fiche est par ailleurs bien tenue, ou elle ne
    // l'est pas. Dire « bien tenue » a qui ne l'est pas serait faux.
    if (score >= 65) {
      return {
        titre: "Votre fiche est bien tenue. Un seul point vous coûte des clients : votre note.",
        texte: "Le reste de votre fiche travaille déjà pour vous. C'est la note qui décide, et c'est elle qu'il faut remonter.",
      };
    }
    return {
      titre: "Votre note vous coûte des clients, et votre fiche ne compense pas.",
      texte: "La note fait hésiter, et le reste de la fiche ne rattrape pas ce qu'elle fait perdre.",
    };
  }
  if (score >= 85) return { titre: "Votre fiche est en bonne santé", texte: "Elle travaille déjà pour vous. L'enjeu n'est plus de la réparer, mais de tenir le rythme." };
  if (score >= 65) return { titre: "Votre fiche tient la route", texte: "Les fondations sont là. Deux ou trois habitudes suffiraient à la faire passer devant." };
  if (score >= 40) return { titre: "Votre fiche vous freine", texte: "Elle est visible, mais elle ne convainc pas encore, et Google le voit avant vos clients." };
  return { titre: "Votre fiche vous coûte des clients", texte: "En l'état, elle joue contre vous à chaque recherche locale." };
}

// ————————————————————————————————————————————————————————————————
// LOT DIAG-2 : « Ce que Stela y changerait ».
//
// ⚠️ REGLE ABSOLUE, alignee sur les CGV (« Le service n'offre aucune garantie
// de resultat chiffre. ») : ces lignes decrivent ce que Stela FAIT, jamais ce
// que Google decidera. Aucune promesse de note, aucun chiffre de resultat,
// aucun superlatif. Un diagnostic qui promettrait « votre note passera a 4,2 »
// vendrait ce que personne ne peut tenir, et se retournerait contre la marque
// au premier client decu.
//
// Le mapping est FIXE et branche sur la cle du constat, pas sur son texte.
// ————————————————————————————————————————————————————————————————
const CE_QUE_STELA_FAIT = {
  note: "Stela invite chaque client satisfait à laisser un avis après sa visite : votre note reflète enfin tous vos clients, pas seulement les mécontents.",
  fraicheur: "Un flux régulier d'avis récents : Google voit une fiche vivante.",
  volume: "Chaque visite devient une occasion d'avis, sans que vous ayez à le demander de vive voix.",
  completude: "Stela surveille votre fiche et vous signale ce qui manque, au lieu de vous laisser le découvrir des mois plus tard.",
  statut: "Stela surveille l'état de votre fiche et vous alerte dès qu'elle cesse d'être proposée aux clients.",
};

/**
 * Section vendeuse mais honnete, derivee des SEULS constats rouges ou ambres.
 *
 * Une fiche saine ne recoit PAS ce bloc en mode probleme : on ne fabrique
 * jamais un defaut pour avoir quelque chose a vendre. Elle recoit une ligne
 * d'entretien et le meme appel a l'essai.
 */
export function ceQueStelaChange(constats, m, maintenant = new Date()) {
  void maintenant;
  const aTraiter = (constats ?? []).filter((c) => c.ton === "fort" || c.ton === "attention");
  // Un seul point par cle : deux constats de la meme famille ne doivent pas
  // produire deux fois la meme phrase.
  const vues = new Set();
  const lignes = [];
  for (const c of aTraiter) {
    const phrase = CE_QUE_STELA_FAIT[c.cle];
    if (!phrase || vues.has(c.cle)) continue;
    vues.add(c.cle);
    lignes.push({ cle: c.cle, texte: phrase });
  }

  // L'arithmetique de la moyenne : un calcul, pas une promesse.
  const n = m ? avisPourAtteindre4(m.note, m.nbAvis) : null;
  const arithmetique = n === null ? null : {
    avisNecessaires: n,
    calcul: `Pour atteindre 4,0, il vous faudrait environ ${n.toLocaleString("fr-FR")} nouveaux avis 5 étoiles.`,
    suite: "Une moyenne ne se corrige pas d'un coup, elle se remonte par un flux régulier. Chaque mois sans collecte rend le rattrapage plus long. C'est exactement ce que Stela automatise : inviter chaque client satisfait, après chaque visite, sans y penser.",
  };

  if (lignes.length === 0) {
    return {
      mode: "entretien",
      titre: "Continuez comme ça",
      lignes: [],
      entretien: "Votre fiche est déjà à jour : Stela automatise ce que vous faites aujourd'hui à la main.",
      arithmetique: null,
    };
  }
  return { mode: "problemes", titre: "Ce que Stela y changerait", lignes, entretien: null, arithmetique };
}

// ————————————————————————————————————————————————————————————————
// 3. Garde-fous : cache 24 h et plafonds. FAIL-CLOSED, decision du lot.
//
// `rateLimit()` de lib/leads.js echoue OUVERT quand Upstash manque : acceptable
// pour un email, dangereux ici. Cette page appelle une API FACTUREE : sans
// compteur, un seul script boucle la facture. Pas de KV, pas d'appel Places,
// sans exception.
// ————————————————————————————————————————————————————————————————
const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const kvPret = () => Boolean(KV_URL && KV_TOKEN);

async function kv(commande) {
  const r = await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commande),
  });
  if (!r.ok) throw new Error(`KV ${r.status}`);
  return r.json();
}

/**
 * Plafond strict. Rend `false` des que le compteur ne peut pas etre tenu :
 * KV absent, KV en panne, quota depasse. L'appel Places n'a alors pas lieu.
 */
export async function plafondOk(cle, { max, windowSec }) {
  if (!kvPret()) return false;
  try {
    const out = await kv([
      ["INCR", `diag:rl:${cle}`],
      ["EXPIRE", `diag:rl:${cle}`, String(windowSec), "NX"],
    ]);
    return Number(out?.[0]?.result ?? Infinity) <= max;
  } catch {
    return false; // fail-closed : on prefere refuser un diagnostic qu'ouvrir la facture.
  }
}

/** Cache 24 h des METRIQUES DERIVEES uniquement (jamais un avis, jamais un nom). */
export async function cacheLire(placeId) {
  if (!kvPret()) return null;
  try {
    const out = await kv([["GET", `diag:fiche:${placeId}`]]);
    const brut = out?.[0]?.result;
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
}

export async function cacheEcrire(placeId, metriques) {
  if (!kvPret()) return;
  try {
    await kv([["SET", `diag:fiche:${placeId}`, JSON.stringify(metriques), "EX", String(86400)]]);
  } catch {
    /* le cache est un confort : son echec ne casse pas le diagnostic deja calcule. */
  }
}

export function ipClient(req) {
  const xf = req.headers["x-forwarded-for"];
  return (Array.isArray(xf) ? xf[0] : String(xf || "")).split(",")[0].trim() || "inconnue";
}

/** Cle de plafond journalier global : borne absolue de la facture Places. */
export const cleJour = (maintenant = new Date()) => `global:${maintenant.toISOString().slice(0, 10)}`;

// build:llms-full (LOT SEO-FIX-2) — génère dist/llms-full.txt.
//
// POURQUOI. /llms.txt est un SOMMAIRE : il dit ce qu'est Stela et où trouver le
// reste. La convention prévoit un second fichier, /llms-full.txt, qui porte le
// CONTENU des pages qui comptent, pour qu'un assistant n'ait pas à crawler le
// site pour répondre. Il était en 404. Stela a déjà des impressions en IA
// générative et /statistiques-avis-google-france se fait citer : le manque coûte.
//
// POURQUOI GÉNÉRÉ ET NON ÉCRIT À LA MAIN. public/llms.txt est maintenu à la main,
// et c'est tenable pour un sommaire de 7 Ko. Un fichier qui recopie le contenu de
// dix pages ne l'est pas : il dériverait dès la première retouche de texte, et
// personne ne le verrait. On l'extrait donc du HTML BUILDÉ, ce qui garantit qu'il
// dit exactement ce que le site dit.
//
// À LANCER APRÈS `astro build` (lit dist/).
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const DIST = "dist";
const SITE = "https://www.mystela.fr";

// Les pages qui comptent pour une IA : ce que fait le produit, combien il coûte,
// et les données publiques qu'elle peut citer. Pas le blog, déjà listé dans
// llms.txt, ni les pages villes, qui sont des déclinaisons d'un même gabarit.
const PAGES = [
  ["index", "Accueil"],
  ["tarifs", "Tarifs"],
  ["fonctionnalites", "Fonctionnalités"],
  ["collecte-avis-google", "Collecte d'avis Google"],
  ["reponse-automatique-avis", "Réponses automatiques aux avis"],
  ["analyse-des-avis", "Analyse des avis"],
  ["avis-multi-plateformes", "Avis multi-plateformes"],
  ["centralisation-reservations", "Centralisation des réservations"],
  ["sms-fidelisation", "SMS et fidélisation"],
  ["presence-plateformes", "Présence sur les plateformes"],
  ["statistiques-avis-google-france", "Statistiques sur les avis Google en France"],
  ["comparatif", "Comparatif"],
];

const ENTITES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " ", "&eacute;": "é", "&egrave;": "è", "&agrave;": "à", "&ccedil;": "ç", "&rarr;": "->", "&hellip;": "...", "&euro;": "€", "&times;": "x", "&laquo;": "«", "&raquo;": "»", "&#8217;": "'" };
const detexte = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&[a-z]+;|&#\d+;/gi, (e) => ENTITES[e] ?? " ");

// Le contenu principal, sans le chrome de navigation ni les scripts, et SANS les
// blocs décoratifs. La maquette de téléphone de l'accueil porte role="img" : son
// texte simulé (« Touchez une étoile », « Votre établissement ») est du décor, et
// le donner à lire à un assistant, c'est lui apprendre de faux faits sur Stela.
// Un simple remplacement par expression régulière ne peut pas retirer un bloc
// imbriqué : on parcourt donc les balises en tenant une profondeur de saut.
const SAUT_TAG = /^(script|style|noscript|svg|template|nav|header|footer)$/i;
// Les composants de demonstration portent des avis FICTIFS (« Lea M. », « Sophie
// D. »), lisibles comme tels sur la page parce qu'ils sont dessines dans une
// carte d'exemple. Mis a plat dans un fichier texte, ce contexte disparait et un
// assistant les lirait comme de vrais temoignages de vrais clients. On ne donne
// pas a lire a une IA des avis qu'on a inventes pour illustrer une maquette.
const SAUT_CLASSE = /class\s*=\s*.[^"']*\b(rc|fv|mk|rep|phone|ps|seo-before|seo-after)\b/i;
function elaguer(html) {
  const sortie = [];
  let i = 0, sautNom = null, sautProfondeur = 0;
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const [tout, fermant, nom, attrs] = m;
    if (!sautNom) sortie.push(html.slice(i, m.index));
    i = m.index + tout.length;
    const auto = /\/\s*$/.test(attrs) || /^(img|br|hr|meta|link|input|source|area|col|embed|track|wbr)$/i.test(nom);
    if (sautNom) {
      if (nom.toLowerCase() === sautNom && !auto) sautProfondeur += fermant ? -1 : 1;
      if (sautProfondeur === 0) sautNom = null;
      continue;
    }
    if (!fermant && !auto && (SAUT_TAG.test(nom) || SAUT_CLASSE.test(attrs) || /\baria-hidden\s*=\s*["\']true["\']/i.test(attrs) || /\brole\s*=\s*["\']img["\']/i.test(attrs))) {
      sautNom = nom.toLowerCase(); sautProfondeur = 1; continue;
    }
    if (!sautNom) sortie.push(tout);
  }
  if (!sautNom) sortie.push(html.slice(i));
  return sortie.join("");
}

function markdown(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  let b = elaguer(m ? m[1] : html);
  // Décalage de deux niveaux : le H1 de la page devient ###, sous le ## qui porte
  // son titre dans ce fichier. Sans ce décalage, les deux se confondraient.
  b = b.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n\n${"#".repeat(Math.min(6, +n + 2))} ${t.replace(/<[^>]+>/g, " ")}\n`);
  b = b.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${t.replace(/<[^>]+>/g, " ")}`);
  b = b.replace(/<\/(p|div|section|tr|figcaption|blockquote)>/gi, "\n");
  b = b.replace(/<br\s*\/?>/gi, "\n");
  b = b.replace(/<[^>]+>/g, " ");
  b = detexte(b);
  return b.split("\n").map((l) => l.replace(/[ \t\u00a0]+/g, " ").trim())
    .filter((l, i, a) => l !== "" || (a[i - 1] ?? "") !== "")
    .join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const morceaux = [
  "# Stela — contenu complet",
  "",
  "> Version longue de https://www.mystela.fr/llms.txt : le contenu des pages qui décrivent le produit, ses prix et les données publiques que Stela cite. Généré à chaque déploiement depuis les pages elles-mêmes, il ne peut pas diverger du site.",
  "",
  `> Sommaire et liens : ${SITE}/llms.txt`,
];

let manquantes = 0;
for (const [slug, titre] of PAGES) {
  const f = `${DIST}/${slug}.html`;
  if (!existsSync(f)) { console.error(`build:llms-full ECHEC : ${f} absent du build.`); manquantes++; continue; }
  const url = slug === "index" ? SITE : `${SITE}/${slug}`;
  morceaux.push("", "---", "", `## ${titre}`, "", `Source : ${url}`, "", markdown(readFileSync(f, "utf8")));
}
if (manquantes) process.exit(1);

const sortie = morceaux.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
writeFileSync(`${DIST}/llms-full.txt`, sortie, "utf8");
const mots = sortie.split(/\s+/).filter(Boolean).length;
console.log(`build:llms-full OK : ${PAGES.length} pages, ${mots} mots, ${Buffer.byteLength(sortie)} octets -> dist/llms-full.txt`);

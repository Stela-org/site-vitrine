// check:cities (LOT VIT-16) — verrou anti « doorway pages ».
// L'audit du 31 juillet 2026 a relevé 9 pages villes d'environ 480 mots dont
// ~84 % de texte commun : le profil exact que Google declasse. Ce check mesure,
// sur le HTML RENDU (donc ce que voit le crawler) :
//   1. la longueur du contenu principal : >= 1100 mots par ville ;
//   2. la part de contenu UNIQUE a la ville : >= 40 %. Une phrase est dite
//      commune des lors qu'elle apparait a l'identique sur une autre page ville
//      (apres neutralisation du nom de ville et du gentile, sinon un simple
//      « a Nancy » suffirait a faire passer une phrase clonee pour unique) ;
//   3. la presence de la FAQ locale dans le bloc FAQPage (schema) ;
//   4. le <title> <= 60 caracteres.
// A lancer APRES le build.
import { readFileSync, globSync } from "node:fs";

const MIN_WORDS = 1100;
const MIN_UNIQUE_RATIO = 0.4;
const MAX_TITLE = 60;

const files = globSync("dist/restaurants-*.html");
if (files.length === 0) {
  console.error("check:cities ECHEC : aucune page ville dans le build.");
  process.exit(1);
}

const errors = [];

// Contenu principal : <main> sans les blocs non redactionnels (nav, scripts,
// styles, listes de liens vers les autres villes, bloc de closing commun).
function mainText(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  let body = main ? main[1] : html;
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  body = body.replace(/<style[\s\S]*?<\/style>/gi, "");
  body = body.replace(/<section class="others"[\s\S]*?<\/section>/gi, "");
  return body;
}

function toText(htmlFragment) {
  return htmlFragment
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const wordsOf = (text) => text.split(/\s+/).filter((w) => /[a-zA-Zà-üÀ-Ü0-9]/.test(w));

// Neutralise ce qui est propre a la ville pour comparer les phrases entre
// pages : noms de villes, gentiles, prepositions. Une phrase « clonee » ou seul
// le nom de ville change devient alors identique, donc comptee comme commune.
const CITY_TOKENS = [
  "paris", "parisien", "parisienne", "parisiens", "parisiennes",
  "lyon", "lyonnais", "lyonnaise", "lyonnaises",
  "marseille", "marseillais", "marseillaise", "marseillaises",
  "bordeaux", "bordelais", "bordelaise", "bordelaises",
  "nice", "nicois", "nicoise", "nicoises",
  "nantes", "nantais", "nantaise", "nantaises",
  "brest", "brestois", "brestoise", "brestoises",
  "rouen", "rouennais", "rouennaise", "rouennaises",
  "nancy", "nanceien", "nanceienne", "nanceiens", "nanceiennes",
];
const CITY_RE = new RegExp(`\\b(${CITY_TOKENS.join("|")})\\b`, "g");

function normalize(sentence) {
  return sentence
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(CITY_RE, "@ville")
    .replace(/\s+/g, " ")
    .trim();
}

// Decoupe en phrases, en ignorant les fragments trop courts (titres, boutons)
// qui fausseraient la mesure dans un sens comme dans l'autre.
function sentencesOf(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => wordsOf(s).length >= 6);
}

const pages = files.map((file) => {
  const html = readFileSync(file, "utf8");
  const text = toText(mainText(html));
  const sentences = sentencesOf(text);
  return {
    file,
    ville: file.replace(/^dist\/restaurants-/, "").replace(/\.html$/, ""),
    html,
    words: wordsOf(text).length,
    sentences,
    normalized: sentences.map(normalize),
  };
});

for (const page of pages) {
  // 1) Longueur.
  if (page.words < MIN_WORDS) {
    errors.push(`${page.file}: ${page.words} mots dans le contenu principal, minimum ${MIN_WORDS}.`);
  }

  // 2) Part unique : mots portes par des phrases qu'aucune AUTRE ville ne partage.
  const others = new Set(pages.filter((p) => p !== page).flatMap((p) => p.normalized));
  let uniqueWords = 0;
  let totalWords = 0;
  page.sentences.forEach((sentence, i) => {
    const n = wordsOf(sentence).length;
    totalWords += n;
    if (!others.has(page.normalized[i])) uniqueWords += n;
  });
  const ratio = totalWords ? uniqueWords / totalWords : 0;
  if (ratio < MIN_UNIQUE_RATIO) {
    errors.push(`${page.file}: ${(ratio * 100).toFixed(1)} % de contenu unique, minimum ${MIN_UNIQUE_RATIO * 100} %.`);
  }
  page.ratio = ratio;

  // 3) FAQ locale presente dans le bloc FAQPage.
  const ld = [...page.html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try { return JSON.parse(m[1]); } catch { return null; }
    })
    .filter(Boolean);
  const faqPage = ld.find((b) => b["@type"] === "FAQPage");
  if (!faqPage) {
    errors.push(`${page.file}: bloc FAQPage absent.`);
  } else if (!Array.isArray(faqPage.mainEntity) || faqPage.mainEntity.length < 6) {
    errors.push(`${page.file}: FAQPage avec ${faqPage.mainEntity?.length ?? 0} question(s) : la FAQ locale (3 a 4 questions) doit s'ajouter aux questions communes.`);
  }

  // 4) Titre <= 60 caracteres.
  const title = page.html.match(/<title>([^<]*)<\/title>/);
  if (title && title[1].length > MAX_TITLE) {
    errors.push(`${page.file}: <title> de ${title[1].length} caracteres (max ${MAX_TITLE}) -> ${title[1]}`);
  }
}

if (errors.length) {
  console.error(`check:cities ECHEC : ${errors.length} probleme(s) :`);
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
const minWords = Math.min(...pages.map((p) => p.words));
const minRatio = Math.min(...pages.map((p) => p.ratio));
console.log(`check:cities OK : ${pages.length} pages villes, ${minWords} mots minimum (seuil ${MIN_WORDS}), ${(minRatio * 100).toFixed(1)} % de contenu unique minimum (seuil ${MIN_UNIQUE_RATIO * 100} %), FAQ locale dans le FAQPage, titres <= ${MAX_TITLE} caracteres.`);

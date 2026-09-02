// check:brand — garde-fou marque. Baseline 0 dans les sources du site :
//  - « Stella » (double L) = codename interne interdit en surface.
//  - « Avistars » / « avistars.fr » = ancienne marque à ne jamais réintroduire.
//  - review gating (interception d'insatisfaits, filtrage des avis par la note).
// Ce gardien scanne par LISTE BLANCHE (voir PATTERNS) : src/ et public/.
// Le dossier legacy/ n'en faisait donc pas partie, et c'est ainsi que ses 67
// fichiers Avistars ont survécu à un gardien à baseline 0. Il est supprimé au
// LOT VIT-MENAGE ; sa mémoire utile est dans docs/URL-MAP-LEGACY.md.
//
// ── LOT AVISTARS-PURGE-1 §C — la même cécité avait laissé passer autre chose ──
// La liste blanche `src/` + `public/` ne voyait NI `vercel.json`, NI `scripts/`,
// NI `.github/`. Or c'est dans `vercel.json` que vivait le mapping 301 du
// rebrand, et c'est là qu'une erreur ne casse pas un texte affiché mais une
// REDIRECTION : sept règles y pointaient une source en `.html` que `cleanUrls`
// retirait avant leur application, donc tout backlink Avistars tombait en 404,
// sans qu'aucun gardien ne puisse le dire. On ajoute donc deux volets :
//
//   Volet 2 — `vercel.json`, contrôle STRUCTUREL et non textuel. Une occurrence
//     d'« avistars » y est LÉGITIME dans un `has.host` (c'est le domaine legacy
//     qu'on redirige, il doit y être nommé) et INTERDITE dans un `destination`
//     (renvoyer un visiteur vers l'ancienne marque). Un scan textuel ne saurait
//     pas faire la différence et forcerait à exclure le fichier entier, donc à
//     ne rien garder. On parse le JSON.
//
//   Volet 3 — `scripts/` et `.github/`, scan textuel avec EXCLUSIONS MOTIVÉES.
//     Quelques fichiers doivent nommer l'ancienne marque pour faire leur travail
//     (ce gardien-ci en premier). Chaque exclusion porte sa raison écrite, jamais
//     un nom seul : une exclusion sans motif est une porte qu'on rouvre en
//     silence, exactement le mécanisme qui a produit les 67 fichiers.
//
// `docs/` reste HORS PÉRIMÈTRE, volontairement : la documentation doit pouvoir
// parler d'Avistars pour tracer le mapping 301 et l'histoire du rebrand.
import { readFileSync, globSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

// Empreinte du favicon Avistars (legacy) : ne doit JAMAIS réapparaître.
const LEGACY_FAVICON_SHA256 = "c5dad924b7f50fe73db77300f020cf62b92ec8c1e338ed6eee0c405956b5ee89";

const PATTERNS = [
  "src/**/*.{astro,ts,tsx,js,mjs,md}",
  "public/**/*.{txt,json,xml,webmanifest,html}",
];

// Motifs interdits (insensibles à la casse). Le codename à double L est exclu
// via lookahead quand il fait partie du mot composé du repo interne
// (« stella-app », toléré en commentaire technique). Le discours de review
// gating (interception d'insatisfaits, filtrage par la note) n'est PAS un motif
// automatique : une négation légitime (« aucune interception ») le déclencherait
// à tort. Sa purge reste un point de revue humaine du GATE.
const RULES = [
  { name: "codename double L", re: /\bStella\b(?!-app)/i },
  { name: "Avistars / avistars.fr", re: /avistars/i },
];

const files = [...new Set(PATTERNS.flatMap((p) => globSync(p)))];

const offenders = [];
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.re.test(line)) offenders.push(`${f}:${i + 1} [${rule.name}]: ${line.trim().slice(0, 90)}`);
    }
  });
}

// ── Volet 2 : `vercel.json`, contrôle structurel des DESTINATIONS ──────────
// Une destination est ce vers quoi on ENVOIE un visiteur. Elle ne doit jamais
// porter l'ancienne marque. Les `source` et les `has.host`, eux, la nomment
// légitimement : ce sont les motifs d'entrée du domaine legacy qu'on redirige.
if (existsSync("vercel.json")) {
  const conf = JSON.parse(readFileSync("vercel.json", "utf8"));
  for (const champ of ["redirects", "rewrites"]) {
    (conf[champ] ?? []).forEach((regle, i) => {
      for (const rule of RULES) {
        if (typeof regle.destination === "string" && rule.re.test(regle.destination)) {
          offenders.push(`vercel.json ${champ}[${i}].destination [${rule.name}] : ${regle.destination}`);
        }
      }
      // Une source en `.html` ne se déclenche JAMAIS quand `cleanUrls` est
      // actif : l'extension est retirée avant l'application des règles. La
      // règle serait verte, morte, et silencieuse — le défaut exact du lot.
      if (conf.cleanUrls === true && typeof regle.source === "string" && regle.source.endsWith(".html")) {
        offenders.push(`vercel.json ${champ}[${i}].source [règle morte sous cleanUrls] : ${regle.source} ne se déclenchera jamais (retirer .html de la source)`);
      }
      // LOT SEO-FIX-1 : la règle trop gourmande. Un paramètre `:nom` sans
      // motif capture N'IMPORTE QUEL suffixe. Tant que la destination garde la
      // MÊME forme de chemin que la source (`/:path*` vers `/:path*`), c'est
      // sans danger : on rejoue l'URL telle quelle. Dès que la destination
      // change de forme, le paramètre fabrique une URL qui n'existe peut-être
      // pas, et la redirection sert un 404 à la place de la page demandée.
      // Le 02/09/2026, `/blog/avis-google-restaurant-:ville` envoyait l'article
      // publié `...-paris-lyon` sur `/restaurants-paris-lyon`, inexistant :
      // un 404 lié depuis les 16 pages du blog. Le correctif est toujours une
      // liste fermée, `:ville(bordeaux|brest|...)`.
      if (typeof regle.source === "string" && typeof regle.destination === "string") {
        const forme = (v) => v.replace(/:[A-Za-z0-9_]+(\([^)]*\))?\*?/g, ":P");
        const nus = [...regle.source.matchAll(/:([A-Za-z0-9_]+)(\([^)]*\))?/g)].filter((m) => !m[2]);
        const memeForme = forme(regle.source) === forme(new URL(regle.destination, "https://www.mystela.fr").pathname);
        if (nus.length > 0 && !memeForme) {
          offenders.push(`vercel.json ${champ}[${i}].source [règle trop gourmande] : ${regle.source} capture n'importe quel suffixe et le réinjecte dans ${regle.destination}, de forme différente. Borner le paramètre par une liste fermée, ex. :${nus[0][1]}(a|b|c).`);
        }
      }
    });
  }
}

// ── Volet 3 : `scripts/` et `.github/`, scan textuel à exclusions motivées ──
const EXCLUSIONS_MOTIVEES = {
  "scripts/check-brand.mjs": "définit les motifs interdits : il doit nommer les chaînes qu'il interdit",
  "scripts/check-copy.mjs": "commentaire historique retraçant la suppression de legacy/ au LOT VIT-MENAGE",
  "scripts/check-analytics.mjs": "avistars.fr figure dans la liste blanche des domaines d'emails du site : savoir reconnaître une adresse legacy est son travail",
  ".github/workflows/gardiens.yml": "intitulé de l'étape CI qui exécute précisément ce gardien",
};
const PATTERNS_ETENDUS = ["scripts/**/*.mjs", ".github/**/*.yml"];
const filesEtendus = [...new Set(PATTERNS_ETENDUS.flatMap((p) => globSync(p)))]
  .filter((f) => !(f in EXCLUSIONS_MOTIVEES));

for (const f of filesEtendus) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.re.test(line)) offenders.push(`${f}:${i + 1} [${rule.name}]: ${line.trim().slice(0, 90)}`);
    }
  });
}

// Empreinte : le favicon ne doit pas être celui d'Avistars.
if (existsSync("public/favicon.ico")) {
  const sha = createHash("sha256").update(readFileSync("public/favicon.ico")).digest("hex");
  if (sha === LEGACY_FAVICON_SHA256) offenders.push("public/favicon.ico [favicon legacy Avistars] : empreinte identique à l'ancien favicon");
}

if (offenders.length) {
  console.error(`check:brand ECHEC : ${offenders.length} occurrence(s) interdite(s) :`);
  offenders.forEach((o) => console.error("  " + o));
  process.exit(1);
}
console.log(
  `check:brand OK : 0 occurrence interdite ` +
  `(${files.length} fichiers src/public + ${filesEtendus.length} fichiers scripts/.github ` +
  `+ vercel.json + favicon ; ${Object.keys(EXCLUSIONS_MOTIVEES).length} exclusion(s) motivée(s)).`
);

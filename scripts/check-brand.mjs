// check:brand — garde-fou marque. Baseline 0 dans les sources du site :
//  - « Stella » (double L) = codename interne interdit en surface.
//  - « Avistars » / « avistars.fr » = ancienne marque à ne jamais réintroduire.
//  - review gating (interception d'insatisfaits, filtrage des avis par la note).
// Le legacy/ (ancien site) est exclu : purgé au VIT-4.
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
console.log(`check:brand OK : 0 occurrence interdite (${files.length} fichiers + favicon).`);

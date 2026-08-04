// lint:copy — baseline 0 : aucun tiret cadratin (—, U+2014) dans les sources du
// site (src/, public/, docs/). Le legacy/ (ancien site Avistars) est supprimé au LOT VIT-MENAGE ; il
// sera supprimé au VIT-4, on ne le corrige pas.
import { readFileSync, globSync } from "node:fs";

const PATTERNS = [
  "src/**/*.{astro,ts,tsx,js,mjs,css,md,json,txt}",
  "public/**/*.{txt,json,xml,webmanifest,html}",
  "docs/**/*.md",
];
const EM_DASH = /—/;

const files = [...new Set(PATTERNS.flatMap((p) => globSync(p)))];

const offenders = [];
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (EM_DASH.test(line)) offenders.push(`${f}:${i + 1}: ${line.trim().slice(0, 80)}`);
  });
}

if (offenders.length) {
  console.error(`lint:copy ECHEC : ${offenders.length} tiret(s) cadratin interdit(s) :`);
  offenders.forEach((o) => console.error("  " + o));
  process.exit(1);
}
console.log(`lint:copy OK : 0 tiret cadratin (${files.length} fichiers).`);

// lint:copy — deux baselines à 0, sur les sources du site (src/, public/, docs/).
//
// 1. Aucun tiret cadratin (—, U+2014).
// 2. Aucun emoji dans src/ (VIT-19). La charte est « zéro emoji » depuis
//    toujours, mais rien ne la faisait respecter : VIT-18 a dû retirer un 🎁
//    des cartes de prix, VIT-18b deux autres de la maquette du hero, et il en
//    restait sept sur les cartes métier. Trois lots pour la même faute, parce
//    qu'un humain relit la copie et jamais les caractères. Maintenant le build
//    tombe.
//
// Le legacy/ (ancien site Avistars) a été supprimé au LOT VIT-MENAGE.
import { readFileSync, globSync } from "node:fs";

const PATTERNS = [
  "src/**/*.{astro,ts,tsx,js,mjs,css,md,json,txt}",
  "public/**/*.{txt,json,xml,webmanifest,html}",
  "docs/**/*.md",
];
const EM_DASH = /—/;

// Détection par propriété Unicode plutôt que par plages recopiées à la main :
// `Extended_Pictographic` est LA propriété que le standard réserve à ce qui se
// dessine comme une image, et elle suit les révisions d'Unicode toute seule.
// Elle laisse passer ce que le site utilise vraiment comme typographie : ★
// (U+2605) des notes, ✓ (U+2713) des listes, → (U+2192) des flèches, · et •.
// Elle attrape en revanche le ✳ (U+2733) déjà proscrit, que Glyph.astro
// remplace par un SVG parce qu'iOS le rendait en vert.
const EMOJI = /\p{Extended_Pictographic}/gu;

// Trois symboles portent `Extended_Pictographic` sans être des emojis : ce sont
// des signes juridiques, rendus en texte et non en image tant qu'aucun U+FE0F
// ne les suit. Le © du footer en est un. Ce n'est pas une exception accordée à
// un fichier, c'est la définition de ce que le gardien cherche.
const LEGAL = /[©®™]/gu;

// Fichiers dispensés du volet emoji. VOLONTAIREMENT VIDE. Une entrée ajoutée
// ici doit porter sa raison écrite à côté, jamais un chemin seul : sans la
// raison, personne ne saura plus tard si elle est encore méritée.
const EMOJI_EXEMPT = new Set([]);

const files = [...new Set(PATTERNS.flatMap((p) => globSync(p)))];

const dashes = [];
const emojis = [];
for (const f of files) {
  const isSrc = f.startsWith("src/") && !EMOJI_EXEMPT.has(f);
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (EM_DASH.test(line)) dashes.push(`${f}:${i + 1}: ${line.trim().slice(0, 80)}`);
    if (!isSrc) return;
    const found = [...new Set(line.replace(LEGAL, "").match(EMOJI) ?? [])];
    if (found.length) {
      const cps = found.map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"));
      emojis.push(`${f}:${i + 1}: ${cps.join(" ")} : ${line.trim().slice(0, 70)}`);
    }
  });
}

if (dashes.length) {
  console.error(`lint:copy ECHEC : ${dashes.length} tiret(s) cadratin interdit(s) :`);
  dashes.forEach((o) => console.error("  " + o));
}
if (emojis.length) {
  console.error(`lint:copy ECHEC : ${emojis.length} ligne(s) portant un emoji dans src/ :`);
  emojis.forEach((o) => console.error("  " + o));
  console.error("  Remplacer par un SVG inline (voir SegmentIcon.astro ou Glyph.astro), pas par un autre caractere.");
}
if (dashes.length || emojis.length) process.exit(1);

const scanned = files.filter((f) => f.startsWith("src/")).length;
console.log(`lint:copy OK : 0 tiret cadratin (${files.length} fichiers), 0 emoji dans src/ (${scanned} fichiers).`);

// check:alt — garde-fou accessibilité + SEO : toute balise <img> du build doit
// porter un attribut `alt` NON VIDE (décision superviseur VIT-8, signal Bing Live
// URL « Alt attribute for images is missing »). Les visuels purement décoratifs
// portent leur description ou vivent en CSS/SVG, pas en <img alt="">. À lancer
// APRÈS le build (lit dist/).
import { readFileSync, globSync } from "node:fs";

const htmlFiles = globSync("dist/**/*.html");
const IMG_RE = /<img\b[^>]*>/gi;
const ALT_RE = /\salt\s*=\s*"([^"]*)"/i;

const offenders = [];
let imgs = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(IMG_RE)) {
    imgs++;
    const tag = m[0];
    const alt = tag.match(ALT_RE);
    if (!alt || alt[1].trim() === "") {
      // Nettoie les attributs de scoping Astro pour un message lisible.
      const clean = tag.replace(/\sdata-astro-cid-[^=\s>]*(="[^"]*")?/g, "").slice(0, 140);
      offenders.push(`${file.replace(/^dist/, "")} : ${alt ? "alt vide" : "attribut alt manquant"} → ${clean}`);
    }
  }
}

if (offenders.length) {
  console.error(`check:alt ECHEC : ${offenders.length} image(s) sans alt non vide :`);
  [...new Set(offenders)].forEach((o) => console.error("  " + o));
  process.exit(1);
}
console.log(`check:alt OK : ${imgs} balise(s) <img> avec alt non vide (${htmlFiles.length} pages).`);

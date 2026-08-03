// check:schema — valide chaque bloc JSON-LD (schema.org) du build : parse JSON
// strict + présence de @context / @type + champs minimaux par type. Ne remplace
// pas le Rich Results Test de Google, mais garantit qu'aucun schema n'est
// malformé (cause n°1 d'un rich result rejeté). À lancer APRÈS le build.
import { readFileSync, globSync } from "node:fs";

const htmlFiles = globSync("dist/**/*.html");
const LD_RE = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

// Champs minimaux attendus par type (contrôle léger).
const REQUIRED = {
  Organization: ["name", "url"],
  WebSite: ["name", "url"],
  SoftwareApplication: ["name", "offers"],
  FAQPage: ["mainEntity"],
  BreadcrumbList: ["itemListElement"],
  // LOT VIT-16 : `license` est le champ que Search Console a signalé absent le
  // 03/08/2026. Il est ici pour que l'oubli ne puisse pas revenir en silence :
  // une page-données sans licence lisible par machine n'est pas citable
  // proprement, et Google prévient qu'il peut durcir ce signal.
  Dataset: ["name", "description", "license", "creator"],
};

const errors = [];
let blocks = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(LD_RE)) {
    blocks++;
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch (e) {
      errors.push(`${file}: JSON-LD invalide (${e.message})`);
      continue;
    }
    const nodes = Array.isArray(data) ? data : [data];
    for (const node of nodes) {
      if (!node["@context"]) errors.push(`${file}: @context manquant`);
      const type = node["@type"];
      if (!type) { errors.push(`${file}: @type manquant`); continue; }
      const req = REQUIRED[type];
      if (req) for (const f of req) {
        if (node[f] === undefined) errors.push(`${file}: ${type}.${f} manquant`);
      }
    }
  }
}

if (errors.length) {
  console.error(`check:schema ECHEC : ${errors.length} probleme(s) :`);
  [...new Set(errors)].forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(`check:schema OK : ${blocks} blocs JSON-LD valides (${htmlFiles.length} pages).`);

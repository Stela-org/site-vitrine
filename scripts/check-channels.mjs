// check:channels — le chiffre « XX canaux et plateformes » affiché sur
// /fonctionnalites DOIT égaler le nombre RÉEL d'éléments de la liste CHANNELS
// (config/site.ts). Empêche un claim gonflé : si la liste change, le chiffre
// affiché doit suivre (et inversement). À lancer APRÈS le build.
import { readFileSync } from "node:fs";

// 1) Compter les entrées réelles de CHANNELS dans la source.
const src = readFileSync("src/config/site.ts", "utf8");
const m = src.match(/export const CHANNELS\s*=\s*\[([\s\S]*?)\]\s*as const;/);
if (!m) { console.error("check:channels ECHEC : bloc CHANNELS introuvable dans config/site.ts."); process.exit(1); }
const count = (m[1].match(/\{\s*name:/g) || []).length;
if (count < 1) { console.error("check:channels ECHEC : CHANNELS vide."); process.exit(1); }

// 2) Le chiffre affiché sur le hub /fonctionnalites (span data-count).
const html = readFileSync("dist/fonctionnalites.html", "utf8");
const shown = html.match(/data-count="(\d+)"/);
if (!shown) { console.error("check:channels ECHEC : aucun chiffre data-count sur /fonctionnalites."); process.exit(1); }
const displayed = Number(shown[1]);

if (displayed !== count) {
  console.error(`check:channels ECHEC : chiffre affiché ${displayed} != ${count} éléments réels dans CHANNELS.`);
  process.exit(1);
}
console.log(`check:channels OK : ${displayed} canaux et plateformes affichés = ${count} éléments réels dans CHANNELS.`);

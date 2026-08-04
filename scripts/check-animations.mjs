// check:animations — garde-fou d'une VRAIE régression fonctionnelle, pas d'un
// détail de style. Les révélations au scroll s'écrivent avec `animation-timeline:
// view()` (ou `scroll()`). Si la source utilise le RACCOURCI `animation: ... ;`
// juste à côté, le minifieur du build replie les deux déclarations en une seule
// valeur du raccourci :
//     animation:linear both reveal-in view()
// `view()` n'est pas une valeur légale du raccourci `animation` : le navigateur
// JETTE LA RÈGLE ENTIÈRE. animationName retombe à "none", animationTimeline à
// "auto", et plus AUCUNE révélation ne joue en production. Rien ne casse
// visuellement (règle VIT-6 : ces reveals ne touchent jamais l'opacité), donc le
// défaut passe inaperçu — d'où ce gardien.
//
// PARADE : écrire des LONGHANDS (animation-name / -duration / -timing-function /
// -fill-mode / -timeline / -range), forme qui survit à la minification.
//
// À lancer APRÈS le build : ce gardien inspecte le CSS BUILDÉ dans dist/, pas la
// source. C'est tout le sujet — la source peut être juste et le build faux.
import { readFileSync, globSync } from "node:fs";

// Un raccourci `animation:` (pas `animation-name:`, pas `animation-timeline:`)
// dont la valeur contient view() ou scroll(). Le `(?!-)` exclut les longhands.
const SHORTHAND_RE = /animation\s*(?!-)\s*:\s*([^;{}]*?(?:view|scroll)\s*\([^;{}]*)/gi;

const files = [...globSync("dist/**/*.css"), ...globSync("dist/**/*.html")];
const offenders = [];
let scanned = 0;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  scanned++;
  for (const m of source.matchAll(SHORTHAND_RE)) {
    const value = m[1].trim().slice(0, 120);
    offenders.push(`${file} : raccourci illégal → animation: ${value}`);
  }
}

if (offenders.length) {
  console.error(
    `check:animations ECHEC : ${offenders.length} raccourci(s) \`animation\` contenant view()/scroll() dans le CSS buildé.`
  );
  console.error(
    "  Le navigateur jette ces règles : les révélations au scroll ne jouent PAS."
  );
  [...new Set(offenders)].forEach((o) => console.error("  " + o));
  console.error(
    "  Correctif : remplacer le raccourci par des longhands (animation-name, animation-duration,"
  );
  console.error(
    "  animation-timing-function, animation-fill-mode) à côté de animation-timeline / animation-range."
  );
  process.exit(1);
}

// Filet inverse : si plus aucune timeline n'est présente dans le build, c'est que
// les révélations ont disparu (ou que le gardien scanne le vide).
const timelines = files.reduce(
  (n, f) => n + (readFileSync(f, "utf8").match(/animation-timeline\s*:/gi) || []).length,
  0
);
if (timelines === 0) {
  console.error(
    "check:animations ECHEC : aucune déclaration `animation-timeline` dans dist/ — les révélations au scroll ont disparu du build."
  );
  process.exit(1);
}

console.log(
  `check:animations OK : ${timelines} déclaration(s) animation-timeline en longhand, 0 raccourci illégal (${scanned} fichier(s) buildés).`
);

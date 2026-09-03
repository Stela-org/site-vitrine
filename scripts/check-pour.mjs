// check:pour (LOT POUR-1) — les pages métier ne peuvent plus redevenir des coquilles.
//
// POURQUOI. Avant SEO-FIX-2, les sept pages /pour/ faisaient 300 à 430 mots dont
// 30 à 50 propres au métier : le même gabarit répété sept fois, avec un nom de
// métier échangé. Le lot les a réécrites une par une. Sans gardien, la prochaine
// page /pour/ naîtrait comme les précédentes, et personne ne le verrait avant que
// Google ne le voie.
//
// TROIS REFUS.
//   1. Une page sous le plancher de mots.
//   2. Une phrase de 8 mots partagée entre deux blocs métier.
//   3. Une page /pour/ sans bloc métier du tout — le cas de la page nouvelle.
//
// LE PLANCHER EST UN CLIQUET, ET IL VAUT 753. Ce n'est pas un chiffre rond, c'est
// le MINIMUM RÉEL des sept pages au 03/09/2026 (`/pour/institut`). Un seuil rond
// à 700 laisserait 53 mots de marge à quelqu'un pour raboter sans rien casser ;
// un seuil au réel refuse la première régression. La contrepartie est assumée :
// retirer un mot à la page la plus courte fait tomber la CI. C'est exactement la
// discipline de `lint:colors`, dont la baseline ne bouge que sur décision
// humaine. Si les sept pages progressent, ce nombre MONTE, jamais l'inverse.
//
// LE GABARIT EST NEUTRALISÉ. La nav, les boutons, le bandeau d'exemples, la
// grille de tarifs et les liens croisés se répètent par construction : mesurés
// bruts, ils produisent 1 785 phrases de 8 mots « partagées » qui ne disent rien
// de la qualité du contenu. Le contrôle d'unicité ne porte donc QUE sur la
// section `.metier`, qui est le contenu écrit pour chaque métier.
//
// AUCUNE EXCLUSION, ET IL NE DOIT PAS Y EN AVOIR. Si une page ne passe pas, c'est
// qu'elle n'est pas à niveau ou que le plancher est faux. Les deux se corrigent,
// aucun des deux ne s'excuse.
//
// À LANCER APRÈS LE BUILD.
import { readFileSync, globSync } from "node:fs";

const PLANCHER_MOTS = 753; // cliquet : minimum réel des sept au 03/09/2026 (institut)
const N = 8;               // longueur d'une « phrase » au sens de ce gardien

const fichiers = globSync("dist/pour/*.html");
if (fichiers.length === 0) {
  console.error("check:pour ECHEC : aucune page /pour/ dans le build.");
  process.exit(1);
}

const mots = (t) => t.match(/[0-9A-Za-zÀ-ÿ'’-]+/g) ?? [];
const enTexte = (html) =>
  html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ");

// Le corps de la page : <main> sans le chrome, comme check:cities.
function corpsPage(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return mots(enTexte(m ? m[1] : html));
}
// Le bloc métier seul : ce qui a été écrit POUR ce métier.
function blocMetier(html) {
  const m = html.match(/<section class="metier"[\s\S]*?<\/section>/i);
  return m ? mots(enTexte(m[0])) : null;
}

const erreurs = [];
const blocs = new Map();
let minimum = Infinity;

for (const f of fichiers.sort()) {
  const slug = f.split("/").pop().replace(/\.html$/, "");
  const html = readFileSync(f, "utf8");
  const page = corpsPage(html);
  const bloc = blocMetier(html);

  if (bloc === null) {
    erreurs.push(`/pour/${slug} n'a pas de bloc metier. Ajouter son entree dans src/content/metiers.ts : vocabulaire du metier, moment de la demande, objection propre au metier.`);
  } else {
    blocs.set(slug, bloc);
  }
  if (page.length < PLANCHER_MOTS) {
    erreurs.push(`/pour/${slug} ne fait que ${page.length} mots, plancher ${PLANCHER_MOTS}.`);
  }
  minimum = Math.min(minimum, page.length);
}

// Unicité : aucune suite de N mots ne doit exister dans deux blocs métier.
const grammes = new Map();
for (const [slug, m] of blocs) {
  const s = new Set();
  for (let i = 0; i + N <= m.length; i++) s.add(m.slice(i, i + N).join(" "));
  grammes.set(slug, s);
}
const noms = [...grammes.keys()];
let partagees = 0;
for (let i = 0; i < noms.length; i++) {
  for (let j = i + 1; j < noms.length; j++) {
    const communes = [...grammes.get(noms[i])].filter((g) => grammes.get(noms[j]).has(g));
    if (communes.length) {
      partagees += communes.length;
      erreurs.push(`/pour/${noms[i]} et /pour/${noms[j]} partagent ${communes.length} phrase(s) de ${N} mots, dont : « ${communes[0]} ».`);
    }
  }
}

if (erreurs.length) {
  console.error(`check:pour ECHEC : ${erreurs.length} probleme(s) :`);
  for (const e of erreurs) console.error("  " + e);
  console.error(`  Le contenu metier vit dans src/content/metiers.ts. Regle d'ecriture : chaque paragraphe doit etre IMPOSSIBLE a ecrire pour un autre metier.`);
  process.exit(1);
}
console.log(`check:pour OK : ${fichiers.length} pages metier, ${minimum} mots minimum (plancher ${PLANCHER_MOTS}), ${partagees} phrase(s) de ${N} mots partagee(s) entre deux blocs, 0 page sans bloc metier.`);

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── LOT DETTES-CONCU-1 §D (dette CONCU-D1) ────────────────────────────────
//
// CE QUE CE GARDIEN PROTÈGE, ET CONTRE QUOI.
//
// La date « Mis à jour le » de /roadmap est maintenant écrite à la main dans
// `roadmap.json`. C'est la bonne source : celui qui touche une ligne est le
// seul à savoir s'il fait une mise à jour ou s'il corrige une coquille.
//
// C'est aussi la source la plus facile à oublier. Le mode d'échec n'est pas
// théorique, c'est celui qu'on vient de corriger dans l'autre sens : une page
// qui annonce une fraîcheur qu'elle n'a pas. Modifier trois lignes de roadmap
// sans toucher `updated`, et la page continue d'afficher une date vieille de
// deux mois sous du contenu tout neuf.
//
// LA RÈGLE : `updated` ne doit pas prendre plus de SEPT JOURS de retard sur la
// dernière modification git du fichier. Sept et non zéro, parce qu'une
// correction de coquille ne mérite pas de faire mentir la date dans l'autre
// sens : on ne veut pas non plus qu'un changement d'accent annonce une mise à
// jour de la roadmap.
//
// `updated` EN AVANCE EST ACCEPTÉ, et c'est délibéré : on écrit la date du
// jour où l'on travaille, le commit vient parfois le lendemain. C'est le
// RETARD qui ment au visiteur, jamais l'avance de quelques heures.
//
// PAS D'HISTORIQUE GIT, PAS DE VERDICT. Vercel clone à depth=1 : le gardien y
// serait aveugle, et un gardien aveugle qui refuse bloquerait tous les
// déploiements. Il passe donc, en le DISANT — c'est en CI, où l'historique est
// complet, que la vérification a lieu pour de bon.

const CHEMIN = resolve(process.cwd(), "src/content/roadmap.json");
const TOLERANCE_JOURS = 7;
const JOUR_MS = 86_400_000;

function echouer(lignes) {
  console.error(`\n❌ check:roadmap-updated : ${lignes[0]}`);
  for (const l of lignes.slice(1)) console.error(`   ${l}`);
  console.error("");
  process.exit(1);
}

let doc;
try {
  doc = JSON.parse(readFileSync(CHEMIN, "utf8"));
} catch (e) {
  echouer([`src/content/roadmap.json est illisible.`, String(e.message)]);
}

if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
  echouer([
    "src/content/roadmap.json doit etre un OBJET { updated, lignes }.",
    "La racine en tableau est l'ancienne forme (avant DETTES-CONCU-1 §D).",
  ]);
}
if (typeof doc.updated !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(doc.updated)) {
  echouer([
    "le champ `updated` manque ou n'est pas une date ISO courte (AAAA-MM-JJ).",
    `lu : ${JSON.stringify(doc.updated)}`,
  ]);
}
if (!Array.isArray(doc.lignes) || doc.lignes.length === 0) {
  echouer(["le champ `lignes` manque ou est vide."]);
}

const declaree = Date.parse(`${doc.updated}T12:00:00Z`);
if (Number.isNaN(declaree)) echouer([`\`updated\` n'est pas une date valide : ${doc.updated}.`]);

let commitIso = "";
try {
  commitIso = execFileSync("git", ["log", "-1", "--format=%cI", "--", CHEMIN], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  /* pas de git du tout : meme traitement que l'historique tronque */
}

if (!commitIso) {
  console.log(
    "[check:roadmap-updated] aucun historique git pour roadmap.json " +
    "(clone superficiel ou hors depot) : verification impossible, on passe."
  );
  console.log(`[check:roadmap-updated] date declaree : ${doc.updated}, ${doc.lignes.length} ligne(s).`);
  process.exit(0);
}

const commit = Date.parse(commitIso);
const retardJours = (commit - declaree) / JOUR_MS;

if (retardJours > TOLERANCE_JOURS) {
  echouer([
    `\`updated\` a ${Math.floor(retardJours)} jours de retard sur la derniere modification du fichier.`,
    `declaree dans le JSON : ${doc.updated}`,
    `dernier commit du fichier : ${commitIso.slice(0, 10)}`,
    `tolerance : ${TOLERANCE_JOURS} jours.`,
    "",
    "La page annoncerait une fraicheur qu'elle n'a pas. Mettez `updated` a la",
    "date du jour ou vous avez change le contenu - ni celle du build, ni celle",
    "du commit : celle ou vous avez decide.",
  ]);
}

console.log(
  `[check:roadmap-updated] \`updated\` = ${doc.updated}, dernier commit du fichier ${commitIso.slice(0, 10)}, ` +
  `${doc.lignes.length} ligne(s). Ecart : ${Math.max(0, Math.round(retardJours))} jour(s), tolerance ${TOLERANCE_JOURS}.`
);
console.log("✓ La date affichee sur /roadmap correspond a son contenu.");

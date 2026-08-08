// LOT DIAG-2 : gardien de la section « Ce que Stela y changerait ».
//
// POURQUOI CE GARDIEN EXISTE. Cette section est la seule surface VENDEUSE du
// diagnostic, et la seule ou la tentation d'une phrase de trop se paie cher :
// les CGV disent « Le service n'offre aucune garantie de resultat chiffre. »
// Promettre une note, un classement ou un pourcentage sur cette page
// contredirait le contrat que le meme site fait signer trois pages plus loin.
//
// Le gardien ne juge pas le style : il refuse les formes qui PROMETTENT.
// Il balaie les textes de vente de lib/diagnostic.js — les constats, les
// verdicts, et le mapping « ce que Stela fait ».
import { readFileSync } from "node:fs";
import {
  diagnostiquer,
  verdict,
  ceQueStelaChange,
  avisPourAtteindre4,
} from "../lib/diagnostic.js";

const fautes = [];
const gronder = (ou, quoi) => fautes.push(`${ou} : ${quoi}`);

// ── 1. Les formes interdites, sur tous les textes generes ────────────────
//
// Chaque motif vise une PROMESSE, pas un mot. « votre note reflète » est
// permis (c'est ce que Stela fait) ; « votre note passera » ne l'est pas.
const INTERDITS = [
  [/\bvotre note (va|passera|atteindra|montera|sera)\b/i, "promesse sur la note"],
  [/\bvous (allez|allez enfin)? ?(gagner|obtenir|atteindre) \+?\d/i, "promesse chiffree"],
  [/\bgaranti(e|s)?\b/i, "garantie"],
  [/\bjusqu'a \+?\d+ ?%/i, "promesse chiffree en pourcentage"],
  [/\b(\+ ?\d+ ?%|\d+ ?% de plus)\b/i, "promesse chiffree en pourcentage"],
  [/\b(premier|1er) (sur|dans) google\b/i, "promesse de classement"],
  [/\bmeilleur(e|s)? (note|classement|resultat)\b/i, "superlatif de resultat"],
  [/\b(numero un|n°1|no 1)\b/i, "superlatif de classement"],
  [/\bdoublera|triplera|multipliera\b/i, "promesse de multiplication"],
];

function verifierTexte(ou, texte) {
  if (typeof texte !== "string") return;
  for (const [motif, quoi] of INTERDITS) {
    if (motif.test(texte)) gronder(ou, `${quoi} -> « ${texte.slice(0, 90)} »`);
  }
}

// ── 2. Un echantillon de fiches qui couvre toutes les branches ───────────
const MAINTENANT = new Date("2026-08-08T12:00:00Z");
const jours = (n) => new Date(MAINTENANT.getTime() - n * 86400000).toISOString();

const FICHES = [
  { nom: "note rouge, fiche tenue", m: { note: 3.7, nbAvis: 2843, dernierAvisRedigeAt: jours(5), site: true, telephone: true, horaires: true, photos: 8, photosPlafonnees: false, statut: "OPERATIONAL" } },
  { nom: "note rouge, fiche negligee", m: { note: 3.1, nbAvis: 12, dernierAvisRedigeAt: jours(400), site: false, telephone: false, horaires: false, photos: 0, photosPlafonnees: false, statut: "OPERATIONAL" } },
  { nom: "fiche parfaite", m: { note: 4.8, nbAvis: 320, dernierAvisRedigeAt: jours(2), site: true, telephone: true, horaires: true, photos: 10, photosPlafonnees: true, statut: "OPERATIONAL" } },
  { nom: "sans note ni avis", m: { note: null, nbAvis: 0, dernierAvisRedigeAt: null, site: false, telephone: true, horaires: true, photos: 1, photosPlafonnees: false, statut: "OPERATIONAL" } },
  { nom: "fermee", m: { note: 4.4, nbAvis: 90, dernierAvisRedigeAt: jours(20), site: true, telephone: true, horaires: true, photos: 4, photosPlafonnees: false, statut: "CLOSED_PERMANENTLY" } },
];

for (const { nom, m } of FICHES) {
  const { score, constats } = diagnostiquer(m, MAINTENANT);
  const v = verdict(score, m);
  const b = ceQueStelaChange(constats, m);

  verifierTexte(`${nom} / verdict.titre`, v.titre);
  verifierTexte(`${nom} / verdict.texte`, v.texte);
  for (const c of constats) verifierTexte(`${nom} / constat ${c.cle}`, c.texte);
  verifierTexte(`${nom} / stela.titre`, b.titre);
  verifierTexte(`${nom} / stela.entretien`, b.entretien);
  for (const l of b.lignes) verifierTexte(`${nom} / stela ${l.cle}`, l.texte);
  if (b.arithmetique) {
    verifierTexte(`${nom} / arithmetique.calcul`, b.arithmetique.calcul);
    verifierTexte(`${nom} / arithmetique.suite`, b.arithmetique.suite);
  }

  // ── 3. Les invariants de structure ────────────────────────────────────
  // Tout constat rouge ou ambre porte une cle connue du mapping, sinon la
  // section B l'oublierait EN SILENCE le jour ou un constat est ajoute.
  for (const c of constats) {
    if (!c.cle) gronder(nom, `constat sans cle : « ${c.texte.slice(0, 60)} »`);
  }
  const clesTraitees = new Set(b.lignes.map((l) => l.cle));
  for (const c of constats) {
    if ((c.ton === "fort" || c.ton === "attention") && !clesTraitees.has(c.cle)) {
      gronder(nom, `constat ${c.ton} « ${c.cle} » sans reponse dans « Ce que Stela y changerait »`);
    }
  }
  // Une fiche sans constat rouge ni ambre ne doit JAMAIS recevoir le mode
  // « problemes » : on ne fabrique pas un defaut pour avoir a vendre.
  const aDesProblemes = constats.some((c) => c.ton === "fort" || c.ton === "attention");
  if (!aDesProblemes && b.mode !== "entretien") gronder(nom, "fiche saine basculee en mode probleme");
  if (aDesProblemes && b.mode !== "problemes") gronder(nom, "fiche a problemes basculee en mode entretien");

  // La note rouge COMMANDE le titre, quel que soit le score.
  if (Number.isFinite(m.note) && m.note < 4 && !/note/i.test(v.titre)) {
    gronder(nom, `note ${m.note} < 4 mais le titre ne parle pas de la note : « ${v.titre} »`);
  }
  // ... et l'arithmetique de la moyenne doit alors etre presente.
  if (Number.isFinite(m.note) && m.note < 4 && m.nbAvis > 0 && !b.arithmetique) {
    gronder(nom, "note < 4 sans l'arithmetique de la moyenne");
  }
}

// ── 4. L'arithmetique elle-meme, sur des cas connus ──────────────────────
const CALCULS = [
  [3.7, 2843, 853],  // le cas reel releve par Nicolas
  [3.0, 100, 100],
  [3.9, 1000, 100],
];
for (const [note, total, attendu] of CALCULS) {
  const n = avisPourAtteindre4(note, total);
  if (n !== attendu) gronder("arithmetique", `note ${note} sur ${total} avis -> ${n}, attendu ${attendu}`);
}
// Aucun calcul quand il n'a pas de sens : une note deja a 4 ou au-dessus ne
// doit pas afficher « il vous faudrait 0 avis ».
for (const [note, total] of [[4.0, 100], [4.6, 500], [null, 100]]) {
  if (avisPourAtteindre4(note, total) !== null) gronder("arithmetique", `note ${note} devrait rendre null`);
}

// ── 5. Le filtre 4,0 de Maps est annonce sur une note rouge ──────────────
const rouge = diagnostiquer(FICHES[0].m, MAINTENANT).constats.find((c) => c.cle === "note");
if (!/filtrer les établissements notés 4,0 et plus/i.test(rouge.texte)) {
  gronder("constat note", "le filtre 4,0 de Google Maps n'est plus annonce sur une note rouge");
}

// ── 6. La page ne recalcule rien : la section B vient du serveur ─────────
const page = readFileSync(new URL("../src/pages/diagnostic.astro", import.meta.url), "utf8");
if (!/d\.stela/.test(page)) gronder("page", "la page n'affiche plus la section « Ce que Stela y changerait »");
if (/Pour atteindre 4,0/.test(page)) {
  gronder("page", "l'arithmetique est reecrite dans la page : elle doit venir du serveur, sinon le rapport email divergera");
}
const rapport = readFileSync(new URL("../api/diagnostic-rapport.js", import.meta.url), "utf8");
if (!/ceQueStelaChange/.test(rapport)) gronder("rapport email", "le rapport email n'inclut plus la section B");

if (fautes.length) {
  console.error(`\n[check:diagnostic] ${fautes.length} probleme(s) :\n`);
  for (const f of fautes) console.error(`  - ${f}`);
  console.error("\nRegle : on decrit ce que Stela FAIT, jamais ce que Google decidera (CGV, aucune garantie de resultat chiffre).\n");
  process.exit(1);
}
console.log(`[check:diagnostic] ${FICHES.length} fiches, ${INTERDITS.length} formes interdites, arithmetique et structure verifiees.`);
console.log("✓ Aucune promesse de resultat, aucun constat rouge sans reponse.");

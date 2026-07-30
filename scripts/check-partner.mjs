// check:partner (LOT PARTNER-1v) — verrou sur le code partenaire.
// 1. Table de vérité de la VALIDATION du format ([a-z0-9-]{2,32}, insensible
//    casse) : la logique reelle (src/lib/partner.ts) est importee, jamais
//    recopiee, sinon le test validerait une copie et non le code livre.
// 2. Decoration des Payment Links Stripe : parametres existants preserves,
//    URL non-Stripe intacte, code invalide sans effet.
// 3. Peremption a 90 jours (last-touch) via parseStoredPartner.
// 4. Le HTML rendu ne contient AUCUN client_reference_id : la decoration se
//    fait au clic, les liens statiques restent nus (sans-JS = lien normal).
// Node lit le TypeScript nativement (type stripping, Node >= 22.6).
import { readFileSync, globSync } from "node:fs";

let lib;
try {
  lib = await import("../src/lib/partner.ts");
} catch (err) {
  console.error("check:partner ECHEC : impossible de charger src/lib/partner.ts depuis Node.");
  console.error("  " + (err && err.message));
  console.error("  (Node >= 22.6 requis pour lire le TypeScript sans transpilation.)");
  process.exit(1);
}
const { normalizePartnerCode, partnerCodeFromSearch, decorateStripeUrl, parseStoredPartner, PARTNER_TTL_MS } = lib;

const errors = [];
const eq = (label, actual, expected) => {
  if (actual !== expected) errors.push(`${label} : attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
};

// 1) Format du code : ce qui passe, ce qui est rejete.
const VALID = [
  ["ab", "ab"], // borne basse : 2 caracteres
  ["clubpro", "clubpro"],
  ["club-pro-2026", "club-pro-2026"],
  ["ClubPro", "clubpro"], // insensible a la casse
  ["  CLUB-PRO  ", "club-pro"], // espaces de bord ignores
  ["a".repeat(32), "a".repeat(32)], // borne haute : 32 caracteres
  ["123456", "123456"],
  ["--", "--"],
];
const INVALID = [
  "a", // trop court
  "a".repeat(33), // trop long
  "", // vide
  "   ", // blanc
  "club_pro", // underscore
  "club pro", // espace interne
  "club.pro", // point
  "club/pro", // slash
  "clüb", // accent
  "club%20pro", // encodage
  "<script>", // injection
  "club\npro", // saut de ligne
  "café", // non ASCII
  null,
  undefined,
  42,
  {},
];
for (const [input, expected] of VALID) eq(`code valide ${JSON.stringify(input)}`, normalizePartnerCode(input), expected);
for (const input of INVALID) eq(`code invalide ${JSON.stringify(input)}`, normalizePartnerCode(input), null);

// Extraction depuis la query string.
eq("?p=clubpro", partnerCodeFromSearch("?p=clubpro"), "clubpro");
eq("?utm_source=x&p=Club-Pro", partnerCodeFromSearch("?utm_source=x&p=Club-Pro"), "club-pro");
eq("?p=club pro (invalide)", partnerCodeFromSearch("?p=club%20pro"), null);
eq("?p= (vide)", partnerCodeFromSearch("?p="), null);
eq("aucun parametre", partnerCodeFromSearch(""), null);
eq("autre parametre", partnerCodeFromSearch("?q=clubpro"), null);

// 2) Decoration des Payment Links.
const LINK = "https://buy.stripe.com/4gM6oH9KY4Sx2CRdyO9Zm0f?utm_source=vitrine&utm_campaign=tarifs";
const decorated = decorateStripeUrl(LINK, "clubpro");
if (!decorated.includes("client_reference_id=clubpro")) errors.push(`decoration : client_reference_id absent -> ${decorated}`);
if (!decorated.includes("utm_source=vitrine") || !decorated.includes("utm_campaign=tarifs")) {
  errors.push(`decoration : parametres utm perdus -> ${decorated}`);
}
eq("decoration sans code", decorateStripeUrl(LINK, null), LINK);
eq("decoration code invalide", decorateStripeUrl(LINK, "club pro"), LINK);
eq("decoration URL interne", decorateStripeUrl("https://www.mystela.fr/tarifs", "clubpro"), "https://www.mystela.fr/tarifs");
eq("decoration URL non absolue", decorateStripeUrl("/tarifs", "clubpro"), "/tarifs");
const twice = decorateStripeUrl(decorated, "autrecode");
if ((twice.match(/client_reference_id=/g) || []).length !== 1) errors.push(`decoration : client_reference_id duplique -> ${twice}`);
if (!twice.includes("client_reference_id=autrecode")) errors.push(`decoration : le dernier code ne gagne pas -> ${twice}`);

// 3) Peremption 90 jours + last-touch.
const now = Date.UTC(2026, 6, 30);
eq("code frais", parseStoredPartner(JSON.stringify({ code: "clubpro", ts: now - 1000 }), now), "clubpro");
eq("code a 89 jours", parseStoredPartner(JSON.stringify({ code: "clubpro", ts: now - PARTNER_TTL_MS + 60000 }), now), "clubpro");
eq("code a 91 jours", parseStoredPartner(JSON.stringify({ code: "clubpro", ts: now - PARTNER_TTL_MS - 60000 }), now), null);
eq("stockage illisible", parseStoredPartner("pas du json", now), null);
eq("stockage sans date", parseStoredPartner(JSON.stringify({ code: "clubpro" }), now), null);
eq("stockage code invalide", parseStoredPartner(JSON.stringify({ code: "club pro", ts: now }), now), null);
eq("stockage vide", parseStoredPartner(null, now), null);
if (PARTNER_TTL_MS !== 90 * 24 * 60 * 60 * 1000) errors.push(`duree de validite : ${PARTNER_TTL_MS} ms au lieu de 90 jours.`);

// 4) Le build ne doit contenir aucun lien Stripe pre-decore.
const htmlFiles = globSync("dist/**/*.html");
let stripeLinks = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/https:\/\/buy\.stripe\.com\/[^"'\s]*/g)) {
    stripeLinks++;
    if (m[0].includes("client_reference_id")) {
      errors.push(`${file}: lien Stripe pre-decore dans le HTML statique -> ${m[0].slice(0, 120)}`);
    }
  }
}
if (htmlFiles.length && stripeLinks === 0) errors.push("aucun lien Stripe trouve dans le build : le tunnel d'achat a disparu ?");

if (errors.length) {
  console.error(`check:partner ECHEC : ${errors.length} probleme(s) :`);
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(`check:partner OK : format du code verrouille (${VALID.length} valides, ${INVALID.length} rejetes), decoration Stripe correcte, peremption 90 jours, ${stripeLinks} liens Stripe nus dans le HTML.`);

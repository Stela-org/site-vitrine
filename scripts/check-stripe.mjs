// check:stripe — verrouille le TUNNEL D'ACHAT réel de la vitrine.
// L'achat se fait SUR LA VITRINE via 4 Payment Links Stripe LIVE (essai 7 jours) :
// bouton de plan → Stripe Checkout. Ce gate garantit qu'un futur changement (Stripe
// renommé, prix modifié, lien supprimé par erreur lors d'une refonte) force une mise
// à jour CONSCIENTE de la vitrine, au lieu de casser silencieusement les paiements.
// À lancer APRÈS le build (lit dist/).
import { readFileSync, globSync } from "node:fs";

// 1) Les 4 Payment Links LIVE exacts (suffixes …9Zm0f/g/h/i). Source de vérité :
//    branche héritée « legacy », ancien index.html (ETOILE/CONST × MONTH/YEAR).
const LINKS = {
  "Étoile mensuel": "https://buy.stripe.com/4gM6oH9KY4Sx2CRdyO9Zm0f",
  "Étoile annuel": "https://buy.stripe.com/3cI00j2iw0Ch91f0M29Zm0g",
  "Constellation mensuel": "https://buy.stripe.com/6oUfZh3mA84J6T72Ua9Zm0h",
  "Constellation annuel": "https://buy.stripe.com/28E5kD8GU84Jdhv9iy9Zm0i",
};

// 2) Montants de référence RÉELS (vérifiés dans Stripe) + durée d'essai. Doivent
//    apparaître tels quels sur la page tarifs.
const AMOUNTS = ["49 €", "89 €", "39 €", "79 €", "468 €", "948 €", "7 jours"];

const htmlFiles = globSync("dist/**/*.html");
const read = (f) => readFileSync(f, "utf8");
const all = htmlFiles.map((f) => ({ f, html: read(f) }));
const errors = [];

// A. Chaque lien LIVE exact présent au moins une fois dans le build.
for (const [label, url] of Object.entries(LINKS)) {
  const hit = all.some(({ html }) => html.includes(url));
  if (!hit) errors.push(`Payment Link « ${label} » absent du build : ${url}`);
}

// B. La page tarifs porte les 4 liens ET les montants de référence.
const tarifs = all.find(({ f }) => /\/tarifs\.html$|\/tarifs\/index\.html$/.test(f));
if (!tarifs) {
  errors.push("Page /tarifs introuvable dans le build.");
} else {
  for (const [label, url] of Object.entries(LINKS)) {
    if (!tarifs.html.includes(url)) errors.push(`/tarifs : lien « ${label} » manquant (${url}).`);
  }
  for (const a of AMOUNTS) {
    if (!tarifs.html.includes(a)) errors.push(`/tarifs : montant/durée de référence « ${a} » absent.`);
  }
  // Chaque bouton de plan doit porter les 2 variantes (toggle mensuel/annuel).
  const monthlyAttrs = (tarifs.html.match(/data-href-monthly=/g) || []).length;
  const yearlyAttrs = (tarifs.html.match(/data-href-yearly=/g) || []).length;
  if (monthlyAttrs < 2 || yearlyAttrs < 2) {
    errors.push(`/tarifs : boutons de plan sans double lien mensuel/annuel (data-href-monthly=${monthlyAttrs}, data-href-yearly=${yearlyAttrs}, attendus ≥2 chacun).`);
  }
}

// C. Règle « 2 clics » : depuis TOUTE page indexable, le paiement est à ≤2 clics.
//    Proxy vérifiable : chaque page mène soit directement à un Payment Link,
//    soit à /tarifs (page → /tarifs → Stripe = 2 clics). Le CTA de la nav
//    (présent partout) pointe vers /tarifs, ce test garde ce lien vivant.
const stripeHosts = /buy\.stripe\.com/;
const linksToTarifs = /href=["'](?:\/tarifs|#tarifs|https:\/\/www\.mystela\.fr\/tarifs)["']/;
for (const { f, html } of all) {
  if (!/<main[\s>]/.test(html)) continue; // fichiers utilitaires (vérif Google, etc.)
  if (/noindex/.test(html)) continue; // pages légales / merci / confirme
  if (stripeHosts.test(html) || linksToTarifs.test(html)) continue;
  errors.push(`Règle 2 clics : ${f.replace(/^dist/, "")} n'a aucun lien vers /tarifs ni vers Stripe.`);
}

// D. Aucun lien mort vers un ancien tunnel app/signup (l'achat est sur la vitrine).
for (const { f, html } of all) {
  if (/app\.mystela\.fr\/signup/.test(html)) {
    errors.push(`Tunnel obsolète : ${f.replace(/^dist/, "")} pointe encore vers app.mystela.fr/signup.`);
  }
}

if (errors.length) {
  console.error(`check:stripe ECHEC : ${errors.length} probleme(s) :`);
  [...new Set(errors)].forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(`check:stripe OK : 4 Payment Links LIVE + montants (49/89/39/79/468/948, 7 jours) + tunnel 2 clics vérifiés (${htmlFiles.length} pages).`);

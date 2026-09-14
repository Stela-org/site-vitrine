// check:stripe — verrouille le TUNNEL D'ACHAT réel de la vitrine.
// L'achat se fait SUR LA VITRINE via 4 Payment Links Stripe LIVE (essai 7 jours) :
// bouton de plan → Stripe Checkout. Ce gate garantit qu'un futur changement (Stripe
// renommé, prix modifié, lien supprimé par erreur lors d'une refonte) force une mise
// à jour CONSCIENTE de la vitrine, au lieu de casser silencieusement les paiements.
// À lancer APRÈS le build (lit dist/).
import { readFileSync, globSync } from "node:fs";

// 1) Les Payment Links LIVE, LUS DANS LA SOURCE et jamais recopiés ici.
//
//    LOT PRIX-1 : ils étaient dupliqués dans ce fichier. La duplication a tenu
//    tant que rien ne changeait ; le jour du changement de grille, ce gardien
//    aurait vérifié que le build contient les ANCIENS liens, c'est-à-dire
//    l'exact contraire de ce qu'on lui demande. Un gardien qui recopie ce
//    qu'il surveille finit toujours par défendre la version d'avant.
//    Node lit le TypeScript nativement (type stripping, Node >= 22.6), même
//    mécanique que check:partner.
let site;
try {
  site = await import("../src/config/tarifs.ts");
} catch (err) {
  console.error("check:stripe ECHEC : impossible de charger src/config/tarifs.ts depuis Node.");
  console.error("  " + (err && err.message));
  process.exit(1);
}
const { STRIPE_LINKS, PLANS, stripeLink } = site;

const LINKS = {};
for (const [plan, parPeriode] of Object.entries(STRIPE_LINKS)) {
  for (const [periode, url] of Object.entries(parPeriode)) {
    LINKS[`${plan} ${periode}`] = url;
  }
}

// 2) Montants de référence, DÉRIVÉS de `PLANS`. Doivent apparaître tels quels
//    sur la page tarifs : c'est ce qui empêche la grille affichée de diverger
//    de la grille facturée.
const AMOUNTS = ["7 jours"];
for (const p of PLANS) {
  AMOUNTS.push(`${p.monthly} €`);
  if (p.yearlyPerMonth !== null) AMOUNTS.push(`${p.yearlyPerMonth} €`);
  if (p.yearlyTotal !== null) AMOUNTS.push(`${p.yearlyTotal} €`);
}

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
  // Chaque offre À ANNUEL porte les deux liens. Polaire n'en a qu'un, et c'est
  // voulu : lui poser un `data-href-yearly` la ferait pointer vers une URL vide
  // au premier clic sur « Annuel », c'est-à-dire un tunnel d'achat mort.
  const aAnnuel = PLANS.filter((p) => p.yearlyTotal !== null).length;
  const monthlyAttrs = (tarifs.html.match(/data-href-monthly=/g) || []).length;
  const yearlyAttrs = (tarifs.html.match(/data-href-yearly=/g) || []).length;
  if (monthlyAttrs < aAnnuel || yearlyAttrs < aAnnuel) {
    errors.push(`/tarifs : boutons de plan sans double lien mensuel/annuel (data-href-monthly=${monthlyAttrs}, data-href-yearly=${yearlyAttrs}, attendus ≥${aAnnuel} chacun).`);
  }
  if (yearlyAttrs > aAnnuel) {
    errors.push(`/tarifs : ${yearlyAttrs} liens annuels pour ${aAnnuel} offre(s) à annuel : une offre sans annuel a reçu un lien vide.`);
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

// E. Polaire n'a PAS d'annuel, et l'absence doit rester une absence.
//    Le compilateur refuse déjà `stripeLink("polaire", "yearly")` ; ce test
//    couvre l'exécution, que le typage ne protège pas (un appel construit
//    dynamiquement, un `as any`, un fichier `.astro` non typé au build).
if (STRIPE_LINKS.polaire?.yearly !== undefined) {
  errors.push("STRIPE_LINKS.polaire.yearly existe : Polaire n'a pas d'annuel, ce lien mènerait nulle part.");
}
if (typeof stripeLink === "function") {
  const lienPolaireAnnuel = stripeLink("polaire", "yearly");
  if (!lienPolaireAnnuel.startsWith("undefined")) {
    errors.push(`stripeLink("polaire","yearly") rend une URL d'apparence valide (${lienPolaireAnnuel.slice(0, 60)}) : elle serait cliquée.`);
  }
}

// F. CHAQUE LIEN RÉPOND. C'est le seul volet de ce gardien qui vérifie le
//    monde réel plutôt que nos fichiers.
//
//    POURQUOI CE VOLET EXISTE. Tout le reste de ce script compare des chaînes
//    entre elles : il resterait vert si les six liens étaient parfaitement
//    cohérents ET tous désactivés dans Stripe. C'est précisément ce qui vient
//    d'arriver aux deux anciens liens Étoile, passés `active: false` le 14/09.
//    Un lien mort ne se voit nulle part, sauf dans le chiffre d'affaires.
//
//    `HEAD`, pas `GET` : on veut le code de statut, pas la page. Un lien
//    désactivé rend 404. Hors ligne ou coupure réseau : on N'ÉCHOUE PAS, on
//    le DIT — un gardien qui tombe parce que le wifi a hoqueté est un gardien
//    qu'on finit par ignorer, et celui-ci garde le tunnel d'achat.
let reseauOk = true;
const morts = [];
await Promise.all(
  Object.entries(LINKS).map(async ([label, url]) => {
    try {
      const rep = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
      if (rep.status !== 200) morts.push(`${label} : HTTP ${rep.status} (${url})`);
    } catch (e) {
      reseauOk = false;
      console.warn(`  [reseau] ${label} injoignable : ${e && e.message}`);
    }
  }),
);
for (const m of morts) errors.push(`Payment Link qui ne repond plus : ${m}`);

if (errors.length) {
  console.error(`check:stripe ECHEC : ${errors.length} probleme(s) :`);
  [...new Set(errors)].forEach((e) => console.error("  " + e));
  process.exit(1);
}
const listeMontants = AMOUNTS.filter((a) => a !== "7 jours").join(", ");
console.log(
  `check:stripe OK : ${Object.keys(LINKS).length} Payment Links LIVE${reseauOk ? " (tous en 200)" : " (verification reseau indisponible, non bloquante)"}` +
  ` + montants (${listeMontants}, 7 jours) + tunnel 2 clics verifies (${htmlFiles.length} pages).`,
);

// check:analytics (LOT GADS-1), verrou de conformité de la mesure d'audience.
// Règle : AUCUN script Google dans le HTML rendu. Le tag GA4 n'est jamais dans
// le markup statique, il est injecté par JavaScript UNIQUEMENT après un clic
// « Accepter ». Ce check lit le build (dist/) et échoue si :
//   1. une page contient une référence à un domaine Google de mesure/publicité
//      (googletagmanager, google-analytics, doubleclick, googleadservices...) ;
//   2. une page charge un <script src> ou un <link href> externe (préconnexion
//      comprise) vers un tiers : tout doit être servi en 'self' ;
//   3. les trois événements de conversion ne sont plus câblés dans le bundle ;
//   3bis. (LOT GADS-2) le hachage SHA-256 de l'email disparaît du bundle, ou un
//      email en clair se retrouve dans un appel de conversion ;
//   4. la page /merci-essai manque, n'est pas en noindex, ou entre au sitemap.
// À lancer APRÈS le build.
import { readFileSync, existsSync, globSync } from "node:fs";

const DIST = "dist";
const htmlFiles = globSync(`${DIST}/**/*.html`);
const jsFiles = globSync(`${DIST}/**/*.js`);
const errors = [];

// 1) Domaines Google interdits dans le HTML rendu. NB : l'ID de mesure
// (G-XXXXXXX) dans le bloc <script type="application/json"> de configuration est
// autorisé : c'est une donnée inerte, non exécutable, qui ne déclenche aucune
// requête. Ce qui est interdit, c'est le domaine.
const GOOGLE_HOSTS = /googletagmanager\.com|google-analytics\.com|doubleclick\.net|googleadservices\.com|googlesyndication\.com|googletagservices\.com|analytics\.google\.com|gtag\/js/i;

// 2) Ressources externes CHARGEES automatiquement. Les liens de contenu
// (<a href>) et les URL declaratives (canonical, og:url, JSON-LD) sont
// legitimes : seul ce que le navigateur va chercher tout seul est vise.
const EXTERNAL_LOAD = /<(?:script|iframe|img)\b[^>]*\bsrc="(https?:\/\/[^"]+)"/gi;
// Pour <link>, seuls les rel qui declenchent un chargement comptent.
const LINK_TAG = /<link\b[^>]*>/gi;
const LOADING_REL = /\brel="(?:stylesheet|preconnect|dns-prefetch|preload|prefetch|modulepreload)"/i;

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  if (GOOGLE_HOSTS.test(html)) {
    const hit = html.match(GOOGLE_HOSTS)[0];
    errors.push(`${file}: domaine Google present dans le HTML rendu (${hit}). Le tag doit etre injecte au consentement, jamais dans le markup.`);
  }
  for (const m of html.matchAll(EXTERNAL_LOAD)) {
    errors.push(`${file}: ressource tierce chargee automatiquement -> ${m[1].slice(0, 120)}`);
  }
  for (const tag of html.matchAll(LINK_TAG)) {
    const t = tag[0];
    const href = t.match(/\bhref="(https?:\/\/[^"]+)"/i);
    if (href && LOADING_REL.test(t)) {
      errors.push(`${file}: <link> tiers charge automatiquement -> ${href[1].slice(0, 120)}`);
    }
  }
}

// 3) Les trois conversions doivent rester cablees (dans le JS bundle, pas le HTML).
const bundle = jsFiles.map((f) => readFileSync(f, "utf8")).join("\n");
for (const evt of ["essai_demarre", "demande_devis", "guide_telecharge"]) {
  if (!bundle.includes(evt)) errors.push(`evenement de conversion absent du bundle : ${evt}`);
}
// Le consentement par defaut « denied » et le passage a « granted » restent la.
for (const token of ["consent", "default", "denied", "granted", "transport_type"]) {
  if (!bundle.includes(token)) errors.push(`jeton de consentement absent du bundle : ${token}`);
}

// 3 bis) LOT GADS-2, le suivi avance doit rester cable ET rester pseudonymise.
// Deux regressions possibles, toutes deux silencieuses :
//   a. le hachage disparait (refactor, suppression d'un appel) -> plus aucun gain
//      de conversions, et personne ne s'en apercoit puisque la mesure continue ;
//   b. pire : un email en CLAIR se retrouve dans un appel de conversion -> fuite
//      de donnee personnelle vers Google, et manquement RGPD.
// Le gardien echoue dans les deux cas.
for (const token of ["sha256_email_address", "SHA-256", "subtle", "user_data"]) {
  if (!bundle.includes(token)) {
    errors.push(`suivi avance (GADS-2) : jeton « ${token} » absent du bundle. Le hachage de l'email n'est plus cable : les conversions repartent sans donnee d'identification.`);
  }
}

// Un email en clair ne doit apparaitre NULLE PART dans le bundle ni dans le HTML
// rendu. On tolere les adresses du site lui-meme (contact@mystela.fr...), qui
// sont du contenu affiche, pas de la donnee de conversion.
const EMAIL_LITTERAL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const EMAILS_DU_SITE = /@(mystela\.fr|avistars\.fr|example\.(com|org)|etablissement\.fr|sentry\.io|w3\.org|schema\.org)$/i;
// Les placeholders de formulaire (« vous@etablissement.fr ») sont du contenu.
const suspects = new Map();
for (const [file, contenu] of [
  ...jsFiles.map((f) => [f, readFileSync(f, "utf8")]),
  ...htmlFiles.map((f) => [f, readFileSync(f, "utf8")]),
]) {
  for (const m of contenu.matchAll(EMAIL_LITTERAL)) {
    const adresse = m[0];
    if (EMAILS_DU_SITE.test(adresse)) continue;
    // Adresse reelle codee en dur : on regarde si elle traine a proximite du
    // suivi de conversion (fenetre de 400 caracteres autour).
    const autour = contenu.slice(Math.max(0, m.index - 400), m.index + 400);
    if (/sha256_email_address|user_data|hashEmail|track\(|stelaSend|EMAIL_HASH/.test(autour)) {
      suspects.set(`${file}:${adresse}`, `${file} : adresse email en clair (${adresse}) a proximite immediate du suivi de conversion. Seule l'empreinte SHA-256 doit circuler.`);
    }
  }
}
for (const msg of suspects.values()) errors.push(msg);

// L'empreinte transmise a Google ne doit jamais etre alimentee par autre chose
// qu'une valeur hexadecimale. Un `sha256_email_address` recevant directement une
// saisie de formulaire (une valeur contenant « @ ») est une fuite.
for (const m of bundle.matchAll(/sha256_email_address\s*:\s*([^,}\n]{0,120})/g)) {
  if (m[1].includes("@")) {
    errors.push(`suivi avance (GADS-2) : sha256_email_address recoit une valeur contenant « @ » (${m[1].trim().slice(0, 80)}). L'email doit etre hache AVANT, jamais transmis en clair.`);
  }
}

// 4) /merci-essai : presente, noindex, hors sitemap.
const merci = `${DIST}/merci-essai.html`;
if (!existsSync(merci)) {
  errors.push("page /merci-essai absente du build.");
} else {
  const html = readFileSync(merci, "utf8");
  if (!/name="robots" content="noindex/.test(html)) errors.push("/merci-essai : balise robots noindex manquante.");
  if (!/essai_demarre/.test(bundle)) errors.push("/merci-essai : evenement essai_demarre non cable.");
}
const sitemapFile = `${DIST}/sitemap-0.xml`;
if (existsSync(sitemapFile) && /merci-essai/.test(readFileSync(sitemapFile, "utf8"))) {
  errors.push("/merci-essai est dans le sitemap : elle doit en etre exclue.");
}

// 5) LOT FIX-CSP-GA4 : la CSP de production doit autoriser ce dont la mesure a
// besoin. Google envoie ses hits GA4 tantot vers google-analytics.com, tantot
// vers le domaine regionalise analytics.google.com (region1, region2...) : les
// DEUX familles doivent figurer dans connect-src, sinon le navigateur bloque le
// hit en silence et GA4 reste vide, sans la moindre erreur visible. C'est ce qui
// a coute deux jours de donnees. Volet statique du gardien ; la preuve
// dynamique (hit reellement abouti sous la vraie CSP) est dans check:cookies.
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const csp = vercel.headers
  ?.flatMap((h) => h.headers ?? [])
  .find((h) => h.key.toLowerCase() === "content-security-policy")?.value;
if (!csp) {
  errors.push("aucune Content-Security-Policy declaree dans vercel.json.");
} else {
  const directive = (name) => {
    const found = csp.split(";").map((d) => d.trim()).find((d) => d === name || d.startsWith(`${name} `));
    return found ? found.split(/\s+/).slice(1) : [];
  };
  const connect = directive("connect-src");
  const script = directive("script-src");
  const REQUIS_CONNECT = [
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://analytics.google.com",
    "https://region1.analytics.google.com",
    // LOT GADS-2 : chemin de mesure inter-appareils (Google Signals). Observe
    // bloque par la CSP lors du lot : la requete partait et le navigateur la
    // refusait en silence. Or c'est precisement ce chemin qui permet de recoller
    // un clic publicitaire et une conversion survenue plus tard sur un AUTRE
    // appareil, c'est-a-dire l'objet meme du suivi avance.
    "https://stats.g.doubleclick.net",
  ];
  for (const src of REQUIS_CONNECT) {
    if (!connect.includes(src)) {
      errors.push(`CSP connect-src : ${src} manquant. Les hits GA4 partant vers ce domaine seront bloques par le navigateur et GA4 restera vide.`);
    }
  }
  if (!script.includes("https://www.googletagmanager.com")) {
    errors.push("CSP script-src : https://www.googletagmanager.com manquant, gtag.js ne pourra pas se charger.");
  }
}

if (errors.length) {
  console.error(`check:analytics ECHEC : ${errors.length} probleme(s) :`);
  [...new Set(errors)].forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(`check:analytics OK : 0 script Google dans le HTML rendu (${htmlFiles.length} pages), 3 conversions cablees, suivi avance actif (hachage SHA-256 present, 0 email en clair), /merci-essai noindex et hors sitemap, CSP couvrant les deux familles de domaines de collecte GA4.`);

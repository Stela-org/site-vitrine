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

// 3 quater) LOT META-EVENTS-1 : les deux conversions doivent partir vers Meta,
// et sous leur nom STANDARD. Le mode de panne du lot precedent, deplace d'un
// cran : un pixel qui repond, un PageView qui remonte, et zero conversion. Rien
// ne le signale — ni erreur console, ni violation CSP, ni test rouge — parce
// qu'un remaniement qui supprime la table de correspondance laisse le reste
// intact. On exige donc que le bundle SERVI porte encore les deux paires.
//
// Comparaison sur un bundle normalise (guillemets et espaces retires) : le
// minifieur ecrit tantot essai_demarre:"Lead", tantot "essai_demarre":"Lead",
// tantot avec des accents graves (c'est la forme qu'il produit aujourd'hui) :
// les trois doivent passer. Ce qui ne doit pas passer, c'est l'absence.
const bundleNormalise = bundle.replace(/["'`\s]/g, "");
const META_ATTENDU = [
  ["essai_demarre", "Lead", "le demarrage d'essai n'est plus remonte a Meta : les campagnes ne peuvent plus optimiser sur les prospects."],
  ["guide_telecharge", "CompleteRegistration", "le telechargement du guide n'est plus remonte a Meta : la conversion du tunnel guide disparait des campagnes."],
];
for (const [ga4, meta, consequence] of META_ATTENDU) {
  if (!bundleNormalise.includes(`${ga4}:${meta}`)) {
    errors.push(
      `pixel Meta (META-EVENTS-1) : la correspondance ${ga4} -> ${meta} est absente du bundle. ${consequence}`,
    );
  }
}
// L'appel lui-meme doit rester la : une table de correspondance que plus
// personne n'appelle est aussi muette qu'une table absente, et c'est une
// regression qu'aucune verification de presence ne voit. Le bundle doit porter
// DEUX sites d'appel distincts a fbq("track", ...) : celui du PageView, pose au
// chargement du pixel, et celui des conversions, qui lit la table. Un seul
// signifie que l'un des deux a disparu.
const appelsTrack = (bundleNormalise.match(/fbq\(track,/g) || []).length;
if (appelsTrack < 2) {
  errors.push(
    `pixel Meta (META-EVENTS-1) : ${appelsTrack} appel(s) fbq("track", ...) dans le bundle, 2 attendus (PageView + conversions). ` +
    "Soit le PageView, soit l'emission des conversions standard a disparu : le pixel repondra sans mesurer.",
  );
}
// Aucune donnee personnelle ne doit accompagner ces evenements. Les appels
// attendus sont a DEUX arguments (fbq, track, nom) : un troisieme argument
// ouvrirait la porte a un email, un telephone ou un nom.
for (const [, meta] of META_ATTENDU) {
  const avecParams = new RegExp(`fbq\\([^)]*${meta}[^)]*,`);
  if (avecParams.test(bundleNormalise)) {
    errors.push(
      `pixel Meta (META-EVENTS-1) : l'evenement ${meta} est emis avec des parametres. Seul le nom de l'evenement doit partir vers Meta, jamais une donnee personnelle.`,
    );
  }
}

// 3 ter) LOT META-PIXEL-1 : l'identifiant du pixel Meta doit REELLEMENT etre
// present dans la configuration servie. META-CONFORMITE avait tout pose autour
// d'un identifiant vide : le code de chargement, la CSP, les scenarios reseau
// passaient tous, et le pixel ne faisait rien. Un retour a la chaine vide (ou un
// identifiant qui se perd dans un refactor du bloc de config) redonnerait
// exactement ce silence : bannière annonçant Meta, politique de confidentialite
// citant Meta, et aucun pixel. Le gardien exige donc la presence de l'ID dans le
// bloc <script type="application/json"> de CHAQUE page, au format Meta (15-16
// chiffres). Cet ID est une donnee inerte, non executable : sa presence dans le
// HTML ne declenche aucune requete, c'est le clic « Accepter » qui le fait.
const META_ID_ATTENDU = /^\d{15,16}$/;
// Le fichier de verification Google Search Console n'est pas une page du site :
// c'est une ligne de texte servie avec une extension .html, sans layout, donc
// sans banniere. On ne l'exige que la ou la banniere existe, et on verifie a
// part que les pages de conversion, elles, la portent bien.
let pagesAvecConfig = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const bloc = html.match(/<script type="application\/json" id="stela-analytics">([\s\S]*?)<\/script>/);
  if (!bloc) {
    if (html.includes('id="cookie-banner"')) {
      errors.push(`${file}: banniere de consentement presente mais bloc de configuration analytics (#stela-analytics) absent. Ni GA4 ni le pixel Meta ne peuvent etre configures : la banniere promet une mesure qui n'existe pas.`);
    }
    continue;
  }
  pagesAvecConfig++;
  let cfg;
  try {
    cfg = JSON.parse(bloc[1]);
  } catch {
    errors.push(`${file}: bloc de configuration analytics illisible (JSON invalide).`);
    continue;
  }
  if (!cfg.metaId) {
    errors.push(`${file}: identifiant du pixel Meta absent de la configuration (metaId vide). Le bloc de chargement du pixel est inerte : Meta est annonce dans la banniere et la politique de confidentialite, et rien n'est pose.`);
  } else if (!META_ID_ATTENDU.test(String(cfg.metaId))) {
    errors.push(`${file}: identifiant du pixel Meta au format inattendu (${cfg.metaId}). Un ID Meta est une suite de 15 a 16 chiffres ; fbq("init") echouera en silence.`);
  }
  if (!cfg.gaId) {
    errors.push(`${file}: identifiant de mesure GA4 absent de la configuration (gaId vide).`);
  }
}
// Les pages de conversion doivent toutes porter la banniere ET la configuration :
// une page qui perdrait son layout sortirait silencieusement de la mesure.
for (const page of ["index.html", "merci-essai.html", "politique-confidentialite.html"]) {
  const f = `${DIST}/${page}`;
  if (existsSync(f) && !readFileSync(f, "utf8").includes('id="stela-analytics"')) {
    errors.push(`/${page}: bloc de configuration analytics absent. Cette page est hors mesure (GA4 et pixel Meta).`);
  }
}
if (pagesAvecConfig === 0) {
  errors.push("aucune page ne porte le bloc de configuration analytics : la mesure est entierement debranchee.");
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
  // LOT META-CONFORMITE : meme lecon que FIX-CSP-GA4, appliquee d'avance au
  // pixel Meta. Le jour ou ANALYTICS.metaPixelId sera renseigne, un domaine
  // absent de la CSP ne produira aucune erreur visible : le navigateur refusera
  // la requete en silence et la mesure publicitaire restera vide, exactement
  // comme GA4 pendant deux jours. On verrouille donc la CSP maintenant, pendant
  // que le pixel est encore inactif et que l'oubli ne coute rien.
  const img = directive("img-src");
  if (!script.includes("https://connect.facebook.net")) {
    errors.push("CSP script-src : https://connect.facebook.net manquant, fbevents.js ne pourra pas se charger.");
  }
  for (const src of ["https://www.facebook.com", "https://connect.facebook.net"]) {
    if (!connect.includes(src)) {
      errors.push(`CSP connect-src : ${src} manquant. Les evenements du pixel Meta partant vers ce domaine seront bloques par le navigateur, sans erreur visible.`);
    }
  }
  if (!img.includes("https://www.facebook.com")) {
    errors.push("CSP img-src : https://www.facebook.com manquant. Le pixel Meta se replie sur une image de suivi lorsque fetch est indisponible ; elle serait bloquee.");
  }
}

if (errors.length) {
  console.error(`check:analytics ECHEC : ${errors.length} probleme(s) :`);
  [...new Set(errors)].forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(`check:analytics OK : 0 script Google dans le HTML rendu (${htmlFiles.length} pages), 3 conversions cablees, suivi avance actif (hachage SHA-256 present, 0 email en clair), /merci-essai noindex et hors sitemap, CSP couvrant les deux familles de domaines de collecte GA4 et les domaines Meta, identifiants GA4 et pixel Meta presents dans la configuration servie, conversions Meta cablees (essai_demarre -> Lead, guide_telecharge -> CompleteRegistration) et sans aucun parametre.`);

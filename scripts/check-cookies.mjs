// check:cookies, test de non-régression de la bannière de consentement, en
// conditions MOBILE (source du bug iOS). Scénario exigé : tap « Refuser » → la
// bannière disparaît → et ne revient PAS après un rechargement. On teste aussi
// « Accepter ». Nécessite Playwright + chromium (comme check:overflow).
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { extname } from "node:path";
import { chromium } from "playwright";

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const DIST = "dist";
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/json", ".woff2": "font/woff2" };
function resolve(p) {
  let path = decodeURIComponent(p.split("?")[0]);
  if (path === "/" || path === "") return `${DIST}/index.html`;
  path = path.replace(/\/$/, "");
  return [`${DIST}${path}.html`, `${DIST}${path}/index.html`, `${DIST}${path}`].find(isFile);
}
// LOT FIX-CSP-GA4 : le serveur de test sert desormais la VRAIE CSP de
// production, lue dans vercel.json. Sans elle, ce test validait un site que la
// prod bloquait : gtag envoyait bien son hit en local, mais le navigateur le
// refusait en prod parce que le domaine de collecte (region1.analytics.google.com)
// ne figurait pas dans connect-src. Deux jours de donnees perdues faute d'avoir
// teste dans les conditions reelles.
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const CSP = vercel.headers
  ?.flatMap((h) => h.headers ?? [])
  .find((h) => h.key.toLowerCase() === "content-security-policy")?.value;
if (!CSP) {
  console.error("check:cookies ECHEC : aucune Content-Security-Policy trouvee dans vercel.json.");
  process.exit(1);
}
/** Directive de la CSP, sous forme de liste de sources. */
function cspDirective(name) {
  const found = CSP.split(";").map((d) => d.trim()).find((d) => d === name || d.startsWith(`${name} `));
  return found ? found.split(/\s+/).slice(1) : [];
}
const CONNECT_SRC = cspDirective("connect-src");

// LOT GADS-2 : /api/checkout-email est une fonction serverless Vercel, absente
// d'un build statique. Le serveur de test la simule pour pouvoir eprouver les
// CINQ issues de la chaine Stripe, y compris celles qu'on ne saurait pas
// declencher a la demande en production (API lente, 5xx). `stripeMode` pilote
// la reponse ; EMPREINTE_STRIPE est l'empreinte que la vraie fonction
// renverrait pour EMAIL_STRIPE.
const EMAIL_STRIPE = "acheteur.stripe@exemple-test.fr";
const EMPREINTE_STRIPE = createHash("sha256").update(EMAIL_STRIPE).digest("hex");
let stripeMode = "ok";

const server = createServer((req, res) => {
  if (req.url.startsWith("/api/checkout-email")) {
    if (stripeMode === "lent") return; // aucune reponse : declenche le garde-fou 4 s
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    if (stripeMode === "erreur") {
      // ATTENTION, subtilite qui a failli rendre ce gardien decoratif : la vraie
      // fonction repond du JSON VALIDE (`{}`) sur ses chemins d'erreur, statut
      // compris. Si on simulait l'erreur avec un corps non-JSON, `r.json()`
      // rejetterait, la conversion tomberait dans le `.catch` et serait etiquetee
      // « erreur » PAR ACCIDENT, meme sans le tri explicite des statuts. Le
      // gardien validerait alors un code casse. On reproduit donc fidelement la
      // vraie fonction : statut d'erreur ET corps JSON valide.
      res.statusCode = 500;
      return res.end(JSON.stringify({}));
    }
    return res.end(JSON.stringify(stripeMode === "ok" ? { h: EMPREINTE_STRIPE } : {}));
  }
  const f = resolve(req.url);
  if (!f) { res.statusCode = 404; return res.end("404"); }
  res.setHeader("Content-Type", MIME[extname(f)] || "application/octet-stream");
  if (extname(f) === ".html") res.setHeader("Content-Security-Policy", CSP);
  res.end(readFileSync(f));
});
const base = await new Promise((r) => server.listen(0, () => r(`http://127.0.0.1:${server.address().port}`)));

const errors = [];
const browser = await chromium.launch();

async function scenario(label, buttonId) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 700 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const bannerVisible = () => page.evaluate(() => {
    const b = document.getElementById("cookie-banner");
    return !!b && !b.hidden && getComputedStyle(b).display !== "none";
  });
  if (!(await bannerVisible())) errors.push(`${label} : la bannière ne s'affiche pas au premier chargement.`);
  // Tap réel (touch) sur le bouton.
  await page.locator(`#${buttonId}`).tap();
  if (await bannerVisible()) errors.push(`${label} : la bannière est encore visible après le tap.`);
  // Rechargement : le choix persiste ET aucun flash. On coupe le JS pour capturer
  // l'état INITIAL du markup : la bannière doit être cachée dès le HTML (hidden),
  // donc invisible même avant que le script ne s'exécute.
  await ctx.route("**/*.js", (r) => r.abort());
  await page.reload({ waitUntil: "domcontentloaded" });
  const flash = await page.evaluate(() => {
    const b = document.getElementById("cookie-banner");
    return { hasHidden: b?.hasAttribute("hidden"), display: b ? getComputedStyle(b).display : "none" };
  });
  if (!flash.hasHidden || flash.display !== "none") {
    errors.push(`${label} : FLASH possible, la bannière n'est pas cachée dans le markup au reload (hidden=${flash.hasHidden}, display=${flash.display}).`);
  }
  await ctx.unroute("**/*.js");
  // Rechargement normal : le choix persiste, la bannière ne revient pas.
  await page.reload({ waitUntil: "networkidle" });
  if (await bannerVisible()) errors.push(`${label} : la bannière revient après rechargement (choix non persisté).`);
  await ctx.close();
}

await scenario("Refuser", "cookie-deny");
await scenario("Accepter", "cookie-accept");

// GADS-1 : preuve RESEAU. Avant tout choix, et apres un refus, aucune requete ne
// doit partir vers un domaine Google, sur aucune des pages de conversion. Apres
// « Accepter », gtag.js doit au contraire etre demande. On observe la REQUETE
// emise (pas sa reponse) : le test ne depend pas d'un acces reseau reel.
const GOOGLE_HOST = /(^|\.)(google|googletagmanager|google-analytics|doubleclick|googleadservices|gstatic)\./i;
const PAGES = ["/", "/merci-essai", "/guide-google-commercant-local/merci", "/pour/multi-etablissements", "/politique-confidentialite"];

/** Violations CSP remontees par le navigateur pendant tout le scenario. */
const cspViolations = [];

async function networkScenario() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const googleReqs = [];
  /** URL -> statut HTTP de la reponse effectivement recue. */
  const responses = new Map();
  page.on("request", (r) => {
    let host = "";
    try { host = new URL(r.url()).hostname; } catch { /* url exotique */ }
    if (GOOGLE_HOST.test(host)) googleReqs.push(r.url());
  });
  page.on("response", (r) => responses.set(r.url(), r.status()));

  // FIX-CSP-GA4 : toute violation CSP est collectee, y compris celles qui ne
  // concernent pas Google (posthog, polices, images). Une requete bloquee par
  // la CSP ne produit AUCUNE erreur cote gtag : c'est le navigateur qui la
  // refuse en silence, d'ou ce capteur explicite.
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      const w = window;
      (w.__cspViolations = w.__cspViolations || []).push({
        directive: e.effectiveDirective || e.violatedDirective,
        blocked: e.blockedURI,
      });
    });
  });
  const drainViolations = async () => {
    const found = await page.evaluate(() => {
      const w = window;
      const v = w.__cspViolations || [];
      w.__cspViolations = [];
      return v;
    }).catch(() => []);
    cspViolations.push(...found);
  };

  // a) Aucun choix exprime : rien ne doit partir vers Google.
  for (const p of PAGES) await page.goto(base + p, { waitUntil: "networkidle" });
  if (googleReqs.length) {
    errors.push(`AVANT consentement : ${googleReqs.length} requete(s) Google (ex. ${googleReqs[0]}).`);
  }

  // b) Refus : idem, sur toutes les pages, y compris apres navigation.
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.click("#cookie-deny");
  googleReqs.length = 0;
  for (const p of PAGES) await page.goto(base + p, { waitUntil: "networkidle" });
  if (googleReqs.length) {
    errors.push(`APRES refus : ${googleReqs.length} requete(s) Google (ex. ${googleReqs[0]}). Le refus ne doit rien charger.`);
  }

  // c) Acceptation : la mesure doit REELLEMENT partir.
  // LOT FIX-GTAG : la version precedente de ce scenario se contentait de voir
  // gtag.js demande, et c'est precisement pour cela qu'un bug majeur est passe
  // a travers pendant tout le lot GADS-1 (la fonction gtag poussait un tableau
  // au lieu de l'objet `arguments`, que gtag.js est seul a lire : le script se
  // chargeait, puis ignorait consentement, config et evenements en silence,
  // sans la moindre erreur console). On exige donc desormais la PREUVE de bout
  // en bout : un hit de collecte reellement envoye ET le cookie _ga depose.
  await ctx.clearCookies();
  await page.goto(base + "/merci-essai", { waitUntil: "networkidle" });
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  await page.reload({ waitUntil: "networkidle" });
  googleReqs.length = 0;
  await page.click("#cookie-accept");
  // Le hit de collecte part apres le chargement et l'execution de gtag.js :
  // on attend qu'il apparaisse, avec une limite de temps.
  // Les hits de collecte GA4 partent selon le compte vers google-analytics.com
  // ou vers un domaine regionalise (region1.analytics.google.com). Les deux
  // formes comptent : ce qui importe est qu'un hit parte reellement.
  const COLLECT_RE = /^https:\/\/([a-z0-9-]+\.)*(google-analytics\.com|analytics\.google\.com)\/g\/collect/;
  // On attend un hit ABOUTI, c'est-a-dire une requete qui a recu une reponse.
  // Une requete bloquee par la CSP est emise cote page mais n'aboutit jamais :
  // c'est precisement la difference que l'ancien test ne faisait pas.
  const aboutis = () => googleReqs.filter((u) => COLLECT_RE.test(u) && responses.has(u));
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline && aboutis().length === 0) {
    await page.waitForTimeout(250);
  }
  await drainViolations();

  const gtagReq = googleReqs.find((u) => u.includes("googletagmanager.com/gtag/js"));
  if (!gtagReq) errors.push("APRES acceptation : gtag.js n'est pas charge (aucune requete googletagmanager).");
  else if (!/[?&]id=G-/.test(gtagReq)) errors.push(`APRES acceptation : gtag.js sans identifiant de mesure (${gtagReq}).`);

  const tentes = googleReqs.filter((u) => COLLECT_RE.test(u));
  const collectReq = aboutis()[0];
  if (tentes.length === 0) {
    errors.push(
      "APRES acceptation : AUCUN hit de collecte GA4 (google-analytics.com/g/collect). " +
      "Deux causes possibles : (1) la CSP bloque le domaine de collecte avant meme l'envoi, voir les violations listees ci-dessous ; " +
      "(2) la fonction gtag pousse un tableau dans le dataLayer au lieu de l'objet `arguments`. " +
      `connect-src actuelle : ${CONNECT_SRC.join(" ")}`,
    );
  } else if (!collectReq) {
    // Hit TENTE mais jamais abouti : signature d'un blocage CSP.
    const host = new URL(tentes[0]).hostname;
    errors.push(
      `APRES acceptation : le hit de collecte vers ${host} est parti mais n'a JAMAIS abouti (aucune reponse). ` +
      `Cause la plus probable : la connect-src de la CSP ne couvre pas ce domaine. connect-src actuelle : ${CONNECT_SRC.join(" ")}`,
    );
  } else {
    const status = responses.get(collectReq);
    if (!(status >= 200 && status < 300)) {
      errors.push(`APRES acceptation : hit de collecte en statut ${status} (attendu 2xx/204) -> ${collectReq.slice(0, 140)}`);
    }
    if (!/[?&]tid=G-/.test(collectReq)) {
      errors.push(`APRES acceptation : hit de collecte sans identifiant de mesure (${collectReq.slice(0, 160)}).`);
    }
    // GARDIEN FIX-CSP-GA4 : le domaine REELLEMENT utilise par gtag doit figurer
    // dans la connect-src. Si Google change de domaine de collecte demain, ce
    // test le dit ici, au lieu de le laisser decouvrir dans un GA4 vide.
    const collectHost = new URL(collectReq).hostname;
    const autorise = CONNECT_SRC.some((src) => {
      if (src === "*" || src === "'self'") return false;
      const s = src.replace(/^https?:\/\//, "").replace(/\/$/, "");
      return s.startsWith("*.") ? collectHost.endsWith(s.slice(1)) : collectHost === s;
    });
    if (!autorise) {
      errors.push(
        `APRES acceptation : le hit de collecte part vers ${collectHost}, qui n'est PAS dans la connect-src de la CSP ` +
        `(${CONNECT_SRC.join(" ")}). En production, le navigateur le bloquera et GA4 restera vide.`,
      );
    }
  }

  // Le cookie _ga (first-party, pose par gtag.js) prouve que le consentement
  // « granted » a bien ete lu : en analytics_storage denied, il n'existe pas.
  const cookies = await ctx.cookies();
  if (!cookies.some((c) => c.name === "_ga")) {
    errors.push(
      `APRES acceptation : cookie _ga absent (cookies presents : ${cookies.map((c) => c.name).join(", ") || "aucun"}). ` +
      "Le consent update n'a pas ete pris en compte par gtag.js.",
    );
  }

  // L'evenement de conversion de la page doit lui aussi etre parti.
  if (collectReq) {
    const eventHits = googleReqs.filter((u) => COLLECT_RE.test(u));
    const hasEvent = eventHits.some((u) => /[?&]en=essai_demarre/.test(u));
    if (!hasEvent) {
      errors.push(
        "APRES acceptation sur /merci-essai : l'evenement essai_demarre n'apparait dans aucun hit de collecte " +
        `(hits observes : ${eventHits.length}). La file d'evenements n'est pas videe vers GA4.`,
      );
    }
  }
  await drainViolations();
  await ctx.close();
}

await networkScenario();

// LOT GADS-2, suivi avance des conversions. Preuve de bout en bout, sous la
// VRAIE CSP de production : l'empreinte SHA-256 de l'email saisi doit accompagner
// la conversion, et l'email en clair ne doit JAMAIS partir vers Google.
//
// Repartition volontaire entre echec et avertissement :
//   - ce que NOTRE code controle (hachage correct, report d'une page a l'autre,
//     declaration a gtag, absence d'email en clair, hit abouti en 2xx) fait
//     ECHOUER le check ;
//   - la presence de l'empreinte SUR LE RESEAU depend d'un reglage cote Google
//     (« collecte de donnees fournies par l'utilisateur » dans la propriete GA4).
//     Tant qu'il est desactive, gtag.js ne charge meme pas son module de donnees
//     utilisateur et ignore `user_data` en silence. On AVERTIT, sans bloquer un
//     build que le code ne peut pas corriger.
const EMAIL_SONDE = "sonde.gads2@exemple-test.fr";
const EMPREINTE_ATTENDUE = createHash("sha256").update(EMAIL_SONDE).digest("hex");

async function enhancedConversionScenario() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const googleReqs = [];
  const responses = new Map();
  page.on("request", (r) => {
    let host = "";
    try { host = new URL(r.url()).hostname; } catch { /* url exotique */ }
    if (GOOGLE_HOST.test(host) || /doubleclick/.test(host)) {
      googleReqs.push({ url: r.url(), post: r.postData() || "" });
    }
  });
  page.on("response", (r) => responses.set(r.url(), r.status()));

  // 1) Page du formulaire : la saisie de l'email doit produire l'empreinte, et
  // rien d'autre. On verifie la valeur EXACTE : une normalisation qui derive
  // (majuscules non abaissees, espaces non retires) produirait une empreinte que
  // Google ne pourrait recoller a aucun compte, sans que rien ne le signale.
  await page.goto(base + "/guide-google-commercant-local", { waitUntil: "networkidle" });
  // Saisie volontairement « sale » : Google exige minuscules et espaces retires.
  await page.fill('input[name="email"]', `  ${EMAIL_SONDE.toUpperCase()} `);
  await page.dispatchEvent('input[name="email"]', "change");
  await page.waitForTimeout(500);
  const empreinte = await page.evaluate(() => sessionStorage.getItem("stela-uid"));
  if (empreinte !== EMPREINTE_ATTENDUE) {
    errors.push(
      `GADS-2 : l'empreinte preparee a la saisie vaut ${empreinte || "rien"}, attendu ${EMPREINTE_ATTENDUE}. ` +
      "La normalisation (minuscules, espaces retires) ou le hachage SHA-256 a change : Google ne pourra plus recoller la conversion.",
    );
  }

  // 2) Page de merci du meme onglet : la conversion doit partir AVEC l'empreinte.
  await page.goto(base + "/guide-google-commercant-local/merci", { waitUntil: "networkidle" });
  await page.click("#cookie-accept");
  const COLLECT = /^https:\/\/([a-z0-9-]+\.)*(google-analytics\.com|analytics\.google\.com)\/g\/collect/;
  const conversion = () => googleReqs.find((h) => COLLECT.test(h.url) && /[?&]en=guide_telecharge/.test(h.url) && responses.has(h.url));
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline && !conversion()) await page.waitForTimeout(250);

  // 3) L'empreinte a-t-elle bien ete declaree a gtag ? C'est la part que NOTRE
  // code maitrise, et elle est verifiable quel que soit le reglage Google.
  const declaree = await page.evaluate(() =>
    (window.dataLayer || []).some((a) => {
      const args = Array.prototype.slice.call(a);
      return args[0] === "set" && args[1] === "user_data" && typeof args[2]?.sha256_email_address === "string";
    }));
  if (!declaree) {
    errors.push("GADS-2 : aucune declaration `gtag(\"set\", \"user_data\", { sha256_email_address })` dans le dataLayer apres acceptation. Le suivi avance n'est plus cable.");
  }

  // 4) L'email en clair ne doit apparaitre dans AUCUNE requete Google, ni en URL
  // ni dans le corps. C'est l'exigence RGPD non negociable du lot.
  const enClair = googleReqs.filter((h) => {
    const tout = `${h.url}\n${h.post}`;
    return tout.includes(EMAIL_SONDE) || tout.includes(encodeURIComponent(EMAIL_SONDE)) ||
      tout.toLowerCase().includes(EMAIL_SONDE.toLowerCase());
  });
  if (enClair.length) {
    errors.push(`GADS-2 : EMAIL EN CLAIR dans ${enClair.length} requete(s) Google (ex. ${enClair[0].url.slice(0, 160)}). Seule l'empreinte SHA-256 doit circuler.`);
  }

  // 5) La conversion doit ABOUTIR sous la CSP de production, pas seulement partir.
  const hit = conversion();
  if (!hit) {
    const tentes = googleReqs.filter((h) => COLLECT.test(h.url) && /[?&]en=guide_telecharge/.test(h.url));
    errors.push(
      tentes.length
        ? `GADS-2 : la conversion guide_telecharge est partie vers ${new URL(tentes[0].url).hostname} mais n'a JAMAIS abouti. Cause la plus probable : connect-src ne couvre pas ce domaine (${CONNECT_SRC.join(" ")}).`
        : "GADS-2 : aucune conversion guide_telecharge observee apres acceptation. Le report de l'empreinte d'une page a l'autre a peut-etre casse la conversion elle-meme.",
    );
  } else {
    const status = responses.get(hit.url);
    if (!(status >= 200 && status < 300)) {
      errors.push(`GADS-2 : conversion guide_telecharge en statut ${status} (attendu 2xx/204).`);
    }
    // 6) L'empreinte est-elle reellement PARTIE sur le reseau ?
    // Distinction essentielle : cela depend d'un reglage GA4 hors de notre code
    // (« donnees fournies par l'utilisateur », en mode MANUEL). On interroge donc
    // le module de donnees utilisateur de gtag :
    //   - module ABSENT  -> Google n'accepte pas encore `user_data`. Le code n'y
    //     peut rien : on AVERTIT sans bloquer le build.
    //   - module PRESENT -> Google est pret et accepte `user_data`. Si l'empreinte
    //     n'apparait quand meme pas, c'est NOTRE chaine qui a casse : ECHEC.
    // C'est ce qui evite les deux travers symetriques : un build rouge pour une
    // case a cocher chez Google, et une regression de code passee inapercue.
    const updCharge = await page.evaluate(() => !!(window.google_tag_data || {}).upd);
    const surLeReseau = googleReqs.some((h) => `${h.url}\n${h.post}`.includes(EMPREINTE_ATTENDUE));
    if (surLeReseau) {
      console.log("check:cookies : empreinte SHA-256 observee sur le reseau, suivi avance pleinement actif.");
    } else if (updCharge) {
      errors.push(
        "GADS-2 : gtag a bien charge son module de donnees utilisateur (Google accepte `user_data`), " +
        "mais l'empreinte n'apparait dans AUCUN hit de collecte. La chaine de transmission est cassee cote site.",
      );
    } else {
      console.warn(
        "\ncheck:cookies AVERTISSEMENT (GADS-2) : l'empreinte est correctement calculee et declaree a gtag,\n" +
        "  mais elle ne part PAS sur le reseau. gtag.js n'a pas charge son module de donnees utilisateur\n" +
        "  (window.google_tag_data.upd absent) : il ignore `user_data` en silence.\n" +
        "  A FAIRE, cote Google : GA4 > Admin > Parametres des donnees > Collecte de donnees >\n" +
        "  « Collecte de donnees fournies par l'utilisateur », en mode MANUEL (le mode automatique\n" +
        "  seul ne suffit pas : il fait scraper le DOM par Google et ignore le `user_data` fourni).\n" +
        "  Tant que le mode manuel est desactive, le suivi avance n'apporte aucun gain de conversions.\n",
      );
    }
  }
  await ctx.close();
}

// LOT GADS-2 : conversion `demande_devis`. Elle part au submit du formulaire de
// devis, avec l'empreinte de l'email saisi. Specificite : l'empreinte est
// preparee A LA SAISIE (crypto.subtle est asynchrone, le submit natif quitte la
// page). Ce scenario verifie donc qu'au moment du submit elle est bien prete.
async function devisScenario() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const googleReqs = [];
  const responses = new Map();
  page.on("request", (r) => {
    let host = "";
    try { host = new URL(r.url()).hostname; } catch { /* url exotique */ }
    if (GOOGLE_HOST.test(host) || /doubleclick/.test(host)) googleReqs.push({ url: r.url(), post: r.postData() || "" });
  });
  page.on("response", (r) => responses.set(r.url(), r.status()));

  const EMAIL = "devis.test@exemple-test.fr";
  const EMPREINTE = createHash("sha256").update(EMAIL).digest("hex");
  await page.goto(base + "/pour/multi-etablissements", { waitUntil: "networkidle" });
  if (await page.locator('.devis-form input[name="email"]').count() !== 1) {
    errors.push("GADS-2 : le champ email du formulaire de devis est absent. Sans lui, demande_devis repart sans donnee d'identification.");
    await ctx.close();
    return;
  }
  await page.click("#cookie-accept");
  await page.fill('.devis-form input[name="name"]', "Camille Dupont");
  // Saisie sale, comme un vrai visiteur : Google exige minuscules et espaces retires.
  await page.fill('.devis-form input[name="email"]', `  ${EMAIL.toUpperCase()} `);
  await page.fill('.devis-form input[name="establishments"]', "4");
  await page.selectOption('.devis-form select[name="sector"]', { label: "Restauration" });
  await page.dispatchEvent('.devis-form input[name="email"]', "change");
  await page.waitForTimeout(500);
  // On neutralise UNIQUEMENT la navigation : /api/devis est une fonction
  // serverless, absente du build statique, et un 404 emporterait la page avant
  // que le hit ne parte. Le code de suivi, lui, n'est pas touche.
  await page.evaluate(() => {
    document.querySelector(".devis-form")?.addEventListener("submit", (e) => e.preventDefault());
  });
  await page.click('.devis-form button[type="submit"]');
  await page.waitForTimeout(6000);

  const dl = await page.evaluate(() => (window.dataLayer || []).map((a) => {
    try { return JSON.stringify(Array.prototype.slice.call(a)); } catch { return String(a); }
  }));
  if (!dl.some((e) => e.includes("user_data") && e.includes(EMPREINTE))) {
    errors.push(`GADS-2 : demande_devis n'a pas declare l'empreinte attendue (${EMPREINTE}). Normalisation, hachage, ou preparation a la saisie casses.`);
  }
  if (!dl.some((e) => e.includes('"demande_devis"'))) {
    errors.push("GADS-2 : l'evenement demande_devis n'a pas ete emis au submit du formulaire.");
  }
  const clair = googleReqs.filter((h) => `${h.url}\n${h.post}`.toLowerCase().includes(EMAIL));
  if (clair.length) {
    errors.push(`GADS-2 : EMAIL EN CLAIR vers Google depuis le formulaire de devis (${clair[0].url.slice(0, 140)}).`);
  }
  await ctx.close();
}

// LOT GADS-2 : chaine Stripe de la conversion `essai_demarre`. L'email est chez
// Stripe : la page interroge /api/checkout-email, qui ne renvoie QUE l'empreinte.
// Chaque issue doit etre correctement etiquetee par `ec_statut`, sinon une
// conversion sans empreinte passerait pour un suivi avance qui sous-performe
// alors qu'il s'agit d'un simple timeout ou d'une configuration absente.
async function stripeScenario(mode, chemin, statutAttendu, empreinteAttendue) {
  stripeMode = mode;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(base + chemin, { waitUntil: "domcontentloaded" });
  await page.click("#cookie-accept").catch(() => { /* banniere deja tranchee */ });
  // Le mode « lent » doit franchir le garde-fou de 4 s avant d'emettre.
  await page.waitForTimeout(mode === "lent" ? 7000 : 3000);

  const dl = await page.evaluate(() => (window.dataLayer || []).map((a) => {
    try { return JSON.stringify(Array.prototype.slice.call(a)); } catch { return String(a); }
  }));
  const evts = dl.filter((e) => e.includes('"essai_demarre"'));
  const statut = (evts.join(" ").match(/"ec_statut":"(\w+)"/) || [])[1];
  if (evts.length !== 1) {
    errors.push(`GADS-2 (Stripe/${mode}) : ${evts.length} evenement(s) essai_demarre au lieu d'un seul. Risque de conversion comptee deux fois ou perdue.`);
  }
  if (statut !== statutAttendu) {
    errors.push(`GADS-2 (Stripe/${mode}) : ec_statut vaut « ${statut} », attendu « ${statutAttendu} ». Une conversion sans empreinte deviendrait indiagnosticable.`);
  }
  const aEmpreinte = dl.some((e) => e.includes("user_data") && e.includes(EMPREINTE_STRIPE));
  if (empreinteAttendue && !aEmpreinte) {
    errors.push(`GADS-2 (Stripe/${mode}) : l'empreinte renvoyee par /api/checkout-email n'a pas ete declaree a gtag.`);
  }
  if (!empreinteAttendue && aEmpreinte) {
    errors.push(`GADS-2 (Stripe/${mode}) : une empreinte a ete declaree alors qu'aucune n'etait disponible. Jamais de valeur inventee.`);
  }
  await ctx.close();
}

await enhancedConversionScenario();
await devisScenario();
// Les cinq issues de la chaine Stripe, y compris celles qu'on ne peut pas
// provoquer a la demande en production.
await stripeScenario("ok", "/merci-essai?session_id=cs_test_gads2guardian", "ok", true);
await stripeScenario("lent", "/merci-essai?session_id=cs_test_gads2guardian", "timeout", false);
await stripeScenario("vide", "/merci-essai?session_id=cs_test_gads2guardian", "api_vide", false);
await stripeScenario("erreur", "/merci-essai?session_id=cs_test_gads2guardian", "erreur", false);
await stripeScenario("ok", "/merci-essai", "sans_session", false);
stripeMode = "ok";

await browser.close();
server.close();

// Violations CSP observees pendant le scenario. Celles qui touchent la mesure
// sont bloquantes (elles signifient que la CSP mange les donnees) ; les autres
// sont signalees pour information, sans faire echouer le check.
const violations = [...new Map(cspViolations.map((v) => [`${v.directive} ${v.blocked}`, v])).values()];
const MESURE_RE = /google-analytics|analytics\.google|googletagmanager/i;
for (const v of violations.filter((x) => MESURE_RE.test(x.blocked || ""))) {
  errors.push(`Violation CSP bloquant la mesure : ${v.directive} refuse ${v.blocked}.`);
}
const autres = violations.filter((x) => !MESURE_RE.test(x.blocked || ""));
if (autres.length) {
  console.warn(`check:cookies : ${autres.length} violation(s) CSP hors mesure (non bloquant) :`);
  autres.forEach((v) => console.warn(`  ${v.directive} refuse ${v.blocked}`));
}

if (errors.length) {
  console.error(`check:cookies ECHEC : ${errors.length} probleme(s) :`);
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log("check:cookies OK : pages servies sous la CSP de production ; bannière (Refuser + Accepter) fiable sur mobile ; 0 requête Google avant consentement et après refus ; après acceptation, gtag.js chargé, hit /g/collect ABOUTI (2xx) vers un domaine bien présent dans la connect-src, cookie _ga déposé, événement essai_demarre transmis, 0 violation CSP sur la mesure.");
console.log("check:cookies OK (GADS-2) : les 3 conversions portent l'empreinte SHA-256 de l'email quand il existe, 0 email en clair vers Google ; guide_telecharge reporté d'une page à l'autre et abouti en 2xx ; demande_devis préparé à la saisie et émis au submit ; chaîne Stripe étiquetée sur ses 5 issues (ok, timeout, api_vide, erreur, sans_session), 1 seul événement par issue.");

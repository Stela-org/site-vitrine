// check:cookies — test de non-régression de la bannière de consentement, en
// conditions MOBILE (source du bug iOS). Scénario exigé : tap « Refuser » → la
// bannière disparaît → et ne revient PAS après un rechargement. On teste aussi
// « Accepter ». Nécessite Playwright + chromium (comme check:overflow).
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
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
const server = createServer((req, res) => {
  const f = resolve(req.url);
  if (!f) { res.statusCode = 404; return res.end("404"); }
  res.setHeader("Content-Type", MIME[extname(f)] || "application/octet-stream");
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

async function networkScenario() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const googleReqs = [];
  page.on("request", (r) => {
    let host = "";
    try { host = new URL(r.url()).hostname; } catch { /* url exotique */ }
    if (GOOGLE_HOST.test(host)) googleReqs.push(r.url());
  });

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
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline && !googleReqs.some((u) => COLLECT_RE.test(u))) {
    await page.waitForTimeout(250);
  }
  const gtagReq = googleReqs.find((u) => u.includes("googletagmanager.com/gtag/js"));
  if (!gtagReq) errors.push("APRES acceptation : gtag.js n'est pas charge (aucune requete googletagmanager).");
  else if (!/[?&]id=G-/.test(gtagReq)) errors.push(`APRES acceptation : gtag.js sans identifiant de mesure (${gtagReq}).`);

  const collectReq = googleReqs.find((u) => COLLECT_RE.test(u));
  if (!collectReq) {
    errors.push(
      "APRES acceptation : AUCUN hit de collecte GA4 (google-analytics.com/g/collect). " +
      "gtag.js se charge mais n'envoie rien : verifier que la fonction gtag pousse bien `arguments` dans le dataLayer, et non un tableau.",
    );
  } else if (!/[?&]tid=G-/.test(collectReq)) {
    errors.push(`APRES acceptation : hit de collecte sans identifiant de mesure (${collectReq.slice(0, 160)}).`);
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
  await ctx.close();
}

await networkScenario();

await browser.close();
server.close();

if (errors.length) {
  console.error(`check:cookies ECHEC : ${errors.length} probleme(s) :`);
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log("check:cookies OK : bannière (Refuser + Accepter) disparaît au tap et ne revient pas au reload (mobile) ; 0 requête Google avant consentement et après refus ; après acceptation, gtag.js chargé, hit de collecte GA4 réellement envoyé, cookie _ga déposé et événement essai_demarre transmis.");

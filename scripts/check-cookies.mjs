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

  // c) Acceptation : gtag.js est demande, avec le bon identifiant de mesure.
  await ctx.clearCookies();
  await page.goto(base + "/merci-essai", { waitUntil: "networkidle" });
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  await page.reload({ waitUntil: "networkidle" });
  googleReqs.length = 0;
  await page.click("#cookie-accept");
  await page.waitForTimeout(1500);
  const gtagReq = googleReqs.find((u) => u.includes("googletagmanager.com/gtag/js"));
  if (!gtagReq) errors.push("APRES acceptation : gtag.js n'est pas charge (aucune requete googletagmanager).");
  else if (!/[?&]id=G-/.test(gtagReq)) errors.push(`APRES acceptation : gtag.js sans identifiant de mesure (${gtagReq}).`);
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
console.log("check:cookies OK : bannière (Refuser + Accepter) disparaît au tap et ne revient pas au reload (mobile) ; 0 requête Google avant consentement et après refus, gtag.js chargé après acceptation.");

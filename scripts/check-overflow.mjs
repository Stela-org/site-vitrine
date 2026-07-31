// check:overflow — garde-fou anti-scroll horizontal. Sert dist/ (cleanUrls) et
// vérifie, à plusieurs largeurs, que scrollWidth <= innerWidth sur les pages
// clés. Nécessite Playwright + chromium (devDependency). Prend aussi des
// captures si SHOT=1.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname } from "node:path";
import { chromium } from "playwright";

const isFile = (p) => existsSync(p) && statSync(p).isFile();

const DIST = "dist";
const WIDTHS = [320, 375, 768, 1280];
const PAGES = ["/", "/tarifs", "/fonctionnalites", "/collecte-avis-google", "/pour/coiffeur", "/restaurants-lyon", "/comparatif", "/blog/repondre-avis-negatif-google-restaurant", "/blog/geo-ou-seo-commerce-local", "/blog/mesurer-visibilite-ia-commerce-local", "/blog/etre-recommande-par-chatgpt-commerce-local", "/notre-histoire", "/statistiques-avis-google-france", "/guide-google-commercant-local"];
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/json", ".json": "application/json", ".woff": "font/woff", ".woff2": "font/woff2" };

function resolve(p) {
  let path = decodeURIComponent(p.split("?")[0]);
  if (path === "/" || path === "") return `${DIST}/index.html`;
  path = path.replace(/\/$/, "");
  const cands = [`${DIST}${path}.html`, `${DIST}${path}/index.html`, `${DIST}${path}`];
  return cands.find((c) => isFile(c));
}
const server = createServer((req, res) => {
  const file = resolve(req.url);
  if (!file) { res.statusCode = 404; res.end("404"); return; }
  res.setHeader("Content-Type", MIME[extname(file)] || "application/octet-stream");
  res.end(readFileSync(file));
});

const base = await new Promise((r) => server.listen(0, () => r(`http://127.0.0.1:${server.address().port}`)));
const browser = await chromium.launch();
const shot = process.env.SHOT === "1";
const offenders = [];

for (const path of PAGES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(base + path, { waitUntil: "networkidle" });
    const m = await page.evaluate(() => ({
      sw: document.scrollingElement.scrollWidth, iw: window.innerWidth,
      culprit: (() => {
        const vw = window.innerWidth; let worst = null, max = vw;
        for (const el of document.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.right > max + 0.5) { max = r.right; worst = el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : ""); }
        }
        return worst ? `${worst} (right=${Math.round(max)})` : null;
      })(),
    }));
    if (m.sw > m.iw + 1) offenders.push(`${path} @${width}px : scrollWidth ${m.sw} > ${m.iw}  ${m.culprit ? "→ " + m.culprit : ""}`);
    if (shot && width === 375) await page.screenshot({ path: `.overflow/${path.replace(/\W+/g, "_") || "home"}-${width}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
server.close();

if (offenders.length) {
  console.error(`check:overflow ECHEC : ${offenders.length} debordement(s) :`);
  offenders.forEach((o) => console.error("  " + o));
  process.exit(1);
}
console.log(`check:overflow OK : aucun scroll horizontal (${PAGES.length} pages x ${WIDTHS.length} largeurs).`);

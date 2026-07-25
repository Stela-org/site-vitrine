// build:guide : rend le guide (HTML soigné, charte Stela) en PDF via Playwright
// (chromium, déjà en devDependency). Le PDF est ensuite servi en statique et
// devient la valeur PAR DÉFAUT de LEAD_GUIDE_URL. À relancer si le contenu
// (scripts/guide-google-commercant-local.html) change.
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve("scripts/guide-google-commercant-local.html");
const OUT = resolve("public/guides/guide-google-commercant-local.pdf");
mkdirSync(resolve("public/guides"), { recursive: true });

const html = readFileSync(SRC, "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });

// Pied de page discret (charte laiton) + pagination. Marge basse réservée par @page.
const footer = `
  <div style="width:100%; font-size:7pt; color:#6C6558; font-family:'Segoe UI',system-ui,Arial,sans-serif;
    padding:0 16mm; display:flex; justify-content:space-between; align-items:center;">
    <span style="color:#B08A3E; font-weight:800;">&#10022; Stela</span>
    <span>Le Guide Google du commerçant local</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;

await page.pdf({
  path: OUT,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: footer,
  margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
});

await browser.close();
console.log(`build:guide OK : ${OUT}`);

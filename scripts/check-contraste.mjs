// check:contraste (LOT SEO-FIX-2) — garde-fou WCAG 1.4.3 sur le HTML RENDU.
//
// POURQUOI. Le lot SEO-FIX-1 a corrigé vingt-cinq occurrences de texte illisible,
// toutes issues du MÊME défaut : le laiton #B08A3E ne peut pas porter de petit
// texte sur fond clair (2,61 face au crème #EEE7DA, là où WCAG demande 4,5) et ne
// peut pas recevoir du blanc (3,21). Corriger les occurrences ne ferme pas la
// classe : rien n'empêche un futur `color: var(--brass)` sur un libellé de 11 px.
// Ce gardien ferme la classe.
//
// CE QU'IL MESURE. Pour chaque élément portant du texte PROPRE (un nœud texte
// direct, pas celui d'un enfant), il compose la pile de fonds jusqu'au premier
// fond opaque, applique l'alpha du texte, et compare au seuil : 4,5:1 en texte
// courant, 3:1 en texte large (>= 24 px, ou >= 18,66 px en gras >= 700).
//
// POURQUOI SUR LE BUILD ET PAS SUR LES SOURCES. Un ratio dépend du fond EFFECTIF,
// donc de la cascade complète et de la position réelle dans le DOM. Aucune lecture
// de CSS ne le donne : il faut peindre la page.
//
// LE SERVEUR ÉMULE cleanUrls. Sans cela, /tarifs cherche dist/tarifs et rend 404.
// Le 02/09/2026, une mesure faite sans cette émulation a rendu un tableau vert sur
// cinq pages qui étaient en réalité des 404, et masqué trois défauts réels.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, globSync } from "node:fs";
import { extname, relative } from "node:path";
import { chromium } from "playwright";

const DIST = "dist";
const isFile = (p) => existsSync(p) && statSync(p).isFile();
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/json", ".json": "application/json", ".woff": "font/woff", ".woff2": "font/woff2", ".pdf": "application/pdf" };

// EXCLUSIONS MOTIVÉES. Le tableau est VIDE, et c'est un résultat, pas un oubli.
// Les deux exclusions envisagées au brief se sont révélées fausses, chacune pour
// une raison opposée, et les inscrire ici aurait créé la dette qu'on veut éviter.
//
//   .ps-place — écarté parce qu'INUTILE. La maquette de téléphone entière porte
//   role="img" avec un aria-label (PhoneReview.astro). Tout ce qu'elle contient
//   est donc un graphique, hors du critère 1.4.3, et la règle générale ci-dessous
//   le couvre déjà pour la bonne raison. Vérifié : gardien lancé sans aucune
//   exclusion, il ne signale pas .ps-place.
//
//   .freeze-more — écarté parce que DANGEREUX. Cet élément est CONFORME (4,93).
//   L'exclure retirerait la surveillance exactement là où la marge est la plus
//   mince du site, 0,43 : un fond légèrement plus clair le ferait tomber sans que
//   rien ne le dise. On n'exclut pas ce qui passe, on exclut ce qui ne peut pas
//   passer et dont on assume la raison.
//
// LIMITE CONNUE. La composition ne remonte que les background-color. Un texte posé
// sur une background-image ou sur un pseudo-élément en dégradé serait mesuré
// contre le fond du parent, donc potentiellement en faux positif. Le seul cas du
// site est dans la maquette, déjà hors critère. Si un tel cas apparaît hors d'un
// role="img", il s'ajoute ICI avec sa raison écrite, jamais un nom seul.
const EXCLUSIONS = [];

// Les étoiles décoratives ne sont pas exclues par un nom : la règle générale lit
// aria-hidden et role="img", qui est précisément ce qui les met hors critère.

function resolve(p) {
  let path = decodeURIComponent(p.split("?")[0]);
  if (path === "/" || path === "") return `${DIST}/index.html`;
  path = path.replace(/\/$/, "");
  return [`${DIST}${path}.html`, `${DIST}${path}/index.html`, `${DIST}${path}`].find(isFile);
}

const server = createServer((req, res) => {
  const file = resolve(req.url);
  if (!file) { res.statusCode = 404; res.end("404"); return; }
  res.setHeader("Content-Type", MIME[extname(file)] || "application/octet-stream");
  res.end(readFileSync(file));
});
const base = await new Promise((r) => server.listen(0, () => r(`http://127.0.0.1:${server.address().port}`)));

const pages = globSync(`${DIST}/**/*.html`)
  .map((f) => "/" + relative(DIST, f).replace(/\.html$/, "").replace(/(^|\/)index$/, ""))
  .map((u) => (u === "/" ? "/" : u.replace(/\/$/, "")))
  .filter((u) => !/^\/404$/.test(u))
  .sort();
if (!pages.length) { console.error("check:contraste ECHEC : aucune page dans dist/."); process.exit(1); }

const SONDE = (exclusions) => {
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const parse = (s) => { const n = (s.match(/[\d.]+/g) || []).map(Number); return { rgb: n.slice(0, 3), a: n.length > 3 ? n[3] : 1 }; };
  const hex = (a) => "#" + a.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  const fondEffectif = (el) => {
    let cur = el, pile = [];
    while (cur) { const c = parse(getComputedStyle(cur).backgroundColor); if (c.a > 0) { pile.push(c); if (c.a === 1) break; } cur = cur.parentElement; }
    let base = pile.length && pile[pile.length - 1].a === 1 ? pile.pop().rgb : [255, 255, 255];
    for (let i = pile.length - 1; i >= 0; i--) { const c = pile[i]; base = base.map((v, k) => c.rgb[k] * c.a + v * (1 - c.a)); }
    return base;
  };
  const nom = (el) => el.tagName.toLowerCase() + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).join(".") : "");
  const fautes = [], exclus = [];
  for (const el of document.querySelectorAll("body *")) {
    // Texte PROPRE seulement : sinon un conteneur hériterait du texte de ses fils
    // et on mesurerait dix fois la même chaîne sur dix fonds différents.
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
    // Hors WCAG 1.4.3 : ce qui n'est pas exposé comme du texte. aria-hidden le
    // retire de l'arbre d'accessibilité ; role="img" en fait un graphique, dont
    // le nom accessible porte l'information (les blocs d'étoiles).
    if (el.closest('[aria-hidden="true"], [role="img"]')) continue;
    const sel = nom(el);
    const ex = exclusions.find((x) => el.closest(x.sel));
    const fg = parse(cs.color), bg = fondEffectif(el);
    const eff = fg.rgb.map((v, k) => v * fg.a + bg[k] * (1 - fg.a));
    const [L1, L2] = [lum(eff), lum(bg)].sort((a, b) => b - a);
    const ratio = (L1 + 0.05) / (L2 + 0.05);
    const px = parseFloat(cs.fontSize), poids = parseInt(cs.fontWeight, 10) || 400;
    const large = px >= 24 || (px >= 18.66 && poids >= 700);
    const seuil = large ? 3 : 4.5;
    if (ex) { exclus.push(ex.sel); continue; }
    if (ratio + 0.005 < seuil) fautes.push({ sel, texte: hex(eff), fond: hex(bg), px: +px.toFixed(1), poids, ratio: +ratio.toFixed(2), seuil, ex: [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").trim().slice(0, 40) });
  }
  return { fautes, exclus };
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const offenders = [], vus = new Set(); let nbExclus = 0, nbTextes = 0;
for (const path of pages) {
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  const { fautes, exclus } = await page.evaluate(SONDE, EXCLUSIONS);
  nbExclus += exclus.length; nbTextes++;
  for (const f of fautes) {
    // Une même règle CSS produit le même défaut sur trente pages : on ne le
    // signale qu'une fois, sur la première page où on le rencontre.
    const cle = `${f.sel}|${f.texte}|${f.fond}|${f.px}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    offenders.push(`${path} ${f.sel}\n      texte ${f.texte} sur fond ${f.fond}, ${f.px} px poids ${f.poids} : ${f.ratio} pour ${f.seuil} requis — « ${f.ex} »`);
  }
}
await browser.close();
server.close();

if (offenders.length) {
  console.error(`check:contraste ECHEC : ${offenders.length} texte(s) sous le seuil WCAG 1.4.3 (${nbTextes} pages) :`);
  for (const o of offenders) console.error("  " + o);
  console.error("  Rappel : le laiton --brass ne porte pas de petit texte sur fond clair et ne recoit pas de blanc.");
  console.error("  Utiliser --royal (#2B4C8C) pour du texte sur creme, --ink (#15233F) sur une surface laiton.");
  process.exit(1);
}
console.log(`check:contraste OK : 0 texte sous le seuil WCAG 1.4.3 (${nbTextes} pages, 375 px ; ${EXCLUSIONS.length} exclusion(s) motivee(s)).`);

// indexnow-ping — notifie IndexNow (Bing, Yandex, etc.) des URLs modifiées à
// chaque déploiement de production. À lancer APRÈS `astro build` (lit dist/).
//
// Fonctionnement :
//  1. La clé IndexNow est le FICHIER public/indexnow-<clé>.txt (source de vérité
//     unique) : son nom porte la clé, son contenu EST la clé (vérif Bing).
//  2. On calcule les URL réellement modifiées par le dernier commit (git diff),
//     en mappant fichiers de pages/contenu → URL. Un changement « global »
//     (layout, composant, config, styles) resoumet tout le set indexable.
//  3. On POST la liste à api.indexnow.org. Le POST réel n'a lieu qu'en
//     production (VERCEL_ENV=production) ou avec INDEXNOW_FORCE=1 ; sinon dry-run.
//
// Aucune dépendance, aucun secret : IndexNow s'authentifie par le fichier de clé.
import { readFileSync, globSync } from "node:fs";
import { basename } from "node:path";
import { execSync } from "node:child_process";

const SITE = "https://www.mystela.fr";
const ENDPOINT = "https://api.indexnow.org/indexnow";

// 1) Clé + emplacement, dérivés du fichier public/indexnow-*.txt.
const keyFile = globSync("public/indexnow-*.txt")[0];
if (!keyFile) {
  console.error("indexnow ECHEC : aucun fichier public/indexnow-*.txt (clé absente).");
  process.exit(1);
}
const key = readFileSync(keyFile, "utf8").trim();
const keyLocation = `${SITE}/${basename(keyFile)}`;

// 2) Set indexable canonique = URL du sitemap (exclut noindex par construction).
//    On lit les sitemaps de pages, pas l'index (sitemap-index.xml, dont les <loc>
//    pointent vers les fichiers sitemap eux-mêmes) ; on écarte toute loc *.xml.
const sitemaps = globSync("dist/sitemap-*.xml").filter((f) => !/sitemap-index\.xml$/.test(f));
const indexable = new Set();
for (const sm of sitemaps) {
  for (const m of readFileSync(sm, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (!m[1].endsWith(".xml")) indexable.add(m[1]);
  }
}
if (!indexable.size) {
  console.error("indexnow ECHEC : sitemap vide ou introuvable (lancer après le build).");
  process.exit(1);
}

// Fichiers dont un changement impacte potentiellement TOUTES les pages.
const GLOBAL_RE = /^(src\/layouts\/|src\/components\/|src\/config\/|src\/styles\/|astro\.config|package\.json|vercel\.json|src\/content\.config)/;

// Mappe un fichier source modifié → une ou plusieurs URL canoniques.
function filesToUrls(files) {
  const urls = new Set();
  const addAll = () => indexable.forEach((u) => urls.add(u));
  for (const f of files) {
    if (GLOBAL_RE.test(f)) { addAll(); break; }
    // Page statique : src/pages/x.astro → /x (index → /).
    let m = f.match(/^src\/pages\/([^[][^/]*)\.astro$/);
    if (m) { urls.add(m[1] === "index" ? `${SITE}/` : `${SITE}/${m[1]}`); continue; }
    // Article : src/content/blog/<slug>.md → /blog/<slug>.
    m = f.match(/^src\/content\/blog\/(.+)\.mdx?$/);
    if (m) { urls.add(`${SITE}/blog/${m[1]}`); continue; }
    // Data de collections dynamiques → resoumettre le type concerné.
    if (/^src\/content\/cities\.ts$/.test(f) || /^src\/pages\/restaurants-\[/.test(f)) {
      indexable.forEach((u) => /\/restaurants-/.test(u) && urls.add(u)); continue;
    }
    if (/^src\/content\/segments\.ts$/.test(f) || /^src\/pages\/pour\//.test(f)) {
      indexable.forEach((u) => /\/pour\//.test(u) && urls.add(u)); continue;
    }
    if (/^src\/pages\/\[feature\]/.test(f) || /^src\/content\/features/.test(f)) { addAll(); continue; }
    if (/^src\/pages\/blog\//.test(f)) { indexable.forEach((u) => /\/blog\//.test(u) && urls.add(u)); continue; }
  }
  // On ne soumet que des URL réellement indexables (canonique, non-noindex).
  return [...urls].filter((u) => indexable.has(u));
}

// 3) Fichiers modifiés par le dernier commit ; fallback = tout le set.
let changed = [];
try {
  changed = execSync("git diff --name-only HEAD~1 HEAD", { encoding: "utf8" }).split("\n").map((s) => s.trim()).filter(Boolean);
} catch { /* pas d'historique (shallow clone) : on resoumettra tout */ }

let urlList = changed.length ? filesToUrls(changed) : [...indexable];
if (!urlList.length) urlList = [...indexable]; // rien de mappé → set complet (sûr)

const isProd = process.env.VERCEL_ENV === "production" || process.env.INDEXNOW_FORCE === "1";
console.log(`indexnow : ${urlList.length} URL à soumettre (clé ${basename(keyFile)}).`);
urlList.forEach((u) => console.log("  " + u));

if (!isProd) {
  console.log("indexnow : dry-run (VERCEL_ENV != production). Aucun envoi.");
  process.exit(0);
}

const body = { host: new URL(SITE).host, key, keyLocation, urlList };
try {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  // IndexNow renvoie 200 (accepté) ou 202 (accepté, en cours). Autres = à signaler
  // sans casser le déploiement (le référencement n'est pas un bloquant de build).
  if (res.status === 200 || res.status === 202) {
    console.log(`indexnow OK : ${urlList.length} URL soumises (HTTP ${res.status}).`);
  } else {
    console.warn(`indexnow : réponse inattendue HTTP ${res.status} (non bloquant).`);
  }
} catch (e) {
  console.warn(`indexnow : envoi impossible (${e.message}) (non bloquant).`);
}

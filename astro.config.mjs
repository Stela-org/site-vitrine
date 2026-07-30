// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readFileSync, globSync } from "node:fs";
import { basename } from "node:path";

// VIT-16 ③ : dates de dernière modification du sitemap.
// Avant, TOUTES les URL portaient un lastmod = date du build, ce qui annonce à
// Google que 50 pages changent à chaque déploiement. Signal faux, donc ignoré.
// Désormais : seuls les billets de blog portent un lastmod, issu de leur
// frontmatter (updatedDate, à défaut pubDate). Les pages statiques n'en portent
// aucun, ce qui est préférable à une date inventée. Les dates de frontmatter
// existantes ne sont PAS touchées (décision actée) : seules les futures mises à
// jour porteront leur vraie date.
// Lecture directe des fichiers Markdown : la config Astro ne peut pas importer
// `astro:content`, et un parseur de frontmatter complet serait ici superflu.
const blogDates = new Map(
  globSync("src/content/blog/*.md").map((file) => {
    const raw = readFileSync(file, "utf8");
    const fm = raw.split(/^---\s*$/m)[1] ?? "";
    const pick = (key) => fm.match(new RegExp(`^${key}:\\s*"?([0-9]{4}-[0-9]{2}-[0-9]{2})"?`, "m"))?.[1];
    const date = pick("updatedDate") ?? pick("pubDate");
    return [basename(file, ".md"), date];
  }).filter(([, date]) => Boolean(date)),
);

// Domaine canonique UNIQUE (VIT-0/PRD). Le site est 100 % statique et déployé
// sur Vercel (projet site-vitrine). `site` alimente les URL absolues du sitemap
// et des balises canonical.
export default defineConfig({
  site: "https://www.mystela.fr",
  trailingSlash: "never",
  build: {
    format: "file",
    // Ne JAMAIS inliner les scripts : la CSP est stricte (script-src 'self' sans
    // 'unsafe-inline'). Un <script> inline serait bloqué en prod. On force donc
    // des fichiers externes servis en 'self'.
    inlineStylesheets: "auto",
  },
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [
    sitemap({
      // Pages légales et pages de service (merci) en noindex : hors sitemap.
      // /presence-plateformes est une page publique indexable (VIT-14 A4) :
      // elle reste DANS le sitemap.
      filter: (page) => !/\/(mentions-legales|cgv|politique-confidentialite|merci-essai|guide-google-commercant-local\/(merci|desinscrit))\/?$/.test(page),
      // Priorités par intention : home > tarifs > fonctionnalités > segments.
      serialize(item) {
        const u = item.url;
        // lastmod : uniquement pour les billets de blog, à leur vraie date de
        // mise à jour. Aucun lastmod sur les pages statiques (voir en-tête).
        const slug = u.match(/\/blog\/([^/]+?)\/?$/)?.[1];
        const date = slug ? blogDates.get(slug) : undefined;
        if (date) item.lastmod = new Date(`${date}T00:00:00Z`).toISOString();
        else delete item.lastmod;
        if (u === "https://www.mystela.fr/" || u === "https://www.mystela.fr") { item.priority = 1.0; item.changefreq = "weekly"; }
        else if (/\/tarifs$/.test(u)) { item.priority = 0.9; item.changefreq = "monthly"; }
        else if (/\/pour\//.test(u)) { item.priority = 0.7; item.changefreq = "monthly"; }
        else { item.priority = 0.8; item.changefreq = "monthly"; }
        return item;
      },
    }),
  ],
});

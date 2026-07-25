// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
      // Pages légales en noindex : hors sitemap.
      filter: (page) => !/\/(mentions-legales|cgv|politique-confidentialite|presence-plateformes|guide-google-commercant-local\/(merci|desinscrit))\/?$/.test(page),
      // Priorités par intention : home > tarifs > fonctionnalités > segments.
      serialize(item) {
        const u = item.url;
        item.lastmod = new Date().toISOString();
        if (u === "https://www.mystela.fr/" || u === "https://www.mystela.fr") { item.priority = 1.0; item.changefreq = "weekly"; }
        else if (/\/tarifs$/.test(u)) { item.priority = 0.9; item.changefreq = "monthly"; }
        else if (/\/pour\//.test(u)) { item.priority = 0.7; item.changefreq = "monthly"; }
        else { item.priority = 0.8; item.changefreq = "monthly"; }
        return item;
      },
    }),
  ],
});

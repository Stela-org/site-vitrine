import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog Stela : articles en Markdown (src/content/blog/*.md). Le slug = nom de
// fichier (URL propre sans .html). `cluster` sert au maillage thématique
// (pilier GEO, actu Google Business Profile, guide, ville).
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    // VIT-14 A2 : titre <title> court (<=60 car., mot-clé en tête) quand le
    // titre editorial (h1) dépasse. Optionnel : à défaut, `title` sert de <title>.
    metaTitle: z.string().optional(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    keyword: z.string(),
    cluster: z.enum(["geo", "google-business-profile", "guide", "ville"]).default("guide"),
    // Ancienne URL .html (ancien site) pour la redirection 301 au VIT-4.
    legacyHtml: z.string().optional(),
  }),
});

export const collections = { blog };

// LOT TABLE-1 — plugin hast (Sätteri) : reporte l'intitulé de colonne sur
// chaque cellule des tableaux Markdown, sous forme d'attribut data-label.
//
// Pourquoi : sur téléphone, un tableau de 4 à 7 colonnes est illisible, et le
// faire défiler horizontalement est pire (le gate check:overflow l'interdit).
// La solution retenue est l'empilement en cartes : chaque ligne devient une
// carte, chaque cellule affichant son intitulé de colonne au-dessus de sa
// valeur. Cet intitulé doit venir du HTML, car le CSS seul ne peut pas lire le
// contenu d'une autre cellule. Markdown ne produit pas cet attribut : on
// l'ajoute ici, au build, pour TOUS les articles, sans toucher au contenu.
//
// Astro 7 utilise le processeur Sätteri : on branche donc un plugin hast
// (`markdown.processor: satteri({ hastPlugins: [...] })`), et non un plugin
// rehype, qui exigerait de réinstaller l'ancien pipeline unified.

/** Enfants élément portant le tagName demandé. */
function childrenByTag(node, tagName) {
  if (!node || !Array.isArray(node.children)) return [];
  return node.children.filter((c) => c.type === "element" && c.tagName === tagName);
}

/** Plugin hast Sätteri : à passer à `satteri({ hastPlugins: [...] })`. */
export default function satteriTableLabels() {
  return {
    name: "stela-table-labels",
    element: {
      filter: ["table"],
      visit(table, ctx) {
        // Intitulés : première ligne de l'en-tête (un tableau Markdown n'en a
        // qu'une). Sans en-tête exploitable, on laisse le tableau tel quel.
        const head = childrenByTag(table, "thead")[0];
        const headRow = head ? childrenByTag(head, "tr")[0] : null;
        const labels = headRow
          ? childrenByTag(headRow, "th").map((th) => ctx.textContent(th).trim())
          : [];
        if (labels.length === 0) return;

        for (const body of childrenByTag(table, "tbody")) {
          for (const row of childrenByTag(body, "tr")) {
            childrenByTag(row, "td").forEach((cell, i) => {
              const label = labels[i];
              if (label) ctx.setProperty(cell, "data-label", label);
            });
          }
        }
      },
    },
  };
}

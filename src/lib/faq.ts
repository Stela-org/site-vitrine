// Extraction du bloc « En bref » d'un article de blog, pour en faire un schema
// FAQPage. La maison écrit ce bloc toujours de la même façon depuis le VIT-4 :
//
//   ## En bref
//
//   **Une question ?** Une réponse de deux ou trois phrases.
//
//   **Une autre question ?** Une autre réponse.
//
// On lit donc le Markdown source plutôt que de demander à l'auteur de recopier
// ces questions dans le frontmatter : une duplication finit toujours par
// diverger de l'article, et c'est la version affichée qui fait foi. Google exige
// d'ailleurs que le contenu d'un FAQPage soit visible sur la page, ce qui est le
// cas ici par construction.

export type FaqEntry = { question: string; answer: string };

// Le Markdown de la réponse est rendu en HTML dans la page, mais le schema
// attend du texte lisible. On retire donc le balisage sans toucher au texte :
// liens (on garde le libellé), gras, italique, code.
function stripMarkdown(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<![*\w])\*([^*]+)\*(?!\w)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Renvoie les questions-réponses du bloc « En bref », dans l'ordre de l'article.
// Tableau vide si l'article n'a pas ce bloc ou s'il ne suit pas la forme
// attendue : mieux vaut aucun schema qu'un schema faux.
export function extractFaq(markdown: string): FaqEntry[] {
  const start = markdown.search(/^##\s+En bref\s*$/m);
  if (start === -1) return [];

  // Le bloc court jusqu'au prochain titre de même niveau, ou jusqu'à la fin.
  const after = markdown.slice(start).replace(/^##\s+En bref\s*$/m, "");
  const end = after.search(/^##\s+/m);
  const section = end === -1 ? after : after.slice(0, end);

  const entries: FaqEntry[] = [];
  for (const block of section.split(/\n\s*\n/)) {
    const text = block.trim();
    if (!text) continue;
    // Une entrée = un paragraphe qui commence par une question en gras.
    const m = text.match(/^\*\*(.+?)\*\*\s*([\s\S]+)$/);
    if (!m) continue;
    const question = stripMarkdown(m[1]);
    const answer = stripMarkdown(m[2]);
    if (question && answer) entries.push({ question, answer });
  }
  return entries;
}

// Le schema FAQPage correspondant, ou null s'il n'y a pas de quoi en faire un.
// Deux entrées est le minimum en dessous duquel le bloc n'a pas d'intérêt.
export function faqPageLd(entries: FaqEntry[], url: string) {
  if (entries.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "fr-FR",
    mainEntityOfPage: url,
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}

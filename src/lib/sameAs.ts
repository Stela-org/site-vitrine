// LOT GEO-3o-SOCIAL : LE GRAPHE D'ENTITÉ DE LA MARQUE, côté vitrine.
//
// LOT GEO-3o a posé le graphe d'entité des CLIENTS (stella-app, lib/geo/sameAs)
// : `sameAs` de schema.org déclare que plusieurs URL désignent la même entité,
// pour qu'une note vue sur Tripadvisor renforce la page Stela au lieu de la
// concurrencer. La vitrine a le même besoin pour SA propre marque : sa Page
// Facebook et son compte Instagram sont des adresses supplémentaires de Stela,
// et tant que rien ne les relie au domaine, moteurs et IA en font trois entités
// distinctes qui se partagent les signaux au lieu de les cumuler.
//
// Ce module est PUR et VOLONTAIREMENT PLUS PETIT que celui de l'app : la
// vitrine n'a ni Place ID à dériver, ni ordre de plateformes mesuré, ni saisie
// de gérant à valider. Elle a une liste de constantes, dont certaines peuvent
// être vides. La règle qui compte est donc la même que pour `metaPixelId` :
// CE QUI N'EST PAS RENSEIGNÉ N'EXISTE PAS. Pas de chaîne vide dans le JSON-LD,
// pas de tableau vide, pas de clé `sameAs` sans contenu.

/**
 * Valide une URL destinée à `sameAs`, et la rend normalisée, ou `null`.
 *
 * Mêmes trois refus que `lib/geo/sameAs.ts` de l'app, pour les mêmes raisons.
 * Le protocole doit être `https` : une URL déclarée `sameAs` est une identité
 * publique, pas un lien interne, et `javascript:` comme `data:` doivent être
 * hors d'atteinte. L'hôte doit être parsable et contenir un point :
 * « https://intranet » n'identifie personne hors du réseau local. Et une chaîne
 * relative n'est pas une adresse : sans hôte, elle ne désigne rien pour un
 * moteur qui lit la page ailleurs.
 *
 * Le refus est SILENCIEUX : une constante non renseignée est le cas NORMAL ici
 * (le compte n'existe pas encore), pas une erreur à faire remonter au build.
 */
export function normalizeSameAsUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null; // relatif, ou illisible
  }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname;
  if (!host || !host.includes(".") || host.endsWith(".")) return null;
  return parsed.toString();
}

/** Clé de dédoublonnage : casse et `/` final ignorés (cf. app, `dedupeKey`). */
function dedupeKey(url: string): string {
  return url.toLowerCase().replace(/\/+$/, "");
}

/**
 * La liste publiable : validée, dédoublonnée, dans l'ordre de déclaration.
 * Vide si rien n'est renseigné, et c'est `sameAsField` qui décide alors de ne
 * PAS écrire la clé.
 */
export function buildSameAs(urls: readonly unknown[]): string[] {
  const out: string[] = [];
  const vues = new Set<string>();
  for (const raw of urls) {
    const url = normalizeSameAsUrl(raw);
    if (!url) continue;
    const key = dedupeKey(url);
    if (vues.has(key)) continue;
    vues.add(key);
    out.push(url);
  }
  return out;
}

/**
 * Le fragment à répandre dans un nœud JSON-LD : `{ sameAs: [...] }`, ou `{}`.
 *
 * POURQUOI UN FRAGMENT ET NON UN TABLEAU. `sameAs: []` n'est pas neutre : il
 * déclare positivement que l'entité n'a AUCUNE autre adresse connue, ce qui est
 * faux et affaiblit le graphe qu'on essaie justement de construire. L'absence
 * de clé, elle, ne déclare rien. Le spread est la seule forme qui permette à la
 * clé de DISPARAÎTRE sans que le nœud ait à être réécrit.
 *
 *   sameAs: SITE.sameAs        // ← devient `"sameAs": []` quand tout est vide
 *   ...sameAsField(SITE.sameAs) // ← la clé n'est tout simplement pas là
 */
export function sameAsField(urls: readonly unknown[]): { sameAs?: string[] } {
  const liste = buildSameAs(urls);
  return liste.length ? { sameAs: liste } : {};
}

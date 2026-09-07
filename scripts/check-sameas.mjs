// check:sameas — LOT GEO-3o-SOCIAL. Le graphe d'entité de la marque.
//
// DEUX VOLETS, parce qu'une seule des deux questions se vérifie sur le build.
//
//   Volet 1, UNITAIRE. La composition du `sameAs` a une règle qui ne se voit
//     PAS dans le HTML servi tant que les constantes Meta sont renseignées :
//     « un compte non renseigné est omis, jamais rendu vide, et si tout est
//     vide la clé disparaît au lieu de devenir [] ». Le jour où quelqu'un
//     remplace `...sameAsField(x)` par `sameAs: x` pour « simplifier », le
//     build reste vert et la régression part en production. Ce volet fixe donc
//     les quatre cas : deux comptes, un seul, aucun (clé absente), URL invalide
//     écartée.
//
//   Volet 2, SERVI. Le bloc Organization réellement présent dans dist/ doit
//     porter le `sameAs` calculé depuis la config — ni un tableau vide, ni une
//     chaîne vide, ni une valeur écrite en dur ailleurs.
//
// À lancer APRÈS le build (comme check:schema).
import { readFileSync } from "node:fs";
import { buildSameAs, sameAsField, normalizeSameAsUrl } from "../src/lib/sameAs.ts";

// La config est LUE, pas importée : `src/config/site.ts` importe ses voisins
// sans extension (convention Vite/Astro), que la résolution ESM de Node refuse.
// C'est déjà ainsi que check:channels lit CHANNELS, et l'effet secondaire est
// bon : ce gardien vérifie ce qui est ÉCRIT dans le fichier de configuration,
// donc il voit aussi une URL rendue en dur qui contournerait les constantes.
const configSrc = readFileSync("src/config/site.ts", "utf8");
const constante = (nom) => {
  const m = configSrc.match(new RegExp(`export const ${nom}\\s*=\\s*"([^"]*)"`));
  if (!m) {
    console.error(`check:sameas ECHEC : constante ${nom} introuvable dans src/config/site.ts.`);
    process.exit(1);
  }
  return m[1];
};
const FACEBOOK_URL = constante("FACEBOOK_URL");
const INSTAGRAM_URL = constante("INSTAGRAM_URL");

const blocRegistres = configSrc.match(/const REGISTRES\s*=\s*\[([\s\S]*?)\]\s*as const;/);
if (!blocRegistres) {
  console.error("check:sameas ECHEC : bloc REGISTRES introuvable dans src/config/site.ts.");
  process.exit(1);
}
const REGISTRES = [...blocRegistres[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const echecs = [];
const verifie = (nom, condition, detail = "") => {
  if (!condition) echecs.push(`${nom}${detail ? " — " + detail : ""}`);
};

// ── Volet 1 : la composition ────────────────────────────────────────────────
const FB = "https://www.facebook.com/exemple.stela";
const IG = "https://www.instagram.com/exemple.stela/";

// 1. Les deux comptes renseignés : les deux sont dans le graphe, après les
//    registres, dans l'ordre de déclaration.
{
  const liste = buildSameAs([...REGISTRES, FB, IG]);
  verifie("sameAs avec les deux comptes", liste.length === REGISTRES.length + 2, `obtenu ${liste.length} entrées`);
  verifie("sameAs avec les deux comptes : Facebook présent", liste.includes(FB));
  verifie("sameAs avec les deux comptes : Instagram présent", liste.includes(IG));
  verifie("sameAs : les registres restent en tête", liste[0] === REGISTRES[0]);
}

// 2. Un seul compte renseigné : l'autre est OMIS, pas rendu en chaîne vide.
{
  const liste = buildSameAs([...REGISTRES, FB, ""]);
  verifie("sameAs avec un seul compte", liste.length === REGISTRES.length + 1, `obtenu ${liste.length} entrées`);
  verifie("sameAs avec un seul compte : aucune chaîne vide", !liste.includes(""));
  verifie("sameAs avec un seul compte : Facebook présent", liste.includes(FB));
}

// 3. Aucun compte renseigné, et aucun registre : la CLÉ DISPARAÎT.
//    C'est le cœur du lot. `sameAs: []` déclarerait « cette entité n'a aucune
//    autre adresse connue », ce qui est une affirmation, pas une absence.
{
  const champ = sameAsField(["", "", "   "]);
  verifie("sameAs vide : la clé est absente", !("sameAs" in champ), `obtenu ${JSON.stringify(champ)}`);
  verifie("sameAs vide : pas de tableau vide", JSON.stringify(champ) === "{}");
  const rempli = sameAsField([FB]);
  verifie("sameAs non vide : la clé est présente", Array.isArray(rempli.sameAs) && rempli.sameAs.length === 1);
}

// 4. URL invalide écartée, silencieusement, sans casser les autres.
{
  const sales = [
    "javascript:alert(1)",           // protocole non https
    "http://www.facebook.com/stela", // http simple : pas une identité publique
    "data:text/html,x",              // idem
    "/facebook",                     // relative : ne désigne rien hors du site
    "https://intranet",              // hôte sans point
    "pas une url",
    null,
    42,
  ];
  for (const sale of sales) {
    verifie("URL invalide écartée", normalizeSameAsUrl(sale) === null, `acceptée : ${String(sale)}`);
  }
  const liste = buildSameAs([...sales, FB, FB.toUpperCase().replace("HTTPS://WWW.FACEBOOK.COM", "https://www.facebook.com")]);
  verifie("URL invalide écartée : seule l'URL valide subsiste", liste.length === 1, `obtenu ${JSON.stringify(liste)}`);
}

// 5. L'ADRESSE NUMÉRIQUE FACEBOOK survit intacte.
//    `profile.php?id=<numéro>` est la forme servie tant que la Page n'a pas de
//    nom d'utilisateur personnalisé. Une normalisation qui jetterait la
//    query string (tentation légitime : `?ref=`, `?fbclid=` sont du bruit)
//    transformerait l'URL en `https://www.facebook.com/profile.php`, qui ne
//    désigne PLUS la Page de Stela mais un formulaire vide. Ce cas fige donc
//    la règle : ici le `?id=` EST l'identité.
{
  const numerique = "https://www.facebook.com/profile.php?id=61594423881667";
  verifie(
    "adresse numerique Facebook : query string preservee",
    normalizeSameAsUrl(numerique) === numerique,
    `obtenu ${normalizeSameAsUrl(numerique)}`,
  );
  const liste = buildSameAs([numerique, "https://www.instagram.com/mystela.fr/"]);
  verifie("adresse numerique Facebook : presente dans le graphe", liste.includes(numerique));
  verifie("adresse numerique Facebook : deux comptes Meta distincts", liste.length === 2, `obtenu ${liste.length}`);
}

// ── Volet 2 : ce qui est RÉELLEMENT servi ───────────────────────────────────
const attendu = buildSameAs([...REGISTRES, FACEBOOK_URL, INSTAGRAM_URL]);
verifie("config : au moins un registre public déclaré", REGISTRES.length > 0);

const html = readFileSync("dist/index.html", "utf8");
const blocs = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const org = blocs.find((b) => b["@type"] === "Organization");
verifie("dist : bloc Organization présent sur la page d'accueil", Boolean(org));

if (org) {
  if (attendu.length === 0) {
    verifie("dist : aucune adresse connue ⇒ pas de clé sameAs", !("sameAs" in org), `obtenu ${JSON.stringify(org.sameAs)}`);
  } else {
    verifie("dist : sameAs servi == config", JSON.stringify(org.sameAs) === JSON.stringify(attendu), `servi ${JSON.stringify(org.sameAs)}`);
    verifie("dist : aucune entrée vide dans sameAs", org.sameAs.every((u) => typeof u === "string" && u.trim() !== ""));
  }
  // Un compte Meta renseigné DOIT arriver jusqu'au HTML : la constante ne sert
  // à rien si un composant le réécrit ou l'oublie en chemin.
  for (const [nom, url] of [["Facebook", FACEBOOK_URL], ["Instagram", INSTAGRAM_URL]]) {
    if (!url) continue;
    verifie(`dist : ${nom} présent dans le sameAs servi`, (org.sameAs ?? []).some((u) => u === normalizeSameAsUrl(url)));
  }
}

if (echecs.length) {
  console.error(`check:sameas ECHEC : ${echecs.length} probleme(s) :`);
  [...new Set(echecs)].forEach((e) => console.error("  " + e));
  process.exit(1);
}
const meta = [FACEBOOK_URL && "Facebook", INSTAGRAM_URL && "Instagram"].filter(Boolean);
console.log(
  `check:sameas OK : ${attendu.length} adresse(s) dans le graphe d'entite` +
    (meta.length ? ` (dont ${meta.join(" + ")})` : " (aucun compte Meta renseigne : omis, pas vide)") + ".",
);

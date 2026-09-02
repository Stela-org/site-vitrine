// check:indexnow (LOT SEO-FIX-2) — empêche IndexNow de mourir en silence.
//
// LE DÉFAUT QU'IL FERME. Le ping IndexNow tourne au déploiement, derrière un
// `|| true` dans le buildCommand. Ce filet est JUSTE : un service tiers qui tombe
// ne doit pas empêcher le site de se déployer. Mais il rendait l'échec invisible.
// Le 02/09/2026, on a découvert dans les logs Vercel que chaque déploiement
// recevait un HTTP 403 « UserForbiddedToAccessSite » depuis une date inconnue :
// 48 URL annoncées, zéro soumise, et personne prévenu. Règle verte et morte,
// exactement ce que check:brand refuse par ailleurs dans vercel.json.
//
// POURQUOI EN CI ET NON AU DÉPLOIEMENT. Faire échouer le déploiement rendrait le
// site otage de Bing. Faire échouer la CI ne coûte qu'une pull request rouge,
// devant un humain qui la lit. La production ne tombe jamais, l'oubli devient
// impossible.
//
// DEUX CLASSES D'ÉCHEC, TRAITÉES DIFFÉREMMENT.
//   4xx  = notre configuration. Une clé non vérifiée ou un domaine non reconnu ne
//          se répare jamais tout seul : la CI tombe.
//   5xx, réseau, délai dépassé = leur service. On avertit, on ne fait pas tomber.
//
// ÉCHAPPATOIRE. INDEXNOW_SKIP=1 saute la soumission, pour débloquer une PR pendant
// que la vérification Bing est en cours. Elle laisse une ligne dans le journal :
// on ne saute pas en silence.
import { readFileSync, globSync } from "node:fs";
import { basename } from "node:path";

const SITE = "https://www.mystela.fr";
const erreurs = [];

// 1) Cohérence locale : le nom du fichier PORTE la clé, son contenu EST la clé.
const fichiers = globSync("public/indexnow-*.txt");
if (fichiers.length !== 1) {
  console.error(`check:indexnow ECHEC : ${fichiers.length} fichier(s) public/indexnow-*.txt, il en faut exactement un.`);
  process.exit(1);
}
const nom = basename(fichiers[0]);
const cleDuNom = nom.replace(/^indexnow-/, "").replace(/\.txt$/, "");
const contenu = readFileSync(fichiers[0], "utf8");
if (contenu.trim() !== cleDuNom) erreurs.push(`le contenu de ${nom} (${JSON.stringify(contenu.slice(0, 40))}) ne vaut pas la cle de son nom (${cleDuNom}).`);
if (contenu !== contenu.trim()) erreurs.push(`${nom} contient une espace ou un retour a la ligne parasite : la verification Bing compare octet pour octet.`);
if (!/^[a-f0-9]{8,128}$/i.test(cleDuNom)) erreurs.push(`la cle ${cleDuNom} n'est pas au format attendu (8 a 128 caracteres hexadecimaux).`);

// 2) Le fichier de clé est-il servi par la PRODUCTION ? C'est ce que Bing va lire.
const urlCle = `${SITE}/${nom}`;
try {
  const r = await fetch(urlCle, { signal: AbortSignal.timeout(15000) });
  const corps = await r.text();
  if (!r.ok) erreurs.push(`${urlCle} repond ${r.status} : Bing ne peut pas lire la cle.`);
  else if (corps.trim() !== cleDuNom) erreurs.push(`${urlCle} sert ${JSON.stringify(corps.slice(0, 40))} au lieu de la cle.`);
} catch (e) {
  console.warn(`check:indexnow AVERTISSEMENT : ${urlCle} injoignable (${e.name}). Volet reseau non conclu, non bloquant.`);
}

// 3) IndexNow accepte-t-il une soumission ? Une seule URL, la page d'accueil.
if (process.env.INDEXNOW_SKIP === "1") {
  const msg = "check:indexnow : soumission sautee (INDEXNOW_SKIP=1). A retirer des que la verification Bing est faite.";
  // Sur GitHub, une annotation ::warning:: s'affiche en tete de la pull request.
  // Un saut doit se voir sur l'ecran de qui relit, pas seulement dans un journal.
  if (process.env.GITHUB_ACTIONS) console.log(`::warning title=IndexNow non verifie::${msg}`);
  console.warn("check:indexnow AVERTISSEMENT : " + msg);
} else {
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(SITE).host, key: cleDuNom, keyLocation: urlCle, urlList: [`${SITE}/`] }),
      signal: AbortSignal.timeout(20000),
    });
    if (r.status >= 400 && r.status < 500) {
      let d = ""; try { d = (await r.text()).slice(0, 240); } catch { /* corps illisible, le code suffit */ }
      erreurs.push(`api.indexnow.org refuse la soumission : HTTP ${r.status} ${d}\n    Cette classe d'erreur ne se repare pas toute seule : verifier la propriete ${new URL(SITE).host} et la cle ${cleDuNom} dans Bing Webmaster Tools.\n    Pour debloquer une PR en attendant : INDEXNOW_SKIP=1.`);
    } else if (!r.ok) {
      console.warn(`check:indexnow AVERTISSEMENT : api.indexnow.org repond ${r.status}. Panne de leur cote, non bloquant.`);
    }
  } catch (e) {
    console.warn(`check:indexnow AVERTISSEMENT : api.indexnow.org injoignable (${e.name}). Non bloquant.`);
  }
}

if (erreurs.length) {
  console.error(`check:indexnow ECHEC : ${erreurs.length} probleme(s) :`);
  for (const e of erreurs) console.error("  " + e);
  process.exit(1);
}
console.log(`check:indexnow OK : cle ${nom} coherente, servie par la production, soumission acceptee par api.indexnow.org.`);

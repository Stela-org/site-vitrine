// check:devis, gardien du formulaire de devis multi-établissements (LOT DEVIS-1).
//
// POURQUOI CE GARDIEN. C'est la conversion la plus chère du site, et elle a
// passé des semaines à échouer en silence : `?erreur=1` redirigeait vers un
// formulaire qui n'affichait rien, et un envoi réussi ne disait pas non plus
// qu'il était parti. Deux pannes invisibles au build, invisibles au grep, et
// que seule une visite réelle révélait.
//
// Ce que ce script éprouve, dans un vrai navigateur, sur le HTML construit :
//   §1 l'état d'envoi apparaît au submit ;
//   §2 revenir sur la page après un envoi ramène au créneau sans re-remplir ;
//   §3 chacune des quatre validations serveur affiche SON message ;
//   §4 une adresse grand public déclenche un conseil, et n'empêche rien.
//
// Nécessite Playwright + chromium, comme check:cookies et check:overflow.
import { createServer } from "node:http";
import { CALENDAR_URL } from "../lib/booking.js";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname } from "node:path";
import { chromium } from "playwright";

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const DIST = "dist";
const PAGE = "/pour/multi-etablissements";
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/json", ".woff2": "font/woff2" };

function resolve(p) {
  let path = decodeURIComponent(p.split("?")[0]);
  if (path === "/" || path === "") return `${DIST}/index.html`;
  path = path.replace(/\/$/, "");
  return [`${DIST}${path}.html`, `${DIST}${path}/index.html`, `${DIST}${path}`].find(isFile);
}

// La vraie CSP de production, comme dans check:cookies : un gardien qui teste
// sans elle valide un site que la prod bloque.
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const CSP = vercel.headers?.flatMap((h) => h.headers ?? []).find((h) => h.key.toLowerCase() === "content-security-policy")?.value;
if (!CSP) {
  console.error("check:devis ECHEC : aucune Content-Security-Policy trouvee dans vercel.json.");
  process.exit(1);
}

// `/api/devis` est une fonction serverless, absente du build statique. On la
// simule pour eprouver le VRAI parcours de soumission, redirection comprise,
// sans jamais sortir sur le calendrier Google.
const server = createServer((req, res) => {
  if (req.url.startsWith("/api/devis")) {
    // Reponse VOLONTAIREMENT lente. En local la redirection est instantanee et
    // l'etat d'envoi, bien que present, n'est jamais observable : le gardien
    // conclurait a tort qu'il manque. Or le cas qui justifie tout le §1 est
    // exactement celui-la, un serveur ou un calendrier qui tarde. On teste donc
    // dans la condition ou l'etat sert a quelque chose.
    return setTimeout(() => {
      res.statusCode = 303;
      // LOT DEVIS-2, CORRECTION DU GARDIEN. Ce stub redirigeait vers
      // `${PAGE}?envoye=1`, une cible SAME-ORIGIN. La production, elle, redirige
      // vers le calendrier Google, donc CROSS-ORIGIN. Or `form-action 'self'`
      // autorise la premiere et refuse la seconde : le gardien servait la vraie
      // CSP mais rejouait la MAUVAISE CIBLE, et ne pouvait donc pas voir que la
      // prod bloquait la redirection en silence. Deux jours de formulaire mort.
      // On rejoue desormais la cible REELLE, lue dans lib/booking.js.
      res.setHeader("Location", CALENDAR_URL);
      res.end();
    }, 1200);
  }
  const f = resolve(req.url);
  if (!f) { res.statusCode = 404; return res.end("404"); }
  res.setHeader("Content-Type", MIME[extname(f)] || "application/octet-stream");
  if (extname(f) === ".html") res.setHeader("Content-Security-Policy", CSP);
  res.end(readFileSync(f));
});
const base = await new Promise((r) => server.listen(0, () => r(`http://127.0.0.1:${server.address().port}`)));

const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext();

// LOT DEVIS-2. Le calendrier est INTERCEPTE : le gardien ne doit dependre
// d'aucun acces reseau a Google. Ce qui compte est de savoir si le navigateur a
// seulement TENTE d'y aller : une redirection refusee par la form-action de la
// CSP n'emet aucune requete, et c'est precisement la signature du bug.
let calendrierAtteint = false;
await ctx.route("https://calendar.app.google/**", async (route) => {
  calendrierAtteint = true;
  await route.fulfill({ status: 200, contentType: "text/html", body: "<h1>calendrier</h1>" });
});
/** Violations CSP observees pendant tout le scenario. */
const cspViolations = [];

/** La banniere de consentement recouvre le formulaire : on la tranche d'abord. */
async function ouvrir(page, query = "") {
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      (window.__cspViol = window.__cspViol || []).push({ d: e.effectiveDirective || e.violatedDirective, b: e.blockedURI });
    });
  }).catch(() => { /* deja injecte */ });
  await page.goto(`${base}${PAGE}${query}`, { waitUntil: "networkidle" });
  const deny = page.locator("#cookie-deny");
  if (await deny.isVisible().catch(() => false)) await deny.click();
}

const texteVisible = (page, sel) => page.locator(sel).innerText().catch(() => "");
const estVisible = (page, sel) => page.locator(sel).isVisible().catch(() => false);

// ── §3 : chaque validation serveur a SON message ───────────────────────────
const CAS = [
  ["nom", "nom", 'input[name="name"]'],
  ["email", "email", 'input[name="email"]'],
  ["etablissements", "nombre d'établissements", 'input[name="establishments"]'],
  ["secteur", "secteur", 'select[name="sector"]'],
];

for (const [code, attendu, selecteur] of CAS) {
  const page = await ctx.newPage();
  await ouvrir(page, `?erreur=${code}#devis`);
  if (!(await estVisible(page, "#devis-erreur"))) {
    errors.push(`§3 ?erreur=${code} : aucun message d'erreur affiche (c'est exactement le defaut du lot).`);
  } else {
    const txt = (await texteVisible(page, "#devis-erreur-liste")).toLowerCase();
    if (!txt.includes(attendu.toLowerCase())) {
      errors.push(`§3 ?erreur=${code} : le message ne parle pas de « ${attendu} ». Recu : « ${txt} »`);
    }
    if (await page.locator(`${selecteur}[aria-invalid="true"]`).count() === 0) {
      errors.push(`§3 ?erreur=${code} : le champ fautif n'est pas marque aria-invalid.`);
    }
  }
  await page.close();
}

// Deux champs d'un coup, et le code generique historique.
{
  const page = await ctx.newPage();
  await ouvrir(page, "?erreur=nom,secteur#devis");
  const n = await page.locator("#devis-erreur-liste li").count();
  if (n !== 2) errors.push(`§3 ?erreur=nom,secteur : ${n} message(s) affiche(s), 2 attendus.`);
  await page.close();
}
{
  const page = await ctx.newPage();
  await ouvrir(page, "?erreur=1#devis");
  if (!(await estVisible(page, "#devis-erreur"))) {
    errors.push("§3 ?erreur=1 : l'ancien code generique n'affiche rien. D'anciens liens l'utilisent encore.");
  }
  await page.close();
}

// ── §4 : conseil sur l'adresse, sans blocage ────────────────────────────────
{
  const page = await ctx.newPage();
  await ouvrir(page);
  await page.fill('input[name="email"]', "patron@gmail.com");
  await page.locator('input[name="email"]').blur();
  if (!(await estVisible(page, "#devis-email-hint"))) {
    errors.push("§4 gmail.com : le conseil « adresse professionnelle » ne s'affiche pas.");
  }
  await page.fill('input[name="email"]', "patron@groupe-restaurants.fr");
  await page.locator('input[name="email"]').blur();
  if (await estVisible(page, "#devis-email-hint")) {
    errors.push("§4 domaine professionnel : le conseil reste affiche alors qu'il ne devrait plus l'etre.");
  }
  // Le blocage dur est l'erreur a ne PAS commettre : on verifie qu'une adresse
  // grand public passe la validation du navigateur.
  await page.fill('input[name="email"]', "patron@gmail.com");
  const soumettable = await page.evaluate(() => {
    const f = document.querySelector(".devis-form");
    const e = f.querySelector('input[name="email"]');
    return e.checkValidity() && !e.disabled && !f.querySelector("button[type=submit]").disabled;
  });
  if (!soumettable) errors.push("§4 REGRESSION GRAVE : une adresse gmail empeche la soumission. Le lot exige l'inverse.");
  await page.close();
}

// ── §1 et §2 : etat d'envoi, puis retour sur la page ────────────────────────
{
  const page = await ctx.newPage();
  await ouvrir(page);
  await page.fill('input[name="name"]', "Camille Dupont");
  await page.fill('input[name="email"]', "camille@groupe-restaurants.fr");
  await page.fill('input[name="establishments"]', "4");
  await page.selectOption('select[name="sector"]', { label: "Restauration" });

  // Mesure DETERMINISTE, et ca a demande deux essais pour y arriver.
  // `page.click()` ne convient pas ici : la soumission declenche une navigation,
  // Playwright n'arrive plus a terminer ses controles d'actionnabilite et leve un
  // TimeoutError, tandis qu'une lecture differee tombe soit trop tot (le clic
  // n'est pas encore parti), soit trop tard (le contexte d'execution est detruit).
  // On declenche donc la vraie soumission par `requestSubmit()`, qui emet
  // l'evenement `submit` de facon SYNCHRONE, validation du navigateur comprise,
  // et on lit l'etat dans la meme evaluation, avant tout depart de page.
  const etat = await page.evaluate(() => {
    const f = document.querySelector(".devis-form");
    f.requestSubmit();
    const s = document.querySelector("#devis-status");
    const b = document.querySelector("#devis-submit");
    return {
      statut: !!s && !s.hidden,
      desactive: !!b && b.disabled,
      texte: b ? b.textContent.trim() : "",
      memorise: !!localStorage.getItem("stela_devis_envoye"),
    };
  });
  if (!etat.statut) errors.push("§1 : aucun etat visible pendant la soumission, le visiteur envoie dans le vide.");
  if (!etat.desactive) errors.push("§1 : le bouton reste actif au submit, un double envoi est possible.");
  if (!/envoi/i.test(etat.texte)) errors.push(`§1 : le bouton ne dit pas que l'envoi est en cours (« ${etat.texte} »).`);
  if (!etat.memorise) errors.push("§2 : l'envoi n'est pas memorise, le visiteur qui revient devra tout resaisir.");

  await page.waitForLoadState("networkidle").catch(() => {});

  // ── LOT DEVIS-2 : LA REDIRECTION DOIT REELLEMENT ABOUTIR ─────────────────
  // Le defaut de production : le POST partait, l'email de notification arrivait,
  // mais la form-action de la CSP refusait la redirection 303 CROSS-ORIGIN vers
  // le calendrier. Aucune erreur visible, aucun log : le bouton restait fige sur
  // « Envoi en cours… » et le visiteur ne prenait jamais rendez-vous.
  //
  // Le gardien precedent ne pouvait pas le voir : il servait la vraie CSP mais
  // redirigeait vers une cible SAME-ORIGIN, que `form-action 'self'` autorise.
  // Servir la bonne CSP ne suffit pas, il faut rejouer la bonne CIBLE.
  // Le stub repond volontairement avec 1,2 s de delai, puis le navigateur suit
  // la redirection : on ATTEND le resultat au lieu de le lire trop tot, avec une
  // limite de temps pour ne pas suspendre le gardien si rien ne vient.
  const limite = Date.now() + 15000;
  while (Date.now() < limite && !calendrierAtteint) await page.waitForTimeout(200);

  const violations = await page.evaluate(() => window.__cspViol || []).catch(() => []);
  cspViolations.push(...violations);
  const bloqueeParCsp = cspViolations.filter((v) => v.d === "form-action");
  if (bloqueeParCsp.length > 0) {
    errors.push(
      `§5 REDIRECTION BLOQUEE PAR LA CSP : form-action refuse ${bloqueeParCsp[0].b}. ` +
      "Le visiteur reste sur un bouton fige et n'arrive JAMAIS sur le calendrier. " +
      `form-action actuelle : ${(CSP.split(";").map((d) => d.trim()).find((d) => d.startsWith("form-action")) || "absente")}`,
    );
  }
  if (!calendrierAtteint) {
    errors.push(
      "§5 : apres une soumission valide, le navigateur n'a jamais tente d'aller sur le calendrier. " +
      "La demande part, mais le rendez-vous, lui, ne peut pas etre pris.",
    );
  }

  // §2 : le visiteur revient sur la page sans avoir pris de creneau.
  await ouvrir(page);
  if (!(await estVisible(page, "#devis-confirm"))) {
    errors.push("§2 : de retour sur la page, rien ne confirme l'envoi ni ne ramene au creneau.");
  } else {
    const lien = await page.locator("#devis-confirm a").getAttribute("href");
    if (!lien || !lien.includes("calendar.app.google")) {
      errors.push(`§2 : la confirmation ne renvoie pas au calendrier (href = ${lien}).`);
    }
    const txt = (await texteVisible(page, "#devis-confirm")).toLowerCase();
    if (txt.includes("24 h") || txt.includes("24h")) {
      errors.push("§2 : la confirmation promet encore une reponse sous 24 h, ce qui dispense de prendre un creneau.");
    }
    if (!txt.includes("créneau")) {
      errors.push("§2 : la confirmation n'oriente pas explicitement vers le choix d'un creneau.");
    }
  }

  // Le formulaire reste accessible pour une seconde demande.
  // Le clic est garde : sur une page depourvue du bouton, un `page.click` nu
  // fait CRASHER le gardien au bout de 30 s au lieu de rendre un diagnostic.
  if (await estVisible(page, "#devis-redo")) {
    await page.click("#devis-redo");
    if (await estVisible(page, "#devis-confirm")) {
      errors.push("§2 : « Envoyer une autre demande » ne rend pas la main au formulaire.");
    }
  } else if (await estVisible(page, "#devis-confirm")) {
    errors.push("§2 : la confirmation ne propose aucun moyen de revenir au formulaire.");
  }
  await page.close();
}

// ── La note sous le bouton ne promet plus un email ──────────────────────────
{
  const html = readFileSync(`${DIST}${PAGE}.html`, "utf8");
  if (/Réponse sous 24\s?h/i.test(html)) {
    errors.push("§2 : la note sous le bouton promet toujours « Reponse sous 24 h », au lieu d'orienter vers le creneau.");
  }
}

// ── LOT DEVIS-2 §6 : LE GARDE-FOU ANTI-ECRAN MORT ───────────────────────────
// On rejoue la panne EXACTE de production : une CSP dont la form-action ne
// couvre pas le calendrier, donc une redirection refusee en silence. Le
// visiteur ne doit PAS rester devant un bouton fige : au bout de quelques
// secondes, la main lui est rendue, avec un message et un lien manuel.
//
// Ce scenario a sa propre CSP et son propre serveur : il teste ce qui se passe
// QUAND la configuration est fausse, et doit donc rester vert meme apres la
// correction de vercel.json. C'est la ceinture, pas les bretelles.
{
  const CSP_SANS_CALENDRIER = CSP.replace(" https://calendar.app.google", "");
  const srv = createServer((req, res) => {
    if (req.url.startsWith("/api/devis")) {
      res.statusCode = 303;
      res.setHeader("Location", CALENDAR_URL);
      return res.end();
    }
    const f = resolve(req.url);
    if (!f) { res.statusCode = 404; return res.end("404"); }
    res.setHeader("Content-Type", MIME[extname(f)] || "application/octet-stream");
    if (extname(f) === ".html") res.setHeader("Content-Security-Policy", CSP_SANS_CALENDRIER);
    res.end(readFileSync(f));
  });
  const b2 = await new Promise((r) => srv.listen(0, () => r(`http://127.0.0.1:${srv.address().port}`)));
  const nav = await browser.newContext();
  const pg = await nav.newPage();
  await pg.goto(`${b2}${PAGE}`, { waitUntil: "networkidle" });
  await pg.fill('input[name="name"]', "Camille Dupont");
  await pg.fill('input[name="email"]', "camille@groupe-restaurants.fr");
  await pg.fill('input[name="establishments"]', "4");
  await pg.selectOption('select[name="sector"]', { label: "Restauration" });
  await pg.evaluate(() => document.querySelector(".devis-form").requestSubmit());

  // Juste apres : l'etat d'envoi est pose et le bouton desactive.
  const fige = await pg.evaluate(() => {
    const b = document.querySelector("#devis-submit");
    return { desactive: !!b && b.disabled, texte: b ? b.textContent.trim() : "" };
  });
  if (!fige.desactive) errors.push("§6 : le bouton n'est pas desactive au submit.");

  // Au-dela du delai de secours, la main DOIT etre rendue.
  await pg.waitForTimeout(9000);
  const secours = await pg.evaluate(() => {
    const b = document.querySelector("#devis-submit");
    const s = document.querySelector("#devis-status");
    const a = s ? s.querySelector("a") : null;
    return {
      rendu: !!b && !b.disabled,
      texte: b ? b.textContent.trim() : "",
      message: s && !s.hidden ? s.textContent.trim() : "",
      lien: a ? a.getAttribute("href") : null,
    };
  });
  if (!secours.rendu) {
    errors.push(`§6 ECRAN MORT : la redirection est bloquee et le bouton reste fige sur « ${secours.texte} ». Le visiteur n'a aucune issue.`);
  }
  if (/envoi/i.test(secours.texte)) {
    errors.push(`§6 : le bouton dit encore « ${secours.texte} » alors que plus rien n'est en cours.`);
  }
  if (!secours.lien || !secours.lien.includes("calendar.app.google")) {
    errors.push(`§6 : aucun lien manuel vers le calendrier n'est propose (href = ${secours.lien}).`);
  }
  if (!/partie|envoy/i.test(secours.message)) {
    errors.push(`§6 : le message laisse croire a un echec de la demande, alors qu'elle est bien partie. Recu : « ${secours.message} »`);
  }
  await nav.close();
  srv.close();
}

await browser.close();
server.close();

if (errors.length > 0) {
  console.error(`\ncheck:devis ECHEC, ${errors.length} probleme(s) :\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("check:devis OK : etat d'envoi, confirmation orientee creneau, 4 erreurs serveur affichees, conseil email non bloquant.");

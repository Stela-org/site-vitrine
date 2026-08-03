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
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname } from "node:path";
import { chromium } from "playwright";
import { CALENDAR_URL } from "../lib/booking.js";

// LOT DEVIS-5 : GARDE-TEMPS GLOBAL.
//
// Ce script s'est fige TROIS fois plutot que de rapporter : une attente de
// navigation qui n'arrivait jamais, un `server.close()` suspendu a une
// connexion ouverte, un `evaluate` sans contexte ou revenir. A chaque fois il
// paraissait lent, alors qu'il etait mort. Un gardien qui pend masque
// exactement ce qu'il devrait reveler, et bloque la CI sans rien dire.
//
// Desormais il ECHOUE BRUYAMMENT au bout du temps imparti. `unref()` pour que
// ce minuteur n'empeche jamais, a lui seul, le processus de se terminer
// normalement.
const BUDGET_MS = 180000;
const garde = setTimeout(() => {
  console.error(
    `\ncheck:devis ECHEC : depassement du garde-temps de ${BUDGET_MS / 1000} s.\n` +
    "Le gardien s'est fige au lieu de conclure. Causes deja vues : une navigation\n" +
    "attendue qui n'arrive jamais, une connexion HTTP laissee ouverte, un\n" +
    "`evaluate` lance juste avant une navigation. Ne pas relancer en esperant\n" +
    "mieux : chercher l'attente sans borne.",
  );
  process.exit(1);
}, BUDGET_MS);
garde.unref();

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

/** Sources autorisees par `form-action`, la directive qui gouverne les soumissions. */
function cspDirective(name) {
  const found = CSP.split(";").map((d) => d.trim()).find((d) => d === name || d.startsWith(`${name} `));
  return found ? found.split(/\s+/).slice(1) : [];
}
const FORM_ACTION = cspDirective("form-action");

// `/api/devis` est une fonction serverless, absente du build statique. On la
// simule pour eprouver le VRAI parcours de soumission, redirection comprise,
// sans jamais sortir sur le calendrier Google.
//
// CORRECTIF DEVIS-1b : `redirectionMode` pilote la destination du 303. C'est le
// manque qui a rendu ce gardien complaisant : il ne testait QUE la redirection
// meme origine, alors que la production renvoyait vers calendar.app.google, que
// `form-action` bloque. Meme piege que FIX-CSP-GA4 sous une autre forme, un test
// qui ne rejoue pas les conditions reelles valide un site casse.
let redirectionMode = "confirmation";
const server = createServer((req, res) => {
  if (req.url.startsWith("/api/devis")) {
    // Reponse VOLONTAIREMENT lente. En local la redirection est instantanee et
    // l'etat d'envoi, bien que present, n'est jamais observable : le gardien
    // conclurait a tort qu'il manque. Or le cas qui justifie tout le §1 est
    // exactement celui-la, un serveur ou un calendrier qui tarde. On teste donc
    // dans la condition ou l'etat sert a quelque chose.
    return setTimeout(() => {
      res.statusCode = 303;
      if (redirectionMode === "muet") {
        // 204 No Content : le navigateur RESTE sur la page, rien ne se passe.
        // Une absence totale de reponse produirait le meme effet visible, mais
        // laisserait une navigation en vol qui fige toutes les commandes
        // Playwright suivantes, gardien compris.
        res.statusCode = 204;
        return res.end();
      }
      // LOT DEVIS-5 : la vraie reponse est un 303 vers la confirmation, ancre
      // comprise. Sans le fragment, ce stub validerait un parcours ou le
      // navigateur n'a nulle part ou se poser.
      res.setHeader("Location", `${PAGE}?devis=ok#devis-confirm`);
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

/** La banniere de consentement recouvre le formulaire : on la tranche d'abord. */
/**
 * (d) CAPTEUR DE VIOLATIONS CSP, repris de la session qui a livre fbb6111 et
 * elargi. L'assertion statique plus bas compare les destinations connues de
 * `api/devis.js` a form-action ; elle est aveugle a une destination introduite
 * ailleurs, ou a un blocage d'une autre directive. Ce capteur, lui, ecoute tout
 * ce que le navigateur refuse pendant le parcours, y compris ce qu'on n'avait
 * pas prevu. Les deux sont complementaires, aucun ne remplace l'autre.
 *
 * La violation est aussi renvoyee par la console : survenue juste avant une
 * navigation, elle serait sinon perdue avec le contexte d'execution.
 */
const violationsParcours = [];
const MARQUEUR = "__CSPVIOL__";
const pagesEcoutees = new WeakSet();

async function ouvrir(page, query = "") {
  await page.addInitScript((marqueur) => {
    document.addEventListener("securitypolicyviolation", (e) => {
      console.warn(marqueur + JSON.stringify({ d: e.effectiveDirective || e.violatedDirective, b: e.blockedURI }));
    });
  }, MARQUEUR).catch(() => { /* deja injecte */ });
  if (!pagesEcoutees.has(page)) {
    pagesEcoutees.add(page);
    page.on("console", (m) => {
      const t = m.text();
      if (!t.startsWith(MARQUEUR)) return;
      // Le scenario du filet de securite PROVOQUE volontairement une violation
      // (il rejoue la panne de production) : elle ne compte pas comme un defaut.
      if (redirectionMode === "muet") return;
      try { violationsParcours.push(JSON.parse(t.slice(MARQUEUR.length))); } catch { /* illisible */ }
    });
  }
  // `networkidle` peut ne jamais survenir (une requete lente reste pendante) et
  // `goto` leve alors une exception qui fait CRASHER le gardien au lieu de
  // produire un diagnostic. On se rabat sur le chargement du document, et on
  // transforme tout echec en erreur lisible.
  try {
    await page.goto(`${base}${PAGE}${query}`, { waitUntil: "networkidle", timeout: 15000 });
  } catch {
    try {
      await page.goto(`${base}${PAGE}${query}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    } catch (e) {
      errors.push(`Page inaccessible (${query || "sans parametre"}) : ${String(e).split("\n")[0]}`);
      return false;
    }
  }
  const deny = page.locator("#cookie-deny");
  if (await deny.isVisible().catch(() => false)) await deny.click().catch(() => {});
  return true;
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

// ── CORRECTIF DEVIS-1b : la panne de production, rejouee ────────────────────
// Le formulaire ne doit renvoyer QU'A des destinations que `form-action`
// autorise. Un 303 vers le calendrier partait bien, mais le navigateur refusait
// de le suivre, sans rien dire : le visiteur restait devant un ecran mort.
{
  const source = readFileSync("api/devis.js", "utf8");
  const origineCalendrier = new URL(CALENDAR_URL).origin;
  // `'self'` designe l'origine de la PAGE, jamais celle du calendrier : seul un
  // domaine cite explicitement autoriserait la redirection.
  const calendrierAutorise = FORM_ACTION.some((s) => s === origineCalendrier || s.startsWith(`${origineCalendrier}/`));
  const redirigeVersCalendrier = source.includes(CALENDAR_URL) || /redirect\(\s*CALENDAR\b/.test(source);
  if (redirigeVersCalendrier && !calendrierAutorise) {
    errors.push(
      `CSP : api/devis.js renvoie la soumission vers ${origineCalendrier}, absent de form-action (${FORM_ACTION.join(" ") || "vide"}). ` +
      `Le navigateur bloque cette navigation SANS RIEN DIRE : la demande part, l'email arrive, et le visiteur n'atteint jamais le calendrier.`
    );
  }
}

// Le parcours complet sous la VRAIE CSP : soumission, confirmation meme origine,
// puis saut vers le calendrier par une navigation ordinaire.
{
  const page = await ctx.newPage();
  const violations = [];
  await ouvrir(page);
  await page.evaluate(() => {
    window.__v = [];
    document.addEventListener("securitypolicyviolation", (e) => window.__v.push(e.violatedDirective));
  });
  // LOT DEVIS-4 §1 : plus AUCUN depart automatique vers le calendrier. Une
  // interception qui l'attendait validerait un comportement qu'on vient de
  // retirer volontairement ; pire, elle passerait au vert le jour ou il
  // reviendrait par accident. On verifie donc l'inverse : la page NE DOIT PAS
  // bouger d'elle-meme.
  let departAutomatique = false;
  await page.route("https://calendar.app.google/**", (route) => {
    departAutomatique = true;
    route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>calendrier simule</body></html>" });
  });

  await page.fill('input[name="name"]', "Camille Dupont");
  await page.fill('input[name="email"]', "camille@groupe-restaurants.fr");
  await page.fill('input[name="establishments"]', "4");
  await page.selectOption('select[name="sector"]', { label: "Restauration" });
  await page.evaluate(() => document.querySelector(".devis-form").requestSubmit());

  await page.waitForURL(/devis=ok/, { timeout: 8000 }).catch(() => {});
  if (!/devis=ok/.test(page.url())) {
    errors.push(`CSP : la soumission n'a pas abouti a la page de confirmation (URL = ${page.url()}). C'est la panne du 02/08.`);
  }
  await page.waitForTimeout(2500);

  // LOT DEVIS-4 §1, le nouveau contrat : soumission, confirmation meme origine,
  // encart VISIBLE et bouton qui mene au calendrier. Le visiteur clique
  // lui-meme, quand il est pret.
  if (departAutomatique) {
    errors.push("§1b : la page part TOUTE SEULE vers le calendrier. Ce saut automatique a ete retire, il donne l'impression que le site decroche.");
  }
  if (!(await estVisible(page, "#devis-confirm"))) {
    errors.push("§1b : apres la soumission, l'encart de confirmation n'apparait pas. Le visiteur ne sait ni que sa demande est partie, ni ou prendre son creneau.");
  } else {
    const lien = await page.locator("#devis-calendrier").getAttribute("href");
    if (!lien || !lien.includes("calendar.app.google")) {
      errors.push(`§1b : le bouton de la confirmation ne mene pas au calendrier (href = ${lien}).`);
    }
    // La confirmation doit se trouver SOUS le formulaire : au-dessus, elle
    // repoussait le formulaire hors de l'ecran.
    const ordre = await page.evaluate(() => {
      const f = document.querySelector(".devis-form");
      const c = document.querySelector("#devis-confirm");
      return f && c ? (f.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 : false;
    });
    if (!ordre) errors.push("§1b : l'encart de confirmation est AU-DESSUS du formulaire, il devait passer dessous.");
  }
  violations.push(...await page.evaluate(() => window.__v || []).catch(() => []));
  if (violations.includes("form-action")) {
    errors.push("CSP : la soumission declenche encore une violation form-action.");
  }
  await page.close();
}

// Le filet de securite. LOT DEVIS-4 : il change de DECLENCHEUR, pas d'objet.
// Rien ne part plus tout seul vers le calendrier, donc la panne a rejouer n'est
// plus une redirection refusee : c'est la SOUMISSION elle-meme qui n'aboutit
// pas, seule etape qui puisse encore figer l'ecran. Le serveur reste donc muet,
// et on exige que le visiteur reprenne la main.
{
  redirectionMode = "muet";
  const page = await ctx.newPage();
  await ouvrir(page);
  await page.fill('input[name="name"]', "Camille Dupont");
  await page.fill('input[name="email"]', "camille@groupe-restaurants.fr");
  await page.fill('input[name="establishments"]', "4");
  await page.selectOption('select[name="sector"]', { label: "Restauration" });
  await page.evaluate(() => document.querySelector(".devis-form").requestSubmit());

  const repris = await page.waitForSelector("#devis-submit:not([disabled])", { timeout: 12000 }).then(() => true).catch(() => false);
  if (!repris) {
    errors.push("§2b : le bouton reste bloque sur « Envoi en cours… » indefiniment. Un ecran mort est pire que pas d'etat du tout.");
  }
  if (!(await estVisible(page, "#devis-secours"))) {
    errors.push("§2b : aucun message ni lien manuel quand la soumission n'aboutit pas.");
  } else {
    const lien = await page.locator("#devis-secours a").getAttribute("href");
    if (!lien || !lien.includes("calendar.app.google")) {
      errors.push(`§2b : le message de secours ne propose pas de lien vers le calendrier (href = ${lien}).`);
    }
  }
  await page.close();
  redirectionMode = "confirmation";
}

// ── La note sous le bouton ne promet plus un email ──────────────────────────
{
  const html = readFileSync(`${DIST}${PAGE}.html`, "utf8");
  if (/Réponse sous 24\s?h/i.test(html)) {
    errors.push("§2 : la note sous le bouton promet toujours « Reponse sous 24 h », au lieu d'orienter vers le creneau.");
  }
}

// (d) Le parcours nominal ne doit produire AUCUNE violation, quelle que soit la
// directive : un refus de la CSP ne laisse aucune trace ailleurs.
{
  const vues = new Map();
  for (const v of violationsParcours) vues.set(`${v.d}|${v.b}`, v);
  for (const v of vues.values()) {
    errors.push(`CSP : le parcours declenche une violation « ${v.d} » sur ${v.b}. Ce blocage est silencieux cote visiteur.`);
  }
}

// (e) L'ANGLE MORT : form-action ne doit contenir AUCUNE origine externe inutile.
//
// Les assertions precedentes verifient toutes que les destinations du formulaire
// sont AUTORISEES. Aucune ne verifie l'inverse : qu'on n'autorise pas plus que
// necessaire. Une origine externe laissee la apres coup, comme
// calendar.app.google devenu sans objet des lors que la soumission reste en meme
// origine, elargit la surface d'attaque sans que rien ne le signale jamais.
// C'est exactement le genre de residu que personne ne retire, faute d'alerte.
{
  const AUTORISEES = new Set(["'self'", "https://app.mystela.fr"]);
  const superflues = FORM_ACTION.filter((s) => !AUTORISEES.has(s));
  if (superflues.length > 0) {
    errors.push(
      `CSP : form-action autorise ${superflues.join(", ")} sans necessite. La soumission reste en meme origine ` +
      `et c'est la page qui mene ensuite au calendrier : seules 'self' et https://app.mystela.fr sont justifiees.`,
    );
  }
}

// ── LOT DEVIS-5 : POST-REDIRECT-GET, ET LA CONFIRMATION SANS JAVASCRIPT ─────
// Le defaut corrige : la page defilait vers la confirmation, puis le
// rechargement la remontait en haut. Le positionnement doit venir de la
// REPONSE, pas d'un script qu'une navigation efface.
{
  // (1) La soumission repond bien par une 303 vers la MEME ORIGINE, ancre
  //     comprise. On lit la reponse brute plutot que l'etat du navigateur :
  //     c'est le contrat HTTP qu'on verrouille ici.
  const reponse = await fetch(`${base}/api/devis`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "name=Camille&email=c%40exemple.fr&establishments=4&sector=Restauration",
    redirect: "manual",
  }).catch((e) => ({ status: 0, headers: new Headers(), erreur: String(e) }));

  if (reponse.status !== 303) {
    errors.push(`§5 : la soumission repond ${reponse.status} au lieu de 303. Un 302 rejouerait le POST au rechargement et redemanderait « voulez-vous renvoyer le formulaire ? ».`);
  }
  const location = reponse.headers.get("location") || "";
  const cible = new URL(location, base);
  if (cible.origin !== new URL(base).origin) {
    errors.push(`§5 : la redirection sort de l'origine (${cible.origin}). La CSP stricte l'interdit, et rien ne doit s'ajouter a form-action.`);
  }
  if (cible.hash !== "#devis-confirm") {
    errors.push(`§5 : l'URL d'arrivee ne porte pas le fragment #devis-confirm (hash = « ${cible.hash} »). Sans lui, le navigateur n'a nulle part ou se poser et la page reste en haut.`);
  }

  // (1 bis) Le controle ci-dessus porte sur le STUB, donc sur du code de test :
  //         il verrouille le contrat que la page attend, pas ce que la vraie
  //         fonction produit. Celle-ci n'existe pas dans un build statique, on
  //         l'inspecte donc a la source. Sans ce complement, le gardien
  //         validerait sa propre simulation.
  {
    const src = readFileSync("api/devis.js", "utf8");
    if (!src.includes("?devis=ok#devis-confirm")) {
      errors.push("§5 : api/devis.js ne redirige pas vers `?devis=ok#devis-confirm`. La page ne saura ni afficher la confirmation, ni ou se positionner.");
    }
    if (!/res\.statusCode\s*=\s*303/.test(src)) {
      errors.push("§5 : api/devis.js ne repond pas 303. Un 302 laisse le navigateur rejouer le POST au rechargement.");
    }
    // La destination de la redirection ne doit jamais dependre d'une valeur
    // postee non filtree : ce serait une redirection ouverte.
    if (!/SEGMENT_RE/.test(src)) {
      errors.push("§5 SECURITE : le segment recu du formulaire entre dans l'URL de redirection sans filtre. Un POST forge choisirait la destination.");
    }
  }

  // (2) Et surtout : l'encart est visible SANS JavaScript. C'est tout
  //     l'interet de la technique ; un encart revele par script serait a la
  //     merci du prochain rechargement, exactement comme le defaut d'origine.
  const sansJs = await browser.newContext({ javaScriptEnabled: false });
  const pg = await sansJs.newPage();
  await pg.goto(`${base}${PAGE}?devis=ok#devis-confirm`, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
  if (!(await pg.locator("#devis-confirm").isVisible().catch(() => false))) {
    errors.push("§5 SANS JAVASCRIPT : l'encart de confirmation reste invisible. Le visiteur ne saurait pas que sa demande est partie, et le navigateur ne peut pas se positionner sur une ancre masquee.");
  }
  const lienSansJs = await pg.locator("#devis-calendrier").getAttribute("href").catch(() => null);
  if (!lienSansJs || !lienSansJs.includes("calendar.app.google")) {
    errors.push(`§5 SANS JAVASCRIPT : le bouton de prise de creneau ne mene nulle part (href = ${lienSansJs}).`);
  }
  // Le formulaire reste au-dessus, l'encart en dessous : la disposition de
  // DEVIS-4 ne doit pas avoir bouge.
  const dispo = await pg.evaluate(() => {
    const f = document.querySelector(".devis-form");
    const c = document.querySelector("#devis-confirm");
    return f && c ? { formulaireVisible: f.offsetParent !== null, ordre: (f.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 } : null;
  }).catch(() => null);
  if (!dispo || !dispo.formulaireVisible) errors.push("§5 : le formulaire n'est plus visible au-dessus de la confirmation.");
  if (!dispo || !dispo.ordre) errors.push("§5 : l'encart n'est plus SOUS le formulaire.");
  await sansJs.close();
}

clearTimeout(garde);
await browser.close();
// `server.close()` ATTEND la fin des connexions en cours. Le scenario du filet
// laisse volontairement une requete sans reponse : sans cette coupure franche, le
// gardien ne rendait jamais la main et paraissait bloque au lieu de conclure.
server.closeAllConnections?.();
server.close();

if (errors.length > 0) {
  console.error(`\ncheck:devis ECHEC, ${errors.length} probleme(s) :\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  "check:devis OK : POST-redirect-GET 303 vers #devis-confirm en meme origine, confirmation visible SANS JavaScript, " +
  "filet de securite si la soumission n'aboutit pas, etat d'envoi, 4 erreurs serveur affichees, conseil email non bloquant."
);

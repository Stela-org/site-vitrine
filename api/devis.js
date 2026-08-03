// Vercel Serverless Function (Node). Demande de devis multi-établissements :
// petit formulaire de qualification (nom, email, nombre d'établissements,
// secteur) → notification email à contact@mystela.fr → redirection vers la prise
// de rendez-vous. Défenses : honeypot + validation serveur + rate limit IP.
// Le rendez-vous prime : tout chemin (bot, rate limit, échec d'envoi) finit sur
// la page de confirmation, qui mène au calendrier ; seule une saisie invalide
// revient au formulaire avec le détail de ce qui ne va pas.
import { sendEmail, rateLimit, clientIp, SITE, EMAIL_RE } from "../lib/leads.js";

const PAGE = "/pour/multi-etablissements";
const NOTIFY_TO = "contact@mystela.fr";

// CORRECTIF DEVIS-1b : cette fonction ne redirige PLUS vers le calendrier.
//
// Elle le faisait, et le navigateur refusait de suivre : `form-action` de la CSP
// vaut `'self' https://app.mystela.fr`, et cette directive s'applique à TOUTE la
// chaîne de redirection d'une soumission, pas seulement à sa première étape. Le
// POST partait, l'email de notification arrivait, puis la navigation vers
// calendar.app.google était bloquée. Le visiteur restait devant un écran mort,
// bouton figé sur « Envoi en cours… », et ne réservait jamais.
//
// Deux corrections étaient possibles : étendre `form-action` aux domaines du
// calendrier, ou cesser d'y renvoyer depuis une soumission. La seconde est
// retenue. La première aurait supposé d'autoriser calendar.app.google ET
// calendar.google.com (le lien court redirige vers le second), donc de faire
// dépendre la conversion la plus chère du site d'une chaîne de redirections
// Google qu'on ne maîtrise pas : le jour où Google ajoute un domaine, la panne
// revient, aussi silencieuse qu'aujourd'hui.
//
// La fonction renvoie donc vers une page du site, MÊME ORIGINE, toujours
// autorisée par `'self'`. C'est la page qui emmène ensuite le visiteur au
// calendrier, par une navigation ordinaire que `form-action` ne régit pas, et
// qui affiche de toute façon un bouton manuel si ce saut échoue.
// LOT DEVIS-5 : POST-REDIRECT-GET AVEC ANCRE.
//
// DEVIS-4 avait retire la redirection automatique vers le calendrier et l'avait
// remplacee par un defilement doux. Sauf que le formulaire fait un POST NATIF,
// qui NAVIGUE : le `scrollIntoView` s'executait sur une page que le
// rechargement repositionnait aussitot en haut. Le visiteur voyait la page
// descendre vers la confirmation, puis remonter sur le formulaire, sans savoir
// si son envoi avait abouti.
//
// La reponse porte donc le positionnement elle-meme, dans l'URL : le navigateur
// se pose sur `#devis-confirm` au chargement. C'est natif, ca survit au
// rechargement et au retour arriere, et ca fonctionne sans JavaScript.
//
// 303 See Other, jamais 302 : 303 impose au navigateur de refaire un GET. Sans
// quoi un rechargement rejouerait le POST et redemanderait « voulez-vous
// renvoyer le formulaire ? ».
//
// Le segment vient du formulaire, il n'est pas code en dur : la page est
// parametree, et une seconde landing sur devis renverrait sinon tout le monde
// sur multi-etablissements. La valeur est strictement filtree avant d'entrer
// dans une URL : sans ce filtre, un POST forge choisirait la destination de la
// redirection.
const SEGMENT_RE = /^[a-z0-9-]{2,40}$/;
const SEGMENT_DEFAUT = "multi-etablissements";
const confirmationPour = (segment) => {
  const slug = SEGMENT_RE.test(segment) ? segment : SEGMENT_DEFAUT;
  return `${SITE}/pour/${slug}?devis=ok#devis-confirm`;
};

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => resolve(d));
  });
  if (raw.trim().startsWith("{")) return JSON.parse(raw);
  const out = {};
  for (const pair of raw.split("&")) {
    const [k, v] = pair.split("=");
    out[decodeURIComponent(k || "")] = decodeURIComponent((v || "").replace(/\+/g, " "));
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  const redirect = (url) => {
    res.statusCode = 303;
    res.setHeader("Location", url);
    res.end();
  };

  let body = {};
  try {
    body = await readBody(req);
  } catch {
    return redirect(`${SITE}${PAGE}?erreur=1#devis`); // corps illisible : le segment l'est aussi
  }

  const name = String(body.name || "").trim().slice(0, 80);
  const establishments = String(body.establishments || "").trim().slice(0, 10);
  const sector = String(body.sector || "").trim().slice(0, 60);
  // LOT GADS-2 : l'email devient un champ du formulaire. Validé ICI au même titre
  // que le reste, le `required` du navigateur ne protège de rien, un POST direct
  // l'ignore.
  const email = String(body.email || "").trim().slice(0, 120).toLowerCase();
  const honeypot = String(body.website || "").trim();
  // LOT DEVIS-5 : d'ou vient la demande, pour y renvoyer le visiteur.
  const segment = String(body.segment || "").trim().slice(0, 40);
  const CONFIRMATION = confirmationPour(segment);

  // Bot (honeypot rempli) : on redirige sans rien envoyer.
  if (honeypot) return redirect(CONFIRMATION);

  // LOT DEVIS-1 §3 : la validation disait seulement « erreur=1 », et la page
  // n'affichait rien du tout. Le visiteur revenait sur un formulaire muet, sans
  // savoir lequel des quatre champs posait problème. On renvoie donc la LISTE
  // des champs invalides, que la page traduit en phrases. Les codes sont
  // stables et lisibles : ils apparaissent dans l'URL du prospect.
  const invalides = [];
  if (!name) invalides.push("nom");
  if (!EMAIL_RE.test(email)) invalides.push("email");
  if (!/^\d{1,6}$/.test(establishments)) invalides.push("etablissements");
  if (!sector) invalides.push("secteur");
  if (invalides.length > 0) {
    // Echec de validation : on ne redirige JAMAIS vers ?devis=ok. Le visiteur
    // doit lire ce qui ne va pas, pas une confirmation mensongere.
    const slug = SEGMENT_RE.test(segment) ? segment : SEGMENT_DEFAUT;
    return redirect(`${SITE}/pour/${slug}?erreur=${invalides.join(",")}#devis`);
  }

  // Rate limit par IP : au-delà, on redirige quand même (pas d'indice) sans email.
  const byIp = await rateLimit(`devis:${clientIp(req)}`, { max: 5, windowSec: 3600 });
  if (!byIp.ok) return redirect(CONFIRMATION);

  try {
    await sendEmail({
      to: NOTIFY_TO,
      subject: `Demande de devis multi-établissements, ${name}`,
      html: `<p>Nouvelle demande de devis depuis ${SITE}${PAGE} :</p>
<ul>
  <li><strong>Nom :</strong> ${esc(name)}</li>
  <li><strong>Email :</strong> ${esc(email)}</li>
  <li><strong>Nombre d'établissements :</strong> ${esc(establishments)}</li>
  <li><strong>Secteur :</strong> ${esc(sector)}</li>
</ul>
<p>Le contact a été renvoyé vers la prise de rendez-vous.</p>`,
    });
  } catch {
    /* la notification est best effort : le rendez-vous prime */
  }

  return redirect(CONFIRMATION);
}

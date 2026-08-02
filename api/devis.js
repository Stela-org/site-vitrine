// Vercel Serverless Function (Node). Demande de devis multi-établissements :
// petit formulaire de qualification (nom, email, nombre d'établissements,
// secteur) → notification email à contact@mystela.fr → redirection vers la prise
// de rendez-vous. Défenses : honeypot + validation serveur + rate limit IP.
// Le rendez-vous prime : tout chemin (bot, rate limit, échec d'envoi) finit
// sur le calendrier, seule une saisie invalide revient au formulaire.
import { sendEmail, rateLimit, clientIp, SITE, EMAIL_RE } from "../lib/leads.js";
import { CALENDAR_URL } from "../lib/booking.js";

const PAGE = "/pour/multi-etablissements";
const CALENDAR = CALENDAR_URL;
const NOTIFY_TO = "contact@mystela.fr";

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
    return redirect(`${SITE}${PAGE}?erreur=1#devis`);
  }

  const name = String(body.name || "").trim().slice(0, 80);
  const establishments = String(body.establishments || "").trim().slice(0, 10);
  const sector = String(body.sector || "").trim().slice(0, 60);
  // LOT GADS-2 : l'email devient un champ du formulaire. Validé ICI au même titre
  // que le reste, le `required` du navigateur ne protège de rien, un POST direct
  // l'ignore.
  const email = String(body.email || "").trim().slice(0, 120).toLowerCase();
  const honeypot = String(body.website || "").trim();

  // Bot (honeypot rempli) : on redirige sans rien envoyer.
  if (honeypot) return redirect(CALENDAR);

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
    return redirect(`${SITE}${PAGE}?erreur=${invalides.join(",")}#devis`);
  }

  // Rate limit par IP : au-delà, on redirige quand même (pas d'indice) sans email.
  const byIp = await rateLimit(`devis:${clientIp(req)}`, { max: 5, windowSec: 3600 });
  if (!byIp.ok) return redirect(CALENDAR);

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
<p>Le contact a été redirigé vers la prise de rendez-vous.</p>`,
    });
  } catch {
    /* la notification est best effort : le rendez-vous prime */
  }

  return redirect(CALENDAR);
}

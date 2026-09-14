// Vercel Serverless Function (Node). LOT PARTNER-1 §5 — candidature au
// programme partenaires : cinq champs, une notification email, rien en base.
//
// POURQUOI AUCUN ENREGISTREMENT. Une candidature n'est pas un lead marketing :
// elle n'entre dans aucune séquence, elle n'est pas relancée automatiquement,
// et elle se traite à la main en deux jours. La pousser dans `marketing_leads`
// mélangerait des agences candidates avec des commerçants prospects dans la
// même liste de diffusion, ce qui est exactement la façon de leur envoyer un
// jour une campagne qui ne les concerne pas. Un email à contact@ suffit, et
// c'est le canal où la réponse sera écrite de toute façon.
//
// AUCUNE DONNÉE BANCAIRE DEMANDÉE. L'IBAN se donne au moment de signer, par un
// canal humain. Le collecter dans un formulaire public, avant même d'avoir dit
// oui, serait recueillir une donnée sensible dont on n'a pas encore l'usage.
//
// POST-REDIRECT-GET en 303, comme `api/devis.js` : un rechargement ne rejoue
// pas l'envoi, et le retour arrière ne redemande rien.
import { sendEmail, rateLimit, clientIp, SITE, EMAIL_RE } from "../lib/leads.js";

const PAGE = "/partenaires";
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
  const redirect = (suffixe) => {
    res.statusCode = 303;
    res.setHeader("Location", `${SITE}${PAGE}${suffixe}`);
    res.end();
  };
  const CONFIRMATION = "?candidature=ok#candidature-confirm";

  let body = {};
  try {
    body = await readBody(req);
  } catch {
    return redirect("?erreur=nom#candidature");
  }

  const nom = String(body.nom || "").trim().slice(0, 80);
  const structure = String(body.structure || "").trim().slice(0, 80);
  const site = String(body.site || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 120).toLowerCase();
  const clients = String(body.clients || "").trim().slice(0, 10);
  const piege = String(body.website || "").trim();

  // Robot : on affiche la confirmation sans rien envoyer. Lui répondre « erreur »
  // lui apprendrait que le champ est un piège.
  if (piege) return redirect(CONFIRMATION);

  // Validation SERVEUR. Le `required` du navigateur ne protège de rien : un
  // POST direct l'ignore. Les codes renvoyés sont stables et lisibles, la page
  // les traduit en phrases (le visiteur les voit dans son URL).
  const invalides = [];
  if (!nom) invalides.push("nom");
  if (!structure) invalides.push("structure");
  if (!EMAIL_RE.test(email)) invalides.push("email");
  // Le SITE est facultatif : beaucoup de freelances n'ont qu'un profil
  // LinkedIn. En faire un champ obligatoire écarterait exactement la cible.
  if (!/^\d{1,6}$/.test(clients)) invalides.push("clients");
  if (invalides.length > 0) return redirect(`?erreur=${invalides.join(",")}#candidature`);

  // Rate limit par IP. Au-delà, on renvoie la confirmation sans envoyer :
  // aucun indice donné, et la boîte contact ne se fait pas inonder.
  const parIp = await rateLimit(`partenaire:${clientIp(req)}`, { max: 5, windowSec: 3600 });
  if (!parIp.ok) return redirect(CONFIRMATION);

  try {
    await sendEmail({
      to: NOTIFY_TO,
      subject: `Candidature partenaire, ${structure}`,
      html: `<p>Nouvelle candidature au programme partenaires depuis ${SITE}${PAGE} :</p>
<ul>
  <li><strong>Nom :</strong> ${esc(nom)}</li>
  <li><strong>Structure :</strong> ${esc(structure)}</li>
  <li><strong>Site :</strong> ${site ? esc(site) : "non renseigné"}</li>
  <li><strong>Email :</strong> ${esc(email)}</li>
  <li><strong>Clients gérés :</strong> ${esc(clients)}</li>
</ul>
<p>À traiter sous deux jours ouvrés : répondre avec un taux et créer le partenaire en console pour obtenir son lien.</p>`,
    });
  } catch {
    // La notification est best effort. Un échec d'envoi ne doit pas renvoyer
    // le candidat sur une page d'erreur : de son côté, il a bien candidaté.
  }

  return redirect(CONFIRMATION);
}

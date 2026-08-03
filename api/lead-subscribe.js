// Vercel Serverless Function (Node). Point de collecte UNIQUE du site : demande
// du lead magnet « Le guide Google du commerçant local ». SIMPLE OPT-IN :
// une seule case de consentement obligatoire (non pré-cochée) → on envoie le
// guide immédiatement + une relance J+3 planifiée, et on pousse le lead au CRM.
// Défenses : honeypot + validation serveur + consentement + rate limit.
import {
  SITE,
  EMAIL_RE,
  isConfigured,
  unsubUrlFor,
  guideEmail,
  closingEmail,
  sendEmail,
  pushLeadToCrm,
  rateLimit,
  clientIp,
} from "../lib/leads.js";

const PAGE = "/guide-google-commercant-local";

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
  const redirect = (path) => {
    res.statusCode = 303;
    res.setHeader("Location", SITE + path);
    res.end();
  };

  let body = {};
  try {
    body = await readBody(req);
  } catch {
    return redirect(`${PAGE}?erreur=1`);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const firstName = String(body.first_name || "").trim().slice(0, 40);
  const honeypot = String(body.website || "").trim();
  const consent = body.consent;

  // Bot (honeypot rempli) : on affiche la page de succès sans rien faire.
  if (honeypot) return redirect(`${PAGE}/merci`);
  // Sans consentement explicite : ni envoi, ni lead (règle du lot).
  if (!EMAIL_RE.test(email) || !consent) return redirect(`${PAGE}?erreur=1`);
  if (!isConfigured()) {
    res.statusCode = 500;
    return res.end("Service non configuré (env manquants).");
  }

  // Rate limit : par email et par IP. En cas de dépassement, on affiche la page
  // de succès (pas d'indice pour un attaquant) sans envoyer ni re-pousser.
  const [byEmail, byIp] = await Promise.all([
    rateLimit(`e:${email}`, { max: 3, windowSec: 3600 }),
    rateLimit(`i:${clientIp(req)}`, { max: 10, windowSec: 3600 }),
  ]);
  if (!byEmail.ok || !byIp.ok) return redirect(`${PAGE}/merci`);

  const consentedAt = new Date().toISOString();

  // 1) Planifier la relance J+3 EN PREMIER, pour récupérer son id Resend et le
  //    glisser (signé HMAC) dans le lien de désinscription du guide : une
  //    désinscription pourra ainsi annuler la relance encore en attente.
  //    Son propre lien de désinscription est email-seul (rien à annuler après
  //    sa livraison). Best effort : ne bloque jamais le guide.
  let scheduledId = null;
  try {
    const unsub = unsubUrlFor(email);
    const c = closingEmail({ firstName, unsubUrl: unsub });
    scheduledId = await sendEmail({
      to: email,
      subject: c.subject,
      html: c.html,
      scheduledAt: "in 3 days",
      unsubUrl: unsub,
    });
  } catch {
    /* planification indisponible : on continue sans relance */
  }

  // 2) Envoyer le guide (immédiat), lien de désinscription porteur de l'id
  //    planifié. Le guide prime : son échec n'est pas divulgué.
  try {
    const unsub = unsubUrlFor(email, scheduledId);
    const g = guideEmail({ firstName, unsubUrl: unsub });
    await sendEmail({ to: email, subject: g.subject, html: g.html, unsubUrl: unsub });
  } catch {
    /* échec d'envoi : on ne divulgue rien, on affiche merci */
  }

  // 3) Pousser le lead au CRM : best effort, non bloquant. L'id de la relance
  //    part avec (LOT VIT-17 §1) : ce n'est PAS pour la désinscription — celle-ci
  //    récupère l'id par le jeton signé — mais pour le VERSEMENT EN PROSPECTION,
  //    qui doit couper le nurturing vitrine et n'a aucun jeton à sa disposition.
  await pushLeadToCrm({ email, firstName, consentedAt, scheduledId }).catch(() => {});

  return redirect(`${PAGE}/merci`);
}

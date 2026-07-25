// lib/leads.js — coeur du lead magnet (simple opt-in RGPD).
// Partagé par les fonctions serverless api/lead-subscribe.js et api/lead-unsubscribe.js.
// Vercel bundle ce module (importé hors /api, donc jamais routé comme fonction).
//
// Responsabilités :
//  - emails à la charte Stela (fond crème, bouton laiton, logo image hébergée,
//    jamais le glyphe étoile en texte), adressés au prénom quand il existe ;
//  - envoi via Resend (email immédiat + email de relance J+3 planifié) ;
//  - poussée du lead vers le CRM (POST app.mystela.fr/api/leads, Bearer, retry) ;
//  - lien de désinscription signé HMAC (marque le lead désinscrit côté CRM) ;
//  - rate limit par IP/email via Upstash Redis REST (garde-fou anti-abus).
import crypto from "node:crypto";

export const SITE = "https://www.mystela.fr";
export const APP = "https://app.mystela.fr";
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const SECRET = process.env.LEAD_HMAC_SECRET;
const RESEND_KEY = process.env.RESEND_API_KEY;
// Expéditeur : une personne, pas une marque (délivrabilité : évite l'onglet
// Promotions de Gmail). Domaine à vérifier chez Resend (SPF/DKIM).
const FROM = process.env.LEAD_FROM || "Corentin de Stela <contact@mystela.fr>";
const CRM_TOKEN = process.env.LEADS_INGEST_SECRET; // jamais en dur : lu de l'env
const GUIDE_URL =
  process.env.LEAD_GUIDE_URL || `${SITE}/guides/guide-google-commercant-local.pdf`;

// Charte (miroir de src/config/site.ts, non importable ici car TS/Astro).
const C = {
  ink: "#15233F",
  brass: "#B08A3E",
  cream: "#F7F4EF",
  border: "#ECE6DC",
  sec: "#4A5568",
  muted: "#6C6558",
};

export const isConfigured = () => Boolean(SECRET && RESEND_KEY);

// ————————————————————————————————————————————————————————————————
// Désinscription : jeton HMAC (email + éventuel id d'email planifié J+3, signés,
// sans expiration : un lien de désinscription doit toujours fonctionner).
// base64url({ e, sid?, s }). Le sid permet d'annuler la relance planifiée à la
// désinscription. Rétro-compatible : sans sid, la signature porte le seul email.
// ————————————————————————————————————————————————————————————————
const signPayload = (email, sid) => (sid ? `${email}|${sid}` : email);
const signEmail = (email, sid) =>
  crypto.createHmac("sha256", SECRET || "").update(signPayload(email, sid)).digest("hex");

export function unsubToken(email, scheduledId) {
  const e = String(email).trim().toLowerCase();
  const sid = scheduledId || undefined;
  const payload = sid ? { e, sid, s: signEmail(e, sid) } : { e, s: signEmail(e) };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

// Retourne { email, scheduledId } si le jeton est valide, sinon null.
export function verifyUnsub(token) {
  try {
    const { e, sid, s } = JSON.parse(Buffer.from(String(token), "base64url").toString());
    const expected = signEmail(e, sid);
    const ok =
      s &&
      expected.length === s.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s));
    return ok ? { email: e, scheduledId: sid || null } : null;
  } catch {
    return null;
  }
}

export const unsubUrlFor = (email, scheduledId) =>
  `${SITE}/api/lead-unsubscribe?token=${unsubToken(email, scheduledId)}`;

// ————————————————————————————————————————————————————————————————
// Gabarit email à la charte. `firstName` optionnel : salutation au prénom si
// présent, sinon neutre. Le pied contient toujours le lien de désinscription.
// ————————————————————————————————————————————————————————————————
function greeting(firstName) {
  const fn = String(firstName || "").trim();
  // Prénom simple uniquement (anti-injection dans le HTML) : lettres/espaces/tirets.
  const safe = /^[\p{L}][\p{L} '-]{0,40}$/u.test(fn) ? fn : "";
  return safe ? `Bonjour ${safe},` : "Bonjour,";
}

// HTML volontairement MINIMAL, façon email écrit à la main : pas de carte, pas
// de bouton, pas de logo, pas d'émoji ; texte court, liens en texte, signature
// simple, désinscription en une ligne discrète. Objectif délivrabilité : rester
// dans la boîte principale (Gmail) plutôt que dans l'onglet Promotions.
const A = (href, label) => `<a href="${href}" style="color:${C.ink};">${label}</a>`;
const P = (html) => `<p style="margin:0 0 14px;">${html}</p>`;

function shell({ preheader, firstName, bodyHtml, unsubUrl }) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#ffffff;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader || ""}</span>
<div style="max-width:560px;margin:0 auto;padding:22px 24px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#222b3d;">
${P(greeting(firstName))}
${bodyHtml}
<p style="margin:26px 0 0;font-size:12px;color:${C.muted};">Vous ne souhaitez plus recevoir mes emails ? <a href="${unsubUrl}" style="color:${C.muted};">Se désinscrire</a>.</p>
</div>
</body></html>`;
}

// Email 1 (immédiat) : la personne écrit, remet le guide, mentionne une fois
// l'essai. 2 liens texte : le PDF + les tarifs.
export function guideEmail({ firstName, unsubUrl }) {
  const body =
    P(`Merci de m'avoir demandé le guide. Le voici, en un clic : ${A(GUIDE_URL, "Le guide Google du commerçant local (PDF)")}.`) +
    P("J'y ai réuni ce qui marche vraiment pour une fiche Google : collecter des avis sans enfreindre les règles, y répondre simplement, et rester visible, y compris dans les réponses des IA.") +
    P(`Si après lecture vous préférez qu'on s'en occupe à votre place, c'est le rôle de Stela. On propose un essai gratuit de 7 jours, sans engagement : ${A(`${SITE}/tarifs`, "voir les tarifs")}.`) +
    P("Bonne lecture,<br/>Corentin, cofondateur de Stela");
  return {
    subject: "Votre guide Google",
    html: shell({ preheader: "Le guide est en pièce jointe, en un clic.", firstName, bodyHtml: body, unsubUrl }),
  };
}

// Email 2 (J+3, planifié) : simple relance humaine, 1 seul lien (tarifs).
export function closingEmail({ firstName, unsubUrl }) {
  const body =
    P("Je voulais juste m'assurer que le guide vous a été utile.") +
    P("Si je devais en retenir une seule idée : sur Google, la régularité compte plus que les coups d'éclat. Quelques avis récents chaque mois, des réponses soignées, une fiche à jour, et votre visibilité progresse.") +
    P(`C'est exactement ce qu'on automatise chez Stela, en restant conforme. Si vous voulez essayer, c'est gratuit pendant 7 jours : ${A(`${SITE}/tarifs`, "voir les tarifs")}.`) +
    P("Une question ? Répondez simplement à ce message, je le lis.") +
    P("Corentin, cofondateur de Stela");
  return {
    subject: "Avez-vous pu lire le guide ?",
    html: shell({ preheader: "Un mot sur votre visibilité Google.", firstName, bodyHtml: body, unsubUrl }),
  };
}

// ————————————————————————————————————————————————————————————————
// Envoi Resend. `scheduledAt` (ISO ou langage naturel « in 3 days ») planifie
// l'email côté Resend : pas besoin de cron pour la relance J+3. Retourne l'id
// de l'email Resend (utile pour annuler un envoi planifié), ou null.
// ————————————————————————————————————————————————————————————————
export async function sendEmail({ to, subject, html, scheduledAt, unsubUrl }) {
  if (!RESEND_KEY) return null;
  const payload = { from: FROM, to, subject, html };
  if (scheduledAt) payload.scheduled_at = scheduledAt;
  // Désinscription One-Click (RFC 8058) : bouton natif « Se désinscrire » dans
  // Gmail/Outlook, et signal de délivrabilité. L'endpoint accepte le POST.
  if (unsubUrl) {
    payload.headers = {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  try {
    const data = await r.json();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

// Annule un email PLANIFIÉ côté Resend (endpoint officiel : POST /emails/:id/cancel).
// Sans effet si l'email est déjà parti (Resend renvoie une erreur) : on avale.
// Retourne true si l'annulation a été acceptée, false sinon.
export async function cancelScheduledEmail(id) {
  if (!RESEND_KEY || !id) return false;
  try {
    const r = await fetch(`https://api.resend.com/emails/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}` },
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ————————————————————————————————————————————————————————————————
// CRM : poussée du lead (fire-and-forget + un retry). N'interrompt JAMAIS
// l'envoi du guide : toute erreur est avalée. Le header Authorization: Bearer
// vient de l'env LEADS_INGEST_SECRET, jamais en dur.
// ————————————————————————————————————————————————————————————————
async function crmPost(path, payload) {
  if (!CRM_TOKEN) return false; // non configuré : on n'échoue pas, on ignore.
  const attempt = () =>
    fetch(`${APP}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRM_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  try {
    const r = await attempt();
    if (r.ok) return true;
  } catch { /* on retente une fois */ }
  try {
    const r = await attempt();
    return r.ok;
  } catch {
    return false;
  }
}

export function pushLeadToCrm({ email, firstName, consentedAt }) {
  return crmPost("/api/leads", {
    email,
    first_name: firstName || null,
    source: "guide-google",
    marketing_consent: true,
    consented_at: consentedAt || new Date().toISOString(),
  });
}

export function markUnsubscribedInCrm(email) {
  return crmPost("/api/leads", {
    email,
    source: "guide-google",
    marketing_consent: false,
    unsubscribed_at: new Date().toISOString(),
  });
}

// ————————————————————————————————————————————————————————————————
// Rate limit par clé (IP + email) via Upstash Redis REST (INCR + EXPIRE).
// Fenêtre glissante grossière : N requêtes par fenêtre. Si Upstash n'est pas
// configuré, on n'affame pas le formulaire (retourne ok) — voir docs/LEAD-MAGNET.md
// (à provisionner avant toute mise en avant publicitaire).
// ————————————————————————————————————————————————————————————————
const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function rateLimit(key, { max = 5, windowSec = 3600 } = {}) {
  if (!KV_URL || !KV_TOKEN) return { ok: true, skipped: true };
  const k = `leadrl:${key}`;
  try {
    const pipe = [
      ["INCR", k],
      ["EXPIRE", k, String(windowSec), "NX"],
    ];
    const r = await fetch(`${KV_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(pipe),
    });
    const out = await r.json();
    const count = Number(out?.[0]?.result ?? 0);
    return { ok: count <= max, count };
  } catch {
    return { ok: true, skipped: true }; // le store ne doit jamais bloquer un vrai lead.
  }
}

export function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  return (Array.isArray(xf) ? xf[0] : String(xf || "")).split(",")[0].trim() || "unknown";
}

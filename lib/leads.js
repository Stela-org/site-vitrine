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
const FROM = process.env.LEAD_FROM || "Stela <contact@mystela.fr>";
const CRM_TOKEN = process.env.LEADS_INGEST_SECRET; // jamais en dur : lu de l'env
const GUIDE_URL =
  process.env.LEAD_GUIDE_URL || `${SITE}/guides/guide-google-commercant-local.pdf`;
const LOGO = `${SITE}/images/logo-monogramme-512.png`;

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

function shell({ preheader, firstName, bodyHtml, unsubUrl }) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${C.cream};font-family:'Segoe UI',system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;color:${C.ink};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader || ""}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${C.border};border-radius:16px;overflow:hidden;">
  <tr><td style="padding:22px 28px;border-bottom:1px solid ${C.border};">
    <img src="${LOGO}" width="34" height="34" alt="Stela" style="vertical-align:middle;border:0;"/>
    <span style="vertical-align:middle;font-weight:800;font-size:18px;color:${C.ink};margin-left:8px;letter-spacing:-.01em;">Stela</span>
  </td></tr>
  <tr><td style="padding:26px 28px 8px;">
    <p style="margin:0 0 14px;font-size:15px;color:${C.ink};font-weight:700;">${greeting(firstName)}</p>
    ${bodyHtml}
  </td></tr>
  <tr><td style="padding:18px 28px 26px;">
    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:${C.muted};border-top:1px solid ${C.border};padding-top:16px;">
      Stela · Le moteur de croissance Google conforme des commerces locaux.<br/>
      Vous recevez cet email car vous avez demandé notre guide sur www.mystela.fr et accepté d'être recontacté.
      <a href="${unsubUrl}" style="color:${C.brass};">Se désinscrire en un clic</a>. Vos données ne sont ni revendues, ni cédées.
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr>
    <td style="border-radius:12px;background:${C.brass};">
      <a href="${href}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">${label}</a>
    </td></tr></table>`;
}

const p = (html) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:${C.sec};">${html}</p>`;

// Email 1 (immédiat) : livraison du guide + mini-pitch + CTA essai 7 jours.
export function guideEmail({ firstName, unsubUrl }) {
  const body =
    p("Merci pour votre confiance. Voici votre guide, prêt à lire :") +
    `<p style="margin:0 0 4px;font-weight:700;font-size:16px;color:${C.ink};">Le guide Google du commerçant local</p>` +
    p("Tout ce qu'un commerce local doit savoir pour tirer le meilleur de Google, collecter des avis en toute conformité et rester visible, y compris dans les réponses des intelligences artificielles.") +
    button(GUIDE_URL, "Télécharger le guide (PDF)") +
    p("Une fois le guide parcouru, si vous voulez automatiser tout cela sans jamais filtrer un avis, Stela le fait pour vous : collecte conforme, réponses prêtes à envoyer, relances clients et suivi de votre visibilité.") +
    button(`${SITE}/tarifs`, "Essayer Stela, 7 jours gratuits") +
    p(`À très vite,<br/>Corentin, cofondateur de Stela`);
  return {
    subject: "Votre guide Google du commerçant local",
    html: shell({
      preheader: "Votre guide est prêt à télécharger.",
      firstName,
      bodyHtml: body,
      unsubUrl,
    }),
  };
}

// Email 2 (J+3, planifié) : relance douce, orientée passage à l'action.
export function closingEmail({ firstName, unsubUrl }) {
  const body =
    p("Avez-vous pu parcourir le guide Google du commerçant local ? Une idée à retenir avant tout : sur Google, la régularité bat les coups d'éclat. Quelques avis récents chaque mois, des réponses soignées, une fiche à jour, et votre visibilité progresse durablement.") +
    p("C'est exactement ce que Stela automatise, en restant 100 % conforme : on invite tous vos clients (jamais un tri sur la note), Nova rédige vos réponses, et vous suivez votre réputation d'un coup d'œil.") +
    button(`${SITE}/tarifs`, "Démarrer l'essai gratuit de 7 jours") +
    p("Une question ? Répondez simplement à cet email, je le lis.") +
    p("Corentin, cofondateur de Stela");
  return {
    subject: "Une minute par jour pour votre réputation Google",
    html: shell({
      preheader: "La régularité bat les coups d'éclat.",
      firstName,
      bodyHtml: body,
      unsubUrl,
    }),
  };
}

// ————————————————————————————————————————————————————————————————
// Envoi Resend. `scheduledAt` (ISO ou langage naturel « in 3 days ») planifie
// l'email côté Resend : pas besoin de cron pour la relance J+3. Retourne l'id
// de l'email Resend (utile pour annuler un envoi planifié), ou null.
// ————————————————————————————————————————————————————————————————
export async function sendEmail({ to, subject, html, scheduledAt }) {
  if (!RESEND_KEY) return null;
  const payload = { from: FROM, to, subject, html };
  if (scheduledAt) payload.scheduled_at = scheduledAt;
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

export function pushLeadToCrm({ email, firstName, consentedAt, scheduledEmailId }) {
  return crmPost("/api/leads", {
    email,
    first_name: firstName || null,
    source: "guide-google",
    marketing_consent: true,
    consented_at: consentedAt || new Date().toISOString(),
    // Id de la relance J+3 planifiée (Resend), stocké côté CRM (colonne dédiée,
    // migration à prévoir) pour traçabilité / annulation. null si non planifiée.
    scheduled_email_id: scheduledEmailId || null,
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

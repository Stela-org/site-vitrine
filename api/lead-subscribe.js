// Vercel Serverless Function (Node). Point de collecte UNIQUE du site : demande
// du lead magnet « Le guide Google du commerçant local ». Double opt-in RGPD.
// Sans stockage : un jeton HMAC signé encode l'email + l'horodatage ; il est
// confirmé par /api/lead-confirm. Défenses anti-bot : honeypot + consentement +
// validation serveur. (Rate limit fort = à brancher sur Vercel KV / Upstash en
// production ; voir docs/LEAD-MAGNET.md.)
import crypto from "node:crypto";

const SITE = "https://www.mystela.fr";
const SECRET = process.env.LEAD_HMAC_SECRET;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.LEAD_FROM || "Stela <contact@mystela.fr>";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const sign = (email, ts) => crypto.createHmac("sha256", SECRET).update(`${email}|${ts}`).digest("hex");

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await new Promise((resolve) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => resolve(d)); });
  const out = {};
  if (raw.trim().startsWith("{")) return JSON.parse(raw);
  for (const pair of raw.split("&")) { const [k, v] = pair.split("="); out[decodeURIComponent(k || "")] = decodeURIComponent((v || "").replace(/\+/g, " ")); }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; return res.end("Method Not Allowed"); }
  const redirect = (path) => { res.statusCode = 303; res.setHeader("Location", SITE + path); res.end(); };

  let body = {};
  try { body = await readBody(req); } catch { return redirect("/guide-google-commercant-local?erreur=1"); }

  const email = String(body.email || "").trim().toLowerCase();
  const honeypot = String(body.website || "").trim();
  const consent = body.consent;

  // Bot détecté : on ne fait rien mais on affiche la même page (pas d'indice).
  if (honeypot) return redirect("/guide-google-commercant-local/merci");
  if (!EMAIL_RE.test(email) || !consent) return redirect("/guide-google-commercant-local?erreur=1");
  if (!SECRET || !RESEND_KEY) { res.statusCode = 500; return res.end("Service non configuré (env manquants)."); }

  const ts = Date.now();
  const token = Buffer.from(JSON.stringify({ e: email, t: ts, s: sign(email, ts) })).toString("base64url");
  const confirmUrl = `${SITE}/api/lead-confirm?token=${token}`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to: email,
        subject: "Confirmez pour recevoir votre guide Stela",
        html: `<p>Merci pour votre intérêt !</p><p>Cliquez pour confirmer et recevoir <strong>Le guide Google du commerçant local</strong> :</p><p><a href="${confirmUrl}">Confirmer et recevoir le guide</a></p><p style="color:#6c6558;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Aucune donnée ne sera conservée.</p>`,
      }),
    });
  } catch { /* échec envoi : on ne divulgue rien, on affiche merci */ }

  return redirect("/guide-google-commercant-local/merci");
}

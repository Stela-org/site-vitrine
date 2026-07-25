// Vercel Serverless Function (Node). Confirmation du double opt-in : vérifie le
// jeton HMAC (email + horodatage signés, valables 48 h), puis délivre le guide
// par email (lien PDF) et redirige vers la page de confirmation.
import crypto from "node:crypto";

const SITE = "https://www.mystela.fr";
const SECRET = process.env.LEAD_HMAC_SECRET;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.LEAD_FROM || "Stela <contact@mystela.fr>";
const GUIDE_URL = process.env.LEAD_GUIDE_URL || `${SITE}/guide/le-guide-google-du-commercant-local.pdf`;
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

const sign = (email, ts) => crypto.createHmac("sha256", SECRET).update(`${email}|${ts}`).digest("hex");

export default async function handler(req, res) {
  const redirect = (path) => { res.statusCode = 303; res.setHeader("Location", SITE + path); res.end(); };
  const token = new URL(req.url, SITE).searchParams.get("token");
  if (!token || !SECRET) return redirect("/guide-google-commercant-local?erreur=lien");

  try {
    const { e, t, s } = JSON.parse(Buffer.from(token, "base64url").toString());
    const expected = sign(e, t);
    const ok = s && expected.length === s.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s));
    if (!ok || Date.now() - Number(t) > MAX_AGE_MS) return redirect("/guide-google-commercant-local?erreur=lien");

    if (RESEND_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM, to: e,
          subject: "Votre guide Google du commerçant local",
          html: `<p>Merci d'avoir confirmé !</p><p>Téléchargez votre guide : <a href="${GUIDE_URL}">Le guide Google du commerçant local (PDF)</a></p><p>À très vite,<br/>L'équipe Stela</p>`,
        }),
      });
    }
    return redirect("/guide-google-commercant-local/confirme");
  } catch {
    return redirect("/guide-google-commercant-local?erreur=lien");
  }
}

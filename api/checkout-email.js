// Vercel Serverless Function (Node), LOT GADS-2, suivi avancé de la conversion
// `essai_demarre`.
//
// Le problème : /merci-essai est atteinte par la redirection d'un Payment Link
// Stripe. L'email de l'acheteur est saisi CHEZ STRIPE, la vitrine ne le voit
// jamais. Sans lui, Google ne peut pas recoller un clic publicitaire et un essai
// démarré plus tard sur un autre appareil.
//
// Le montage : la success_url des Payment Links porte ?session_id={CHECKOUT_SESSION_ID}
// (réglage côté tableau de bord Stripe, voir docs/GADS-2.md). La page appelle
// cette fonction avec cet identifiant ; on lit la session via l'API Stripe et on
// renvoie UNIQUEMENT l'empreinte SHA-256 de l'email normalisé.
//
// Pourquoi l'empreinte et pas l'email : l'exigence du lot est qu'aucun email en
// clair ne parte vers Google. Hacher ici est strictement plus protecteur que le
// renvoyer au navigateur pour l'y hacher, le clair ne traverse alors même pas
// le réseau et n'existe jamais dans la page. Le hachage navigateur reste en
// place (src/lib/track.ts) pour les deux formulaires où la page détient
// réellement la saisie.
import { createHash } from "node:crypto";
import { rateLimit, clientIp, EMAIL_RE } from "../lib/leads.js";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY; // jamais en dur : lu de l'env
// Identifiant de session Checkout : `cs_` + alphanumérique. Tout le reste est
// rejeté sans même appeler Stripe.
const SESSION_RE = /^cs_[A-Za-z0-9_]{10,255}$/;

/** Normalisation Google : minuscules, espaces retirés. Puis SHA-256 hexadécimal. */
function hashEmail(raw) {
  const email = String(raw || "").replace(/\s+/g, "").toLowerCase();
  if (!EMAIL_RE.test(email)) return null;
  return createHash("sha256").update(email, "utf8").digest("hex");
}

export default async function handler(req, res) {
  // Réponse « rien à fournir ». La page sait faire : elle envoie la conversion
  // sans donnée d'identification. Aucun chemin ne doit renvoyer d'email en clair,
  // ni divulguer pourquoi ça a échoué.
  const rien = (status = 200) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({}));
  };

  if (req.method !== "GET") return rien(405);
  if (!STRIPE_KEY) return rien(); // clé absente : dégradation silencieuse.

  const sessionId = new URL(req.url, "https://x").searchParams.get("session_id") || "";
  if (!SESSION_RE.test(sessionId)) return rien();

  // Rate limit par IP : un identifiant de session est devinable en théorie, on
  // n'offre pas un oracle d'empreintes à qui itère.
  const byIp = await rateLimit(`ckmail:${clientIp(req)}`, { max: 20, windowSec: 3600 });
  if (!byIp.ok) return rien();

  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${STRIPE_KEY}` },
    });
    if (!r.ok) return rien();
    const session = await r.json();
    // Seule une session réellement aboutie compte comme conversion.
    if (session.status !== "complete") return rien();
    const hash = hashEmail(session.customer_details?.email || session.customer_email);
    return hash ? (res.setHeader("Content-Type", "application/json"),
      res.setHeader("Cache-Control", "no-store"),
      res.end(JSON.stringify({ h: hash }))) : rien();
  } catch {
    return rien(); // Stripe indisponible : la conversion part sans empreinte.
  }
}

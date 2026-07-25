// Vercel Serverless Function (Node). Désinscription en un clic : vérifie le
// jeton HMAC (email signé, sans expiration), marque le lead désinscrit côté CRM
// (POST app.mystela.fr/api/leads, marketing_consent:false), puis affiche une
// page de confirmation. Aucun stockage local : la source de vérité est le CRM.
import {
  SITE,
  verifyUnsub,
  markUnsubscribedInCrm,
  cancelScheduledEmail,
} from "../lib/leads.js";

const PAGE = "/guide-google-commercant-local";

export default async function handler(req, res) {
  // POST = désinscription One-Click (RFC 8058, déclenchée par Gmail/Outlook) :
  // on répond 200 sans redirection. GET = clic navigateur : page /desinscrit.
  const isOneClick = req.method === "POST";
  const done = (path) => {
    if (isOneClick) {
      res.statusCode = 200;
      return res.end("OK");
    }
    res.statusCode = 303;
    res.setHeader("Location", SITE + path);
    res.end();
  };

  const token = new URL(req.url, SITE).searchParams.get("token");
  const parsed = token ? verifyUnsub(token) : null;
  if (!parsed) return done(`${PAGE}?erreur=lien`);
  const { email, scheduledId } = parsed;

  // 1) Annuler la relance J+3 encore en attente AVANT de marquer la
  //    désinscription. Si elle est déjà partie, Resend renvoie une erreur : on
  //    continue sans bruit (l'utilisateur ne doit jamais recevoir la relance
  //    après s'être désinscrit).
  if (scheduledId) await cancelScheduledEmail(scheduledId).catch(() => {});

  // 2) Marquer le lead désinscrit côté CRM. Best effort : même si le CRM est
  //    momentanément indisponible, on confirme à l'utilisateur (le CRM
  //    déduplique/rejoue de son côté).
  await markUnsubscribedInCrm(email).catch(() => {});

  return done(`${PAGE}/desinscrit`);
}

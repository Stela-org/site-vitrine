// Vercel Serverless Function (Node). Désinscription en un clic : vérifie le
// jeton HMAC (email signé, sans expiration), marque le lead désinscrit côté CRM
// (POST app.mystela.fr/api/leads, marketing_consent:false), puis affiche une
// page de confirmation. Aucun stockage local : la source de vérité est le CRM.
import { SITE, verifyUnsub, markUnsubscribedInCrm } from "../lib/leads.js";

const PAGE = "/guide-google-commercant-local";

export default async function handler(req, res) {
  const redirect = (path) => {
    res.statusCode = 303;
    res.setHeader("Location", SITE + path);
    res.end();
  };

  const token = new URL(req.url, SITE).searchParams.get("token");
  const email = token ? verifyUnsub(token) : null;
  if (!email) return redirect(`${PAGE}?erreur=lien`);

  // Best effort : même si le CRM est momentanément indisponible, on confirme la
  // désinscription à l'utilisateur (le CRM déduplique/rejoue de son côté).
  await markUnsubscribedInCrm(email).catch(() => {});

  return redirect(`${PAGE}/desinscrit`);
}

// LOT DIAG-1 : envoi du rapport de diagnostic par email. SUITE OPTIONNELLE.
//
// Le diagnostic complet est deja AFFICHE avant qu'on arrive ici. Cette route ne
// deverrouille rien : elle rend un service a qui veut garder le rapport. C'est
// la difference entre une capture d'email et une prise d'otage, et c'est la
// marque.
//
// RGPD, perimetre exact de ce qui est conserve :
//   • l'email, le consentement, la date. Rien d'autre.
//   • PAS l'etablissement diagnostique, PAS son score, PAS son adresse. Le
//     rapport part dans l'email et ne laisse pas de trace liee a la personne.
//   • le consentement est EXPLICITE et jamais precoche : sans `consentement`
//     strictement egal a true, on refuse, meme si l'email est valide.
import { sendEmail, shell, unsubUrlFor, isConfigured, pushLeadToCrm, EMAIL_RE, SITE } from "../lib/leads.js";
import { mesurerFiche, diagnostiquer, verdict, ceQueStelaChange, cacheLire, cacheEcrire, plafondOk, kvPret, ipClient, cleJour } from "../lib/diagnostic.js";

const PAR_IP = { max: 5, windowSec: 3600 };
const PAR_EMAIL = { max: 3, windowSec: 86400 };
const GLOBAL_JOUR = { max: 800, windowSec: 86400 };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const P = (html) => `<p style="margin:0 0 14px;">${html}</p>`;

async function lireCorps(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const brut = await new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => resolve(d));
  });
  try {
    return JSON.parse(brut || "{}");
  } catch {
    return {};
  }
}

const json = (res, code, charge) => {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(charge));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { erreur: "methode" });

  const corps = await lireCorps(req);
  if (String(corps.site_web || "").trim()) return json(res, 200, { ok: true }); // honeypot : silence.
  if (!kvPret()) return json(res, 503, { erreur: "indisponible" });

  const email = String(corps.email || "").trim().slice(0, 120).toLowerCase();
  const consentement = corps.consentement === true;
  const placeId = String(corps.placeId || "").trim().slice(0, 300);

  if (!EMAIL_RE.test(email)) return json(res, 400, { erreur: "email_invalide" });
  // Le consentement n'est pas deductible d'un email saisi : il se donne a part.
  if (!consentement) return json(res, 400, { erreur: "consentement_requis" });
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) return json(res, 400, { erreur: "fiche_invalide" });

  const ip = ipClient(req);
  if (!(await plafondOk(`rap:ip:${ip}`, PAR_IP))) return json(res, 429, { erreur: "trop_de_demandes" });
  if (!(await plafondOk(`rap:em:${email}`, PAR_EMAIL))) return json(res, 429, { erreur: "trop_de_demandes" });

  // Sans Resend ni secret de desinscription, on ne peut pas envoyer un email
  // marketing conforme (le lien de desinscription en fait partie). On le dit
  // plutot que d'afficher une confirmation mensongere.
  if (!isConfigured()) return json(res, 503, { erreur: "indisponible" });

  // Le rapport est RECALCULE cote serveur, jamais recu du navigateur : sinon
  // n'importe qui ferait envoyer par notre domaine un contenu de son choix.
  let metriques = await cacheLire(placeId);
  if (!metriques) {
    if (!(await plafondOk(cleJour(), GLOBAL_JOUR))) return json(res, 503, { erreur: "indisponible" });
    const { data, error } = await mesurerFiche(placeId);
    if (error || !data) return json(res, 502, { erreur: "google_indisponible" });
    metriques = data;
    await cacheEcrire(placeId, metriques);
  }

  const { score, constats } = diagnostiquer(metriques);
  const v = verdict(score, metriques);
  const lignes = constats.map((c) => `<li style="margin:0 0 8px;">${esc(c.texte)}</li>`).join("");

  // LOT DIAG-2 : la section « ce que Stela y changerait », RECALCULEE ICI comme
  // tout le reste du rapport. Rien de ce bloc ne vient du navigateur : sinon
  // n'importe qui ferait partir de notre domaine les arguments de son choix.
  const b = ceQueStelaChange(constats, metriques);
  const blocStela =
    b.mode === "entretien"
      ? P(`<strong>${esc(b.titre)}.</strong> ${esc(b.entretien)}`)
      : P(`<strong>${esc(b.titre)}</strong>`) +
        `<ul style="margin:0 0 14px;padding-left:20px;">${b.lignes.map((l) => `<li style="margin:0 0 8px;">${esc(l.texte)}</li>`).join("")}</ul>` +
        (b.arithmetique ? P(`${esc(b.arithmetique.calcul)} ${esc(b.arithmetique.suite)}`) : "");

  const body =
    P(`Voici le diagnostic de la fiche Google de <strong>${esc(metriques.nom || "votre etablissement")}</strong>.`) +
    P(`<strong>Score : ${score} sur 100.</strong> ${esc(v.titre)}. ${esc(v.texte)}`) +
    `<ul style="margin:0 0 14px;padding-left:20px;">${lignes}</ul>` +
    blocStela +
    P("Ce diagnostic ne mesure que ce que Google publie sur votre fiche. Il ne regarde ni vos reponses aux avis, ni vos statistiques de visites, qui ne sont lisibles que depuis votre compte.") +
    P(`Si vous voulez que tout cela se fasse tout seul, c'est le role de Stela, avec un essai gratuit de 7 jours : <a href="${SITE}/tarifs" style="color:#15233F;">voir les tarifs</a>.`) +
    P("Corentin, cofondateur de Stela");

  try {
    await sendEmail({
      to: email,
      subject: `Le diagnostic de votre fiche Google : ${score} sur 100`,
      html: shell({ preheader: v.titre, bodyHtml: body, unsubUrl: unsubUrlFor(email) }),
      unsubUrl: unsubUrlFor(email),
    });
  } catch {
    return json(res, 502, { erreur: "envoi_impossible" });
  }

  // Enregistrement du prospect : email, consentement, date. La source distingue
  // ce canal du guide, sans porter le moindre detail sur l'etablissement.
  try {
    await pushLeadToCrm({ email, consentedAt: new Date().toISOString(), source: "diagnostic-google" });
  } catch {
    /* best effort : le rapport est parti, c'est ce que la personne attendait. */
  }

  return json(res, 200, { ok: true });
}

// LOT ROAD-1 : vote « Ca m'interesse » des lignes « prochain trimestre » de
// /roadmap. Meme patron que api/lead-subscribe.js (fonction serverless Node,
// coeur dans lib/), avec deux differences assumees :
//
//   - elle repond en JSON et non par une redirection 303 : le bouton se
//     transforme sur place, la page ne se recharge pas ;
//   - elle ne collecte RIEN. Pas d'email, pas de consentement a recueillir,
//     pas de lead pousse au CRM, pas d'IP stockee. L'IP sert au plafond
//     anti-rafale le temps de la requete et n'est jamais ecrite : la cle de
//     compteur est un hachage tronque, pas l'adresse.
//
// GET  -> { compteurs: { id: n }, votes: [id], seuil, disponible }
// POST -> { id } ; rend { compteur, votes: true } et pose le cookie rv_<id>.
//
// Le double vote est arrete par le cookie, cote SERVEUR : un second POST qui
// porte rv_<id> rend le compteur inchange sans incrementer. Ce n'est pas une
// identification du visiteur, c'est la memoire du navigateur — quelqu'un qui
// efface ses cookies revote, et c'est acceptable pour un compteur d'interet.
import crypto from "node:crypto";
import {
  VOTABLES,
  SEUIL_AFFICHAGE,
  estVotable,
  kvPret,
  lireCompteurs,
  incrementer,
  dejaVote,
  votesDuNavigateur,
  cookieVote,
} from "../lib/roadmap.js";
import { rateLimit, clientIp } from "../lib/leads.js";

// Anti-rafale : 30 votes par heure et par IP. Genereux (sept lignes, plusieurs
// personnes derriere une meme sortie d'entreprise) mais borne un script.
const PAR_IP = { max: 30, windowSec: 3600 };

const json = (res, code, charge, cookie) => {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  // Jamais mis en cache par un intermediaire : la reponse depend des cookies
  // du visiteur et d'un compteur qui bouge.
  res.setHeader("Cache-Control", "no-store");
  if (cookie) res.setHeader("Set-Cookie", cookie);
  res.end(JSON.stringify(charge));
};

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

export default async function handler(req, res) {
  if (req.method === "GET") {
    const compteurs = await lireCompteurs();
    return json(res, 200, {
      compteurs: compteurs || {},
      votes: votesDuNavigateur(req),
      seuil: SEUIL_AFFICHAGE,
      disponible: compteurs !== null,
    });
  }

  if (req.method !== "POST") return json(res, 405, { erreur: "methode" });

  const corps = await lireCorps(req);
  const id = String(corps.id || "").trim().slice(0, 60);

  // Liste blanche : les seuls id acceptes sont ceux des lignes « prochain
  // trimestre » du JSON. Une ligne livree ou en cours ne se vote pas, et un id
  // invente ne cree pas de cle.
  if (!estVotable(id)) return json(res, 400, { erreur: "ligne_inconnue" });

  if (!kvPret()) return json(res, 503, { erreur: "indisponible" });

  // Deja vote : on rend l'etat courant sans incrementer et sans repousser de
  // cookie. C'est le chemin du « vote puis rechargement ».
  if (dejaVote(req, id)) {
    const compteurs = await lireCompteurs();
    return json(res, 200, { compteur: compteurs?.[id] ?? 0, votes: true, deja: true });
  }

  // Plafond par IP. L'adresse est HACHEE avant de servir de cle : le magasin ne
  // contient jamais une adresse lisible, et la cle expire avec la fenetre.
  const empreinte = crypto.createHash("sha256").update(clientIp(req)).digest("hex").slice(0, 16);
  const plafond = await rateLimit(`rv:${empreinte}`, PAR_IP);
  if (!plafond.ok) return json(res, 429, { erreur: "trop_de_votes" });

  const compteur = await incrementer(id);
  // FAIL-CLOSED : sans increment reellement ecrit, pas de cookie et pas de
  // « Merci ». Le visiteur pourra reessayer, plutot que d'etre remercie pour un
  // vote perdu.
  if (compteur === null) return json(res, 503, { erreur: "indisponible" });

  return json(res, 200, { compteur, votes: true }, cookieVote(id));
}

// Expose pour les controles manuels (curl) : rappel des lignes votables.
export { VOTABLES };

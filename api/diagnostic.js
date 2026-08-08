// LOT DIAG-1 : route serveur du diagnostic de fiche Google.
//
// Elle existe pour UNE raison de securite : la cle Places ne doit jamais entrer
// dans le navigateur. Une cle Places dans un bundle public est une cle publique,
// et une cle Places publique est une facture publique.
//
// Deux etapes, deux appels factures, deux plafonds :
//   action=recherche   -> Text Search, rend jusqu'a 5 candidats (nom + adresse)
//   action=diagnostic  -> Place Details sur le candidat CHOISI, puis score
//
// L'etape de choix n'est pas de la friction : un « Le Bistrot, Lyon » renvoie
// cinq etablissements, et diagnostiquer le mauvais est pire que ne rien
// diagnostiquer.
import {
  chercherEtablissements,
  mesurerFiche,
  diagnostiquer,
  verdict,
  plafondOk,
  cacheLire,
  cacheEcrire,
  kvPret,
  ipClient,
  cleJour,
} from "../lib/diagnostic.js";

// Plafonds. Par IP pour arreter un curieux, globaux pour borner la facture meme
// si l'attaque vient de mille adresses.
const PAR_IP_RECHERCHE = { max: 15, windowSec: 3600 };
const PAR_IP_DIAGNOSTIC = { max: 10, windowSec: 3600 };
const GLOBAL_JOUR = { max: 800, windowSec: 86400 };

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
  // Aucune mise en cache par un intermediaire : la reponse depend du plafond.
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(charge));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { erreur: "methode" });

  const corps = await lireCorps(req);

  // Honeypot : un champ que seul un robot remplit. On repond « rien trouve »
  // plutot qu'une erreur, pour ne pas lui apprendre qu'il a ete repere.
  if (String(corps.site_web || "").trim()) return json(res, 200, { candidats: [] });

  // FAIL-CLOSED, decision du lot DIAG-1 : sans compteur, pas d'appel facture.
  if (!kvPret()) return json(res, 503, { erreur: "indisponible" });

  const ip = ipClient(req);
  const action = String(corps.action || "").trim();

  if (action === "recherche") {
    const q = String(corps.q || "").trim().slice(0, 120);
    if (q.length < 3) return json(res, 400, { erreur: "requete_courte" });

    if (!(await plafondOk(`ip:r:${ip}`, PAR_IP_RECHERCHE))) return json(res, 429, { erreur: "trop_de_demandes" });
    if (!(await plafondOk(cleJour(), GLOBAL_JOUR))) return json(res, 503, { erreur: "indisponible" });

    const { data, error } = await chercherEtablissements(q);
    if (error) return json(res, 502, { erreur: "google_indisponible" });
    return json(res, 200, { candidats: data });
  }

  if (action === "diagnostic") {
    const placeId = String(corps.placeId || "").trim().slice(0, 300);
    if (!/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) return json(res, 400, { erreur: "fiche_invalide" });

    if (!(await plafondOk(`ip:d:${ip}`, PAR_IP_DIAGNOSTIC))) return json(res, 429, { erreur: "trop_de_demandes" });

    // Cache d'abord : un etablissement deja diagnostique dans les 24 h ne
    // recoute rien, et ne consomme donc pas le plafond journalier.
    let metriques = await cacheLire(placeId);
    if (!metriques) {
      if (!(await plafondOk(cleJour(), GLOBAL_JOUR))) return json(res, 503, { erreur: "indisponible" });
      const { data, error } = await mesurerFiche(placeId);
      if (error || !data) return json(res, 502, { erreur: "google_indisponible" });
      metriques = data;
      await cacheEcrire(placeId, metriques);
    }

    const { score, constats } = diagnostiquer(metriques);
    return json(res, 200, {
      etablissement: { nom: metriques.nom, adresse: metriques.adresse },
      score,
      verdict: verdict(score),
      constats,
    });
  }

  return json(res, 400, { erreur: "action_inconnue" });
}

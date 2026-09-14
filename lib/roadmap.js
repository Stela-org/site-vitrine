// lib/roadmap.js — coeur du vote « Ca m'interesse » de la page /roadmap.
// Partage par la fonction serverless api/roadmap-vote.js. Vercel bundle ce
// module (importe hors /api, donc jamais route comme fonction), sur le meme
// modele que lib/leads.js et lib/diagnostic.js.
//
// CE QU'ON STOCKE, ET RIEN D'AUTRE : un entier par ligne de roadmap. Pas
// d'email, pas d'IP, pas d'identifiant de navigateur, pas d'horodatage par
// vote. Le seul etat cote visiteur est un cookie `rv_<id>` qui ne contient que
// le chiffre 1 : il dit « ce navigateur a deja vote sur cette ligne », il ne
// dit pas qui.
//
// BACKEND : Upstash Redis REST, celui que lib/leads.js utilise deja pour ses
// compteurs (rateLimit) et lib/diagnostic.js pour ses plafonds. Aucune table
// Supabase n'existe cote vitrine : le site est statique, seules les fonctions
// serverless ont un etat, et leur magasin de compteurs est celui-la. Une table
// `roadmap_votes { id, count }` aurait exige une base entiere pour sept
// entiers.
//
// Le compteur est un COMPTEUR, pas une mesure : il sert a classer l'interet,
// jamais a etre publie comme un chiffre d'audience.
import roadmap from "../src/content/roadmap.json" with { type: "json" };

/** Lignes ouvertes au vote : uniquement « prochain trimestre ». */
export const VOTABLES = roadmap.filter((l) => l.status === "prochain").map((l) => l.id);

/** Seuil d'affichage du compteur. Sous ce seuil, on ne montre pas « 1 » : un
 *  compteur a 1 dit surtout que personne ne s'y interesse. */
export const SEUIL_AFFICHAGE = 3;

export const estVotable = (id) => VOTABLES.includes(id);

const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const kvPret = () => Boolean(KV_URL && KV_TOKEN);

async function kv(commande) {
  const r = await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commande),
  });
  if (!r.ok) throw new Error(`KV ${r.status}`);
  return r.json();
}

const cle = (id) => `roadmap:vote:${id}`;

/** Compteurs de toutes les lignes votables. Une ligne jamais votee vaut 0.
 *  Rend null si le magasin est absent ou en panne : l'appelant dit alors que le
 *  vote est indisponible, plutot que d'afficher des zeros qui seraient faux. */
export async function lireCompteurs() {
  if (!kvPret() || VOTABLES.length === 0) return null;
  try {
    const out = await kv(VOTABLES.map((id) => ["GET", cle(id)]));
    const compteurs = {};
    VOTABLES.forEach((id, i) => {
      compteurs[id] = Number(out?.[i]?.result ?? 0) || 0;
    });
    return compteurs;
  } catch {
    return null;
  }
}

/** Incremente une ligne et rend son nouveau total, ou null si le magasin est
 *  indisponible. FAIL-CLOSED : sans compteur tenu, on ne pose pas le cookie et
 *  on ne remercie pas — un « Merci » pour un vote perdu est un mensonge. */
export async function incrementer(id) {
  if (!kvPret()) return null;
  try {
    const out = await kv([["INCR", cle(id)]]);
    const n = Number(out?.[0]?.result);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

// ————————————————————————————————————————————————————————————————
// Cookie `rv_<id>`. Un an, SameSite=Lax, HttpOnly : le navigateur le renvoie,
// le JavaScript de la page n'y touche jamais. C'est le serveur qui dit a la
// page sur quelles lignes ce navigateur a deja vote (champ `votes` du GET), ce
// qui evite d'exposer un etat que du script pourrait falsifier a l'affichage.
// Valeur « 1 » : il n'y a rien d'autre a y mettre.
// ————————————————————————————————————————————————————————————————
export const UN_AN = 31536000;

export function dejaVote(req, id) {
  const brut = String(req.headers?.cookie || "");
  return brut.split(";").some((c) => c.trim().startsWith(`rv_${id}=`));
}

export function votesDuNavigateur(req) {
  return VOTABLES.filter((id) => dejaVote(req, id));
}

export function cookieVote(id) {
  return `rv_${id}=1; Max-Age=${UN_AN}; Path=/; SameSite=Lax; HttpOnly; Secure`;
}

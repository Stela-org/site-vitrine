// LOT DEVIS-1 : l'URL du calendrier de prise de rendez-vous, en UN seul endroit.
//
// Elle est lue par deux mondes qui ne se parlent pas : la fonction serveur
// `api/devis.js`, qui y redirige après un envoi valide, et la page
// `/pour/multi-etablissements`, qui doit pouvoir y renvoyer un visiteur revenu
// sans avoir pris de créneau. Dupliquer la constante, c'est prendre le risque
// qu'un changement de lien ne soit répercuté que d'un côté, et que la moitié
// des prospects tombe sur un calendrier mort sans que rien ne le signale.
//
// Fichier volontairement sans dépendance : il part aussi dans le bundle client.
export const CALENDAR_URL = "https://calendar.app.google/hchodXwU2y3PhpeW8";

// TEMPORAIRE (passe sandbox ZELTY-1, superviseur 27/07/2026) : capture des
// webhooks du restaurant SANDBOX Zelty pour observer le mécanisme d'auth
// (header ? corps ? signature ?) et les noms de champs réels. Ne reçoit que
// des données de test du bac à sable. À SUPPRIMER une fois la passe terminée.
export default async function handler(req, res) {
  let raw = "";
  await new Promise((resolve) => {
    req.on("data", (c) => (raw += c));
    req.on("end", resolve);
  });
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    // On logue tout sauf les en-têtes d'infra sans intérêt (cookies absents ici).
    if (!["x-vercel-proxy-signature", "x-vercel-sc-headers", "forwarded"].includes(k)) headers[k] = v;
  }
  console.log("[zcap] method:", req.method, "headers:", JSON.stringify(headers));
  console.log("[zcap] body:", raw.slice(0, 4000));
  res.statusCode = 200;
  res.end("ok");
}

// Test de fumée d'un déploiement, sans aucune écriture ni connexion.
//
//   npm run smoke                                  (production)
//   npm run smoke -- https://autre-deploiement.vercel.app
//
// Vérifie : pages publiques servies, pages protégées renvoyées vers la connexion, routes API
// fermées sans session, ancienne route retirée, redirection ouverte refusée, en-têtes de
// sécurité, aucun secret dans le HTML public. À lancer après chaque déploiement.

const BASE = (process.argv[2] || process.env.SMOKE_BASE_URL || "https://hammersuite-kk8d.vercel.app").replace(/\/$/, "");

const resultats = [];
function etape(nom, ok, detail = "") {
  resultats.push({ nom, ok });
  console.log(`${ok ? "OK   " : "ÉCHEC"} ${nom}${detail ? " : " + detail : ""}`);
}
const get = (chemin, init = {}) => fetch(BASE + chemin, { redirect: "manual", ...init });

try {
  // 1. Pages publiques
  for (const chemin of ["/", "/pricing", "/login", "/signup", "/forgot-password"]) {
    const r = await get(chemin);
    etape(`Page publique ${chemin}`, r.status === 200, `HTTP ${r.status}`);
  }

  // 2. Pages protégées : renvoi vers la connexion
  for (const chemin of ["/dashboard", "/dashboard/dossiers", "/dashboard/settings", "/saisie"]) {
    const r = await get(chemin);
    const vers = r.headers.get("location") || "";
    etape(`Page protégée ${chemin}`, [302, 307, 308].includes(r.status) && vers.includes("/login"), `HTTP ${r.status} -> ${vers}`);
  }

  // 3. Routes API fermées sans session
  for (const chemin of ["/api/generate-courrier", "/api/analyze-photo", "/api/extract-document", "/api/courriers/refresh-url"]) {
    const r = await fetch(BASE + chemin, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    etape(`API sans session ${chemin}`, r.status === 401, `HTTP ${r.status}`);
  }

  // 4. Ancienne route retirée
  {
    const r = await fetch(BASE + "/api/generate-catalogue", { method: "POST" });
    etape("Route retirée /api/generate-catalogue", [404, 405].includes(r.status), `HTTP ${r.status}`);
  }

  // 5. Redirection ouverte refusée par le rappel d'authentification
  {
    const r = await get("/auth/callback?code=invalide&next=//exemple.invalid/piege");
    const vers = r.headers.get("location") || "";
    const ok = [302, 303, 307, 308].includes(r.status) && vers.includes("/login") && !vers.includes("exemple.invalid");
    etape("Redirection ouverte refusée", ok, `HTTP ${r.status} -> ${vers}`);
  }

  // 6. En-têtes de sécurité et absence de secret dans le HTML public
  {
    const r = await get("/");
    const h = (nom) => (r.headers.get(nom) || "").toLowerCase();
    etape("HSTS", h("strict-transport-security").includes("max-age="));
    etape("X-Content-Type-Options", h("x-content-type-options") === "nosniff");
    etape("X-Frame-Options", ["deny", "sameorigin"].includes(h("x-frame-options")));
    etape("Referrer-Policy", h("referrer-policy").length > 0, h("referrer-policy"));
    etape("X-Powered-By absent", !r.headers.has("x-powered-by"));
    const html = await r.text();
    const fuite = /service_role|sk-ant-|PDFMONKEY_API_KEY|SUPABASE_SERVICE/i.test(html);
    etape("Aucun secret dans le HTML public", !fuite);
  }
} catch (e) {
  etape("Exécution", false, e.message.split("\n")[0]);
}

const echecs = resultats.filter((r) => !r.ok).length;
console.log(echecs ? `\n${echecs} échec(s) sur ${resultats.length} contrôles (${BASE}).` : `\nFumée passée : ${resultats.length} contrôles (${BASE}).`);
process.exit(echecs ? 1 : 0);

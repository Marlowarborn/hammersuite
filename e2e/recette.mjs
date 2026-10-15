// Recette de bout en bout, en local, avec le compte de démonstration du seed.
//
//   npm run dev -- -p 3100        (dans un autre terminal)
//   npm run test:e2e
//
// Variables optionnelles : E2E_BASE_URL (défaut http://localhost:3100), E2E_EMAIL,
// E2E_PASSWORD (défauts : compte de démo de supabase/seed.sql), E2E_HEADED=1 pour voir.
// Utilise le Chrome installé (playwright-core, aucun navigateur téléchargé).
//
// Tout ce que la recette crée porte le marqueur [recette] et est supprimé à la fin, qu'elle
// réussisse ou non. Refuse de tourner ailleurs qu'en local, sauf E2E_ALLOW_REMOTE=1.

import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.E2E_BASE_URL || "http://localhost:3100";
const EMAIL = process.env.E2E_EMAIL || "demo@marto.test";
const PASSWORD = process.env.E2E_PASSWORD || "demo-marto-local";
const MARQUEUR = "[recette]";
const DOSSIER_DEMO = "00000000-0000-4000-8000-0000000000b1";

const hote = new URL(BASE).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(hote) && process.env.E2E_ALLOW_REMOTE !== "1") {
  console.error(`Refus : ${BASE} n'est pas local. La recette écrit des données ; E2E_ALLOW_REMOTE=1 pour forcer.`);
  process.exit(2);
}

// Variables Supabase : celles de .env.local, pour le nettoyage par l'API.
function lireEnv() {
  const env = { ...process.env };
  const fichier = join(ici, "..", ".env.local");
  if (existsSync(fichier)) {
    for (const ligne of readFileSync(fichier, "utf8").split(/\r?\n/)) {
      const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  return env;
}
const env = lireEnv();

const resultats = [];
const erreursReseau = [];
function etape(nom, ok, detail = "") {
  resultats.push({ nom, ok, detail });
  console.log(`${ok ? "OK   " : "ÉCHEC"} ${nom}${detail ? " : " + detail : ""}`);
}

async function nettoyer() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log("Nettoyage ignoré : variables Supabase absentes.");
    return;
  }
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { error: e1 } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (e1) { console.log("Nettoyage impossible : " + e1.message); return; }
  const { data: objets } = await sb.from("objets").select("id, photo_path").or(`titre.ilike.%${MARQUEUR}%,description.ilike.%${MARQUEUR}%`);
  const photos = (objets || []).map((o) => o.photo_path).filter(Boolean);
  if (photos.length) await sb.storage.from("objet-photos").remove(photos);
  if (objets?.length) await sb.from("objets").delete().in("id", objets.map((o) => o.id));
  const { data: contrats } = await sb.from("dossier_contrats").select("id, fichier_path").ilike("description", `%${MARQUEUR}%`);
  const fichiers = (contrats || []).map((c) => c.fichier_path).filter(Boolean);
  if (fichiers.length) await sb.storage.from("dossier-docs").remove(fichiers);
  if (contrats?.length) await sb.from("dossier_contrats").delete().in("id", contrats.map((c) => c.id));
  console.log(`Nettoyage : ${objets?.length || 0} objet(s), ${contrats?.length || 0} contrat(s), ${photos.length + fichiers.length} fichier(s) retirés.`);
  await sb.auth.signOut();
}

const navigateur = await chromium.launch({ channel: "chrome", headless: process.env.E2E_HEADED !== "1" });
const page = await navigateur.newPage();
page.on("response", (r) => {
  if (r.url().includes("supabase.co") && r.status() >= 400) {
    erreursReseau.push(`${r.status()} ${r.request().method()} ${r.url().split("?")[0].split("/").slice(-2).join("/")}`);
  }
});
const lire = async () => (await page.locator("main").innerText()).replace(/\s+/g, " ");

try {
  // 1. Connexion
  await page.goto(`${BASE}/login`);
  await page.locator("input[type=email]").fill(EMAIL);
  await page.locator("input[type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL("**/dashboard**", { timeout: 20000 });
  await page.waitForTimeout(2500);
  const accueil = await lire();
  etape("Connexion et tableau de bord", /Dossiers en cours/i.test(accueil) && !/Bonjour Diane/.test(accueil));

  // 2. Dossier : checklist créée une seule fois, onglets lisibles
  await page.goto(`${BASE}/dashboard/dossiers/${DOSSIER_DEMO}`);
  await page.waitForTimeout(3500);
  const dossier = await lire();
  etape("Dossier et checklist", /Ouverture/.test(dossier) && /Clôture/.test(dossier));

  // 3. Objet judiciaire avec photo
  await page.getByText(/^Objets \(\d+\)$/).first().click();
  await page.waitForTimeout(800);
  const avant = Number((await lire()).match(/Tous \((\d+)\)/)?.[1] || 0);
  await page.getByText("+ Ajouter un objet").click();
  await page.waitForTimeout(800);
  await page.locator("select").last().selectOption({ label: "Matériel" });
  await page.getByPlaceholder("Description détaillée de l'objet…").fill(`Objet de test ${MARQUEUR}`);
  await page.locator("input[type=number]").nth(0).fill("100");
  await page.locator("input[type=file][accept='image/*']").setInputFiles(join(ici, "fixtures", "objet.png"));
  await page.getByRole("button", { name: "Ajouter l'objet" }).click();
  await page.waitForTimeout(5000);
  const apres = Number((await lire()).match(/Tous \((\d+)\)/)?.[1] || 0);
  const imageSignee = await page.locator("main img[src*='token=']").count();
  etape("Objet avec photo (numéro par la base, photo signée)", apres === avant + 1 && imageSignee > 0, `${avant} -> ${apres} objets`);

  // 4. Contrat avec fichier
  await page.getByText("Annexes", { exact: true }).first().click();
  await page.waitForTimeout(1000);
  await page.getByText("+ Ajouter").first().click();
  await page.waitForTimeout(800);
  await page.getByPlaceholder(/ex\. véhic/i).fill(`Contrat de test ${MARQUEUR}`);
  await page.locator("input[type=file]").first().setInputFiles(join(ici, "fixtures", "contrat.pdf"));
  await page.getByRole("button", { name: /^Enregistrer$/ }).last().click();
  await page.waitForTimeout(4000);
  const lienSigne = await page.locator("main a[href*='token=']").count();
  etape("Contrat avec fichier (lien signé)", (await lire()).includes(MARQUEUR) && lienSigne > 0);

  // 5. Répertoire : création avec numéro attribué par la base
  await page.goto(`${BASE}/dashboard/lots`);
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /enregistrer un objet/i }).click();
  await page.waitForTimeout(800);
  await page.getByPlaceholder("ex. Tableau huile sur toile").fill(`Lampe de test ${MARQUEUR}`);
  await page.getByRole("button", { name: /^(Enregistrer|Créer|Ajouter)/ }).last().click();
  await page.waitForTimeout(3000);
  etape("Répertoire : création", (await lire()).includes(`Lampe de test ${MARQUEUR}`));

  // 6. Paramètres : lecture de l'étude (aucune modification)
  await page.goto(`${BASE}/dashboard/settings`);
  const tva = await page.getByText(/TVA intracommunautaire/i).first().waitFor({ timeout: 15000 }).then(() => true, () => false);
  etape("Paramètres de l'étude", tva);

  etape("Aucune erreur Supabase", erreursReseau.length === 0, erreursReseau.join(" | "));
} catch (e) {
  etape("Exécution", false, e.message.split("\n")[0]);
} finally {
  await navigateur.close();
  await nettoyer().catch((e) => console.log("Nettoyage en erreur : " + e.message));
}

const echecs = resultats.filter((r) => !r.ok).length;
console.log(echecs ? `\n${echecs} échec(s) sur ${resultats.length} étapes.` : `\nRecette passée : ${resultats.length} étapes.`);
process.exit(echecs ? 1 : 0);

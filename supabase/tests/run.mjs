// Rejoue les migrations, le seed et les tests RLS sur un Postgres embarqué (PGlite).
// Usage : node supabase/tests/run.mjs   (ou npm run test:sql). Aucun service distant.
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const steps = [
  ["bouchon auth/storage", join(here, "stub_supabase.sql")],
  ["0001_schema", join(root, "migrations", "0001_schema.sql")],
  ["0002_rls", join(root, "migrations", "0002_rls.sql")],
  ["rejeu 0001 (idempotence)", join(root, "migrations", "0001_schema.sql")],
  ["rejeu 0002 (idempotence)", join(root, "migrations", "0002_rls.sql")],
  ["seed", join(root, "seed.sql")],
  ["tests RLS", join(here, "rls.sql")],
];

const db = new PGlite({ extensions: { pgcrypto } });
let failed = false;
for (const [label, file] of steps) {
  const sql = readFileSync(file, "utf8");
  try {
    await db.exec(sql);
    console.log(`OK    ${label}`);
  } catch (e) {
    failed = true;
    console.log(`ÉCHEC ${label}: ${e.message}`);
    if (e.position) console.log("  position", e.position, JSON.stringify(sql.slice(Math.max(0, e.position - 160), Number(e.position) + 80)));
    if (e.detail) console.log("  detail", e.detail);
    if (e.hint) console.log("  hint", e.hint);
    break;
  }
}
await db.close();
process.exit(failed ? 1 : 0);

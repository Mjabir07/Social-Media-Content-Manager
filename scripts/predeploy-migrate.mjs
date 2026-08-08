// Apply pending Prisma migrations at build time.
//
// Migrations need a DIRECT (non-pooled) Postgres connection: pgbouncer / Neon's
// "-pooler" endpoint can't hold the advisory lock `migrate deploy` takes, which
// fails the build with P1002. So we run against a direct URL:
//   - use DIRECT_URL if it's set, else
//   - derive it from DATABASE_URL by stripping "-pooler" (Neon's direct host).
// If neither is available (local/preview build with no DB) we skip cleanly so the
// build still succeeds.
import { execSync } from "node:child_process";

const pooled = process.env.DATABASE_URL || "";
const direct = process.env.DIRECT_URL || pooled.replace("-pooler", "");

if (!direct) {
  console.log("[predeploy-migrate] No DATABASE_URL/DIRECT_URL — skipping migrate deploy.");
  process.exit(0);
}

try {
  execSync("prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DIRECT_URL: direct },
  });
} catch (err) {
  console.error("[predeploy-migrate] migrate deploy failed:", err?.message ?? err);
  process.exit(1);
}

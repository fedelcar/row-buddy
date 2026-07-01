/**
 * Manually sync the login account and (on a brand-new database) demo data.
 *
 *   npm run db:seed
 *
 * Reads SEED_USERNAME / SEED_PASSWORD from the environment (or .env.local).
 * Normally you don't need this — the app runs migrations and seeds itself on
 * first boot — but it's handy for adding a second account or rotating a
 * password without redeploying.
 */
import { loadEnv } from "../db/env";

loadEnv();

async function main() {
  const { getDb } = await import("../db");
  const { ensureAccount } = await import("../db/seed-data");

  // getDb() migrates and, on a fresh database, seeds demo data + account.
  const db = await getDb();

  const username = process.env.SEED_USERNAME ?? "coach";
  const password = process.env.SEED_PASSWORD ?? "row-buddy";
  const result = await ensureAccount(db, username, password);
  console.log(`Account "${username}": ${result}.`);
  if (!process.env.SEED_USERNAME || !process.env.SEED_PASSWORD) {
    console.log(
      "⚠️  Used the default username/password — set SEED_USERNAME and SEED_PASSWORD for anything real.",
    );
  }
}

main().then(() => process.exit(0));

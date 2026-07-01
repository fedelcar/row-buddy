import path from "node:path";
import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { rowBuddyDb?: Promise<Db> };

/**
 * Neon over HTTP when DATABASE_URL is set (production / Vercel).
 * Falls back to an embedded PGlite database in ./.pglite for local dev,
 * so `npm run dev` works with zero setup.
 *
 * On first use the database sets itself up: migrations run, the login
 * account is synced to SEED_USERNAME/SEED_PASSWORD, and an empty database
 * gets the demo squad — no manual `db:push`/`db:seed` step required.
 */
export function getDb(): Promise<Db> {
  globalForDb.rowBuddyDb ??= createDb().catch((err) => {
    // Don't cache a failed init — let the next request retry.
    globalForDb.rowBuddyDb = undefined;
    throw err;
  });
  return globalForDb.rowBuddyDb;
}

const MIGRATIONS = { migrationsFolder: path.join(process.cwd(), "drizzle") };

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    const db = drizzle(url, { schema }) as unknown as Db;
    const fresh = await isFreshDatabase(db);
    await runMigrations(() => migrate(db as never, MIGRATIONS));
    await bootstrapData(db, fresh);
    return db;
  }
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL is not set. Add the Neon integration in your Vercel project's Storage tab.",
    );
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite("./.pglite");
  const db = drizzle(client, { schema }) as unknown as Db;
  const fresh = await isFreshDatabase(db);
  await runMigrations(() => migrate(db as never, MIGRATIONS));
  await bootstrapData(db, fresh);
  return db;
}

/** True when the schema has never been created — the only time demo data seeds. */
async function isFreshDatabase(db: Db): Promise<boolean> {
  const result = await db.execute(
    sql`select 1 from information_schema.tables where table_schema = 'public' and table_name = 'athletes'`,
  );
  const rows = Array.isArray(result) ? result : (result as { rows: unknown[] }).rows;
  return rows.length === 0;
}

/** Two cold lambdas can race to migrate a brand-new database; one retry settles it. */
async function runMigrations(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (first) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      await fn();
    } catch {
      throw first;
    }
  }
}

async function bootstrapData(db: Db, fresh: boolean): Promise<void> {
  const { ensureAccount, seedSampleData } = await import("./seed-data");
  const username = process.env.SEED_USERNAME;
  const password = process.env.SEED_PASSWORD;
  if (username && password) {
    const result = await ensureAccount(db, username, password);
    if (result !== "unchanged") console.log(`Login account "${username}" ${result}.`);
  } else if (process.env.NODE_ENV !== "production") {
    await ensureAccount(db, "coach", "row-buddy");
  }
  if (fresh) {
    const counts = await seedSampleData(db);
    console.log(
      `Seeded demo data: ${counts.athletes} athletes, ${counts.tests} erg tests, ${counts.sessions} sessions.`,
    );
  }
}

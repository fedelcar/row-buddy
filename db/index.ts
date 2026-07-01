import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { rowBuddyDb?: Promise<Db> };

/**
 * Neon over HTTP when DATABASE_URL is set (production / Vercel).
 * Falls back to an embedded PGlite database in ./.pglite for local dev,
 * so `npm run dev` works with zero setup.
 */
export function getDb(): Promise<Db> {
  globalForDb.rowBuddyDb ??= createDb();
  return globalForDb.rowBuddyDb;
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle(url, { schema }) as unknown as Db;
  }
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL is not set. Add the Neon integration in your Vercel project's Storage tab.",
    );
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite("./.pglite");
  return drizzle(client, { schema }) as unknown as Db;
}

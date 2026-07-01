/**
 * Seeds the login account and, on an empty database, realistic sample data.
 *
 *   npm run db:seed
 *
 * Reads SEED_USERNAME / SEED_PASSWORD from the environment (or .env.local).
 * Safe to re-run: the account is upserted, sample data is only inserted when
 * there are no athletes yet.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { loadEnv } from "../db/env";
import { getDb } from "../db";
import { athletes, ergTests, sessionResults, sessions, users } from "../db/schema";
import type { Side, TestType } from "../lib/domain";

loadEnv();

// Deterministic PRNG so re-seeding a fresh database gives the same demo data.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260607);

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const SQUAD: Array<{
  name: string;
  ageGroup: string;
  side: Side;
  weightClass: string;
  base2k: number; // starting 2k split (s/500m)
  trend: number; // improvement per test, seconds
}> = [
  { name: "Tom Askwith", ageGroup: "Senior", side: "port", weightClass: "Open", base2k: 98.5, trend: 0.5 },
  { name: "Marcus Boyle", ageGroup: "Senior", side: "starboard", weightClass: "Open", base2k: 99.8, trend: 0.4 },
  { name: "Dan Kowalski", ageGroup: "Senior", side: "both", weightClass: "Open", base2k: 101.2, trend: 0.7 },
  { name: "Leo Fitzgerald", ageGroup: "U23", side: "port", weightClass: "Open", base2k: 102.4, trend: 0.9 },
  { name: "Sam Whitehouse", ageGroup: "U23", side: "starboard", weightClass: "Lightweight", base2k: 104.0, trend: 0.6 },
  { name: "Jonas Meyer", ageGroup: "Senior", side: "scull", weightClass: "Open", base2k: 100.6, trend: 0.3 },
  { name: "Ben Otieno", ageGroup: "U23", side: "both", weightClass: "Open", base2k: 103.1, trend: 1.0 },
  { name: "Chris Hale", ageGroup: "Masters", side: "port", weightClass: "Open", base2k: 107.5, trend: 0.2 },
  { name: "Ravi Sharma", ageGroup: "U19", side: "starboard", weightClass: "Lightweight", base2k: 108.9, trend: 1.2 },
  { name: "Pete Lindqvist", ageGroup: "Masters", side: "scull", weightClass: "Open", base2k: 106.2, trend: -0.2 },
];

async function main() {
  const db = await getDb();

  const username = process.env.SEED_USERNAME ?? "coach";
  const password = process.env.SEED_PASSWORD ?? "row-buddy";
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    await db.update(users).set({ passwordHash }).where(eq(users.username, username));
    console.log(`Updated password for existing account "${username}".`);
  } else {
    await db.insert(users).values({ username, passwordHash });
    console.log(`Created account "${username}".`);
  }
  if (!process.env.SEED_USERNAME || !process.env.SEED_PASSWORD) {
    console.log(
      "⚠️  Using the default username/password. Set SEED_USERNAME and SEED_PASSWORD and re-run — and change them after the first login for anything you care about.",
    );
  }

  const existingAthletes = await db.select({ id: athletes.id }).from(athletes).limit(1);
  if (existingAthletes.length > 0) {
    console.log("Athletes already exist — skipping sample data.");
    return;
  }

  console.log("Seeding sample squad…");
  const inserted = await db
    .insert(athletes)
    .values(SQUAD.map(({ name, ageGroup, side, weightClass }) => ({ name, ageGroup, side, weightClass })))
    .returning({ id: athletes.id });

  // Erg tests: a 2k roughly every 3 weeks over ~4 months, plus scattered 5k/6k/30min.
  const testRows: (typeof ergTests.$inferInsert)[] = [];
  inserted.forEach((row, i) => {
    const spec = SQUAD[i];
    for (let t = 0; t < 6; t++) {
      const daysAgo = 110 - t * 21 + Math.floor(rand() * 5);
      const split = spec.base2k - spec.trend * t + (rand() - 0.5) * 1.2;
      const timeSeconds = Math.round(split * 4 * 10) / 10;
      testRows.push({
        athleteId: row.id,
        date: isoDaysAgo(daysAgo),
        testType: "2k",
        timeSeconds,
        distanceMeters: 2000,
        splitSeconds: timeSeconds / 4,
        strokeRate: 28 + Math.floor(rand() * 6),
        notes: t === 5 && rand() > 0.5 ? "Season test — big effort" : null,
      });
    }
    for (const [testType, meters, offset] of [
      ["5k", 5000, 95],
      ["6k", 6000, 60],
    ] as Array<[TestType, number, number]>) {
      if (rand() > 0.35) {
        const split = spec.base2k + 8 + (rand() - 0.5) * 2;
        const timeSeconds = Math.round(split * (meters / 500) * 10) / 10;
        testRows.push({
          athleteId: row.id,
          date: isoDaysAgo(offset + Math.floor(rand() * 10)),
          testType,
          timeSeconds,
          distanceMeters: meters,
          splitSeconds: timeSeconds / (meters / 500),
          strokeRate: 24 + Math.floor(rand() * 4),
          notes: null,
        });
      }
    }
    if (rand() > 0.5) {
      const split = spec.base2k + 10 + (rand() - 0.5) * 2;
      const meters = Math.round((1800 / split) * 500);
      testRows.push({
        athleteId: row.id,
        date: isoDaysAgo(40 + Math.floor(rand() * 12)),
        testType: "30min",
        timeSeconds: 1800,
        distanceMeters: meters,
        splitSeconds: 1800 / (meters / 500),
        strokeRate: 22 + Math.floor(rand() * 4),
        notes: null,
      });
    }
  });
  await db.insert(ergTests).values(testRows);

  // Sessions: ~4 per week for the last 10 weeks, most with the whole squad.
  const sessionNotes = [
    "Steady state, focus on catches",
    "Technique work in pairs",
    "Pyramid pieces",
    "Long UT2",
    "Race-pace 500s",
    "Easy recovery row",
    null,
    null,
  ];
  for (let week = 9; week >= 0; week--) {
    const plan: Array<{ type: "water" | "erg" | "weights"; day: number }> = [
      { type: "water", day: 6 },
      { type: "water", day: 4 },
      { type: "erg", day: 2 },
      { type: rand() > 0.4 ? "weights" : "water", day: 1 },
    ];
    for (const { type, day } of plan) {
      const daysAgo = week * 7 + day;
      const distanceMeters =
        type === "water"
          ? (10 + Math.floor(rand() * 6)) * 1000
          : type === "erg"
            ? (6 + Math.floor(rand() * 6)) * 1000
            : null;
      const durationSeconds =
        type === "weights" ? 3600 : distanceMeters ? Math.round(distanceMeters * (0.24 + rand() * 0.04)) : null;
      const [s] = await db
        .insert(sessions)
        .values({
          date: isoDaysAgo(daysAgo),
          type,
          distanceMeters,
          durationSeconds,
          notes: sessionNotes[Math.floor(rand() * sessionNotes.length)],
        })
        .returning({ id: sessions.id });
      const attending = inserted.filter(() => rand() > 0.18);
      if (attending.length > 0) {
        await db.insert(sessionResults).values(
          attending.map((a, idx) => {
            const withData = type !== "weights" && rand() > 0.5 && distanceMeters;
            const split = withData ? SQUAD[idx % SQUAD.length].base2k + 14 + (rand() - 0.5) * 4 : null;
            return {
              sessionId: s.id,
              athleteId: a.id,
              timeSeconds: split && distanceMeters ? Math.round(split * (distanceMeters / 500)) : null,
              splitSeconds: split,
              strokeRate: withData ? 18 + Math.floor(rand() * 6) : null,
            };
          }),
        );
      }
    }
  }

  console.log(
    `Seeded ${inserted.length} athletes, ${testRows.length} erg tests, and 40 sessions. Sign in and have a look!`,
  );
}

main().then(() => process.exit(0));

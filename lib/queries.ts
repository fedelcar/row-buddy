import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  athletes,
  ergTests,
  sessionResults,
  sessions,
  type Athlete,
  type ErgTest,
  type Session,
  type SessionResult,
  type TestType,
} from "@/db/schema";

export async function getAthletes(includeInactive = false): Promise<Athlete[]> {
  const db = await getDb();
  const rows = includeInactive
    ? await db.select().from(athletes)
    : await db.select().from(athletes).where(eq(athletes.active, true));
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAthlete(id: number): Promise<Athlete | null> {
  const db = await getDb();
  const [row] = await db.select().from(athletes).where(eq(athletes.id, id)).limit(1);
  return row ?? null;
}

export async function getAthleteTests(athleteId: number): Promise<ErgTest[]> {
  const db = await getDb();
  return db
    .select()
    .from(ergTests)
    .where(eq(ergTests.athleteId, athleteId))
    .orderBy(desc(ergTests.date), desc(ergTests.id));
}

export interface AthleteSessionRow {
  result: SessionResult;
  session: Session;
}

export async function getAthleteSessionResults(athleteId: number): Promise<AthleteSessionRow[]> {
  const db = await getDb();
  const rows = await db
    .select({ result: sessionResults, session: sessions })
    .from(sessionResults)
    .innerJoin(sessions, eq(sessionResults.sessionId, sessions.id))
    .where(eq(sessionResults.athleteId, athleteId))
    .orderBy(desc(sessions.date), desc(sessions.id));
  return rows;
}

/** Personal bests per test type: the row with the lowest split. */
export function personalBests(tests: ErgTest[]): Partial<Record<TestType, ErgTest>> {
  const pbs: Partial<Record<TestType, ErgTest>> = {};
  for (const t of tests) {
    const current = pbs[t.testType];
    if (!current || t.splitSeconds < current.splitSeconds) pbs[t.testType] = t;
  }
  return pbs;
}

/** Fastest split per athlete for a test type, across all athletes. */
export async function getAllPersonalBests(testType: TestType): Promise<Map<number, number>> {
  const db = await getDb();
  const rows = await db
    .select({ athleteId: ergTests.athleteId, split: ergTests.splitSeconds })
    .from(ergTests)
    .where(eq(ergTests.testType, testType));
  const best = new Map<number, number>();
  for (const r of rows) {
    const current = best.get(r.athleteId);
    if (current === undefined || r.split < current) best.set(r.athleteId, r.split);
  }
  return best;
}

export interface LeaderboardEntry {
  athlete: Athlete;
  best: ErgTest;
}

/** Best (fastest-split) test per active athlete for a given test type. */
export async function leaderboard(testType: TestType): Promise<LeaderboardEntry[]> {
  const db = await getDb();
  const rows = await db
    .select({ athlete: athletes, test: ergTests })
    .from(ergTests)
    .innerJoin(athletes, eq(ergTests.athleteId, athletes.id))
    .where(and(eq(ergTests.testType, testType), eq(athletes.active, true)));
  const best = new Map<number, LeaderboardEntry>();
  for (const { athlete, test } of rows) {
    const entry = best.get(athlete.id);
    if (!entry || test.splitSeconds < entry.best.splitSeconds) {
      best.set(athlete.id, { athlete, best: test });
    }
  }
  return [...best.values()].sort((a, b) => a.best.splitSeconds - b.best.splitSeconds);
}

export interface ImprovementEntry {
  athlete: Athlete;
  latest: ErgTest;
  previous: ErgTest;
  /** Positive = seconds faster per 500m than the previous test. */
  deltaSeconds: number;
}

/** Athletes whose two most recent tests of a type show a change, sorted by improvement. */
export async function improvements(testType: TestType): Promise<ImprovementEntry[]> {
  const db = await getDb();
  const rows = await db
    .select({ athlete: athletes, test: ergTests })
    .from(ergTests)
    .innerJoin(athletes, eq(ergTests.athleteId, athletes.id))
    .where(and(eq(ergTests.testType, testType), eq(athletes.active, true)))
    .orderBy(desc(ergTests.date), desc(ergTests.id));
  const byAthlete = new Map<number, { athlete: Athlete; tests: ErgTest[] }>();
  for (const { athlete, test } of rows) {
    const entry = byAthlete.get(athlete.id) ?? { athlete, tests: [] };
    if (entry.tests.length < 2) entry.tests.push(test);
    byAthlete.set(athlete.id, entry);
  }
  const out: ImprovementEntry[] = [];
  for (const { athlete, tests } of byAthlete.values()) {
    if (tests.length < 2) continue;
    const [latest, previous] = tests;
    out.push({ athlete, latest, previous, deltaSeconds: previous.splitSeconds - latest.splitSeconds });
  }
  return out.sort((a, b) => b.deltaSeconds - a.deltaSeconds);
}

export interface SessionWithAthletes {
  session: Session;
  athletes: Array<{ id: number; name: string }>;
}

export async function getSessions(limit?: number): Promise<SessionWithAthletes[]> {
  const db = await getDb();
  const query = db.select().from(sessions).orderBy(desc(sessions.date), desc(sessions.id));
  const rows = limit ? await query.limit(limit) : await query;
  if (rows.length === 0) return [];
  const results = await db
    .select({
      sessionId: sessionResults.sessionId,
      athleteId: athletes.id,
      name: athletes.name,
    })
    .from(sessionResults)
    .innerJoin(athletes, eq(sessionResults.athleteId, athletes.id))
    .where(
      inArray(
        sessionResults.sessionId,
        rows.map((s) => s.id),
      ),
    );
  const byId = new Map<number, Array<{ id: number; name: string }>>();
  for (const r of results) {
    const list = byId.get(r.sessionId) ?? [];
    list.push({ id: r.athleteId, name: r.name });
    byId.set(r.sessionId, list);
  }
  return rows.map((session) => ({ session, athletes: byId.get(session.id) ?? [] }));
}

export async function getSessionWithResults(id: number): Promise<{
  session: Session;
  results: Array<{ result: SessionResult; athlete: Athlete }>;
} | null> {
  const db = await getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!session) return null;
  const results = await db
    .select({ result: sessionResults, athlete: athletes })
    .from(sessionResults)
    .innerJoin(athletes, eq(sessionResults.athleteId, athletes.id))
    .where(eq(sessionResults.sessionId, id));
  return { session, results };
}

export interface WeekBucket {
  weekStart: string;
  meters: number;
  sessions: number;
}

function mondayOf(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

/** Team training volume per week over the last `weeksBack` weeks. */
export async function weeklyTeamVolume(weeksBack = 12): Promise<WeekBucket[]> {
  const db = await getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksBack * 7);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(sessions)
    .where(sql`${sessions.date} >= ${cutoffIso}`);
  const byWeek = new Map<string, WeekBucket>();
  for (const s of rows) {
    const weekStart = mondayOf(s.date);
    const bucket = byWeek.get(weekStart) ?? { weekStart, meters: 0, sessions: 0 };
    bucket.meters += s.distanceMeters ?? 0;
    bucket.sessions += 1;
    byWeek.set(weekStart, bucket);
  }
  if (byWeek.size === 0) return [];
  const weeks = [...byWeek.keys()].sort();
  const out: WeekBucket[] = [];
  const cursor = new Date(`${weeks[0]}T00:00:00`);
  const last = new Date(`${weeks[weeks.length - 1]}T00:00:00`);
  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    out.push(byWeek.get(key) ?? { weekStart: key, meters: 0, sessions: 0 });
    cursor.setDate(cursor.getDate() + 7);
  }
  return out;
}

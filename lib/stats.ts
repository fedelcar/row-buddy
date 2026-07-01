import { Session, splitSeconds } from "./types";

export interface WeekBucket {
  /** ISO date of the Monday starting the week */
  weekStart: string;
  meters: number;
  sessions: number;
}

export interface SplitPoint {
  date: string;
  split: number;
  session: Session;
}

export interface Totals {
  meters: number;
  sessions: number;
  seconds: number;
  /** Best (lowest) average split across sessions, seconds per 500m */
  bestSplit: number | null;
  bestSplitSession: Session | null;
}

function mondayOf(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function weeklyVolume(sessions: Session[]): WeekBucket[] {
  const byWeek = new Map<string, WeekBucket>();
  for (const s of sessions) {
    const weekStart = mondayOf(s.date);
    const bucket = byWeek.get(weekStart) ?? { weekStart, meters: 0, sessions: 0 };
    bucket.meters += s.distanceMeters;
    bucket.sessions += 1;
    byWeek.set(weekStart, bucket);
  }
  if (byWeek.size === 0) return [];
  // Fill empty weeks so gaps in training are visible, not collapsed.
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

export function splitTrend(sessions: Session[]): SplitPoint[] {
  return [...sessions]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((s) => ({ date: s.date, split: splitSeconds(s), session: s }));
}

export function totals(sessions: Session[]): Totals {
  let meters = 0;
  let seconds = 0;
  let bestSplit: number | null = null;
  let bestSplitSession: Session | null = null;
  for (const s of sessions) {
    meters += s.distanceMeters;
    seconds += s.durationSeconds;
    const split = splitSeconds(s);
    if (bestSplit === null || split < bestSplit) {
      bestSplit = split;
      bestSplitSession = s;
    }
  }
  return { meters, sessions: sessions.length, seconds, bestSplit, bestSplitSession };
}

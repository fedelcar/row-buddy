import type { Session } from "./types";

const STORAGE_KEY = "row-buddy:sessions";

const EMPTY: Session[] = [];
let cache: { raw: string | null; sessions: Session[] } = { raw: null, sessions: EMPTY };
const listeners = new Set<() => void>();

function parseSessions(raw: string | null): Session[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isValidSession);
  } catch {
    return EMPTY;
  }
}

/** Stable-reference snapshot for useSyncExternalStore. */
export function getSessionsSnapshot(): Session[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cache.raw) cache = { raw, sessions: parseSessions(raw) };
  return cache.sessions;
}

export function getServerSessionsSnapshot(): Session[] {
  return EMPTY;
}

export function subscribeToSessions(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveSessions(sessions: Session[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  listeners.forEach((l) => l());
}

function isValidSession(s: unknown): s is Session {
  if (typeof s !== "object" || s === null) return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.date === "string" &&
    (o.type === "erg" || o.type === "water") &&
    typeof o.distanceMeters === "number" &&
    o.distanceMeters > 0 &&
    typeof o.durationSeconds === "number" &&
    o.durationSeconds > 0
  );
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Demo data so the dashboard has something to show before the first real row. */
export function sampleSessions(): Session[] {
  const specs: Array<{
    daysAgo: number;
    type: Session["type"];
    m: number;
    split: number; // seconds per 500m
    spm: number;
    notes?: string;
  }> = [
    { daysAgo: 87, type: "erg", m: 5000, split: 122.5, spm: 22, notes: "Base pace, steady state" },
    { daysAgo: 84, type: "erg", m: 6000, split: 124.0, spm: 20 },
    { daysAgo: 80, type: "water", m: 8000, split: 138.0, spm: 18, notes: "Choppy water" },
    { daysAgo: 76, type: "erg", m: 2000, split: 109.8, spm: 30, notes: "2k test" },
    { daysAgo: 72, type: "erg", m: 5000, split: 121.4, spm: 22 },
    { daysAgo: 68, type: "water", m: 10000, split: 135.5, spm: 19 },
    { daysAgo: 63, type: "erg", m: 8000, split: 123.2, spm: 21 },
    { daysAgo: 59, type: "erg", m: 5000, split: 120.8, spm: 23 },
    { daysAgo: 55, type: "water", m: 9000, split: 134.0, spm: 19, notes: "Flat water, felt great" },
    { daysAgo: 50, type: "erg", m: 6000, split: 121.9, spm: 21 },
    { daysAgo: 46, type: "erg", m: 4 * 1000, split: 113.5, spm: 28, notes: "4x1k intervals" },
    { daysAgo: 41, type: "water", m: 12000, split: 133.2, spm: 18 },
    { daysAgo: 37, type: "erg", m: 5000, split: 119.9, spm: 22 },
    { daysAgo: 33, type: "erg", m: 6000, split: 120.6, spm: 21 },
    { daysAgo: 28, type: "water", m: 10000, split: 132.4, spm: 19 },
    { daysAgo: 24, type: "erg", m: 2000, split: 107.2, spm: 31, notes: "2k test — new PB" },
    { daysAgo: 19, type: "erg", m: 7000, split: 120.1, spm: 21 },
    { daysAgo: 15, type: "water", m: 11000, split: 131.8, spm: 19 },
    { daysAgo: 11, type: "erg", m: 5000, split: 118.7, spm: 23 },
    { daysAgo: 7, type: "erg", m: 6000, split: 119.4, spm: 22 },
    { daysAgo: 4, type: "water", m: 9500, split: 130.9, spm: 20, notes: "Morning row, glassy" },
    { daysAgo: 1, type: "erg", m: 5000, split: 117.9, spm: 23 },
  ];
  return specs.map((s, i) => ({
    id: `sample-${i}`,
    date: isoDaysAgo(s.daysAgo),
    type: s.type,
    distanceMeters: s.m,
    durationSeconds: Math.round((s.m / 500) * s.split),
    strokeRate: s.spm,
    notes: s.notes,
  }));
}

export type SessionType = "erg" | "water";

export interface Session {
  id: string;
  /** ISO date, e.g. "2026-07-01" */
  date: string;
  type: SessionType;
  distanceMeters: number;
  durationSeconds: number;
  /** Strokes per minute */
  strokeRate?: number;
  notes?: string;
}

/** Average split in seconds per 500m. */
export function splitSeconds(s: Pick<Session, "distanceMeters" | "durationSeconds">): number {
  return s.durationSeconds / (s.distanceMeters / 500);
}

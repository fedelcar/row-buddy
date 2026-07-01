"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessionResults, sessions, SESSION_TYPES, type SessionType } from "@/db/schema";
import { parseDuration } from "@/lib/format";
import { requireSession } from "./guard";

export interface SessionFormState {
  error?: string;
}

export async function createSession(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  await requireSession();
  const date = String(formData.get("date") ?? "");
  const typeRaw = String(formData.get("type") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!date) return { error: "Pick a date." };
  if (!(SESSION_TYPES as readonly string[]).includes(typeRaw))
    return { error: "Pick a session type." };
  const type = typeRaw as SessionType;

  const distanceRaw = String(formData.get("distanceMeters") ?? "").trim();
  const distanceMeters = distanceRaw === "" ? null : Number(distanceRaw);
  if (distanceMeters !== null && (!Number.isFinite(distanceMeters) || distanceMeters <= 0))
    return { error: "Distance should be a positive number of meters." };

  const durationRaw = String(formData.get("duration") ?? "").trim();
  const durationSeconds = durationRaw === "" ? null : parseDuration(durationRaw);
  if (durationRaw !== "" && !durationSeconds)
    return { error: "Duration should look like 60:00 (mm:ss) or 1:20:00 (h:mm:ss)." };

  // Per-athlete results: athlete-<id> checkboxes with optional time/spm fields.
  const athleteIds = formData
    .getAll("athletes")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

  const results: Array<{
    athleteId: number;
    timeSeconds: number | null;
    splitSeconds: number | null;
    strokeRate: number | null;
  }> = [];
  for (const athleteId of athleteIds) {
    const timeRaw = String(formData.get(`time-${athleteId}`) ?? "").trim();
    const spmRaw = String(formData.get(`spm-${athleteId}`) ?? "").trim();
    const timeSeconds = timeRaw === "" ? null : parseDuration(timeRaw);
    if (timeRaw !== "" && !timeSeconds)
      return { error: `Time for an athlete should look like 20:00 (mm:ss).` };
    const strokeRate = spmRaw === "" ? null : Number(spmRaw);
    if (strokeRate !== null && (!Number.isFinite(strokeRate) || strokeRate <= 0 || strokeRate > 60))
      return { error: "Stroke rate should be between 1 and 60." };
    const splitSeconds =
      timeSeconds && distanceMeters ? timeSeconds / (distanceMeters / 500) : null;
    results.push({ athleteId, timeSeconds, splitSeconds, strokeRate });
  }

  const db = await getDb();
  const [session] = await db
    .insert(sessions)
    .values({ date, type, distanceMeters, durationSeconds, notes })
    .returning({ id: sessions.id });
  if (results.length > 0) {
    await db
      .insert(sessionResults)
      .values(results.map((r) => ({ ...r, sessionId: session.id })));
  }

  revalidatePath("/");
  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function deleteSession(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.id, id));
  revalidatePath("/");
  revalidatePath("/sessions");
}

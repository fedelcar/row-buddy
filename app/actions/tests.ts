"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { ergTests, TEST_DISTANCES, TEST_TYPES, type TestType } from "@/db/schema";
import { parseDuration } from "@/lib/format";
import { requireSession } from "./guard";

export interface TestFormState {
  error?: string;
}

export async function createErgTest(
  _prev: TestFormState,
  formData: FormData,
): Promise<TestFormState> {
  await requireSession();
  const athleteId = Number(formData.get("athleteId"));
  const date = String(formData.get("date") ?? "");
  const testTypeRaw = String(formData.get("testType") ?? "");
  const strokeRateRaw = String(formData.get("strokeRate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!Number.isInteger(athleteId) || athleteId <= 0) return { error: "Pick an athlete." };
  if (!date) return { error: "Pick a date." };
  if (!(TEST_TYPES as readonly string[]).includes(testTypeRaw))
    return { error: "Pick a test type." };
  const testType = testTypeRaw as TestType;

  let timeSeconds: number;
  let distanceMeters: number;
  if (testType === "30min") {
    timeSeconds = 30 * 60;
    distanceMeters = Number(formData.get("distanceMeters"));
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0)
      return { error: "Enter the meters covered in the 30 minutes." };
  } else {
    const parsed = parseDuration(String(formData.get("time") ?? ""));
    if (!parsed) return { error: "Time should look like 7:21.5 (mm:ss)." };
    timeSeconds = parsed;
    distanceMeters = TEST_DISTANCES[testType];
  }
  const splitSeconds = timeSeconds / (distanceMeters / 500);

  const strokeRate = strokeRateRaw === "" ? null : Number(strokeRateRaw);
  if (strokeRate !== null && (!Number.isFinite(strokeRate) || strokeRate <= 0 || strokeRate > 60))
    return { error: "Stroke rate should be between 1 and 60." };

  const db = await getDb();
  // A PB if no earlier test of this type has an equal or faster split.
  const faster = await db
    .select({ id: ergTests.id })
    .from(ergTests)
    .where(
      and(
        eq(ergTests.athleteId, athleteId),
        eq(ergTests.testType, testType),
        lt(ergTests.splitSeconds, splitSeconds + 0.001),
      ),
    )
    .limit(1);
  const isPb = faster.length === 0;

  await db.insert(ergTests).values({
    athleteId,
    date,
    testType,
    timeSeconds,
    distanceMeters: Math.round(distanceMeters),
    splitSeconds,
    strokeRate,
    notes,
  });

  revalidatePath("/");
  revalidatePath(`/athletes/${athleteId}`);
  redirect(`/athletes/${athleteId}${isPb ? "?newpb=1" : ""}`);
}

export async function deleteErgTest(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  const athleteId = Number(formData.get("athleteId"));
  if (!Number.isInteger(id)) return;
  const db = await getDb();
  await db.delete(ergTests).where(eq(ergTests.id, id));
  revalidatePath("/");
  revalidatePath(`/athletes/${athleteId}`);
}

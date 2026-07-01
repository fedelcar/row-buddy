"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { athletes, SIDES, type Side } from "@/db/schema";
import { requireSession } from "./guard";

export interface AthleteFormState {
  error?: string;
}

function readAthleteForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const ageGroup = String(formData.get("ageGroup") ?? "").trim() || null;
  const sideRaw = String(formData.get("side") ?? "");
  const side = (SIDES as readonly string[]).includes(sideRaw) ? (sideRaw as Side) : null;
  const weightClass = String(formData.get("weightClass") ?? "").trim() || null;
  return { name, ageGroup, side, weightClass };
}

export async function createAthlete(
  _prev: AthleteFormState,
  formData: FormData,
): Promise<AthleteFormState> {
  await requireSession();
  const values = readAthleteForm(formData);
  if (!values.name) return { error: "The athlete needs a name." };
  const db = await getDb();
  const [row] = await db.insert(athletes).values(values).returning({ id: athletes.id });
  revalidatePath("/athletes");
  redirect(`/athletes/${row.id}`);
}

export async function updateAthlete(
  _prev: AthleteFormState,
  formData: FormData,
): Promise<AthleteFormState> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing athlete." };
  const values = readAthleteForm(formData);
  if (!values.name) return { error: "The athlete needs a name." };
  const active = formData.get("active") === "on";
  const db = await getDb();
  await db.update(athletes).set({ ...values, active }).where(eq(athletes.id, id));
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${id}`);
  redirect(`/athletes/${id}`);
}

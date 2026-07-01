"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/session";

export interface LoginState {
  error?: string;
  /** Echoed back so the field survives the post-action form reset. */
  username?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "");
  if (!username || !password) {
    return { error: "Enter your username and password.", username };
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "That username and password don't match.", username };
  }

  await createSession({ userId: user.id, username: user.username });
  redirect(from.startsWith("/") && !from.startsWith("//") ? from : "/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

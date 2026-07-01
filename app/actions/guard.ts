import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import type { SessionPayload } from "@/lib/session-core";

/** Server actions re-check the session; the proxy redirect alone isn't authorization. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

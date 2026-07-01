import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "row_buddy_session";
export const SESSION_DAYS = 30;

export interface SessionPayload {
  userId: number;
  username: string;
  [key: string]: unknown;
}

export function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? process.env.SESSION_SECRET;
  if (secret) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error(
      "AUTH_SECRET is not set. Add it in Vercel → Settings → Environment Variables.",
    );
  }
  return new TextEncoder().encode("row-buddy-dev-secret-do-not-use-in-prod");
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecretKey());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

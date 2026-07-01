import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decryptSession } from "@/lib/session-core";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)"],
};

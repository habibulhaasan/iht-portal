import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/admin"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !request.cookies.get("session")) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Runs on every request except static assets and Next internals (API routes
// are intentionally included so /api/session itself stays reachable — it's
// not in PROTECTED_PREFIXES above).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|avatars).*)"],
};

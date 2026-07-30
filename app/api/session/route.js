import { NextResponse } from "next/server";
import { adminAuth } from "../../../lib/firebaseAdmin";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

// Called right after a successful client-side login/register. Exchanges the
// short-lived Firebase ID token for a longer-lived session cookie that
// middleware.js can check for on every request — this is what lets us
// redirect unauthenticated visitors away from /dashboard, /onboarding, and
// /admin before any page JS even runs.
export async function POST(request) {
  const { idToken } = await request.json();
  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    // Verifies the token is genuine before minting a cookie for it.
    await adminAuth.verifyIdToken(idToken);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS / 1000,
      path: "/",
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }
}

// Called on logout to clear the cookie server-side (in addition to the
// client-side firebase signOut()).
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", "", { maxAge: 0, path: "/" });
  return response;
}

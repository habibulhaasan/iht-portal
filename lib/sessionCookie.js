// Call right after a successful sign-in/sign-up so middleware.js has a
// cookie to check on subsequent requests.
export async function syncSessionCookie(user) {
  const idToken = await user.getIdToken();
  await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

// Call right before firebase's signOut() so the cookie doesn't outlive the
// client-side session.
export async function clearSessionCookie() {
  await fetch("/api/session", { method: "DELETE" });
}

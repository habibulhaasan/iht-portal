"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { syncSessionCookie } from "../../lib/sessionCookie";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      await syncSessionCookie(cred.user);
      router.replace("/dashboard"); // RouteGuard will bounce to /onboarding if incomplete
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-mark">IHT · Rangpur</div>
        <div>
          <h1 className="auth-hero-title">
            Welcome
            <br />
            back.
          </h1>
          <p className="auth-hero-sub">
            Pick up where you left off — your directory, your donation log, your people.
          </p>
        </div>
        <div />
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <h1>Log in</h1>
          <p className="subtitle">Enter your credentials to continue.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required value={form.password} onChange={update("password")} />
            </div>
            <div className="auth-switch" style={{ marginTop: -6, marginBottom: 18, textAlign: "right" }}>
              <Link href="/forgot-password" style={{ fontSize: 13 }}>Forgot password?</Link>
            </div>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Logging in…" : "Log in"}
            </button>
          </form>

          <div className="auth-switch">
            New here? <Link href="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

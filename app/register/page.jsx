// File: app/register/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { syncSessionCookie } from "../../lib/sessionCookie";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });

      await setDoc(doc(db, "users", cred.user.uid), {
        email: form.email,
        role: "user",
        profileComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Store name + email now so onboarding can pre-fill, and so the
      // directory (which can't read other users' `users/{uid}` docs) has
      // an email to show when a member opts into visibility.email
      await setDoc(
        doc(db, "profiles", cred.user.uid),
        { name: form.name, email: form.email, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true }
      );

      await syncSessionCookie(cred.user);

      // Hard navigation, not router.replace — see the comment in
      // app/login/page.jsx for why: avoids Next's client Router Cache
      // serving a stale pre-signup redirect for /onboarding.
      window.location.href = "/onboarding";
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
            Find your batchmates.
            <br />
            Stay in the network.
          </h1>
          <p className="auth-hero-sub">
            A shared home for every current and former student of the Institute of Health
            Technology, Rangpur — departments, sessions, and everyone who's donated blood along
            the way.
          </p>
        </div>
        <div />
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <h1>Create your account</h1>
          <p className="subtitle">Start with the basics — you'll complete your full profile next.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full name</label>
              <input type="text" required value={form.name} onChange={update("name")} placeholder="As it appears on your certificate" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required value={form.password} onChange={update("password")} placeholder="At least 6 characters" />
            </div>
            <div className="field">
              <label>Confirm password</label>
              <input type="password" required value={form.confirm} onChange={update("confirm")} />
            </div>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="auth-switch">
            Already registered? <Link href="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/email-already-in-use": "That email is already registered — try logging in instead.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Please choose a stronger password.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
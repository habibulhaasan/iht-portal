"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // "sent"
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      // Don't reveal whether the email exists — show the same success
      // state either way, to avoid leaking which emails are registered.
    } finally {
      setStatus("sent");
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-mark">IHT · Rangpur</div>
        <div>
          <h1 className="auth-hero-title">Reset your password</h1>
          <p className="auth-hero-sub">We'll email you a secure link to set a new one.</p>
        </div>
        <div />
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <h1>Forgot password</h1>
          <p className="subtitle">Enter the email you registered with.</p>

          {status === "sent" ? (
            <div className="error-banner" style={{ background: "#eaf5ef", borderColor: "#bfe0cc", color: "var(--forest)" }}>
              If an account exists for that email, a reset link is on its way. Check your inbox
              (and spam folder).
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <div className="auth-switch">
            <Link href="/login">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

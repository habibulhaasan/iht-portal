// File: app/login/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { syncSessionCookie } from "../../lib/sessionCookie";

export default function LoginPage() {
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

      // Hard navigation on purpose — see original comment: avoids Next's
      // client Router Cache serving a stale pre-auth redirect.
      window.location.href = "/dashboard"; // RouteGuard sends to /onboarding if incomplete
    } catch (err) {
      setError(friendlyError(err.code));
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-mark">
        <div className="auth-hero-logo-wrap">
          <Image src="/iht-rangpur-logo.png" alt="IHT Rangpur" fill className="auth-hero-logo" />
        </div>          
        আইএইচটি · রংপুর
        </div>
        <div>
          <h1 className="auth-hero-title">
            স্বাগতম।
          </h1>
          <p className="auth-hero-sub">
            আপনার প্রিয় ব্যাচমেন্ট ও এলামনাইদের সাথে তথ্য পেতে লগইন করুন।
          </p>
        </div>
        <div />
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <Image
            src="/iht-rangpur-logo.png"
            alt="IHT Rangpur"
            width={56}
            height={56}
            className="auth-card-logo"
          />
          <h1 className="auth-card-text">লগ ইন করুন</h1>
          <p className="subtitle">চালিয়ে যেতে আপনার তথ্য দিন।</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>ইমেইল</label>
              <input type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>পাসওয়ার্ড</label>
              <input type="password" required value={form.password} onChange={update("password")} />
            </div>
            <div className="auth-switch" style={{ marginTop: -6, marginBottom: 18, textAlign: "right" }}>
              <Link href="/forgot-password" style={{ fontSize: 13 }}>পাসওয়ার্ড ভুলে গেছেন?</Link>
            </div>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "লগ ইন হচ্ছে…" : "লগ ইন"}
            </button>
          </form>

          <div className="auth-switch">
            নতুন এসেছেন? <Link href="/register">অ্যাকাউন্ট তৈরি করুন</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/invalid-credential": "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।",
    "auth/user-not-found": "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।",
    "auth/wrong-password": "পাসওয়ার্ড সঠিক নয়।",
    "auth/too-many-requests": "অনেকবার চেষ্টা করা হয়েছে — একটু পরে আবার চেষ্টা করুন।",
  };
  return map[code] || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
}
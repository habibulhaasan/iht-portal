"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext({
  user: null,
  userDoc: null,
  loading: true,
  refreshUserDoc: async () => null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      userRef.current = firebaseUser;
      if (!firebaseUser) {
        setUserDoc(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // One-shot read that bypasses Firestore's realtime Listen channel entirely.
  // Call this after any write you need reflected immediately (e.g. finishing
  // onboarding) — unlike onSnapshot, it doesn't depend on a long-lived
  // channel that ad blockers / privacy extensions can silently kill
  // (ERR_BLOCKED_BY_CLIENT). It also updates the shared context state, so
  // anything reading useAuth().userDoc elsewhere (like a dashboard
  // RouteGuard) sees the fresh value too — not just the caller.
  const refreshUserDoc = useCallback(async () => {
    if (!userRef.current) return null;
    try {
      const snap = await getDoc(doc(db, "users", userRef.current.uid));
      const data = snap.exists() ? snap.data() : null;
      setUserDoc(data);
      return data;
    } catch (err) {
      console.error("refreshUserDoc failed:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // Watchdog: if the realtime listener hasn't delivered anything within
    // 5s — e.g. its channel got blocked — fall back to a one-shot read
    // instead of leaving the app on a spinner indefinitely.
    let settled = false;
    const watchdog = setTimeout(() => {
      if (!settled) {
        settled = true;
        refreshUserDoc().finally(() => setLoading(false));
      }
    }, 5000);

    const unsubDoc = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        settled = true;
        clearTimeout(watchdog);
        setUserDoc(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      // Without this, any listener error (permission denied, offline, backend
      // unreachable) leaves loading=true forever and the whole app hangs on
      // the spinner. Fail open: clear loading so RouteGuard can act on `user`.
      (err) => {
        settled = true;
        clearTimeout(watchdog);
        console.error("users doc listener error:", err);
        setUserDoc(null);
        setLoading(false);
      }
    );

    return () => {
      settled = true;
      clearTimeout(watchdog);
      unsubDoc();
    };
  }, [user, refreshUserDoc]);

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, refreshUserDoc }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
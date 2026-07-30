"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext({
  user: null,
  userDoc: null,
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserDoc(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Re-entering the loading state while we (re)subscribe to this user's doc.
    setLoading(true);
    const unsubDoc = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setUserDoc(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      // Without this, any listener error (permission denied, offline, backend
      // unreachable) leaves loading=true forever and the whole app hangs on
      // the spinner. Fail open: clear loading so RouteGuard can act on `user`.
      (err) => {
        console.error("users doc listener error:", err);
        setUserDoc(null);
        setLoading(false);
      }
    );
    return () => unsubDoc();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userDoc, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

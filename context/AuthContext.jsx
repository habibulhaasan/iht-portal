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
    const unsubDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setUserDoc(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
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

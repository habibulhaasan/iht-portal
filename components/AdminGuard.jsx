"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function AdminGuard({ children }) {
  const { userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!userDoc || userDoc.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [userDoc, loading, router]);

  if (loading || !userDoc || userDoc.role !== "admin") {
    return <div className="screen-center"><div className="loader" /></div>;
  }

  return children;
}

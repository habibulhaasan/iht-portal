"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

export default function RouteGuard({ children }) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }

    if (user && userDoc) {
      const incomplete = !userDoc.profileComplete;
      if (incomplete && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }
      if (!incomplete && (isPublic || pathname === "/onboarding")) {
        router.replace("/dashboard");
        return;
      }
    }
  }, [user, userDoc, loading, pathname, router]);

  if (loading) {
    return (
      <div className="screen-center">
        <div className="loader" />
      </div>
    );
  }

  return children;
}

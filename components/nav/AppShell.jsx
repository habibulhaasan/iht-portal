"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { User, Droplet, Users, Star, Shield, Bell } from "lucide-react";
import { auth } from "../../lib/firebase";
import { clearSessionCookie } from "../../lib/sessionCookie";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../lib/notifications";
import DesktopSidebar from "./DesktopSidebar";
import MobileTopBar from "./MobileTopBar";
import MobileNav from "./MobileNav";

const DASHBOARD_TABS = [
  { key: "profile", label: "My Profile", icon: User },
  { key: "donations", label: "Blood Donations", icon: Droplet },
  { key: "directory", label: "Directory", icon: Users },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "favorites", label: "Favorites", icon: Star },
];

export default function AppShell({ children }) {
  const { user, userDoc } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = userDoc?.role === "admin";
  const { unreadCount } = useNotifications(user?.uid);

  const activeKey = pathname === "/admin" ? "admin" : searchParams.get("tab") || "profile";

  const navItems = [
    ...DASHBOARD_TABS.map((t) => ({
      ...t,
      href: `/dashboard?tab=${t.key}`,
      badge: t.key === "notifications" && unreadCount > 0 ? unreadCount : null,
    })),
    ...(isAdmin ? [{ key: "admin", label: "Admin panel", icon: Shield, href: "/admin" }] : []),
  ];

  const handleNavigate = (item) => router.push(item.href);

  const handleLogout = async () => {
    await clearSessionCookie();
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-shell">
      <DesktopSidebar
        items={navItems}
        activeKey={activeKey}
        onNavigate={handleNavigate}
        userEmail={user?.email}
        onLogout={handleLogout}
      />
      <MobileTopBar onLogout={handleLogout} />
      <main className="dashboard-main">{children}</main>
      <MobileNav items={navItems} activeKey={activeKey} onNavigate={handleNavigate} />
    </div>
  );
}
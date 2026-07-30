"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { clearSessionCookie } from "../../lib/sessionCookie";
import MyProfileTab from "../../components/dashboard/MyProfileTab";
import DonationsTab from "../../components/dashboard/DonationsTab";
import DirectoryTab from "../../components/dashboard/DirectoryTab";
import FavoritesTab from "../../components/dashboard/FavoritesTab";

const TABS = [
  { key: "profile", label: "My Profile", Component: MyProfileTab },
  { key: "donations", label: "Blood Donations", Component: DonationsTab },
  { key: "directory", label: "Directory", Component: DirectoryTab },
  { key: "favorites", label: "Favorites", Component: FavoritesTab },
];

export default function DashboardPage() {
  const { user, userDoc } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const Active = TABS.find((t) => t.key === activeTab).Component;

  const handleLogout = async () => {
    await clearSessionCookie();
    await signOut(auth);
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">IHT · Rangpur</div>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`dashboard-nav-item ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          {userDoc?.role === "admin" && (
            <Link href="/admin" className="dashboard-nav-item" style={{ textDecoration: "none", display: "block" }}>
              Admin panel
            </Link>
          )}
        </nav>
        <button className="dashboard-logout" onClick={handleLogout}>Log out</button>
        <div className="dashboard-user-email">{user?.email}</div>
      </aside>
      <main className="dashboard-main">
        <Active />
      </main>
    </div>
  );
}

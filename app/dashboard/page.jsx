"use client";

import { useSearchParams } from "next/navigation";
import MyProfileTab from "../../components/dashboard/MyProfileTab";
import DonationsTab from "../../components/dashboard/DonationsTab";
import DirectoryTab from "../../components/dashboard/DirectoryTab";
import FavoritesTab from "../../components/dashboard/FavoritesTab";
import NotificationsTab from "../../components/dashboard/NotificationsTab";
import AboutTab from "../../components/dashboard/AboutTab";

const TAB_COMPONENTS = {
  profile: MyProfileTab,
  donations: DonationsTab,
  directory: DirectoryTab,
  notifications: NotificationsTab,
  favorites: FavoritesTab,
  about: AboutTab,
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "profile";
  const Active = TAB_COMPONENTS[tab] || MyProfileTab;

  return <Active />;
}
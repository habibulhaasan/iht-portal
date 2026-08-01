"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useDirectorySettings } from "../../lib/directorySettings";
import { DirectoryRow, DirectoryCard } from "./DirectoryTab";

export default function FavoritesTab() {
  const { user } = useAuth();
  const { settings: adminSettings } = useDirectorySettings();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "favorites"), async (snap) => {
      const ids = snap.docs.map((d) => d.id);
      const profiles = await Promise.all(
        ids.map(async (id) => {
          const profSnap = await getDoc(doc(db, "profiles", id));
          return profSnap.exists() ? { id, ...profSnap.data() } : null;
        })
      );
      setFavorites(profiles.filter(Boolean));
    });
    return () => unsub();
  }, [user]);

  const removeFavorite = async (id) => deleteDoc(doc(db, "users", user.uid, "favorites", id));

  const showCol = (key) => adminSettings[key] !== false;

  return (
    <div>
      <h2>Favorites</h2>
      <p className="step-sub">{favorites.length} people you've bookmarked for quick access.</p>

      {favorites.length === 0 && (
        <p className="helper-text">No favorites yet — star someone from the Directory tab.</p>
      )}

      {/* Same table/card split as Directory — reusing DirectoryRow/
          DirectoryCard directly means this tab automatically stays
          consistent with Directory's field visibility, admin settings,
          avatars, and donation info, with no duplicated logic to drift out
          of sync. */}
      <div className="directory-table-wrap">
        <table className="directory-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              {showCol("bloodGroup") && <th>Blood</th>}
              {showCol("donation") && <th>Blood Donation</th>}
              {showCol("department") && <th>Department</th>}
              {showCol("session") && <th>Session</th>}
              {showCol("status") && <th>Status</th>}
              {showCol("location") && <th>Location</th>}
              {showCol("officeAddress") && <th>Office address</th>}
              {(showCol("phone") || showCol("email")) && <th>Contact</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {favorites.map((p) => (
              <DirectoryRow
                key={p.id}
                profile={p}
                adminSettings={adminSettings}
                isFavorite={true}
                onToggleFavorite={() => removeFavorite(p.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="directory-grid-mobile">
        {favorites.map((p) => (
          <DirectoryCard
            key={p.id}
            profile={p}
            adminSettings={adminSettings}
            isFavorite={true}
            onToggleFavorite={() => removeFavorite(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
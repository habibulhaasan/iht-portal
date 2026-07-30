"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function FavoritesTab() {
  const { user } = useAuth();
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

  return (
    <div>
      <h2>Favorites</h2>
      <p className="step-sub">People you've bookmarked for quick access.</p>
      <div className="directory-grid">
        {favorites.map((p) => (
          <div className="directory-card" key={p.id}>
            <div className="directory-card-body">
              <div className="directory-card-name">{p.name}</div>
              <div className="directory-card-meta">{p.department} · {p.session}</div>
              <div className="directory-card-meta">🩸 {p.bloodGroup}</div>
            </div>
            <button className="favorite-btn active" onClick={() => removeFavorite(p.id)}>★</button>
          </div>
        ))}
        {favorites.length === 0 && <p className="helper-text">No favorites yet — star someone from the Directory tab.</p>}
      </div>
    </div>
  );
}

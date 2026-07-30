"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { BD_DIVISIONS, getLocationLabel } from "../../lib/bdData";
import { defaultAvatarFor } from "../../lib/photoUtils";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const DEPARTMENTS = ["Laboratory", "Radiology", "Physiotherapy", "Radiotherapy", "Dental", "Pharmacy", "SIT"];

export default function DirectoryTab() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [filters, setFilters] = useState({ divisionId: "", bloodGroup: "", jobType: "", department: "", session: "" });

  useEffect(() => {
    // Fine to fetch the whole collection client-side for a single-institute
    // scale dataset. If this grows large, switch to Firestore compound
    // queries with composite indexes instead of filtering in memory.
    const unsub = onSnapshot(collection(db, "profiles"), (snap) => {
      setProfiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "favorites"), (snap) => {
      setFavoriteIds(new Set(snap.docs.map((d) => d.id)));
    });
    return () => unsub();
  }, [user]);

  const toggleFavorite = async (targetUid) => {
    const ref = doc(db, "users", user.uid, "favorites", targetUid);
    if (favoriteIds.has(targetUid)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { addedAt: serverTimestamp() });
    }
  };

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (p.id === user?.uid) return false;
      if (filters.divisionId && p.currentAddress?.divisionId !== filters.divisionId) return false;
      if (filters.bloodGroup && p.bloodGroup !== filters.bloodGroup) return false;
      if (filters.department && p.department !== filters.department) return false;
      if (filters.session && p.session !== filters.session) return false;
      if (filters.jobType && p.employment?.status !== filters.jobType) return false;
      return true;
    });
  }, [profiles, filters, user]);

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <h2>Directory</h2>
      <p className="step-sub">{filtered.length} people match your filters.</p>

      <div className="directory-filters">
        <select value={filters.divisionId} onChange={setFilter("divisionId")}>
          <option value="">All divisions</option>
          {BD_DIVISIONS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filters.bloodGroup} onChange={setFilter("bloodGroup")}>
          <option value="">All blood groups</option>
          {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
        </select>
        <select value={filters.department} onChange={setFilter("department")}>
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.jobType} onChange={setFilter("jobType")}>
          <option value="">Studying or job</option>
          <option value="studying">Studying</option>
          <option value="job">Job</option>
        </select>
        <input type="text" placeholder="Session e.g. 2018-2019" value={filters.session} onChange={setFilter("session")} />
      </div>

      <div className="directory-grid">
        {filtered.map((p) => (
          <DirectoryCard
            key={p.id}
            profile={p}
            isFavorite={favoriteIds.has(p.id)}
            onToggleFavorite={() => toggleFavorite(p.id)}
          />
        ))}
        {filtered.length === 0 && <p className="helper-text">No one matches these filters yet.</p>}
      </div>
    </div>
  );
}

function DirectoryCard({ profile, isFavorite, onToggleFavorite }) {
  const v = profile.visibility || {};
  const avatar =
    profile.photo?.useDefault === false && profile.photo?.base64
      ? profile.photo.base64
      : defaultAvatarFor(profile.gender);

  const locationLabel = profile.currentAddress?.upazilaId
    ? getLocationLabel(profile.currentAddress.upazilaId)
    : null;

  return (
    <div className="directory-card">
      <img src={avatar} alt={profile.name} className="photo-preview" style={{ width: 56, height: 56 }} />
      <div className="directory-card-body">
        <div className="directory-card-name">{profile.name}</div>
        <div className="directory-card-meta">{profile.department} · {profile.session}</div>
        <div className="directory-card-meta">🩸 {profile.bloodGroup}</div>
        {v.currentAddress && locationLabel && (
          <div className="directory-card-meta">📍 {locationLabel}</div>
        )}
        {v.employment && profile.employment?.officeName && (
          <div className="directory-card-meta">💼 {profile.employment.officeName}</div>
        )}
        {v.email && profile.email && <div className="directory-card-meta">✉️ {profile.email}</div>}
        {v.phone && profile.phone && <div className="directory-card-meta">📞 {profile.phone}</div>}
      </div>
      <button
        className={`favorite-btn ${isFavorite ? "active" : ""}`}
        onClick={onToggleFavorite}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        ★
      </button>
    </div>
  );
}

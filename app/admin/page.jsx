"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminGuard from "../../components/AdminGuard";
import AdminEditForm from "../../components/admin/AdminEditForm";
import DirectorySettingsPanel from "../../components/admin/DirectorySettingsPanel";
import DirectoryStatsPanel from "../../components/admin/DirectoryStatsPanel";

export default function AdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [usersByUid, setUsersByUid] = useState({});
  const [search, setSearch] = useState("");
  const [selectedUid, setSelectedUid] = useState(null);
  const [statFilter, setStatFilter] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "profiles"), (snap) => {
      setProfiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = d.data(); });
      setUsersByUid(map);
    });
    return () => unsub();
  }, []);

  const merged = useMemo(
    () =>
      profiles.map((p) => ({
        ...p,
        role: usersByUid[p.id]?.role || "user",
        profileComplete: usersByUid[p.id]?.profileComplete ?? false,
      })),
    [profiles, usersByUid]
  );

  const statFiltered = useMemo(() => {
    if (!statFilter) return merged;
    return merged.filter((p) => {
      if (statFilter.type === "department") return p.department === statFilter.value;
      if (statFilter.type === "session") return p.session === statFilter.value;
      if (statFilter.type === "status") {
        if (statFilter.value === "incomplete") return !p.profileComplete;
        if (statFilter.value === "studying") return p.employment?.status === "studying";
        if (statFilter.value === "govt") return p.employment?.status === "job" && p.employment?.jobType === "govt";
        if (statFilter.value === "non-govt") return p.employment?.status === "job" && p.employment?.jobType === "non-govt";
      }
      return true;
    });
  }, [merged, statFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return statFiltered;
    return statFiltered.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.department?.toLowerCase().includes(q) ||
        p.session?.toLowerCase().includes(q)
    );
  }, [statFiltered, search]);

  const selected = merged.find((p) => p.id === selectedUid);

  const goToStat = (type, value) => {
    if (!type) {
      setStatFilter(null);
      return;
    }
    setStatFilter({ type, value });
    setSelectedUid(null);
  };

  return (
    <AdminGuard>
      <div className="admin-shell">
        <DirectoryStatsPanel profiles={merged} onSelectStat={goToStat} />

        <div className="admin-columns">
          <div className="admin-list-pane">
            <div className="admin-list-header">
              <h1>All members</h1>
              {statFilter && (
                <button className="chip-clear" onClick={() => setStatFilter(null)}>
                  {statFilter.type}: {statFilter.value} ✕
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Search name, email, department, session…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search"
            />
            <div className="admin-list">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  className={`admin-list-item ${selectedUid === p.id ? "active" : ""}`}
                  onClick={() => setSelectedUid(p.id)}
                >
                  <div className="admin-list-item-name">
                    {p.name || "(no name)"}
                    {p.role === "admin" && <span className="admin-badge">ADMIN</span>}
                    {!p.profileComplete && <span className="incomplete-badge">INCOMPLETE</span>}
                  </div>
                  <div className="admin-list-item-meta">{p.department} · {p.session} · {p.email}</div>
                </button>
              ))}
              {filtered.length === 0 && <p className="helper-text">No matches.</p>}
            </div>
          </div>

          <div className="admin-edit-pane">
            {selected ? (
              <AdminEditForm key={selected.id} profile={selected} />
            ) : (
              <>
                <DirectorySettingsPanel />
                <p className="helper-text" style={{ marginTop: 16 }}>
                  Select a member from the list, or click a stat, to view/edit their full profile.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
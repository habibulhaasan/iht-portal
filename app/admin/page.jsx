"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminGuard from "../../components/AdminGuard";
import AdminEditForm from "../../components/admin/AdminEditForm";

export default function AdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [usersByUid, setUsersByUid] = useState({});
  const [search, setSearch] = useState("");
  const [selectedUid, setSelectedUid] = useState(null);

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

  const merged = profiles.map((p) => ({
    ...p,
    role: usersByUid[p.id]?.role || "user",
    profileComplete: usersByUid[p.id]?.profileComplete ?? false,
  }));

  const filtered = merged.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.session?.toLowerCase().includes(q)
    );
  });

  const selected = merged.find((p) => p.id === selectedUid);

  return (
    <AdminGuard>
      <div className="admin-shell">
        <div className="admin-list-pane">
          <h1>Admin · All members</h1>
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
            <p className="helper-text">Select a member from the list to edit their locked fields.</p>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}

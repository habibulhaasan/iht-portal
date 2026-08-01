"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminGuard from "../../components/AdminGuard";
import AdminEditForm from "../../components/admin/AdminEditForm";
import AdminFilterBar from "../../components/admin/AdminFilterBar";
import DirectorySettingsPanel from "../../components/admin/DirectorySettingsPanel";
import AdminNotificationsPanel from "../../components/admin/AdminNotificationsPanel";

const PAGE_SIZE = 30;
const EMPTY_FILTERS = { department: "", session: "", status: "", completeness: "" };

function statusOf(p) {
  const e = p.employment;
  if (!e?.status) return "unset";
  if (e.status === "studying") return "studying";
  if (e.status === "job" && e.jobType === "govt") return "govt";
  if (e.status === "job" && e.jobType === "non-govt") return "non-govt";
  return "unset";
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [usersByUid, setUsersByUid] = useState({});
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedUid, setSelectedUid] = useState(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState("members"); // "members" | "settings"

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
      profiles
        .map((p) => ({
          ...p,
          role: usersByUid[p.id]?.role || "user",
          profileComplete: usersByUid[p.id]?.profileComplete ?? false,
        }))
        // Last registered first. createdAt is set at registration on both
        // users/{uid} and profiles/{uid} (see app/register/page.jsx) — using
        // the profile's own copy here avoids depending on the users/{uid}
        // snapshot having arrived yet. Falls back to 0 (sorts to the bottom)
        // for any legacy doc that predates this field.
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)),
    [profiles, usersByUid]
  );

  const filtered = useMemo(() => {
    return merged.filter((p) => {
      if (filters.department && p.department !== filters.department) return false;
      if (filters.session && p.session !== filters.session) return false;
      if (filters.status && statusOf(p) !== filters.status) return false;
      if (filters.completeness === "incomplete" && p.profileComplete) return false;
      if (filters.completeness === "complete" && !p.profileComplete) return false;
      return true;
    });
  }, [merged, filters]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.department?.toLowerCase().includes(q) ||
        p.session?.toLowerCase().includes(q)
    );
  }, [filtered, search]);

  // Reset to page 1 whenever the result set changes shape, so the list never
  // silently lands on an empty "page 4 of 1" after a filter/search change.
  useEffect(() => { setPage(1); }, [search, filters]);

  const pageCount = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const pageItems = searched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selected = merged.find((p) => p.id === selectedUid);

  return (
    <AdminGuard>
      <div className="admin-shell">
        <div className="admin-toplevel-tabs">
          <button
            type="button"
            className={`admin-toplevel-tab ${view === "members" ? "active" : ""}`}
            onClick={() => setView("members")}
          >
            Members
          </button>
          <button
            type="button"
            className={`admin-toplevel-tab ${view === "settings" ? "active" : ""}`}
            onClick={() => setView("settings")}
          >
            Directory settings
          </button>
          <button
            type="button"
            className={`admin-toplevel-tab ${view === "notifications" ? "active" : ""}`}
            onClick={() => setView("notifications")}
          >
            Notifications
          </button>
        </div>

        {view === "settings" ? (
          <div className="admin-settings-view">
            <DirectorySettingsPanel />
          </div>
        ) : (
          <>
            <div className={`admin-toolbar ${selectedUid ? "admin-toolbar-hidden-mobile" : ""}`}>
              <AdminFilterBar profiles={merged} filters={filters} onChange={setFilters} />
            </div>
            {view === "notifications" ? (
              <AdminNotificationsPanel />
            ) : (
              <div className={`admin-columns ${selectedUid ? "showing-detail" : ""}`}>
                <div className="admin-list-pane">
                  <h1>All members</h1>
                  <input
                    type="text"
                    placeholder="Search name, email, department, session…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="admin-search"
                  />
                  <div className="admin-list">
                    {pageItems.map((p) => (
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
                    {searched.length === 0 && <p className="helper-text">No matches.</p>}
                  </div>

                  {searched.length > 0 && (
                    <div className="admin-pagination">
                      <button className="btn-ghost btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        ← Prev
                      </button>
                      <span className="admin-pagination-status">
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, searched.length)} of {searched.length}
                      </span>
                      <button className="btn-ghost btn" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
                        Next →
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-edit-pane">
                  {selected && (
                    <button type="button" className="admin-back-btn" onClick={() => setSelectedUid(null)}>
                      ← Back to list
                    </button>
                  )}
                  {selected ? (
                    <AdminEditForm key={selected.id} profile={selected} />
                  ) : (
                    <p className="helper-text">Select a member from the list to view/edit their full profile.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminGuard>
  );
}

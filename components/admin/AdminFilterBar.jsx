"use client";

import { useMemo } from "react";

function tally(list, keyFn) {
  const counts = {};
  list.forEach((item) => {
    const k = keyFn(item);
    if (!k) return;
    counts[k] = (counts[k] || 0) + 1;
  });
  return counts;
}

function statusOf(p) {
  const e = p.employment;
  if (!e?.status) return "unset";
  if (e.status === "studying") return "studying";
  if (e.status === "job" && e.jobType === "govt") return "govt";
  if (e.status === "job" && e.jobType === "non-govt") return "non-govt";
  return "unset";
}

const STATUS_LABELS = { studying: "Studying", govt: "Job · Govt", "non-govt": "Job · Non-Govt", unset: "Not set" };

// Dropdowns instead of pill rows so filtering stays compact (one line, even
// on mobile) as the department/session list grows — and each option shows a
// live count so an admin can see e.g. "Laboratory (42)" before clicking in,
// rather than filtering blind.
export default function AdminFilterBar({ profiles, filters, onChange }) {
  const total = profiles.length;
  const incomplete = profiles.filter((p) => !p.profileComplete).length;

  const byDepartment = useMemo(() => tally(profiles, (p) => p.department), [profiles]);
  const bySession = useMemo(() => tally(profiles, (p) => p.session), [profiles]);
  const byStatus = useMemo(() => tally(profiles, statusOf), [profiles]);

  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  const activeCount = Object.values(filters).filter(Boolean).length;
  const clearAll = () => onChange({ department: "", session: "", status: "", completeness: "" });

  return (
    <div className="admin-filter-bar">
      <div className="admin-overview-line">
        <span><strong>{total}</strong> members</span>
        <span className="admin-overview-dot">·</span>
        <button
          type="button"
          className="admin-overview-link"
          onClick={() => onChange({ ...filters, completeness: filters.completeness === "incomplete" ? "" : "incomplete" })}
        >
          <strong>{incomplete}</strong> incomplete
        </button>
      </div>

      <div className="admin-filter-dropdowns">
        <select value={filters.department} onChange={set("department")}>
          <option value="">All departments ({total})</option>
          {Object.entries(byDepartment).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
            <option key={dept} value={dept}>{dept} ({count})</option>
          ))}
        </select>

        <select value={filters.session} onChange={set("session")}>
          <option value="">All sessions ({total})</option>
          {Object.entries(bySession).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([session, count]) => (
            <option key={session} value={session}>{session} ({count})</option>
          ))}
        </select>

        <select value={filters.status} onChange={set("status")}>
          <option value="">All statuses ({total})</option>
          {Object.entries(byStatus).map(([status, count]) => (
            <option key={status} value={status}>{STATUS_LABELS[status]} ({count})</option>
          ))}
        </select>

        <select value={filters.completeness} onChange={set("completeness")}>
          <option value="">Complete or incomplete ({total})</option>
          <option value="complete">Complete ({total - incomplete})</option>
          <option value="incomplete">Incomplete ({incomplete})</option>
        </select>

        {activeCount > 0 && (
          <button type="button" className="chip-clear" onClick={clearAll}>
            Clear filters ({activeCount}) ✕
          </button>
        )}
      </div>
    </div>
  );
}
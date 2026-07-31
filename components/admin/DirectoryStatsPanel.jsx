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

export default function DirectoryStatsPanel({ profiles, onSelectStat }) {
  const total = profiles.length;
  const incomplete = profiles.filter((p) => !p.profileComplete).length;

  const byDepartment = useMemo(() => tally(profiles, (p) => p.department), [profiles]);
  const bySession = useMemo(() => tally(profiles, (p) => p.session), [profiles]);

  const statusCounts = useMemo(() => {
    let studying = 0, govt = 0, nonGovt = 0, unset = 0;
    profiles.forEach((p) => {
      const e = p.employment;
      if (!e?.status) unset++;
      else if (e.status === "studying") studying++;
      else if (e.status === "job" && e.jobType === "govt") govt++;
      else if (e.status === "job" && e.jobType === "non-govt") nonGovt++;
      else unset++;
    });
    return { studying, govt, nonGovt, unset };
  }, [profiles]);

  return (
    <div className="admin-stats-panel">
      <h2>Overview</h2>

      <div className="stats-summary-row">
        <button className="stat-card" onClick={() => onSelectStat(null, null)}>
          <div className="stat-number">{total}</div>
          <div className="stat-label">Total members</div>
        </button>
        <button className="stat-card stat-card-warn" onClick={() => onSelectStat("status", "incomplete")}>
          <div className="stat-number">{incomplete}</div>
          <div className="stat-label">Incomplete profiles</div>
        </button>
      </div>

      <div className="stats-group">
        <h3>By department</h3>
        <div className="stats-pill-row">
          {Object.entries(byDepartment).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
            <button key={dept} className="stat-pill" onClick={() => onSelectStat("department", dept)}>
              {dept} <strong>{count}</strong>
            </button>
          ))}
          {Object.keys(byDepartment).length === 0 && <p className="helper-text">No data yet.</p>}
        </div>
      </div>

      <div className="stats-group">
        <h3>By session</h3>
        <div className="stats-pill-row">
          {Object.entries(bySession).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([session, count]) => (
            <button key={session} className="stat-pill" onClick={() => onSelectStat("session", session)}>
              {session} <strong>{count}</strong>
            </button>
          ))}
          {Object.keys(bySession).length === 0 && <p className="helper-text">No data yet.</p>}
        </div>
      </div>

      <div className="stats-group">
        <h3>By current status</h3>
        <div className="stats-pill-row">
          <button className="stat-pill" onClick={() => onSelectStat("status", "studying")}>
            Studying <strong>{statusCounts.studying}</strong>
          </button>
          <button className="stat-pill" onClick={() => onSelectStat("status", "govt")}>
            Job · Govt <strong>{statusCounts.govt}</strong>
          </button>
          <button className="stat-pill" onClick={() => onSelectStat("status", "non-govt")}>
            Job · Non-Govt <strong>{statusCounts.nonGovt}</strong>
          </button>
          {statusCounts.unset > 0 && (
            <span className="stat-pill stat-pill-static">Not set <strong>{statusCounts.unset}</strong></span>
          )}
        </div>
      </div>
    </div>
  );
}
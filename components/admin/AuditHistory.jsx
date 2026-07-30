"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AuditHistory({ targetUid }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Composite index needed: auditLogs (targetUid ASC, timestamp DESC).
    // Firestore will show a one-click link in the console error to create it
    // the first time this query runs against your project.
    const q = query(
      collection(db, "auditLogs"),
      where("targetUid", "==", targetUid),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [targetUid]);

  const formatValue = (v) => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  return (
    <div className="audit-history">
      <h3>Edit history</h3>
      {logs.length === 0 && <p className="helper-text">No admin edits recorded for this member yet.</p>}
      <ul className="audit-list">
        {logs.map((log) => (
          <li key={log.id}>
            <div className="audit-field">{log.field}</div>
            <div className="audit-change">
              <span className="audit-old">{formatValue(log.oldValue)}</span>
              <span className="audit-arrow">→</span>
              <span className="audit-new">{formatValue(log.newValue)}</span>
            </div>
            <div className="audit-meta">
              {log.timestamp?.toDate?.().toLocaleString() ?? "just now"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

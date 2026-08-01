"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Two separate queries (broadcasts vs. this member's targeted ones) merged
// client-side, rather than one query with or(where(...), where(...)).
// Each query only ever returns docs that satisfy the *same* condition
// checked in firestore.rules for that doc, so both stay valid under
// per-document security rules without needing a composite `or` index.
//
// Composite indexes needed the first time each query runs (Firestore will
// print a one-click link in the console error to create them):
//   notifications (audience ASC, createdAt DESC)
//   notifications (targetUid ASC, createdAt DESC)
export function useNotifications(uid) {
  const [broadcast, setBroadcast] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loaded, setLoaded] = useState({ broadcast: false, personal: false, reads: false });

  useEffect(() => {
    const q = query(collection(db, "notifications"), where("audience", "==", "all"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBroadcast(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoaded((l) => ({ ...l, broadcast: true }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "notifications"), where("targetUid", "==", uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPersonal(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoaded((l) => ({ ...l, personal: true }));
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(collection(db, "users", uid, "notificationReads"), (snap) => {
      setReadIds(new Set(snap.docs.map((d) => d.id)));
      setLoaded((l) => ({ ...l, reads: true }));
    });
    return () => unsub();
  }, [uid]);

  const notifications = useMemo(() => {
    const seen = new Set();
    const merged = [...broadcast, ...personal].filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
    merged.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    return merged.map((n) => ({ ...n, read: readIds.has(n.id) }));
  }, [broadcast, personal, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const ready = loaded.broadcast && loaded.personal && loaded.reads;

  return { notifications, unreadCount, ready };
}

export async function markNotificationRead(uid, notificationId) {
  await setDoc(doc(db, "users", uid, "notificationReads", notificationId), { readAt: serverTimestamp() });
}

export async function sendNotification({ title, body, audience, targetUid, createdBy }) {
  await addDoc(collection(db, "notifications"), {
    title: title.trim(),
    body: body.trim(),
    audience,
    targetUid: audience === "user" ? targetUid : null,
    createdBy,
    createdAt: serverTimestamp(),
  });
}
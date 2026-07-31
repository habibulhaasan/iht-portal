"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Single source of truth for what can appear in the Directory tab.
// - togglableByUser: true  -> gated by BOTH this admin switch AND the
//   member's own visibility.{field} choice in My Profile (phone, email,
//   current address, employment/office).
// - togglableByUser: false -> gated ONLY by this admin switch — there's no
//   per-member opt-out for these (blood group, department, session, status),
//   since hiding them defeats the point of a blood-donor directory, but the
//   institute may still want a global kill switch for any of them.
export const DIRECTORY_FIELDS = [
  { key: "bloodGroup", label: "Blood group", togglableByUser: false },
  { key: "department", label: "Department", togglableByUser: false },
  { key: "session", label: "Session", togglableByUser: false },
  { key: "status", label: "Status (studying / job)", togglableByUser: false },
  { key: "location", label: "Current address", togglableByUser: true },
  { key: "officeAddress", label: "Office / employment info", togglableByUser: true },
  { key: "phone", label: "Phone number", togglableByUser: true },
  { key: "email", label: "Email address", togglableByUser: true },
];

const SETTINGS_DOC = doc(db, "settings", "directoryVisibility");

function defaults() {
  const d = {};
  DIRECTORY_FIELDS.forEach((f) => { d[f.key] = true; });
  return d;
}

// Absent doc / absent field both mean "on" — so the directory works exactly
// as before out of the box, until an admin explicitly turns something off.
export function useDirectorySettings() {
  const [settings, setSettings] = useState(defaults());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(SETTINGS_DOC, (snap) => {
      setSettings({ ...defaults(), ...(snap.exists() ? snap.data() : {}) });
      setLoaded(true);
    });
    return () => unsub();
  }, []);

  return { settings, loaded };
}

export async function saveDirectorySettings(next) {
  await setDoc(SETTINGS_DOC, { ...next, updatedAt: serverTimestamp() }, { merge: true });
}

// Effective visibility of one field for one profile: admin switch AND
// (if applicable) the member's own per-field consent.
export function isFieldVisible(fieldKey, adminSettings, profile) {
  const field = DIRECTORY_FIELDS.find((f) => f.key === fieldKey);
  if (adminSettings[fieldKey] === false) return false;
  if (field?.togglableByUser) return !!profile.visibility?.[fieldKey === "location" ? "currentAddress" : fieldKey === "officeAddress" ? "employment" : fieldKey];
  return true;
}
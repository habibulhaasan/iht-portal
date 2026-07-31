"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

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

export function useDirectorySettings() {
  const [settings, setSettings] = useState(defaults());
  const [loaded, setLoaded] = useState(false);

  const loadOnce = useCallback(async () => {
    try {
      const snap = await getDoc(SETTINGS_DOC);
      setSettings({ ...defaults(), ...(snap.exists() ? snap.data() : {}) });
    } catch (err) {
      console.error("directorySettings one-shot read failed — check firestore.rules for the settings/ collection:", err);
      // Fail open with defaults (everything visible) so the admin panel is
      // still usable and can be corrected, rather than hanging forever.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    let settled = false;

    const watchdog = setTimeout(() => {
      if (!settled) {
        settled = true;
        loadOnce();
      }
    }, 5000);

    const unsub = onSnapshot(
      SETTINGS_DOC,
      (snap) => {
        settled = true;
        clearTimeout(watchdog);
        setSettings({ ...defaults(), ...(snap.exists() ? snap.data() : {}) });
        setLoaded(true);
      },
      (err) => {
        settled = true;
        clearTimeout(watchdog);
        console.error("directorySettings listener error — likely a missing/incorrect Firestore rule for settings/{doc}:", err);
        loadOnce();
      }
    );

    return () => {
      settled = true;
      clearTimeout(watchdog);
      unsub();
    };
  }, [loadOnce]);

  return { settings, loaded };
}

export async function saveDirectorySettings(next) {
  await setDoc(SETTINGS_DOC, { ...next, updatedAt: serverTimestamp() }, { merge: true });
}

export function isFieldVisible(fieldKey, adminSettings, profile) {
  const field = DIRECTORY_FIELDS.find((f) => f.key === fieldKey);
  if (adminSettings[fieldKey] === false) return false;
  if (field?.togglableByUser) {
    return !!profile.visibility?.[fieldKey === "location" ? "currentAddress" : fieldKey === "officeAddress" ? "employment" : fieldKey];
  }
  return true;
}
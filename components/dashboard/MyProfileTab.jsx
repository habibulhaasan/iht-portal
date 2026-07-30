"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { BD_DIVISIONS, getDistrictsByDivision, getUpazilasByDistrict } from "../../lib/bdData";
import { defaultAvatarFor, resizeAndEncode } from "../../lib/photoUtils";
import EmploymentStep from "../steps/EmploymentStep";

export default function MyProfileTab() {
  const { user } = useAuth();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "profiles", user.uid), (snap) => setDraft(snap.data()));
    return () => unsub();
  }, [user]);

  if (!draft) return <p className="helper-text">Loading your profile…</p>;

  const currentAddress = draft.currentAddress || {};
  const districts = currentAddress.divisionId ? getDistrictsByDivision(currentAddress.divisionId) : [];
  const upazilas = currentAddress.districtId ? getUpazilasByDistrict(currentAddress.districtId) : [];

  const setAddress = (patch) =>
    setDraft((d) => ({ ...d, currentAddress: { ...d.currentAddress, ...patch } }));

  const setVisibility = (key) => (e) =>
    setDraft((d) => ({ ...d, visibility: { ...d.visibility, [key]: e.target.checked } }));

  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeAndEncode(file);
    setDraft((d) => ({ ...d, photo: { base64, useDefault: false } }));
  };

  const removePhoto = () => setDraft((d) => ({ ...d, photo: { base64: null, useDefault: true } }));

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    await updateDoc(doc(db, "profiles", user.uid), {
      currentAddress: draft.currentAddress,
      phone: draft.phone,
      employment: draft.employment,
      visibility: draft.visibility,
      photo: draft.photo,
      updatedAt: serverTimestamp(),
    });
    setSaving(false);
    setSavedMsg("Saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  return (
    <div>
      <h2>My profile</h2>
      <p className="step-sub">
        You can update these yourself. Everything else (name, DOB, department, etc.) is admin-managed.
      </p>

      <div className="field">
        <label>Phone number</label>
        <input
          type="tel"
          value={draft.phone || ""}
          onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
        />
      </div>

      <div className="field">
        <label>Profile photo</label>
        <div className="photo-upload">
          <img
            src={
              draft.photo?.useDefault === false && draft.photo?.base64
                ? draft.photo.base64
                : defaultAvatarFor(draft.gender)
            }
            alt="Profile"
            className="photo-preview"
          />
          <div>
            <label className="btn-ghost btn" style={{ display: "inline-block", cursor: "pointer", width: "auto" }}>
              Change photo
              <input type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: "none" }} />
            </label>
            {draft.photo?.useDefault === false && (
              <button
                type="button"
                onClick={removePhoto}
                style={{ display: "block", marginTop: 10, background: "none", border: "none", color: "#a3401f", fontSize: 13, cursor: "pointer" }}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--forest)", marginBottom: 10 }}>
        Current address
      </label>
      <div className="field-row" style={{ marginBottom: 10 }}>
        <select
          value={currentAddress.divisionId || ""}
          onChange={(e) => setAddress({ divisionId: e.target.value, districtId: "", upazilaId: "" })}
        >
          <option value="">Division</option>
          {BD_DIVISIONS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          value={currentAddress.districtId || ""}
          onChange={(e) => setAddress({ districtId: e.target.value, upazilaId: "" })}
          disabled={!currentAddress.divisionId}
        >
          <option value="">District</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <select
        value={currentAddress.upazilaId || ""}
        onChange={(e) => setAddress({ upazilaId: e.target.value })}
        disabled={!currentAddress.districtId}
        style={{ marginBottom: 24 }}
      >
        <option value="">Upazila</option>
        {upazilas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      {/* EmploymentStep's setData already matches useState's updater signature,
          so we can pass setDraft straight through with no wrapper. */}
      <EmploymentStep data={draft} setData={setDraft} />

      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--forest)", margin: "24px 0 10px" }}>
        Who can see your details in the directory?
      </label>
      {["phone", "email", "currentAddress", "employment"].map((key) => (
        <label key={key} style={{ display: "flex", gap: 8, fontSize: 13.5, marginBottom: 8 }}>
          <input type="checkbox" checked={!!draft.visibility?.[key]} onChange={setVisibility(key)} />
          Show my {key === "currentAddress" ? "current address" : key === "employment" ? "office/employment info" : key}
        </label>
      ))}

      <button className="btn" style={{ width: "auto", marginTop: 12 }} onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
      {savedMsg && <span style={{ marginLeft: 12, color: "var(--forest)", fontSize: 13.5 }}>{savedMsg}</span>}
    </div>
  );
}
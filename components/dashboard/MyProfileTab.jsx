"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { BD_DIVISIONS, getDistrictsByDivision, getUpazilasByDistrict, getLocationLabel } from "../../lib/bdData";
import { defaultAvatarFor, resizeAndEncode } from "../../lib/photoUtils";
import EmploymentStep from "../steps/EmploymentStep";

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="profile-info-label">{label}</span>
      <span className="profile-info-value">{value || "—"}</span>
    </div>
  );
}

function employmentSummary(employment) {
  if (!employment?.status) return "—";
  if (employment.status === "studying") return "Currently studying";
  if (employment.status !== "job") return "—";
  if (employment.jobType === "govt") {
    const org = employment.govtOrg === "Other" ? "Government (other)" : employment.govtOrg;
    return `${org} — ${employment.officeName || "—"}`;
  }
  if (employment.jobType === "non-govt") {
    return `${employment.officeName || "—"}${employment.officeLocation ? `, ${employment.officeLocation}` : ""}`;
  }
  return "—";
}

export default function MyProfileTab() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "profiles", user.uid), (snap) => setProfile(snap.data()));
    return () => unsub();
  }, [user]);

  if (!profile) return <p className="helper-text">Loading your profile…</p>;

  const startEditing = () => {
  setFormData({
    ...profile,
    photo: profile.photo ?? { base64: null, useDefault: true },
    employment: profile.employment ?? {},
    visibility: profile.visibility ?? { phone: false, email: false, currentAddress: false, employment: false },
  });
  setEditing(true);
  setSavedMsg("");
  };

  const cancelEditing = () => {
    setFormData(null);
    setEditing(false);
  };

  const draft = editing ? formData : profile;
  const currentAddress = draft.currentAddress || {};
  const districts = currentAddress.divisionId ? getDistrictsByDivision(currentAddress.divisionId) : [];
  const upazilas = currentAddress.districtId ? getUpazilasByDistrict(currentAddress.districtId) : [];

  const setAddress = (patch) =>
    setFormData((d) => ({ ...d, currentAddress: { ...d.currentAddress, ...patch } }));

  const setVisibility = (key) => (e) =>
    setFormData((d) => ({ ...d, visibility: { ...d.visibility, [key]: e.target.checked } }));

  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeAndEncode(file);
    setFormData((d) => ({ ...d, photo: { base64, useDefault: false } }));
  };

  const removePhoto = () => setFormData((d) => ({ ...d, photo: { base64: null, useDefault: true } }));

  const handleSave = async () => {
  setSaving(true);
  setSavedMsg("");
  await updateDoc(doc(db, "profiles", user.uid), {
    currentAddress: formData.currentAddress ?? null,
    phone: formData.phone ?? null,
    employment: formData.employment ?? null,
    visibility: formData.visibility ?? null,
    photo: formData.photo ?? { base64: null, useDefault: true },
    updatedAt: serverTimestamp(),
  });
  setSaving(false);
  setEditing(false);
  setFormData(null);
  setSavedMsg("Saved!");
  setTimeout(() => setSavedMsg(""), 2500);
  };

  const photoSrc =
    draft.photo?.useDefault === false && draft.photo?.base64 ? draft.photo.base64 : defaultAvatarFor(draft.gender);

  return (
    <div>
      <div className="profile-header">
        <img src={photoSrc} alt="Profile" className="photo-preview" style={{ width: 64, height: 64 }} />
        <div>
          <h2 className="profile-header-name">{profile.name}</h2>
          <div className="profile-header-meta">
            {profile.department} · {profile.session} · Class of {profile.passingYear}
          </div>
        </div>
        {!editing && (
          <div className="profile-header-actions">
            <button type="button" className="btn" style={{ width: "auto" }} onClick={startEditing}>
              Edit profile
            </button>
          </div>
        )}
      </div>

      {savedMsg && !editing && (
        <p style={{ color: "var(--forest)", fontSize: 13.5, marginTop: -18, marginBottom: 20 }}>{savedMsg}</p>
      )}

      <div className="profile-section">
        <h3>
          Personal details <span className="admin-badge">Admin-managed</span>
        </h3>
        <div className="profile-info-grid">
          <InfoRow label="Full name" value={profile.name} />
          <InfoRow label="Date of birth" value={profile.dob} />
          <InfoRow label="Blood group" value={profile.bloodGroup} />
          <InfoRow label="Gender" value={cap(profile.gender)} />
          <InfoRow label="Marital status" value={cap(profile.maritalStatus)} />
          <InfoRow label="Permanent address" value={getLocationLabel(profile.permanentAddress?.upazilaId)} />
          <InfoRow label="Permanent local address" value={profile.permanentAddress?.localAddress} />
        </div>
      </div>

      <div className="profile-section">
        <h3>
          Academic details <span className="admin-badge">Admin-managed</span>
        </h3>
        <div className="profile-info-grid">
          <InfoRow label="Department" value={profile.department} />
          <InfoRow label="Session" value={profile.session} />
          <InfoRow label="Passing year" value={profile.passingYear} />
          <InfoRow label="Final year roll" value={profile.finalYearRoll} />
        </div>
      </div>

      <div className="profile-section">
        <h3>Contact & photo</h3>

        {editing ? (
          <div className="field">
            <label>Phone number</label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
            />
          </div>
        ) : (
          <div className="profile-info-grid" style={{ marginBottom: 20 }}>
            <InfoRow label="Phone number" value={profile.phone} />
          </div>
        )}

        {editing && (
          <div className="field">
            <label>Profile photo</label>
            <div className="photo-upload">
              <img src={photoSrc} alt="Profile" className="photo-preview" />
              <div>
                <label className="btn-ghost btn" style={{ display: "inline-block", cursor: "pointer", width: "auto" }}>
                  Change photo
                  <input type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: "none" }} />
                </label>
                {formData.photo?.useDefault === false && (
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
        )}
      </div>

      <div className="profile-section">
        <h3>Current address</h3>
        {editing ? (
          <>
            <div className="field-row" style={{ marginBottom: 10 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <select
                  value={currentAddress.divisionId || ""}
                  onChange={(e) => setAddress({ divisionId: e.target.value, districtId: "", upazilaId: "" })}
                >
                  <option value="">Division</option>
                  {BD_DIVISIONS.map((d) => <option key={d.id} value={d.id}>{d.nameBn}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <select
                  value={currentAddress.districtId || ""}
                  onChange={(e) => setAddress({ districtId: e.target.value, upazilaId: "" })}
                  disabled={!currentAddress.divisionId}
                >
                  <option value="">District</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.nameBn}</option>)}
                </select>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <select
                value={currentAddress.upazilaId || ""}
                onChange={(e) => setAddress({ upazilaId: e.target.value })}
                disabled={!currentAddress.districtId}
              >
                <option value="">Upazila</option>
                {upazilas.map((u) => <option key={u.id} value={u.id}>{u.nameBn}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Local address</label>
              <input
                type="text"
                value={currentAddress.localAddress || ""}
                onChange={(e) => setAddress({ localAddress: e.target.value })}
                placeholder="House/road/village — e.g. House 12, Road 4, Shalbon"
              />
            </div>
          </>
        ) : (
          <div className="profile-info-grid">
            <InfoRow label="Current address" value={getLocationLabel(profile.currentAddress?.upazilaId)} />
            <InfoRow label="Local address" value={profile.currentAddress?.localAddress} />
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3>Employment</h3>
        {editing ? (
          <EmploymentStep data={formData} setData={setFormData} />
        ) : (
          <div className="profile-info-grid">
            <InfoRow label="Status" value={employmentSummary(profile.employment)} />
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3>Directory visibility</h3>
        {editing ? (
          <>
            <p className="step-sub" style={{ marginBottom: 12 }}>Who can see these details in the directory?</p>
            {["phone", "email", "currentAddress", "employment"].map((key) => (
              <label key={key} style={{ display: "flex", gap: 8, fontSize: 13.5, marginBottom: 8 }}>
                <input type="checkbox" checked={!!formData.visibility?.[key]} onChange={setVisibility(key)} />
                Show my {key === "currentAddress" ? "current address" : key === "employment" ? "office/employment info" : key}
              </label>
            ))}
          </>
        ) : (
          <div className="profile-info-grid">
            {["phone", "email", "currentAddress", "employment"].map((key) => (
              <InfoRow
                key={key}
                label={key === "currentAddress" ? "Current address" : key === "employment" ? "Office/employment info" : cap(key)}
                value={profile.visibility?.[key] ? "Visible in directory" : "Hidden"}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="profile-edit-actions">
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" className="btn-ghost btn" onClick={cancelEditing} disabled={saving}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
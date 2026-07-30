"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { logProfileEdits, LOCKED_FIELDS } from "../../lib/auditLog";
import { BD_DIVISIONS, getDistrictsByDivision, getUpazilasByDistrict } from "../../lib/bdData";
import AuditHistory from "./AuditHistory";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["male", "female", "other"];
const MARITAL = ["single", "married", "other"];
const DEPARTMENTS = ["Laboratory", "Radiology", "Physiotherapy", "Radiotherapy", "Dental", "Pharmacy", "SIT"];

export default function AdminEditForm({ profile }) {
  const { user: adminUser } = useAuth();
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const field = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));
  const pick = (key, value) => () => setDraft((d) => ({ ...d, [key]: value }));

  const permanentAddress = draft.permanentAddress || {};
  const districts = permanentAddress.divisionId ? getDistrictsByDivision(permanentAddress.divisionId) : [];
  const upazilas = permanentAddress.districtId ? getUpazilasByDistrict(permanentAddress.districtId) : [];
  const setPermanent = (patch) =>
    setDraft((d) => ({ ...d, permanentAddress: { ...d.permanentAddress, ...patch } }));

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    const patch = {};
    for (const f of LOCKED_FIELDS) patch[f] = draft[f] ?? null;
    patch.updatedAt = serverTimestamp();

    await updateDoc(doc(db, "profiles", profile.id), patch);
    await logProfileEdits(profile.id, adminUser.uid, profile, draft);

    setSaving(false);
    setSavedMsg("Saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const handleToggleRole = async () => {
    if (profile.id === adminUser.uid) {
      alert("You can't change your own admin status — ask another admin to do it.");
      return;
    }
    const nextRole = profile.role === "admin" ? "user" : "admin";
    const confirmMsg =
      nextRole === "admin"
        ? `Make ${profile.name || profile.email} an admin? They'll be able to edit anyone's locked fields.`
        : `Remove admin access from ${profile.name || profile.email}?`;
    if (!confirm(confirmMsg)) return;

    await updateDoc(doc(db, "users", profile.id), {
      role: nextRole,
      updatedAt: serverTimestamp(),
    });
  };

  return (
    <div>
      <h2>Editing: {profile.name || profile.email}</h2>
      <p className="step-sub">Changes here are written to the audit log automatically.</p>

      <div className="role-toggle-row">
        <span className={`role-badge ${profile.role === "admin" ? "is-admin" : ""}`}>
          {profile.role === "admin" ? "Admin" : "Regular user"}
        </span>
        <button type="button" className="btn-ghost btn" style={{ width: "auto" }} onClick={handleToggleRole}>
          {profile.role === "admin" ? "Remove admin access" : "Make admin"}
        </button>
      </div>

      <div className="field">
        <label>Full name</label>
        <input type="text" value={draft.name || ""} onChange={field("name")} />
      </div>

      <div className="field">
        <label>Date of birth</label>
        <input type="date" value={draft.dob || ""} onChange={field("dob")} />
      </div>

      <div className="field">
        <label>Blood group</label>
        <div className="pill-group">
          {BLOOD_GROUPS.map((bg) => (
            <button type="button" key={bg} className={`pill ${draft.bloodGroup === bg ? "active" : ""}`} onClick={pick("bloodGroup", bg)}>
              {bg}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Gender</label>
        <div className="pill-group">
          {GENDERS.map((g) => (
            <button type="button" key={g} className={`pill ${draft.gender === g ? "active" : ""}`} onClick={pick("gender", g)}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Marital status</label>
        <div className="pill-group">
          {MARITAL.map((m) => (
            <button type="button" key={m} className={`pill ${draft.maritalStatus === m ? "active" : ""}`} onClick={pick("maritalStatus", m)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Department</label>
        <div className="pill-group">
          {DEPARTMENTS.map((dept) => (
            <button type="button" key={dept} className={`pill ${draft.department === dept ? "active" : ""}`} onClick={pick("department", dept)}>
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Session</label>
          <input type="text" value={draft.session || ""} onChange={field("session")} />
        </div>
        <div className="field">
          <label>Passing year</label>
          <input type="number" value={draft.passingYear || ""} onChange={field("passingYear")} />
        </div>
      </div>

      <div className="field">
        <label>Final year class roll</label>
        <input type="text" value={draft.finalYearRoll || ""} onChange={field("finalYearRoll")} />
      </div>

      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--forest)", marginBottom: 10 }}>
        Permanent address
      </label>
      <div className="field-row" style={{ marginBottom: 10 }}>
        <select
          value={permanentAddress.divisionId || ""}
          onChange={(e) => setPermanent({ divisionId: e.target.value, districtId: "", upazilaId: "" })}
        >
          <option value="">Division</option>
          {BD_DIVISIONS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          value={permanentAddress.districtId || ""}
          onChange={(e) => setPermanent({ districtId: e.target.value, upazilaId: "" })}
          disabled={!permanentAddress.divisionId}
        >
          <option value="">District</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <select
        value={permanentAddress.upazilaId || ""}
        onChange={(e) => setPermanent({ upazilaId: e.target.value })}
        disabled={!permanentAddress.districtId}
        style={{ marginBottom: 24 }}
      >
        <option value="">Upazila</option>
        {upazilas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      <button className="btn" style={{ width: "auto" }} onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
      {savedMsg && <span style={{ marginLeft: 12, color: "var(--forest)", fontSize: 13.5 }}>{savedMsg}</span>}

      <AuditHistory targetUid={profile.id} />
    </div>
  );
}

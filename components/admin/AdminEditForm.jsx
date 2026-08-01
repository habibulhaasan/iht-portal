"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { logProfileEdits } from "../../lib/auditLog";
import { getLastDonation, sortDonations } from "../../lib/donationUtils";
import { BD_DIVISIONS, getDistrictsByDivision, getUpazilasByDistrict } from "../../lib/bdData";
import { HOSPITALS } from "../../lib/hospitalData";
import AuditHistory from "./AuditHistory";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["male", "female", "other"];
const MARITAL = ["single", "married", "other"];
const DEPARTMENTS = ["Laboratory", "Radiology", "Physiotherapy", "Radiotherapy", "Dental", "Pharmacy", "SIT"];

// Everything an admin can write. Excludes email (synced from Firebase Auth —
// editing here wouldn't touch the auth record) and profileComplete/
// donationCount/lastDonationDate (computed server-side, see functions/index.js).
const ADMIN_EDITABLE_FIELDS = [
  "name", "dob", "bloodGroup", "gender", "maritalStatus",
  "department", "session", "passingYear", "finalYearRoll",
  "phone", "currentAddress", "permanentAddress", "employment", "photo",
];

function officesFor(agency, divisionId, districtId, upazilaId) {
  return HOSPITALS.filter(
    (h) =>
      h.agency === agency &&
      (!divisionId || h.location.divisionId === divisionId) &&
      (!districtId || h.location.districtId === districtId) &&
      (!upazilaId || h.location.upazilaId === upazilaId)
  );
}

// Mirrors AddressStep.jsx's AddressBlock exactly (incl. localAddress) so
// admin edits and self-service edits produce identical data shapes.
function AddressFields({ label, value, onChange }) {
  const address = value || { divisionId: "", districtId: "", upazilaId: "", localAddress: "" };
  const districts = address.divisionId ? getDistrictsByDivision(address.divisionId) : [];
  const upazilas = address.districtId ? getUpazilasByDistrict(address.districtId) : [];
  const set = (patch) => onChange({ ...address, ...patch });

  return (
    <div className="address-fields-group">
      <label className="address-group-label">{label}</label>
      <div className="admin-address-grid">
        <div className="field">
          <label>Division</label>
          <select
            value={address.divisionId || ""}
            onChange={(e) => set({ divisionId: e.target.value, districtId: "", upazilaId: "" })}
          >
            <option value="">Select division</option>
            {BD_DIVISIONS.map((d) => <option key={d.id} value={d.id}>{d.nameBn}</option>)}
          </select>
        </div>
        <div className="field">
          <label>District</label>
          <select
            value={address.districtId || ""}
            onChange={(e) => set({ districtId: e.target.value, upazilaId: "" })}
            disabled={!address.divisionId}
          >
            <option value="">Select district</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.nameBn}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Upazila</label>
          <select
            value={address.upazilaId || ""}
            onChange={(e) => set({ upazilaId: e.target.value })}
            disabled={!address.districtId}
          >
            <option value="">Select upazila</option>
            {upazilas.map((u) => <option key={u.id} value={u.id}>{u.nameBn}</option>)}
          </select>
        </div>
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>Local address</label>
        <input
          type="text"
          value={address.localAddress || ""}
          onChange={(e) => set({ localAddress: e.target.value })}
          placeholder="House/road/village"
        />
      </div>
    </div>
  );
}

// Mirrors EmploymentStep.jsx's full branching logic exactly — cascading
// office picker sourced from HOSPITALS (agency-filtered), manual-entry
// fallback, and free-text officeLocation for non-govt — rather than
// reinventing a simplified (and incorrect) version.
function EmploymentFields({ value, onChange }) {
  const employment = value || {};
  const setEmployment = (patch) => onChange({ ...employment, ...patch });

  const setStatus = (status) => () => {
    if (status === "studying") onChange({ status: "studying" });
    else setEmployment({ status: "job" });
  };

  const setJobType = (jobType) => () => {
    if (jobType === "non-govt") {
      setEmployment({ jobType, govtOrg: null, officeLocation: employment.officeLocation || "" });
    } else {
      setEmployment({ jobType, officeLocation: null });
    }
  };

  const setGovtOrg = (govtOrg) => () =>
    setEmployment({
      govtOrg,
      officeId: "",
      officeName: "",
      officeDivisionId: "",
      officeDistrictId: "",
      officeUpazilaId: "",
      officeManualEntry: false,
    });

  const districts = employment.officeDivisionId ? getDistrictsByDivision(employment.officeDivisionId) : [];
  const upazilas = employment.officeDistrictId ? getUpazilasByDistrict(employment.officeDistrictId) : [];
  const officeOptions =
    employment.govtOrg === "DGHS" || employment.govtOrg === "DGFP"
      ? officesFor(employment.govtOrg, employment.officeDivisionId, employment.officeDistrictId, employment.officeUpazilaId)
      : null;

  const selectOffice = (e) => {
    const officeId = e.target.value;
    const hospital = HOSPITALS.find((h) => h.id === officeId);
    setEmployment({ officeId, officeName: hospital?.name || "" });
  };

  const toggleManualEntry = () =>
    setEmployment({ officeManualEntry: !employment.officeManualEntry, officeId: "", officeName: "" });

  return (
    <div className="field">
      <label>Current status</label>
      <div className="pill-group">
        <button type="button" className={`pill ${employment.status === "studying" ? "active" : ""}`} onClick={setStatus("studying")}>
          Studying
        </button>
        <button type="button" className={`pill ${employment.status === "job" ? "active" : ""}`} onClick={setStatus("job")}>
          Job
        </button>
      </div>

      {employment.status === "job" && (
        <>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Job type</label>
            <div className="pill-group">
              <button type="button" className={`pill ${employment.jobType === "govt" ? "active" : ""}`} onClick={setJobType("govt")}>
                Government
              </button>
              <button type="button" className={`pill ${employment.jobType === "non-govt" ? "active" : ""}`} onClick={setJobType("non-govt")}>
                Non-government / Private
              </button>
            </div>
          </div>

          {employment.jobType === "govt" && (
            <>
              <div className="field">
                <label>Organization</label>
                <div className="pill-group">
                  {["DGHS", "DGFP", "Other"].map((org) => (
                    <button type="button" key={org} className={`pill ${employment.govtOrg === org ? "active" : ""}`} onClick={setGovtOrg(org)}>
                      {org}
                    </button>
                  ))}
                </div>
              </div>

              {(employment.govtOrg === "DGHS" || employment.govtOrg === "DGFP") && (
                <>
                  <div className="admin-address-grid" style={{ marginBottom: 10 }}>
                    <div className="field">
                      <label>Division</label>
                      <select
                        value={employment.officeDivisionId || ""}
                        onChange={(e) =>
                          setEmployment({ officeDivisionId: e.target.value, officeDistrictId: "", officeUpazilaId: "", officeId: "", officeName: "" })
                        }
                      >
                        <option value="">All divisions</option>
                        {BD_DIVISIONS.map((d) => <option key={d.id} value={d.id}>{d.nameBn}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>District</label>
                      <select
                        value={employment.officeDistrictId || ""}
                        onChange={(e) => setEmployment({ officeDistrictId: e.target.value, officeUpazilaId: "", officeId: "", officeName: "" })}
                        disabled={!employment.officeDivisionId}
                      >
                        <option value="">All districts</option>
                        {districts.map((d) => <option key={d.id} value={d.id}>{d.nameBn}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Upazila</label>
                      <select
                        value={employment.officeUpazilaId || ""}
                        onChange={(e) => setEmployment({ officeUpazilaId: e.target.value, officeId: "", officeName: "" })}
                        disabled={!employment.officeDistrictId}
                      >
                        <option value="">All upazilas</option>
                        {upazilas.map((u) => <option key={u.id} value={u.id}>{u.nameBn}</option>)}
                      </select>
                    </div>
                  </div>

                  {!employment.officeManualEntry ? (
                    <div className="field">
                      <label>Office name</label>
                      <select value={employment.officeId || ""} onChange={selectOffice}>
                        <option value="">
                          {officeOptions?.length ? `Select office (${officeOptions.length} found)` : "No offices found for this area"}
                        </option>
                        {officeOptions?.map((h) => (
                          <option key={h.id} value={h.id}>{h.nameBn} — {h.facilityType}</option>
                        ))}
                      </select>
                      <p className="helper-text">
                        <button type="button" className="link-button" onClick={toggleManualEntry}>
                          Enter office manually instead
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div className="field">
                      <label>Office name</label>
                      <input
                        type="text"
                        value={employment.officeName || ""}
                        onChange={(e) => setEmployment({ officeName: e.target.value })}
                      />
                      <p className="helper-text">
                        <button type="button" className="link-button" onClick={toggleManualEntry}>
                          Pick from the list instead
                        </button>
                      </p>
                    </div>
                  )}
                </>
              )}

              {employment.govtOrg === "Other" && (
                <div className="field">
                  <label>Institute name</label>
                  <input
                    type="text"
                    value={employment.officeName || ""}
                    onChange={(e) => setEmployment({ officeName: e.target.value })}
                  />
                </div>
              )}
            </>
          )}

          {employment.jobType === "non-govt" && (
            <>
              <div className="field">
                <label>Current office name</label>
                <input
                  type="text"
                  value={employment.officeName || ""}
                  onChange={(e) => setEmployment({ officeName: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Office location</label>
                <input
                  type="text"
                  value={employment.officeLocation || ""}
                  onChange={(e) => setEmployment({ officeLocation: e.target.value })}
                  placeholder="e.g. Panthapath, Dhaka"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminEditForm({ profile }) {
  const { user: adminUser } = useAuth();
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // profile.donationCount / profile.lastDonationDate are meant to be kept in
  // sync by recalcDonationStats, a Cloud Function — which needs the Blaze
  // plan and never runs here, so those two fields are permanently stale/zero.
  // Reading the subcollection directly (same source DonationsTab.jsx uses)
  // instead of trusting those fields fixes the sync issue for good, with no
  // dependency on Cloud Functions at all.
  const [donations, setDonations] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "profiles", profile.id, "bloodDonations"), (snap) => {
      setDonations(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          date: d.data().date?.toDate?.() ?? new Date(d.data().date),
        }))
      );
    });
    return () => unsub();
  }, [profile.id]);

  const lastDonation = useMemo(() => getLastDonation(donations), [donations]);

  const field = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));
  const pick = (key, value) => () => setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    const patch = {};
    for (const f of ADMIN_EDITABLE_FIELDS) patch[f] = draft[f] ?? null;
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

    await updateDoc(doc(db, "users", profile.id), { role: nextRole, updatedAt: serverTimestamp() });
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

      <h3 className="admin-form-section-title">Identity</h3>

      <div className="field">
        <label>Email</label>
        <div className="readonly-value">{profile.email}</div>
        <p className="helper-text">Synced from the account's login — not editable here.</p>
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
            <button type="button" key={bg} className={`pill ${draft.bloodGroup === bg ? "active" : ""}`} onClick={pick("bloodGroup", bg)}>{bg}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Gender</label>
        <div className="pill-group">
          {GENDERS.map((g) => (
            <button type="button" key={g} className={`pill ${draft.gender === g ? "active" : ""}`} onClick={pick("gender", g)}>{g}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Marital status</label>
        <div className="pill-group">
          {MARITAL.map((m) => (
            <button type="button" key={m} className={`pill ${draft.maritalStatus === m ? "active" : ""}`} onClick={pick("maritalStatus", m)}>{m}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Phone number</label>
        <input type="tel" value={draft.phone || ""} onChange={field("phone")} />
      </div>

      <h3 className="admin-form-section-title">Academic</h3>

      <div className="field">
        <label>Department</label>
        <div className="pill-group">
          {DEPARTMENTS.map((dept) => (
            <button type="button" key={dept} className={`pill ${draft.department === dept ? "active" : ""}`} onClick={pick("department", dept)}>{dept}</button>
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

      <h3 className="admin-form-section-title">Address</h3>

      <AddressFields label="Current address" value={draft.currentAddress} onChange={(addr) => setDraft((d) => ({ ...d, currentAddress: addr }))} />
      <AddressFields label="Permanent address" value={draft.permanentAddress} onChange={(addr) => setDraft((d) => ({ ...d, permanentAddress: addr }))} />

      <h3 className="admin-form-section-title">Current status</h3>

      <EmploymentFields value={draft.employment} onChange={(emp) => setDraft((d) => ({ ...d, employment: emp }))} />

      <h3 className="admin-form-section-title">Photo</h3>

      <div className="field">
        {profile.photo?.useDefault === false && profile.photo?.base64 ? (
          <div className="admin-photo-row">
            <img src={profile.photo.base64} alt={profile.name} className="photo-preview" style={{ width: 64, height: 64 }} />
            <button type="button" className="btn-ghost btn" style={{ width: "auto" }} onClick={() => setDraft((d) => ({ ...d, photo: { useDefault: true } }))}>
              Reset to default avatar
            </button>
          </div>
        ) : (
          <p className="helper-text">No custom photo uploaded — showing the default avatar for this member's gender.</p>
        )}
      </div>

      <h3 className="admin-form-section-title">Blood donation stats</h3>

      <div className="field-row">
        <div className="field">
          <label>Total donations</label>
          <div className="readonly-value">{donations.length}</div>
        </div>
        <div className="field">
          <label>Last donation date</label>
          <div className="readonly-value">{lastDonation ? lastDonation.date.toLocaleDateString() : "—"}</div>
        </div>
      </div>
      <p className="helper-text">
        Live from this member's donation log, not directly editable here. (If this ever looks
        out of sync with what they see in their own dashboard, it's the same live data — there's
        no separate cached copy to drift.)
      </p>

      {sortDonations(donations).length > 0 && (
        <ul className="donation-list" style={{ marginBottom: 20 }}>
          {sortDonations(donations).map((d) => (
            <li key={d.id}>
              <span>{d.date.toLocaleDateString()}</span>
              {d.note && <span className="donation-note">{d.note}</span>}
            </li>
          ))}
        </ul>
      )}

      <button className="btn" style={{ width: "auto" }} onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
      {savedMsg && <span style={{ marginLeft: 12, color: "var(--forest)", fontSize: 13.5 }}>{savedMsg}</span>}

      <AuditHistory targetUid={profile.id} />
    </div>
  );
}
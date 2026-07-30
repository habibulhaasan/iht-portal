"use client";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["male", "female", "other"];
const MARITAL = ["single", "married", "other"];

export default function PersonalStep({ data, setData }) {
  const field = (key) => (e) => setData((d) => ({ ...d, [key]: e.target.value }));
  const pick = (key, value) => () => setData((d) => ({ ...d, [key]: value }));

  return (
    <div>
      <h2>Personal details</h2>
      <p className="step-sub">This information is verified by admins and can't be self-edited later.</p>

      <div className="field">
        <label>Full name</label>
        <input type="text" value={data.name || ""} onChange={field("name")} required />
      </div>

      <div className="field">
        <label>Date of birth</label>
        <input type="date" value={data.dob || ""} onChange={field("dob")} required />
      </div>

      <div className="field">
        <label>Blood group</label>
        <div className="pill-group">
          {BLOOD_GROUPS.map((bg) => (
            <button type="button" key={bg} className={`pill ${data.bloodGroup === bg ? "active" : ""}`} onClick={pick("bloodGroup", bg)}>
              {bg}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Gender</label>
        <div className="pill-group">
          {GENDERS.map((g) => (
            <button type="button" key={g} className={`pill ${data.gender === g ? "active" : ""}`} onClick={pick("gender", g)}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Marital status</label>
        <div className="pill-group">
          {MARITAL.map((m) => (
            <button type="button" key={m} className={`pill ${data.maritalStatus === m ? "active" : ""}`} onClick={pick("maritalStatus", m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Phone number</label>
        <input type="tel" value={data.phone || ""} onChange={field("phone")} placeholder="01XXXXXXXXX" required />
        <p className="helper-text">You can update this yourself later from your dashboard.</p>
      </div>
    </div>
  );
}

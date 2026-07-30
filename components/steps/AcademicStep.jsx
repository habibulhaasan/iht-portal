"use client";

const DEPARTMENTS = ["Laboratory", "Radiology", "Physiotherapy", "Radiotherapy", "Dental", "Pharmacy", "SIT"];

export default function AcademicStep({ data, setData }) {
  const field = (key) => (e) => setData((d) => ({ ...d, [key]: e.target.value }));
  const pick = (dept) => () => setData((d) => ({ ...d, department: dept }));

  return (
    <div>
      <h2>Academic details</h2>
      <p className="step-sub">Your department, session, and passing year.</p>

      <div className="field">
        <label>Department</label>
        <div className="pill-group">
          {DEPARTMENTS.map((dept) => (
            <button type="button" key={dept} className={`pill ${data.department === dept ? "active" : ""}`} onClick={pick(dept)}>
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Session</label>
          <input type="text" placeholder="e.g. 2018-2019" value={data.session || ""} onChange={field("session")} required />
        </div>
        <div className="field">
          <label>Passing year</label>
          <input type="number" placeholder="e.g. 2021" value={data.passingYear || ""} onChange={field("passingYear")} required />
        </div>
      </div>

      <div className="field">
        <label>Final year class roll <span style={{ fontWeight: 400, color: "#9a927e" }}>(optional)</span></label>
        <input type="text" value={data.finalYearRoll || ""} onChange={field("finalYearRoll")} />
      </div>
    </div>
  );
}

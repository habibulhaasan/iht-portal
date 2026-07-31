"use client";

const DEPARTMENTS = [
  "Laboratory",
  "Radiology",
  "Physiotherapy",
  "Radiotherapy",
  "Dental",
  "Pharmacy",
  "SIT",
];

// Helper function to dynamically generate sessions from 2009 to the current year
const generateSessions = () => {
  const currentYear = new Date().getFullYear();
  const startYear = 2009;
  const sessions = [];

  for (let i = startYear; i <= currentYear; i++) {
    // Take the next year and grab the last two digits (e.g., 2010 becomes "10")
    const nextYearShort = (i + 1).toString().slice(-2);
    sessions.push(`${i}-${nextYearShort}`);
  }
  
  // Optional: Return sessions.reverse() if you want the newest sessions at the top of the dropdown
  return sessions.reverse(); 
};

const SESSIONS = generateSessions();

export default function AcademicStep({ data, setData }) {
  const field = (key) => (e) =>
    setData((d) => ({ ...d, [key]: e.target.value }));
  const pick = (dept) => () => setData((d) => ({ ...d, department: dept }));

  return (
    <div>
      <h2>Academic details</h2>
      <p className="step-sub">Your department, session, and passing year.</p>

      <div className="field">
        <label>Department</label>
        <div className="pill-group">
          {DEPARTMENTS.map((dept) => (
            <button
              type="button"
              key={dept}
              className={`pill ${data.department === dept ? "active" : ""}`}
              onClick={pick(dept)}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Session</label>
          {/* Replaced Input with a Select Dropdown */}
          <select
            value={data.session || ""}
            onChange={field("session")}
            required
          >
            <option value="" disabled>
              Select a session
            </option>
            {SESSIONS.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Passing year</label>
          <input
            type="number"
            placeholder="e.g. 2021"
            value={data.passingYear || ""}
            onChange={field("passingYear")}
            required
          />
        </div>
      </div>

      <div className="field">
        <label>
          Final year class roll{" "}
          <span style={{ fontWeight: 400, color: "#9a927e" }}>
            (optional)
          </span>
        </label>
        <input
          type="text"
          value={data.finalYearRoll || ""}
          onChange={field("finalYearRoll")}
        />
      </div>
    </div>
  );
}
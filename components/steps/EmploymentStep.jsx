"use client";

import { BD_DIVISIONS, getDistrictsByDivision, getUpazilasByDistrict } from "../../lib/bdData";
import { HOSPITALS } from "../../lib/hospitalData";

// Office is chosen via Division -> District -> Upazila -> facility, filtered
// by agency (DGHS/DGFP), from the real facility directory in
// lib/hospitals.json. Narrowing down to upazila keeps the office list short
// even in busy districts. Not every facility resolves to an upazila (~3%,
// mostly city-corporation thana clinics) — those stay reachable by leaving
// upazila unset, and "my office isn't listed" always falls back to free text.

function officesFor(agency, divisionId, districtId, upazilaId) {
  return HOSPITALS.filter(
    (h) =>
      h.agency === agency &&
      (!divisionId || h.location.divisionId === divisionId) &&
      (!districtId || h.location.districtId === districtId) &&
      (!upazilaId || h.location.upazilaId === upazilaId)
  );
}

export default function EmploymentStep({ data, setData }) {
  const employment = data.employment || {};

  const setEmployment = (patch) =>
    setData((d) => ({ ...d, employment: { ...d.employment, ...patch } }));

  const setStatus = (status) => () => {
    if (status === "studying") {
      setData((d) => ({ ...d, employment: { status: "studying" } }));
    } else {
      setEmployment({ status: "job" });
    }
  };

  const setJobType = (jobType) => () => {
    if (jobType === "non-govt") {
      setEmployment({ jobType, govtOrg: null, officeName: employment.officeName || "" });
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
    setEmployment({
      officeManualEntry: !employment.officeManualEntry,
      officeId: "",
      officeName: "",
    });

  return (
    <div>
      <h2>Current status</h2>
      <p className="step-sub">Are you currently studying or working?</p>

      <div className="field">
        <div className="pill-group">
          <button type="button" className={`pill ${employment.status === "studying" ? "active" : ""}`} onClick={setStatus("studying")}>
            Studying
          </button>
          <button type="button" className={`pill ${employment.status === "job" ? "active" : ""}`} onClick={setStatus("job")}>
            Job
          </button>
        </div>
      </div>

      {employment.status === "job" && (
        <>
          <div className="field">
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
                  <div className="field-row-3" style={{ marginBottom: 10 }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>Division</label>
                      <select
                        value={employment.officeDivisionId || ""}
                        onChange={(e) =>
                          setEmployment({
                            officeDivisionId: e.target.value,
                            officeDistrictId: "",
                            officeUpazilaId: "",
                            officeId: "",
                            officeName: "",
                          })
                        }
                      >
                        <option value="">All divisions</option>
                        {BD_DIVISIONS.map((d) => (
                          <option key={d.id} value={d.id}>{d.nameBn}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>District</label>
                      <select
                        value={employment.officeDistrictId || ""}
                        onChange={(e) =>
                          setEmployment({ officeDistrictId: e.target.value, officeUpazilaId: "", officeId: "", officeName: "" })
                        }
                        disabled={!employment.officeDivisionId}
                      >
                        <option value="">All districts</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>{d.nameBn}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>Upazila</label>
                      <select
                        value={employment.officeUpazilaId || ""}
                        onChange={(e) => setEmployment({ officeUpazilaId: e.target.value, officeId: "", officeName: "" })}
                        disabled={!employment.officeDistrictId}
                      >
                        <option value="">All upazilas</option>
                        {upazilas.map((u) => (
                          <option key={u.id} value={u.id}>{u.nameBn}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!employment.officeManualEntry ? (
                    <div className="field">
                      <label>Office name</label>
                      <select value={employment.officeId || ""} onChange={selectOffice} required>
                        <option value="">
                          {officeOptions.length ? `Select office (${officeOptions.length} found)` : "No offices found for this area"}
                        </option>
                        {officeOptions.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.nameBn} — {h.facilityType}
                          </option>
                        ))}
                      </select>
                      <p className="helper-text">
                        Narrow by division/district/upazila above if the list is long.{" "}
                        <button type="button" className="link-button" onClick={toggleManualEntry}>
                          Can't find your office? Enter it manually.
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
                        placeholder="Type your office/facility name"
                        required
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
                    placeholder="Name of your institute/organization"
                    required
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
                  placeholder="e.g. Square Hospitals Ltd."
                  required
                />
              </div>
              <div className="field">
                <label>Office location</label>
                <input
                  type="text"
                  value={employment.officeLocation || ""}
                  onChange={(e) => setEmployment({ officeLocation: e.target.value })}
                  placeholder="e.g. Panthapath, Dhaka"
                  required
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
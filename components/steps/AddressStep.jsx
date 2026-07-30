"use client";

import { useState } from "react";
import { BD_DIVISIONS, getDistrictsByDivision, getUpazilasByDistrict } from "../../lib/bdData";

// Address shape stored in Firestore: { divisionId, districtId, upazilaId }
// (IDs only — display names are looked up on read via bdData.js helpers,
// so renamed/merged upazilas don't silently break old records.)

function AddressBlock({ label, value, onChange }) {
  const address = value || { divisionId: "", districtId: "", upazilaId: "" };
  const districts = address.divisionId ? getDistrictsByDivision(address.divisionId) : [];
  const upazilas = address.districtId ? getUpazilasByDistrict(address.districtId) : [];

  const set = (patch) => onChange({ ...address, ...patch });

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--forest)", marginBottom: 10 }}>
        {label}
      </label>
      <div className="field-row" style={{ marginBottom: 10 }}>
        <div className="field" style={{ marginBottom: 0 }}>
        <select
          value={address.divisionId}
          onChange={(e) => set({ divisionId: e.target.value, districtId: "", upazilaId: "" })}
          required
        >
          <option value="">Division</option>
          {BD_DIVISIONS.map((d) => (
            <option key={d.id} value={d.id}>{d.nameBn}</option>
          ))}
        </select>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
        <select
          value={address.districtId}
          onChange={(e) => set({ districtId: e.target.value, upazilaId: "" })}
          disabled={!address.divisionId}
          required
        >
          <option value="">District</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.nameBn}</option>
          ))}
        </select>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
      <select
        value={address.upazilaId}
        onChange={(e) => set({ upazilaId: e.target.value })}
        disabled={!address.districtId}
        required
      >
        <option value="">Upazila</option>
        {upazilas.map((u) => (
          <option key={u.id} value={u.id}>{u.nameBn}</option>
        ))}
      </select>
      </div>
    </div>
  );
}

export default function AddressStep({ data, setData }) {
  const [sameAsPermanent, setSameAsPermanent] = useState(
    JSON.stringify(data.currentAddress) === JSON.stringify(data.permanentAddress) && !!data.permanentAddress
  );

  const setPermanent = (val) => {
    setData((d) => ({
      ...d,
      permanentAddress: val,
      currentAddress: sameAsPermanent ? val : d.currentAddress,
    }));
  };

  const setCurrent = (val) => setData((d) => ({ ...d, currentAddress: val }));

  const toggleSame = () => {
    const next = !sameAsPermanent;
    setSameAsPermanent(next);
    if (next) setData((d) => ({ ...d, currentAddress: d.permanentAddress }));
  };

  return (
    <div>
      <h2>Address</h2>
      <p className="step-sub">Permanent address is fixed once submitted. Current address you can update anytime.</p>

      <AddressBlock label="Permanent address" value={data.permanentAddress} onChange={setPermanent} />

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={sameAsPermanent} onChange={toggleSame} />
        Current address is the same as permanent address
      </label>

      {!sameAsPermanent && (
        <AddressBlock label="Current address" value={data.currentAddress} onChange={setCurrent} />
      )}
    </div>
  );
}

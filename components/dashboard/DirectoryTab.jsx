// File: components/dashboard/DirectoryTab.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Star, Phone, Mail, MapPin, Briefcase, GraduationCap, Droplet, RotateCcw } from "lucide-react";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { BD_DIVISIONS, getDistrictsByDivision, getUpazilasByDistrict, getAddressLabel } from "../../lib/bdData";
import { resolveEmploymentAddress } from "../../lib/hospitalData";
import { defaultAvatarFor } from "../../lib/photoUtils";
import { useDirectorySettings, isFieldVisible } from "../../lib/directorySettings";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const DEPARTMENTS = ["Laboratory", "Radiology", "Physiotherapy", "Radiotherapy", "Dental", "Pharmacy", "SIT"];

const DEPARTMENT_COLORS = {
  Laboratory: { bg: "#eaf4ff", fg: "#1d5fa8" },
  Radiology: { bg: "#f3eafb", fg: "#7a3fa0" },
  Physiotherapy: { bg: "#eaf9ef", fg: "#1f7a43" },
  Radiotherapy: { bg: "#fdeaf0", fg: "#b03566" },
  Dental: { bg: "#e8fbfa", fg: "#12807a" },
  Pharmacy: { bg: "#fff6e5", fg: "#b4790c" },
  SIT: { bg: "#eef0ff", fg: "#4a4fc4" },
};

export function DepartmentChip({ department }) {
  if (!department) return null;
  const colors = DEPARTMENT_COLORS[department] || { bg: "#f1ebdd", fg: "#5b5646" };
  return (
    <span className="dept-chip" style={{ background: colors.bg, color: colors.fg }}>
      {department}
    </span>
  );
}

export function BloodDropBadge({ group, size = 38 }) {
  if (!group) return null;
  return (
    <div className="blood-drop" style={{ width: size, height: size }} title={`Blood group ${group}`}>
      <svg viewBox="0 0 24 28" width={size} height={size} aria-hidden="true">
        <path d="M12 1C12 1 2 13.5 2 19.5a10 10 0 0020 0C22 13.5 12 1 12 1z" />
      </svg>
      <span className="blood-drop-label">{group}</span>
    </div>
  );
}

// "Studying" or "Job · Govt (DGHS)" / "Job · Non-Govt" — same status vocabulary
// as EmploymentStep / the filters below, just rendered for humans.
function employmentStatusLabel(e) {
  if (!e?.status) return "—";
  if (e.status === "studying") return "Studying";
  if (e.status === "job") {
    if (e.jobType === "govt") return `Job · Govt${e.govtOrg ? ` (${e.govtOrg})` : ""}`;
    if (e.jobType === "non-govt") return "Job · Non-Govt";
    return "Job";
  }
  return "—";
}

const INITIAL_FILTERS = {
  search: "",
  divisionId: "",
  districtId: "",
  upazilaId: "",
  bloodGroup: "",
  jobType: "",
  department: "",
};



export default function DirectoryTab() {
  const { user } = useAuth();
  const { settings: adminSettings } = useDirectorySettings();
  const [profiles, setProfiles] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "profiles"), (snap) => {
      setProfiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "favorites"), (snap) => {
      setFavoriteIds(new Set(snap.docs.map((d) => d.id)));
    });
    return () => unsub();
  }, [user]);

  const toggleFavorite = async (targetUid) => {
    const ref = doc(db, "users", user.uid, "favorites", targetUid);
    if (favoriteIds.has(targetUid)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { addedAt: serverTimestamp() });
    }
  };

  // Strict cascade: district list is empty until a division is picked, and
  // upazila list is empty until a district is picked — mirrors AddressStep.
  const districtsForFilter = filters.divisionId ? getDistrictsByDivision(filters.divisionId) : [];
  const upazilasForFilter = filters.districtId ? getUpazilasByDistrict(filters.districtId) : [];

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return profiles.filter((p) => {
      if (p.id === user?.uid) return false;
      if (q) {
        // One search box, matches either — case-insensitive substring on
        // both, so "2018" or a partial name both work from the same field.
        const nameMatch = p.name?.toLowerCase().includes(q);
        const sessionMatch = p.session?.toLowerCase().includes(q);
        if (!nameMatch && !sessionMatch) return false;
      }
      if (filters.divisionId && p.currentAddress?.divisionId !== filters.divisionId) return false;
      if (filters.districtId && p.currentAddress?.districtId !== filters.districtId) return false;
      if (filters.upazilaId && p.currentAddress?.upazilaId !== filters.upazilaId) return false;
      if (filters.bloodGroup && p.bloodGroup !== filters.bloodGroup) return false;
      if (filters.department && p.department !== filters.department) return false;
      if (filters.jobType && p.employment?.status !== filters.jobType) return false;
      return true;
    });
  }, [profiles, filters, user]);

  const setFilter = (key) => (e) =>
    setFilters((f) => ({
      ...f,
      [key]: e.target.value,
      ...(key === "divisionId" ? { districtId: "", upazilaId: "" } : {}),
      ...(key === "districtId" ? { upazilaId: "" } : {}),
    }));

  const resetFilters = () => setFilters(INITIAL_FILTERS);
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(INITIAL_FILTERS);

  // A column only ever appears if the admin allows that field at all —
  // whether it's also member-controlled just decides what each *row* shows
  // within that. No point rendering a header full of "—" for a field the
  // institute has switched off entirely.
  const showCol = (key) => adminSettings[key] !== false;

  return (
    <div className="directory-tab">
      <h2>Directory</h2>
      <p className="step-sub">{filtered.length} people match your filters.</p>

      <div className="directory-filters">
        <input
          type="text"
          placeholder="Search by name or session"
          value={filters.search}
          onChange={setFilter("search")}
        />
        <select value={filters.divisionId} onChange={setFilter("divisionId")}>
          <option value="">All divisions</option>
          {BD_DIVISIONS.map((d) => <option key={d.id} value={d.id}>{d.nameBn || d.name}</option>)}
        </select>
        <select value={filters.districtId} onChange={setFilter("districtId")} disabled={!filters.divisionId}>
          <option value="">All districts</option>
          {districtsForFilter.map((d) => <option key={d.id} value={d.id}>{d.nameBn || d.name}</option>)}
        </select>
        <select value={filters.upazilaId} onChange={setFilter("upazilaId")} disabled={!filters.districtId}>
          <option value="">All upazilas</option>
          {upazilasForFilter.map((u) => <option key={u.id} value={u.id}>{u.nameBn || u.name}</option>)}
        </select>
        <select value={filters.bloodGroup} onChange={setFilter("bloodGroup")}>
          <option value="">All blood groups</option>
          {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
        </select>
        <select value={filters.department} onChange={setFilter("department")}>
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.jobType} onChange={setFilter("jobType")}>
          <option value="">Studying or job</option>
          <option value="studying">Studying</option>
          <option value="job">Job</option>
        </select>
        <button
          type="button"
          className="btn-ghost btn directory-reset-btn"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          <RotateCcw size={14} />
          Reset filters
        </button>
      </div>

      {filtered.length === 0 && <p className="helper-text">No one matches these filters yet.</p>}

      <div className="directory-table-wrap">
        <table className="directory-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              {showCol("bloodGroup") && <th>Blood</th>}
              {showCol("donation") && <th>Blood Donation</th>}
              {showCol("department") && <th>Department</th>}
              {showCol("session") && <th>Session</th>}
              {showCol("status") && <th>Status</th>}
              {showCol("location") && <th>Location</th>}
              {showCol("officeAddress") && <th>Office address</th>}
              {(showCol("phone") || showCol("email")) && <th>Contact</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <DirectoryRow
                key={p.id}
                profile={p}
                adminSettings={adminSettings}
                isFavorite={favoriteIds.has(p.id)}
                onToggleFavorite={() => toggleFavorite(p.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="directory-grid-mobile">
        {filtered.map((p) => (
          <DirectoryCard
            key={p.id}
            profile={p}
            adminSettings={adminSettings}
            isFavorite={favoriteIds.has(p.id)}
            onToggleFavorite={() => toggleFavorite(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Resolves ALL visibility for one profile in one place — admin switch AND
// (where applicable) the member's own consent — so DirectoryRow and
// DirectoryCard can't drift out of sync with each other.
function useVisibleProfile(profile, adminSettings) {
  const avatar =
    profile.photo?.useDefault === false && profile.photo?.base64
      ? profile.photo.base64
      : defaultAvatarFor(profile.gender);

  const show = {
    bloodGroup: isFieldVisible("bloodGroup", adminSettings, profile),
    department: isFieldVisible("department", adminSettings, profile),
    session: isFieldVisible("session", adminSettings, profile),
    status: isFieldVisible("status", adminSettings, profile),
    location: isFieldVisible("location", adminSettings, profile),
    officeAddress: isFieldVisible("officeAddress", adminSettings, profile),
    phone: isFieldVisible("phone", adminSettings, profile),
    email: isFieldVisible("email", adminSettings, profile),
  };

  // Donation count/date already live on the profile doc (maintained
  // server-side by the recalcDonationStats Cloud Function) — just decide
  // whether there's anything to show, "if available" per the member's
  // actual log rather than an admin/member consent toggle like the fields
  // above.
  const donationCount = profile.donationCount || 0;
  const rawLastDonation = profile.lastDonationDate;
  const lastDonationDate = rawLastDonation
    ? (rawLastDonation.toDate ? rawLastDonation.toDate() : new Date(rawLastDonation))
    : null;
  const donationInfo =
    adminSettings.donation !== false && donationCount > 0
      ? { count: donationCount, lastDateLabel: lastDonationDate ? lastDonationDate.toLocaleDateString() : "—" }
      : null;

  return {
    avatar,
    show,
    donationInfo,
    locationLabel: show.location ? getAddressLabel(profile.currentAddress, "bn") : "",
    officeAddress: show.officeAddress ? resolveEmploymentAddress(profile.employment) : "",
    officeName: show.officeAddress ? profile.employment?.officeName : "",
    statusLabel: show.status ? employmentStatusLabel(profile.employment) : "",
  };
}
export function DirectoryRow({ profile, adminSettings, isFavorite, onToggleFavorite }) {
  const { show, avatar, donationInfo, locationLabel, officeAddress, officeName, statusLabel } = useVisibleProfile(profile, adminSettings);

  return (
    <tr className="directory-row">
      <td>
        <img src={avatar} alt={profile.name} className="directory-row-avatar" />
      </td>
      <td className="directory-row-name">{profile.name}</td>
      {show.bloodGroup !== undefined && adminSettings.bloodGroup !== false && (
        <td>{show.bloodGroup ? <BloodDropBadge group={profile.bloodGroup} size={32} /> : "—"}</td>
      )}
      {adminSettings.donation !== false && (
        <td>
          {donationInfo ? (
            <span className="directory-row-donation">
              <Droplet size={13} />
              Last: {donationInfo.lastDateLabel} · Total: {donationInfo.count}
            </span>
          ) : (
            "—"
          )}
        </td>
      )}
      {adminSettings.department !== false && (
        <td>{show.department ? <DepartmentChip department={profile.department} /> : "—"}</td>
      )}
      {adminSettings.session !== false && <td>{show.session ? (profile.session || "—") : "—"}</td>}
      {adminSettings.status !== false && <td>{statusLabel || "—"}</td>}
      {adminSettings.location !== false && (
        <td>
          {locationLabel ? (
            <span className="directory-row-location">
              <MapPin size={13} />
              {locationLabel}
            </span>
          ) : (
            "—"
          )}
        </td>
      )}
      {adminSettings.officeAddress !== false && (
        <td>
          {officeName || officeAddress ? (
            <div>
              {officeName && <div>{officeName}</div>}
              {officeAddress && <div className="directory-row-sub">{officeAddress}</div>}
            </div>
          ) : (
            "—"
          )}
        </td>
      )}
      {(adminSettings.phone !== false || adminSettings.email !== false) && (
        <td>
          <div className="directory-row-contact">
            {show.phone && profile.phone && (
              <span title={profile.phone}><Phone size={15} /></span>
            )}
            {show.email && profile.email && (
              <span title={profile.email}><Mail size={15} /></span>
            )}
            {!show.phone && !show.email && "—"}
          </div>
        </td>
      )}
      <td>
        <button
          className={`favorite-btn ${isFavorite ? "active" : ""}`}
          onClick={onToggleFavorite}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </td>
    </tr>
  );
}

export function DirectoryCard({ profile, adminSettings, isFavorite, onToggleFavorite }) {
  const { show, avatar, donationInfo, officeAddress, officeName, statusLabel } = useVisibleProfile(profile, adminSettings);

  return (
    <div className="directory-card">
      <button
        className={`favorite-btn card-favorite-btn ${isFavorite ? "active" : ""}`}
        onClick={onToggleFavorite}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
      </button>

      <div className="directory-card-top">
        <img src={avatar} alt={profile.name} className="photo-preview" style={{ width: 56, height: 56 }} />
        <div>
          <div className="directory-card-name">{profile.name}</div>
          <div className="directory-card-tags">
            {show.department && <DepartmentChip department={profile.department} />}
            {show.session && profile.session && <span className="session-chip">{profile.session}</span>}
          </div>
        </div>
        {show.bloodGroup && <BloodDropBadge group={profile.bloodGroup} />}
      </div>

      <div className="directory-card-body">
        {show.status && statusLabel && statusLabel !== "—" && (
          <div className="directory-card-meta">
            <GraduationCap size={14} />
            <span>{statusLabel}</span>
          </div>
        )}
        {(officeName || officeAddress) && show.officeAddress && (
          <div className="directory-card-meta">
            <Briefcase size={14} />
            <span>
              {officeName}
              {officeName && officeAddress ? " — " : ""}
              {officeAddress}
            </span>
          </div>
        )}
        {show.location && profile.currentAddress && (
          <div className="directory-card-meta">
            <MapPin size={14} />
            <span>{getAddressLabel(profile.currentAddress, "bn")}</span>
          </div>
        )}
        {show.email && profile.email && (
          <div className="directory-card-meta">
            <Mail size={14} />
            <span>{profile.email}</span>
          </div>
        )}
        {show.phone && profile.phone && (
          <div className="directory-card-meta">
            <Phone size={14} />
            <span>{profile.phone}</span>
          </div>
        )}
        {adminSettings.donation !== false && donationInfo && (
          <div className="directory-card-meta directory-card-donation">
            <Droplet size={14} />
            <span>Last Blood donation: {donationInfo.lastDateLabel} · Total: {donationInfo.count}</span>
          </div>
        )}
      </div>
    </div>
  );
}
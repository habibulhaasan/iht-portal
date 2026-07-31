"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Star, Phone, Mail, MapPin, Briefcase } from "lucide-react";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { BD_DIVISIONS, getDistrictsByDivision, getAllDistricts, getAddressLabel } from "../../lib/bdData";
import { resolveEmploymentAddress } from "../../lib/hospitalData";
import { defaultAvatarFor } from "../../lib/photoUtils";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const DEPARTMENTS = ["Laboratory", "Radiology", "Physiotherapy", "Radiotherapy", "Dental", "Pharmacy", "SIT"];

// Distinct, light pastel background per department so cards/rows are easy to
// scan at a glance — matches the site's warm palette rather than clashing
// with it.
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

export default function DirectoryTab() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [filters, setFilters] = useState({
    divisionId: "",
    districtId: "",
    bloodGroup: "",
    jobType: "",
    department: "",
    session: "",
  });

  useEffect(() => {
    // Fine to fetch the whole collection client-side for a single-institute
    // scale dataset. If this grows large, switch to Firestore compound
    // queries with composite indexes instead of filtering in memory.
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

  const districtsForFilter = filters.divisionId ? getDistrictsByDivision(filters.divisionId) : getAllDistricts();

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (p.id === user?.uid) return false;
      if (filters.divisionId && p.currentAddress?.divisionId !== filters.divisionId) return false;
      if (filters.districtId && p.currentAddress?.districtId !== filters.districtId) return false;
      if (filters.bloodGroup && p.bloodGroup !== filters.bloodGroup) return false;
      if (filters.department && p.department !== filters.department) return false;
      if (filters.session && p.session !== filters.session) return false;
      if (filters.jobType && p.employment?.status !== filters.jobType) return false;
      return true;
    });
  }, [profiles, filters, user]);

  const setFilter = (key) => (e) =>
    setFilters((f) => ({
      ...f,
      [key]: e.target.value,
      ...(key === "divisionId" ? { districtId: "" } : {}),
    }));

  return (
    <div>
      <h2>Directory</h2>
      <p className="step-sub">{filtered.length} people match your filters.</p>

      <div className="directory-filters">
        <select value={filters.divisionId} onChange={setFilter("divisionId")}>
          <option value="">All divisions</option>
          {BD_DIVISIONS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filters.districtId} onChange={setFilter("districtId")}>
          <option value="">All districts</option>
          {districtsForFilter.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
        <input type="text" placeholder="Session e.g. 2018-2019" value={filters.session} onChange={setFilter("session")} />
      </div>

      {filtered.length === 0 && <p className="helper-text">No one matches these filters yet.</p>}

      {/* Desktop / tablet: table. Mobile: cards. Both render the same data —
          which one is visible is decided purely by CSS media queries (see
          .directory-table-wrap / .directory-grid in globals.css), so there's
          no layout flash or JS viewport detection needed. */}
      <div className="directory-table-wrap">
        <table className="directory-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Blood</th>
              <th>Department</th>
              <th>Session</th>
              <th>Location</th>
              <th>Office address</th>
              <th>Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <DirectoryRow key={p.id} profile={p} isFavorite={favoriteIds.has(p.id)} onToggleFavorite={() => toggleFavorite(p.id)} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="directory-grid-mobile">
        {filtered.map((p) => (
          <DirectoryCard key={p.id} profile={p} isFavorite={favoriteIds.has(p.id)} onToggleFavorite={() => toggleFavorite(p.id)} />
        ))}
      </div>
    </div>
  );
}

function useProfileDisplay(profile) {
  const v = profile.visibility || {};
  const avatar =
    profile.photo?.useDefault === false && profile.photo?.base64
      ? profile.photo.base64
      : defaultAvatarFor(profile.gender);

  const locationLabel = v.currentAddress ? getAddressLabel(profile.currentAddress, "bn") : "";
  const officeAddress = v.employment ? resolveEmploymentAddress(profile.employment) : "";
  const officeName = v.employment ? profile.employment?.officeName : "";

  return { v, avatar, locationLabel, officeAddress, officeName };
}

function DirectoryRow({ profile, isFavorite, onToggleFavorite }) {
  const { v, avatar, locationLabel, officeAddress, officeName } = useProfileDisplay(profile);

  return (
    <tr className="directory-row">
      <td>
        <img src={avatar} alt={profile.name} className="directory-row-avatar" />
      </td>
      <td className="directory-row-name">{profile.name}</td>
      <td><BloodDropBadge group={profile.bloodGroup} size={32} /></td>
      <td><DepartmentChip department={profile.department} /></td>
      <td>{profile.session || "—"}</td>
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
      <td>
        {v.employment && (officeName || officeAddress) ? (
          <div>
            {officeName && <div>{officeName}</div>}
            {officeAddress && <div className="directory-row-sub">{officeAddress}</div>}
          </div>
        ) : (
          "—"
        )}
      </td>
      <td>
        <div className="directory-row-contact">
          {v.phone && profile.phone && (
            <span title={profile.phone}><Phone size={15} /></span>
          )}
          {v.email && profile.email && (
            <span title={profile.email}><Mail size={15} /></span>
          )}
        </div>
      </td>
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

export function DirectoryCard({ profile, isFavorite, onToggleFavorite }) {
  const { v, avatar, officeAddress, officeName } = useProfileDisplay(profile);

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
          <DepartmentChip department={profile.department} />
        </div>
        <BloodDropBadge group={profile.bloodGroup} />
      </div>

      <div className="directory-card-body">
        {(officeName || officeAddress) && v.employment && (
          <div className="directory-card-meta">
            <Briefcase size={14} />
            <span>
              {officeName}
              {officeName && officeAddress ? " — " : ""}
              {officeAddress}
            </span>
          </div>
        )}
        {v.email && profile.email && (
          <div className="directory-card-meta">
            <Mail size={14} />
            <span>{profile.email}</span>
          </div>
        )}
        {v.phone && profile.phone && (
          <div className="directory-card-meta">
            <Phone size={14} />
            <span>{profile.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
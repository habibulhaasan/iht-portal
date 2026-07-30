// src/lib/utils/hospital-data.ts
//
// Loads hospitals.json and links each facility back to bd-data.ts
// (Division / District / Upazila) via divisionId / districtId / upazilaId.
//
// Source: DGHS/DGFP facility directory, matched against BD_DIVISIONS by
// district & upazila name. ~97% of facilities resolve down to upazila level;
// the rest (mostly city-corporation thana areas like Gulshan, Kotwali,
// Mirpur, plus a few upazilas created after bd-data.ts was written, e.g.
// Indurkani, Eidgaon, Naldanga, Shantiganj) resolve to district level only —
// for those, `upazilaId` is null and the original DGHS upazila/thana name is
// kept in `sourceUpazilaName`.

import hospitalsJson from "./hospitals.json";
import { getDivisionById, getDistrictById, getUpazilaById } from "./bdData";

export const HOSPITALS = hospitalsJson;

/** All hospitals in a given division (by bd-data.ts division id). */
export function getHospitalsByDivision(divisionId) {
  return HOSPITALS.filter((h) => h.location.divisionId === divisionId);
}

/** All hospitals in a given district (by bd-data.ts district id). */
export function getHospitalsByDistrict(districtId) {
  return HOSPITALS.filter((h) => h.location.districtId === districtId);
}

/** All hospitals in a given upazila (by bd-data.ts upazila id). */
export function getHospitalsByUpazila(upazilaId) {
  return HOSPITALS.filter((h) => h.location.upazilaId === upazilaId);
}

/** Lookup a hospital by its Facility_ID. */
export function getHospitalById(id) {
  return HOSPITALS.find((h) => h.id === id);
}

/** Resolved bd-data.ts location objects for a hospital, where available. */
export function getHospitalGeo(hospital) {
  const { divisionId, districtId, upazilaId } = hospital.location;
  return {
    division: divisionId ? getDivisionById(divisionId) : undefined,
    district: districtId ? getDistrictById(districtId) : undefined,
    upazila: upazilaId ? getUpazilaById(upazilaId) : undefined,
  };
}

/**
 * Human-readable location label for a hospital, e.g.
 * "Amtali, Barguna, Barishal Division" or, if only district-level is known,
 * "Dhanmondi (Dhaka South City Corporation), Dhaka, Dhaka Division".
 */
export function getHospitalLocationLabel(hospital) {
  const { division, district, upazila } = getHospitalGeo(hospital);
  if (!division || !district) return "";

  const place =
    upazila?.name ??
    hospital.location.sourceUpazilaName ??
    hospital.location.cityCorporation ??
    "";

  return place
    ? `${place}, ${district.name}, ${division.name} Division`
    : `${district.name}, ${division.name} Division`;
}

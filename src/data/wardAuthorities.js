import data from "./wardAuthorities.json";

export const ZONES = data.ZONES;
export const INITIAL_WARD_AUTHORITIES = data.INITIAL_WARD_AUTHORITIES;

/**
 * Get all available landmarks flattened across all wards
 */
export function getAllLandmarksList(wards = INITIAL_WARD_AUTHORITIES) {
  return wards.flatMap((w) =>
    (w.landmarks || []).map((lm) => ({
      ...lm,
      wardId: w.id,
      wardNumber: w.wardNumber,
      wardName: w.name,
      zone: w.zone,
      borough: w.borough,
    }))
  );
}

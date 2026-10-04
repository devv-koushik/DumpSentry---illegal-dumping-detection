import { INITIAL_WARD_AUTHORITIES, ZONES, getAllLandmarksList } from "../data/wardAuthorities";
import * as api from "./api";

const STORAGE_KEY = "dumpsentry_wards_v1";
const listeners = new Set();

function notifyListeners(wards) {
  listeners.forEach((listener) => {
    try {
      listener(wards);
    } catch (e) {
      console.error("Error in ward listener:", e);
    }
  });
}

/**
 * Loads wards from localStorage or falls back to INITIAL_WARD_AUTHORITIES.
 */
export function getStoredWards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load wards from localStorage, using initial data", err);
  }
  return [...INITIAL_WARD_AUTHORITIES];
}

/**
 * Persist wards to localStorage and notify listeners.
 */
export function saveWards(wards) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wards));
    notifyListeners(wards);
  } catch (err) {
    console.error("Failed to save wards to localStorage:", err);
  }
}

/**
 * Subscribe to ward changes across components.
 */
export function subscribeWards(callback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Fetch all wards (asynchronously for API compatibility)
 */
export async function fetchAllWards() {
  try {
    const backendData = await api.fetchWards();
    if (Array.isArray(backendData) && backendData.length > 0) {
      saveWards(backendData);
      return backendData;
    }
  } catch (err) {
    console.warn("Failed to fetch wards from backend, falling back to local storage.", err);
  }

  return getStoredWards();
}

/**
 * Fetch a single ward by ID
 */
export function getWardById(id) {
  const wards = getStoredWards();
  return wards.find((w) => w.id === id || w.wardNumber.toLowerCase() === String(id).toLowerCase()) || null;
}

/**
 * Update a ward's details and authorities
 */
export async function updateWard(id, updatedFields) {
  const wards = getStoredWards();
  const index = wards.findIndex((w) => w.id === id);
  if (index === -1) {
    throw new Error(`Ward with ID "${id}" not found.`);
  }

  const existing = wards[index];
  const updated = {
    ...existing,
    ...updatedFields,
    authorities: {
      ...existing.authorities,
      ...(updatedFields.authorities || {}),
      councillor: {
        ...(existing.authorities?.councillor || {}),
        ...(updatedFields.authorities?.councillor || {}),
      },
      executiveEngineer: {
        ...(existing.authorities?.executiveEngineer || {}),
        ...(updatedFields.authorities?.executiveEngineer || {}),
      },
      sanitaryInspector: {
        ...(existing.authorities?.sanitaryInspector || {}),
        ...(updatedFields.authorities?.sanitaryInspector || {}),
      },
      office: {
        ...(existing.authorities?.office || {}),
        ...(updatedFields.authorities?.office || {}),
      },
      helpline: {
        ...(existing.authorities?.helpline || {}),
        ...(updatedFields.authorities?.helpline || {}),
      },
      depot: {
        ...(existing.authorities?.depot || {}),
        ...(updatedFields.authorities?.depot || {}),
      },
      policeLiaison: {
        ...(existing.authorities?.policeLiaison || {}),
        ...(updatedFields.authorities?.policeLiaison || {}),
      },
    },
  };

  wards[index] = updated;
  saveWards(wards);

  // Attempt backend update
  try {
    await api.updateWardApi(id, updated);
  } catch (err) {
    console.error("Failed to update ward in backend:", err);
  }

  return updated;
}

/**
 * Create a new custom ward
 */
export function createNewWard(wardData) {
  const wards = getStoredWards();
  const newId = wardData.id || `ward-${Date.now().toString(36)}`;
  const newWard = {
    ...wardData,
    id: newId,
    center: wardData.center || [22.56, 88.36],
    boundary: wardData.boundary || [
      [22.565, 88.355],
      [22.565, 88.365],
      [22.555, 88.365],
      [22.555, 88.355],
      [22.565, 88.355],
    ],
    stats: {
      areaSqKm: "2.0",
      population: "40,000",
      activeHotspots: 0,
      resolutionRate: 100,
      status: "Active Surveillance",
      surveillanceDrones: 1,
      ...(wardData.stats || {}),
    },
  };

  const updated = [newWard, ...wards];
  saveWards(updated);
  return newWard;
}

/**
 * Delete a ward by ID
 */
export function deleteWard(id) {
  const wards = getStoredWards();
  const updated = wards.filter((w) => w.id !== id);
  saveWards(updated);
  return updated;
}

/**
 * Reset all wards and authorities to default official registry
 */
export function resetWardsToDefaults() {
  localStorage.removeItem(STORAGE_KEY);
  notifyListeners(INITIAL_WARD_AUTHORITIES);
  return [...INITIAL_WARD_AUTHORITIES];
}

/**
 * Ray-casting algorithm to test if [lat, lng] is inside a polygon boundary
 */
export function isPointInPolygon(point, polygon) {
  if (!point || !polygon || !Array.isArray(point) || !Array.isArray(polygon)) return false;
  const [lat, lng] = point;
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Detect which ward a given GPS coordinate belongs to
 */
export function findWardForCoordinates(lat, lng, wards = getStoredWards()) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null;
  for (const ward of wards) {
    if (ward.boundary && isPointInPolygon([lat, lng], ward.boundary)) {
      return ward;
    }
  }

  // If not strictly within polygon, find closest ward center
  let closestWard = null;
  let minDistance = Infinity;

  for (const ward of wards) {
    if (ward.center) {
      const dLat = ward.center[0] - lat;
      const dLng = ward.center[1] - lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestWard = ward;
      }
    }
  }

  return closestWard;
}

/**
 * Get all landmarks
 */
export function getLandmarks(wards = getStoredWards()) {
  return getAllLandmarksList(wards);
}

/**
 * Get all zones
 */
export function getZones() {
  return ZONES;
}

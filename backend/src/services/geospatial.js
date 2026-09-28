import fetch from "node-fetch";
import { CONTEXT_TYPES, OSM_TAG_MAP } from "../config/constants.js";

// ─── Nominatim (reverse geocoding) ────────────────────────────────────────

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "DumpSentry/1.0 (contact: admin@dumpsentry.ai)";

/**
 * Reverse-geocode GPS coordinates to a human-readable address.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string>} e.g. "New Town, Kolkata, West Bengal"
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });
    if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    const data = await res.json();
    const addr = data.address || {};

    // Build a concise location string
    const parts = [
      addr.neighbourhood || addr.suburb || addr.village || "",
      addr.city || addr.town || addr.county || "",
      addr.state || "",
    ].filter(Boolean);

    return parts.join(", ") || data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

// ─── Overpass API (nearby POI queries) ────────────────────────────────────

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/**
 * Query OpenStreetMap via Overpass for nearby points-of-interest.
 * Returns a flat list of places with their context type and distance.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {number} searchRadius  Maximum search radius in meters (default 500)
 * @returns {Promise<Array<{
 *   name: string,
 *   type: string,
 *   contextType: string,
 *   distance: number,
 *   osmId: string,
 *   latitude: number,
 *   longitude: number
 * }>>}
 */
export async function findNearbyPlaces(lat, lon, searchRadius = 500) {
  // Build Overpass query parts for each context type
  const queryParts = [];

  for (const tagGroups of Object.values(OSM_TAG_MAP)) {
    for (const tagGroup of tagGroups) {
      for (const value of tagGroup.values) {
        // Query nodes, ways, and relations around the coordinate
        queryParts.push(
          `node["${tagGroup.key}"="${value}"](around:${searchRadius},${lat},${lon});`,
          `way["${tagGroup.key}"="${value}"](around:${searchRadius},${lat},${lon});`
        );
      }
    }
  }

  const query = `
    [out:json][timeout:15];
    (
      ${queryParts.join("\n      ")}
    );
    out center tags;
  `;

  let elements = [];
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      timeout: 20000,
    });
    if (!res.ok) {
      console.warn(`[Geospatial] Overpass returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    elements = data.elements || [];
  } catch (err) {
    console.warn("[Geospatial] Overpass query failed:", err.message);
    return [];
  }

  // Parse results and calculate distances
  const places = [];
  const seen = new Set(); // deduplicate by OSM id

  for (const el of elements) {
    const osmId = `${el.type}/${el.id}`;
    if (seen.has(osmId)) continue;
    seen.add(osmId);

    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    if (elLat == null || elLon == null) continue;

    const tags = el.tags || {};
    const name = tags.name || tags["name:en"] || inferName(tags);
    const distance = Math.round(haversineDistance(lat, lon, elLat, elLon));
    const contextType = classifyElement(tags);

    places.push({
      name,
      type: tags.amenity || tags.healthcare || tags.highway || tags.leisure || tags.landuse || tags.natural || tags.waterway || "unknown",
      contextType,
      distance,
      osmId,
      latitude: elLat,
      longitude: elLon,
    });
  }

  // Sort by distance
  places.sort((a, b) => a.distance - b.distance);
  return places;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Classify an OSM element's tags into one of our context types.
 */
function classifyElement(tags) {
  const amenity = tags.amenity || "";
  const healthcare = tags.healthcare || "";
  const highway = tags.highway || "";
  const leisure = tags.leisure || "";
  const landuse = tags.landuse || "";
  const building = tags.building || "";
  const natural = tags.natural || "";
  const waterway = tags.waterway || "";

  if (["hospital", "clinic", "doctors"].includes(amenity) ||
      ["hospital", "clinic", "centre"].includes(healthcare)) {
    return CONTEXT_TYPES.MEDICAL_FACILITY;
  }
  if (["school", "college", "university", "kindergarten"].includes(amenity)) {
    return CONTEXT_TYPES.EDUCATIONAL_INSTITUTION;
  }
  if (["primary", "secondary", "tertiary", "residential", "trunk", "motorway"].includes(highway)) {
    return CONTEXT_TYPES.ROADSIDE;
  }
  if (["park", "playground", "garden"].includes(leisure) ||
      ["marketplace", "bus_station", "parking"].includes(amenity)) {
    return CONTEXT_TYPES.PUBLIC_AREA;
  }
  if (landuse === "residential" || ["residential", "apartments"].includes(building)) {
    return CONTEXT_TYPES.RESIDENTIAL;
  }
  if (natural === "water" || ["river", "stream", "canal", "drain"].includes(waterway)) {
    return CONTEXT_TYPES.WATER_BODY;
  }
  return CONTEXT_TYPES.OTHER;
}

/**
 * Infer a human-readable name from tags when `name` isn't present.
 */
function inferName(tags) {
  if (tags.amenity) return capitalize(tags.amenity);
  if (tags.healthcare) return capitalize(tags.healthcare);
  if (tags.highway) return `${capitalize(tags.highway)} road`;
  if (tags.leisure) return capitalize(tags.leisure);
  return "Unnamed";
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

/**
 * Haversine formula — distance in meters between two GPS points.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

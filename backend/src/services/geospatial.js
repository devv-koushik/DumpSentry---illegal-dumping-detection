import fetch from "node-fetch";
import {
  CONTEXT_TYPES,
  CONTEXT_LABELS,
  DEFAULT_CONTEXT_PRIORITY,
} from "../config/constants.js";

// ─── Service Configuration ────────────────────────────────────────────────
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "DumpSentry/1.0 (contact: admin@dumpsentry.ai)";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
];

// ─── Reverse Geocoding (Nominatim) ────────────────────────────────────────

/**
 * Reverse-geocode GPS coordinates to a human-readable address.
 * Never claims a location when coordinates are missing.
 *
 * @param {number|null} lat
 * @param {number|null} lon
 * @returns {Promise<{
 *   locationName: string,
 *   raw: object | null
 * }>}
 */
export async function reverseGeocodeDetails(lat, lon) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return {
      locationName: "Location Unavailable (No GPS coordinates provided)",
      raw: null,
    };
  }

  try {
    const url = `${NOMINATIM_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&extratags=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 8000,
    });
    if (!res.ok) {
      return {
        locationName: `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        raw: null,
      };
    }

    const data = await res.json();
    const addr = data.address || {};

    const parts = [
      addr.amenity || addr.building || addr.leisure || addr.natural || data.name || "",
      addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || "",
      addr.city || addr.town || addr.village || addr.county || "",
      addr.state || "",
    ].filter(Boolean);

    const locationName =
      parts.join(", ") ||
      data.display_name ||
      `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    return { locationName, raw: data };
  } catch (err) {
    console.warn("[Geospatial] Nominatim lookup warning:", err.message);
    return {
      locationName: `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      raw: null,
    };
  }
}

/**
 * Backward-compatible helper returning a location string.
 */
export async function reverseGeocode(lat, lon) {
  const result = await reverseGeocodeDetails(lat, lon);
  return result.locationName;
}

// ─── Overpass Nearby POI Queries ──────────────────────────────────────────

/**
 * Build a targeted Overpass QL query for verified POIs across the 12 categories.
 * Restricts to indexed tags on nodes and ways to avoid heavy relation scans or 504 timeouts.
 */
function buildOverpassQuery(lat, lon, searchRadius = 300) {
  return `
[out:json][timeout:12];
(
  node["amenity"~"^(hospital|clinic|doctors|pharmacy|health_post)$"](around:${searchRadius},${lat},${lon});
  way["amenity"~"^(hospital|clinic|doctors|pharmacy|health_post)$"](around:${searchRadius},${lat},${lon});
  node["healthcare"~"^(hospital|clinic|centre|doctor)$"](around:${searchRadius},${lat},${lon});
  way["healthcare"~"^(hospital|clinic|centre|doctor)$"](around:${searchRadius},${lat},${lon});

  node["natural"~"^(water|wetland|bay|strait)$"](around:${searchRadius},${lat},${lon});
  way["natural"~"^(water|wetland|bay|strait)$"](around:${searchRadius},${lat},${lon});
  node["waterway"~"^(river|stream|canal|drain|ditch|dock)$"](around:${searchRadius},${lat},${lon});
  way["waterway"~"^(river|stream|canal|drain|ditch|dock)$"](around:${searchRadius},${lat},${lon});
  node["water"~"^(river|lake|pond|reservoir|basin|canal|stream|oxbow|lagoon)$"](around:${searchRadius},${lat},${lon});
  way["water"~"^(river|lake|pond|reservoir|basin|canal|stream|oxbow|lagoon)$"](around:${searchRadius},${lat},${lon});

  node["leisure"~"^(nature_reserve|park)$"](around:${searchRadius},${lat},${lon});
  way["leisure"~"^(nature_reserve|park)$"](around:${searchRadius},${lat},${lon});

  node["amenity"~"^(school|college|university|kindergarten|research_institute)$"](around:${searchRadius},${lat},${lon});
  way["amenity"~"^(school|college|university|kindergarten|research_institute)$"](around:${searchRadius},${lat},${lon});

  node["railway"~"^(station|halt|platform|tram_stop)$"](around:${searchRadius},${lat},${lon});
  way["railway"~"^(station|halt|platform)$"](around:${searchRadius},${lat},${lon});
  node["amenity"="bus_station"](around:${searchRadius},${lat},${lon});
  way["amenity"="bus_station"](around:${searchRadius},${lat},${lon});

  node["amenity"~"^(townhall|courthouse|police|post_office|community_centre|public_building|fire_station|civic_centre|library)$"](around:${searchRadius},${lat},${lon});
  way["amenity"~"^(townhall|courthouse|police|post_office|community_centre|public_building|fire_station|civic_centre|library)$"](around:${searchRadius},${lat},${lon});

  node["amenity"="marketplace"](around:${searchRadius},${lat},${lon});
  way["amenity"="marketplace"](around:${searchRadius},${lat},${lon});
  node["shop"~"^(supermarket|mall|department_store)$"](around:${searchRadius},${lat},${lon});
  way["shop"~"^(supermarket|mall|department_store)$"](around:${searchRadius},${lat},${lon});
);
out center tags 40;
`;
}

/**
 * Query OpenStreetMap via Overpass for real nearby features.
 * Returns verified places with their context type and distance.
 * Never invents or fabricates places.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {number} searchRadius  Search radius in meters (default: 300)
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
export async function findNearbyPlaces(lat, lon, searchRadius = 300) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return [];
  }

  const query = buildOverpassQuery(lat, lon, searchRadius);
  let elements = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        timeout: 12000,
      });

      if (res.ok) {
        const data = await res.json();
        elements = data.elements || [];
        break;
      }
    } catch (err) {
      // Try next mirror
    }
  }

  const places = [];
  const seen = new Set();

  for (const el of elements) {
    const osmId = `${el.type}/${el.id}`;
    if (seen.has(osmId)) continue;
    seen.add(osmId);

    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    if (elLat == null || elLon == null) continue;

    const tags = el.tags || {};
    const contextType = classifyElement(tags);
    if (contextType === CONTEXT_TYPES.OTHER_UNKNOWN) continue;

    const name = tags.name || tags["name:en"] || inferName(tags);
    const distance = Math.round(haversineDistance(lat, lon, elLat, elLon));

    places.push({
      name,
      type:
        tags.amenity ||
        tags.healthcare ||
        tags.natural ||
        tags.waterway ||
        tags.water ||
        tags.leisure ||
        tags.railway ||
        tags.shop ||
        "feature",
      contextType,
      distance,
      osmId,
      latitude: elLat,
      longitude: elLon,
    });
  }

  places.sort((a, b) => a.distance - b.distance);
  return places;
}

// ─── Environmental Context Detector ───────────────────────────────────────

/**
 * Detect the environmental context for given GPS coordinates.
 * Completely independent from YOLO waste classification.
 * Never claims a context without real location data.
 * Never invents a nearby hospital, school, road, or water body.
 *
 * @param {number|null} lat
 * @param {number|null} lon
 * @param {number} searchRadius  Radius in meters (default: 300)
 * @returns {Promise<{
 *   contextType: string,
 *   contextLabel: string,
 *   nearbyPlaceName: string | null,
 *   distance: number | null,
 *   source: string,
 *   coordinates: { latitude: number, longitude: number } | null,
 *   locationName: string,
 *   nearbyPlaces: Array<object>,
 *   allMatchedContexts: string[]
 * }>}
 */
export async function detectEnvironmentalContext(lat, lon, searchRadius = 300) {
  // 1. Guard: Missing or invalid coordinates
  if (
    lat == null ||
    lon == null ||
    isNaN(lat) ||
    isNaN(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return {
      contextType: CONTEXT_TYPES.OTHER_UNKNOWN,
      contextLabel: CONTEXT_LABELS[CONTEXT_TYPES.OTHER_UNKNOWN] || "Unclassified Area",
      nearbyPlaceName: null,
      distance: null,
      source: "none",
      coordinates: null,
      locationName: "Location Unavailable (No GPS coordinates provided)",
      nearbyPlaces: [],
      allMatchedContexts: [],
    };
  }

  // 2. Query Nominatim reverse geocoding for ground truth at point
  const { locationName, raw: nominatimRaw } = await reverseGeocodeDetails(lat, lon);

  // 3. Query Overpass API for verified nearby POIs
  const nearbyPlaces = await findNearbyPlaces(lat, lon, searchRadius);
  let source = nearbyPlaces.length > 0 ? "OpenStreetMap / Overpass API" : "OpenStreetMap / Nominatim";

  // 4. Incorporate Nominatim immediate location features (distance 0m)
  if (nominatimRaw) {
    const nomTags = {
      amenity:
        nominatimRaw.address?.amenity ||
        (nominatimRaw.category === "amenity" ? nominatimRaw.type : undefined),
      healthcare:
        nominatimRaw.address?.healthcare ||
        (nominatimRaw.category === "healthcare" ? nominatimRaw.type : undefined),
      natural:
        nominatimRaw.category === "natural" ? nominatimRaw.type : undefined,
      waterway:
        nominatimRaw.category === "waterway" ? nominatimRaw.type : undefined,
      leisure:
        nominatimRaw.category === "leisure" ? nominatimRaw.type : undefined,
      highway:
        nominatimRaw.category === "highway"
          ? nominatimRaw.type || "road"
          : undefined,
      railway:
        nominatimRaw.category === "railway" ? nominatimRaw.type : undefined,
      shop:
        nominatimRaw.category === "shop" ? nominatimRaw.type : undefined,
      landuse:
        nominatimRaw.category === "landuse" ? nominatimRaw.type : undefined,
      building: nominatimRaw.address?.building,
    };

    const nomContext = classifyElement(nomTags);

    if (nomContext !== CONTEXT_TYPES.OTHER_UNKNOWN) {
      const nomName =
        nominatimRaw.name ||
        nominatimRaw.address?.road ||
        nominatimRaw.display_name?.split(",")[0] ||
        "Immediate Location Feature";

      nearbyPlaces.unshift({
        name: nomName,
        type: nominatimRaw.type || nominatimRaw.category || "feature",
        contextType: nomContext,
        distance: 0,
        osmId: `${nominatimRaw.osm_type || "osm"}/${nominatimRaw.osm_id || "0"}`,
        latitude: parseFloat(nominatimRaw.lat) || lat,
        longitude: parseFloat(nominatimRaw.lon) || lon,
      });
    }
  }

  // Deduplicate and re-sort by distance ascending
  const uniquePlaces = [];
  const seenOsm = new Set();
  for (const p of nearbyPlaces) {
    if (seenOsm.has(p.osmId)) continue;
    seenOsm.add(p.osmId);
    uniquePlaces.push(p);
  }
  uniquePlaces.sort((a, b) => a.distance - b.distance);

  // 5. If no POI or road found:
  if (uniquePlaces.length === 0) {
    return {
      contextType: CONTEXT_TYPES.OTHER_UNKNOWN,
      contextLabel: CONTEXT_LABELS[CONTEXT_TYPES.OTHER_UNKNOWN] || "Unclassified Area",
      nearbyPlaceName: null,
      distance: null,
      source: "OpenStreetMap (No registered POI within search radius)",
      coordinates: { latitude: lat, longitude: lon },
      locationName,
      nearbyPlaces: [],
      allMatchedContexts: [],
    };
  }

  // 6. Proximity sensitivity selection
  // Immediate features (< 25m) take precedence.
  // Sensitive ecological/health contexts (Healthcare, Water Body, Protected Area, Educational)
  // take precedence over generic roadside/unclassified features if within 150m.
  const sensitiveContexts = [
    CONTEXT_TYPES.HEALTHCARE,
    CONTEXT_TYPES.WATER_BODY,
    CONTEXT_TYPES.ENVIRONMENTAL_PROTECTED,
    CONTEXT_TYPES.EDUCATIONAL,
  ];

  let selectedPlace = uniquePlaces[0];

  const sensitiveNearby = uniquePlaces.filter(
    (p) => sensitiveContexts.includes(p.contextType) && p.distance <= 250
  );

  if (sensitiveNearby.length > 0) {
    // If the closest place is generic (e.g. roadside or commercial) or farther than 20m,
    // pick the closest sensitive ecological/health feature
    if (selectedPlace.distance > 20 || !sensitiveContexts.includes(selectedPlace.contextType)) {
      selectedPlace = sensitiveNearby[0]; // already sorted by distance ascending
    }
  }

  const allMatchedContexts = [
    ...new Set(uniquePlaces.map((p) => p.contextType)),
  ];

  return {
    contextType: selectedPlace.contextType,
    contextLabel:
      CONTEXT_LABELS[selectedPlace.contextType] || selectedPlace.contextType,
    nearbyPlaceName: selectedPlace.name || null,
    distance: selectedPlace.distance,
    source,
    coordinates: { latitude: lat, longitude: lon },
    locationName,
    nearbyPlaces: uniquePlaces,
    allMatchedContexts,
  };
}

// ─── Classification & Formatting Helpers ──────────────────────────────────

/**
 * Classify an OSM element's tags into one of the 12 supported context categories.
 */
export function classifyElement(tags) {
  const amenity = tags.amenity || "";
  const healthcare = tags.healthcare || "";
  const natural = tags.natural || "";
  const waterway = tags.waterway || "";
  const water = tags.water || "";
  const leisure = tags.leisure || "";
  const boundary = tags.boundary || "";
  const landuse = tags.landuse || "";
  const building = tags.building || "";
  const highway = tags.highway || "";
  const railway = tags.railway || "";
  const aeroway = tags.aeroway || "";
  const shop = tags.shop || "";
  const man_made = tags.man_made || "";

  // 1. HEALTHCARE: Hospital, clinic, medical center
  if (
    ["hospital", "clinic", "doctors", "pharmacy", "health_post"].includes(amenity) ||
    ["hospital", "clinic", "centre", "doctor", "laboratory"].includes(healthcare)
  ) {
    return CONTEXT_TYPES.HEALTHCARE;
  }

  // 2. WATER_BODY: River, lake, pond, reservoir, canal, wetland/waterway
  if (
    ["water", "wetland", "bay", "strait"].includes(natural) ||
    ["river", "stream", "canal", "drain", "ditch", "dock", "rapids", "waterfall"].includes(waterway) ||
    ["river", "lake", "pond", "reservoir", "basin", "canal", "stream", "oxbow", "lagoon"].includes(water) ||
    ["reservoir", "basin"].includes(landuse)
  ) {
    return CONTEXT_TYPES.WATER_BODY;
  }

  // 3. ENVIRONMENTAL_PROTECTED: Forest, protected area, park, ecological area
  if (
    ["nature_reserve", "park"].includes(leisure) ||
    ["national_park", "protected_area"].includes(boundary) ||
    ["forest", "conservation", "recreation_ground"].includes(landuse) ||
    ["wood", "forest", "scrub", "grassland"].includes(natural)
  ) {
    return CONTEXT_TYPES.ENVIRONMENTAL_PROTECTED;
  }

  // 4. EDUCATIONAL: School, college, university
  if (
    ["school", "college", "university", "kindergarten", "research_institute"].includes(amenity) ||
    ["school", "university", "college", "kindergarten"].includes(building)
  ) {
    return CONTEXT_TYPES.EDUCATIONAL;
  }

  // 5. TRANSPORT: Railway station, railway track, bus terminal, airport
  if (
    ["station", "halt", "rail", "subway_entrance", "platform", "tram_stop"].includes(railway) ||
    ["bus_station", "ferry_terminal"].includes(amenity) ||
    ["aerodrome", "terminal", "helipad", "runway"].includes(aeroway)
  ) {
    return CONTEXT_TYPES.TRANSPORT;
  }

  // 6. INDUSTRIAL: Factory, industrial area, warehouse
  if (
    ["industrial", "depot"].includes(landuse) ||
    ["industrial", "warehouse", "factory", "manufacture"].includes(building) ||
    ["works", "wastewater_plant", "storage_tank", "silo"].includes(man_made)
  ) {
    return CONTEXT_TYPES.INDUSTRIAL;
  }

  // 7. COMMERCIAL: Market, shopping/commercial area
  if (
    ["commercial", "retail"].includes(landuse) ||
    ["supermarket", "mall", "department_store", "convenience", "general"].includes(shop) ||
    ["marketplace", "bank", "restaurant", "cafe", "fast_food", "food_court"].includes(amenity) ||
    ["commercial", "retail", "supermarket"].includes(building)
  ) {
    return CONTEXT_TYPES.COMMERCIAL;
  }

  // 8. PUBLIC_AREA: Public government/civic facilities
  if (
    ["townhall", "courthouse", "police", "post_office", "community_centre", "public_building", "fire_station", "civic_centre", "library"].includes(amenity) ||
    ["government", "civic", "public"].includes(building)
  ) {
    return CONTEXT_TYPES.PUBLIC_AREA;
  }

  // 9. RESIDENTIAL: Housing area, apartment neighborhood
  if (
    landuse === "residential" ||
    ["residential", "apartments", "house", "detached", "terrace", "dormitory"].includes(building)
  ) {
    return CONTEXT_TYPES.RESIDENTIAL;
  }

  // 10. AGRICULTURAL: Farmland/agricultural area
  if (
    ["farmland", "farmyard", "orchard", "vineyard", "plant_nursery", "allotments", "meadow", "pasture"].includes(landuse) ||
    ["farm", "barn", "cowshed", "greenhouse"].includes(building)
  ) {
    return CONTEXT_TYPES.AGRICULTURAL;
  }

  // 11. ROADSIDE: Road, highway, street, roadside
  if (
    ["primary", "secondary", "tertiary", "residential", "trunk", "motorway", "service", "living_street", "unclassified", "road", "track"].includes(highway)
  ) {
    return CONTEXT_TYPES.ROADSIDE;
  }

  return CONTEXT_TYPES.OTHER_UNKNOWN;
}

/**
 * Infer human-readable name from tags when specific `name` tag is omitted.
 */
export function inferName(tags) {
  if (tags.name) return tags.name;
  if (tags["name:en"]) return tags["name:en"];
  if (tags.waterway) return `${capitalize(tags.waterway)} Waterway`;
  if (tags.water) return `${capitalize(tags.water)} Water Body`;
  if (tags.natural === "water") return "Water Body";
  if (tags.natural === "wood" || tags.natural === "forest") return "Forest Area";
  if (tags.amenity) return `${capitalize(tags.amenity)} Facility`;
  if (tags.healthcare) return `${capitalize(tags.healthcare)} Facility`;
  if (tags.railway) return `${capitalize(tags.railway)} Line / Station`;
  if (tags.highway) return `${capitalize(tags.highway)} Road`;
  if (tags.leisure) return `${capitalize(tags.leisure)} Park`;
  if (tags.landuse) return `${capitalize(tags.landuse)} Zone`;
  if (tags.shop) return `${capitalize(tags.shop)} Store`;
  return "Unnamed Feature";
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

/**
 * Haversine formula — distance in meters between two GPS coordinates.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

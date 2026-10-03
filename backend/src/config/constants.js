// ─── Waste classes (13 fine-tuned YOLO model classes) ──────────────────────
export const WASTE_CLASSES = [
  "construction_waste",
  "appliances",
  "electronic_waste",
  "furniture",
  "metal_waste",
  "plastic_waste",
  "wood_waste",
  "vehicle_waste",
  "tyre_waste",
  "paper_waste",
  "asbestos",
  "textile_waste",
  "mixed_waste",
];

// ─── Context types (what's near the dump site) ────────────────────────────
export const CONTEXT_TYPES = {
  HEALTHCARE: "HEALTHCARE",
  ROADSIDE: "ROADSIDE",
  EDUCATIONAL: "EDUCATIONAL",
  WATER_BODY: "WATER_BODY",
  ENVIRONMENTAL_PROTECTED: "ENVIRONMENTAL_PROTECTED",
  INDUSTRIAL: "INDUSTRIAL",
  RESIDENTIAL: "RESIDENTIAL",
  COMMERCIAL: "COMMERCIAL",
  TRANSPORT: "TRANSPORT",
  PUBLIC_AREA: "PUBLIC_AREA",
  AGRICULTURAL: "AGRICULTURAL",
  OTHER_UNKNOWN: "OTHER_UNKNOWN",

  // Backward compatibility aliases
  MEDICAL_FACILITY: "HEALTHCARE",
  EDUCATIONAL_INSTITUTION: "EDUCATIONAL",
  OTHER: "OTHER_UNKNOWN",
};

// ─── Human-readable context labels ────────────────────────────────────────
export const CONTEXT_LABELS = {
  HEALTHCARE: "Healthcare / Medical Facility",
  ROADSIDE: "Roadside / Highway",
  EDUCATIONAL: "Educational Institution",
  WATER_BODY: "Water Body / Wetland",
  ENVIRONMENTAL_PROTECTED: "Environmentally Protected / Park",
  INDUSTRIAL: "Industrial Area",
  RESIDENTIAL: "Residential Neighborhood",
  COMMERCIAL: "Commercial / Market Area",
  TRANSPORT: "Transport Hub / Terminal",
  PUBLIC_AREA: "Public / Civic Facility",
  AGRICULTURAL: "Agricultural / Farmland",
  OTHER_UNKNOWN: "Unclassified Area",

  // Aliases
  MEDICAL_FACILITY: "Healthcare / Medical Facility",
  EDUCATIONAL_INSTITUTION: "Educational Institution",
  OTHER: "Unclassified Area",
};

// ─── OSM amenity/tag mappings for Overpass queries ────────────────────────
// Maps our context types to OpenStreetMap key-value tags.
export const OSM_TAG_MAP = {
  [CONTEXT_TYPES.HEALTHCARE]: [
    { key: "amenity", values: ["hospital", "clinic", "doctors", "pharmacy", "health_post"] },
    { key: "healthcare", values: ["hospital", "clinic", "centre", "doctor", "laboratory"] },
  ],
  [CONTEXT_TYPES.WATER_BODY]: [
    { key: "natural", values: ["water", "wetland", "bay", "strait"] },
    { key: "waterway", values: ["river", "stream", "canal", "drain", "ditch", "dock", "rapids", "waterfall"] },
    { key: "water", values: ["river", "lake", "pond", "reservoir", "basin", "canal", "stream", "oxbow", "lagoon"] },
    { key: "landuse", values: ["reservoir", "basin"] },
  ],
  [CONTEXT_TYPES.ENVIRONMENTAL_PROTECTED]: [
    { key: "leisure", values: ["nature_reserve", "park"] },
    { key: "boundary", values: ["national_park", "protected_area"] },
    { key: "landuse", values: ["forest", "conservation", "recreation_ground"] },
    { key: "natural", values: ["wood", "forest", "scrub", "grassland"] },
  ],
  [CONTEXT_TYPES.EDUCATIONAL]: [
    { key: "amenity", values: ["school", "college", "university", "kindergarten", "research_institute"] },
    { key: "building", values: ["school", "university", "college", "kindergarten"] },
  ],
  [CONTEXT_TYPES.ROADSIDE]: [
    { key: "highway", values: ["primary", "secondary", "tertiary", "residential", "trunk", "motorway", "service", "living_street", "unclassified", "road"] },
  ],
  [CONTEXT_TYPES.INDUSTRIAL]: [
    { key: "landuse", values: ["industrial", "depot"] },
    { key: "building", values: ["industrial", "warehouse", "factory", "manufacture"] },
    { key: "man_made", values: ["works", "wastewater_plant", "storage_tank", "silo"] },
  ],
  [CONTEXT_TYPES.RESIDENTIAL]: [
    { key: "landuse", values: ["residential"] },
    { key: "building", values: ["residential", "apartments", "house", "detached", "terrace", "dormitory"] },
  ],
  [CONTEXT_TYPES.COMMERCIAL]: [
    { key: "landuse", values: ["commercial", "retail"] },
    { key: "shop", values: ["supermarket", "mall", "department_store", "convenience", "general"] },
    { key: "amenity", values: ["marketplace", "bank", "restaurant", "cafe", "fast_food", "food_court"] },
    { key: "building", values: ["commercial", "retail", "supermarket"] },
  ],
  [CONTEXT_TYPES.TRANSPORT]: [
    { key: "railway", values: ["station", "halt", "rail", "subway_entrance", "platform", "tram_stop"] },
    { key: "amenity", values: ["bus_station", "ferry_terminal"] },
    { key: "aeroway", values: ["aerodrome", "terminal", "helipad", "runway", "apron"] },
    { key: "public_transport", values: ["station", "stop_position", "platform"] },
  ],
  [CONTEXT_TYPES.PUBLIC_AREA]: [
    { key: "amenity", values: ["townhall", "courthouse", "police", "post_office", "community_centre", "public_building", "fire_station", "civic_centre", "library"] },
    { key: "building", values: ["government", "civic", "public"] },
  ],
  [CONTEXT_TYPES.AGRICULTURAL]: [
    { key: "landuse", values: ["farmland", "farmyard", "orchard", "vineyard", "plant_nursery", "allotments", "meadow", "pasture"] },
    { key: "building", values: ["farm", "barn", "cowshed", "greenhouse"] },
  ],
};

// ─── Detection statuses ───────────────────────────────────────────────────
export const DETECTION_STATUSES = {
  PENDING_REVIEW: "Pending Review",
  SUSPECTED_ILLEGAL: "Suspected Illegal",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  RESOLVED: "Resolved",
};

// ─── Alert statuses ───────────────────────────────────────────────────────
export const ALERT_STATUSES = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
};

// ─── Authority types ──────────────────────────────────────────────────────
export const AUTHORITY_TYPES = [
  "HOSPITAL",
  "CLINIC",
  "HEALTHCARE",
  "PWD",
  "EDUCATION",
  "SCHOOL",
  "COLLEGE",
  "UNIVERSITY",
  "WATER_RESOURCES",
  "ENVIRONMENT",
  "FOREST",
  "POLLUTION_CONTROL",
  "MUNICIPAL",
  "CIVIC",
  "TRANSPORT",
  "RAILWAY",
  "AGRICULTURE",
  "POLICE",
  "WARD",
  "OTHER",
];

// ─── Context to Authority Type Mapping ────────────────────────────────────
export const CONTEXT_AUTHORITY_MAP = {
  [CONTEXT_TYPES.HEALTHCARE]: "HOSPITAL",
  [CONTEXT_TYPES.ROADSIDE]: "PWD",
  [CONTEXT_TYPES.EDUCATIONAL]: "EDUCATION",
  [CONTEXT_TYPES.WATER_BODY]: "WATER_RESOURCES",
  [CONTEXT_TYPES.ENVIRONMENTAL_PROTECTED]: "FOREST",
  [CONTEXT_TYPES.INDUSTRIAL]: "POLLUTION_CONTROL",
  [CONTEXT_TYPES.RESIDENTIAL]: "MUNICIPAL",
  [CONTEXT_TYPES.COMMERCIAL]: "MUNICIPAL",
  [CONTEXT_TYPES.TRANSPORT]: "TRANSPORT",
  [CONTEXT_TYPES.PUBLIC_AREA]: "CIVIC",
  [CONTEXT_TYPES.AGRICULTURAL]: "AGRICULTURE",
  [CONTEXT_TYPES.OTHER_UNKNOWN]: "MUNICIPAL",

  // Aliases
  MEDICAL_FACILITY: "HOSPITAL",
  EDUCATIONAL_INSTITUTION: "EDUCATION",
  OTHER: "MUNICIPAL",
};

// ─── Default context priority (higher sensitivity contexts checked first) ─
export const DEFAULT_CONTEXT_PRIORITY = [
  CONTEXT_TYPES.HEALTHCARE,
  CONTEXT_TYPES.WATER_BODY,
  CONTEXT_TYPES.ENVIRONMENTAL_PROTECTED,
  CONTEXT_TYPES.EDUCATIONAL,
  CONTEXT_TYPES.RESIDENTIAL,
  CONTEXT_TYPES.PUBLIC_AREA,
  CONTEXT_TYPES.AGRICULTURAL,
  CONTEXT_TYPES.COMMERCIAL,
  CONTEXT_TYPES.ROADSIDE,
  CONTEXT_TYPES.TRANSPORT,
  CONTEXT_TYPES.INDUSTRIAL,
  CONTEXT_TYPES.OTHER_UNKNOWN,
];


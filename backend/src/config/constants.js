// ─── Waste classes (configurable — add/remove as needed) ───────────────────
// These mirror the 10 target classes the YOLO model is trained on.
// The AI service returns raw class names; the backend maps them through
// this list. When retraining with new classes, update this array and the
// ai-service/data.yaml simultaneously.

export const WASTE_CLASSES = [
  "plastic",
  "paper",
  "cardboard",
  "glass",
  "metal",
  "food_waste",
  "construction_waste",
  "electronic_waste",
  "mixed_waste",
  "other",
];

// ─── Context types (what's near the dump site) ────────────────────────────
export const CONTEXT_TYPES = {
  MEDICAL_FACILITY: "MEDICAL_FACILITY",
  EDUCATIONAL_INSTITUTION: "EDUCATIONAL_INSTITUTION",
  ROADSIDE: "ROADSIDE",
  PUBLIC_AREA: "PUBLIC_AREA",
  RESIDENTIAL: "RESIDENTIAL",
  WATER_BODY: "WATER_BODY",
  OTHER: "OTHER",
};

// ─── OSM amenity/tag mappings for Overpass queries ────────────────────────
// Maps our context types to the OpenStreetMap amenity/tag values used
// in Overpass API queries. Each context type can match multiple OSM tags.
export const OSM_TAG_MAP = {
  [CONTEXT_TYPES.MEDICAL_FACILITY]: [
    { key: "amenity", values: ["hospital", "clinic", "doctors"] },
    { key: "healthcare", values: ["hospital", "clinic", "centre"] },
  ],
  [CONTEXT_TYPES.EDUCATIONAL_INSTITUTION]: [
    { key: "amenity", values: ["school", "college", "university", "kindergarten"] },
  ],
  [CONTEXT_TYPES.ROADSIDE]: [
    { key: "highway", values: ["primary", "secondary", "tertiary", "residential", "trunk", "motorway"] },
  ],
  [CONTEXT_TYPES.PUBLIC_AREA]: [
    { key: "leisure", values: ["park", "playground", "garden"] },
    { key: "amenity", values: ["marketplace", "bus_station", "parking"] },
  ],
  [CONTEXT_TYPES.RESIDENTIAL]: [
    { key: "landuse", values: ["residential"] },
    { key: "building", values: ["residential", "apartments"] },
  ],
  [CONTEXT_TYPES.WATER_BODY]: [
    { key: "natural", values: ["water"] },
    { key: "waterway", values: ["river", "stream", "canal", "drain"] },
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
  "SCHOOL",
  "COLLEGE",
  "UNIVERSITY",
  "PWD",
  "MUNICIPAL",
  "CIVIC",
  "OTHER",
];

// ─── Default context priority (lower index = higher priority) ─────────────
export const DEFAULT_CONTEXT_PRIORITY = [
  CONTEXT_TYPES.MEDICAL_FACILITY,
  CONTEXT_TYPES.EDUCATIONAL_INSTITUTION,
  CONTEXT_TYPES.WATER_BODY,
  CONTEXT_TYPES.ROADSIDE,
  CONTEXT_TYPES.PUBLIC_AREA,
  CONTEXT_TYPES.RESIDENTIAL,
  CONTEXT_TYPES.OTHER,
];

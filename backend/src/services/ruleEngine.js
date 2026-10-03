import Rule from "../models/Rule.js";
import Authority from "../models/Authority.js";
import { CONTEXT_TYPES, CONTEXT_LABELS, CONTEXT_AUTHORITY_MAP } from "../config/constants.js";

/**
 * Compatible authority type lookup fallbacks.
 */
const AUTHORITY_FALLBACK_TYPES = {
  HOSPITAL: ["HOSPITAL", "HEALTHCARE", "CLINIC"],
  HEALTHCARE: ["HOSPITAL", "HEALTHCARE", "CLINIC"],
  PWD: ["PWD"],
  EDUCATION: ["EDUCATION", "SCHOOL", "COLLEGE", "UNIVERSITY"],
  SCHOOL: ["EDUCATION", "SCHOOL", "COLLEGE", "UNIVERSITY"],
  WATER_RESOURCES: ["WATER_RESOURCES", "ENVIRONMENT"],
  FOREST: ["FOREST", "ENVIRONMENT"],
  ENVIRONMENT: ["ENVIRONMENT", "FOREST", "WATER_RESOURCES"],
  POLLUTION_CONTROL: ["POLLUTION_CONTROL", "ENVIRONMENT"],
  MUNICIPAL: ["MUNICIPAL", "CIVIC", "WARD"],
  CIVIC: ["CIVIC", "MUNICIPAL"],
  TRANSPORT: ["TRANSPORT", "RAILWAY"],
  AGRICULTURE: ["AGRICULTURE", "MUNICIPAL"],
};

/**
 * Lookup the configured Authority document for a given authority type from MongoDB.
 *
 * @param {string} authorityType
 * @returns {Promise<object | null>}
 */
export async function getAuthorityForType(authorityType) {
  if (!authorityType) return null;

  // 1. Try exact type match
  let auth = await Authority.findOne({ type: authorityType, active: true }).lean();
  if (auth) return auth;

  // 2. Try compatible fallbacks
  const fallbacks = AUTHORITY_FALLBACK_TYPES[authorityType] || [];
  for (const fbType of fallbacks) {
    auth = await Authority.findOne({ type: fbType, active: true }).lean();
    if (auth) return auth;
  }

  // 3. Fallback to Municipal or first active authority
  auth = await Authority.findOne({ type: "MUNICIPAL", active: true }).lean();
  if (auth) return auth;

  return await Authority.findOne({ active: true }).lean();
}

/**
 * Lookup the configured Authority document directly for an environmental context.
 *
 * @param {string} contextType
 * @returns {Promise<object | null>}
 */
export async function getAuthorityForContext(contextType) {
  const targetType = CONTEXT_AUTHORITY_MAP[contextType] || "MUNICIPAL";
  return getAuthorityForType(targetType);
}

/**
 * Default standard rules for all 12 environmental contexts.
 * Suspicion reasons are explicitly phrased as "suspected" dumping and do NOT claim proximity legally proves dumping.
 */
export const DEFAULT_RULES = [
  {
    name: "Suspected Dumping Near Healthcare Facility",
    contextType: CONTEXT_TYPES.HEALTHCARE,
    radiusMeters: 200,
    priority: 1,
    authorityType: "HOSPITAL",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Suspected biohazard / healthcare buffer violation; requires field verification.",
  },
  {
    name: "Suspected Dumping Near Water Body / Wetland",
    contextType: CONTEXT_TYPES.WATER_BODY,
    radiusMeters: 150,
    priority: 2,
    authorityType: "WATER_RESOURCES",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Risk of aquatic contamination; requires site inspection.",
  },
  {
    name: "Suspected Dumping In Protected / Forest Area",
    contextType: CONTEXT_TYPES.ENVIRONMENTAL_PROTECTED,
    radiusMeters: 200,
    priority: 3,
    authorityType: "FOREST",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Suspected ecological violation in designated environmental protection zone.",
  },
  {
    name: "Suspected Dumping Near Educational Campus",
    contextType: CONTEXT_TYPES.EDUCATIONAL,
    radiusMeters: 200,
    priority: 4,
    authorityType: "EDUCATION",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Suspected safety and sanitation hazard near academic premises.",
  },
  {
    name: "Suspected Roadside Dumping",
    contextType: CONTEXT_TYPES.ROADSIDE,
    radiusMeters: 50,
    priority: 5,
    authorityType: "PWD",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected along {{contextLabel}} ({{placeName}}, {{distance}} away). Suspected unauthorized dumping on public right-of-way.",
  },
  {
    name: "Suspected Dumping In Industrial Zone",
    contextType: CONTEXT_TYPES.INDUSTRIAL,
    radiusMeters: 200,
    priority: 6,
    authorityType: "POLLUTION_CONTROL",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste accumulation detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Potential industrial non-compliance; subject to pollution audit.",
  },
  {
    name: "Suspected Dumping Near Transport Hub",
    contextType: CONTEXT_TYPES.TRANSPORT,
    radiusMeters: 150,
    priority: 7,
    authorityType: "TRANSPORT",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Suspected unauthorized dumping on transit corridor / property.",
  },
  {
    name: "Suspected Dumping In Residential Neighborhood",
    contextType: CONTEXT_TYPES.RESIDENTIAL,
    radiusMeters: 100,
    priority: 8,
    authorityType: "MUNICIPAL",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Suspected civic hygiene violation in residential zone.",
  },
  {
    name: "Suspected Dumping In Commercial / Market Area",
    contextType: CONTEXT_TYPES.COMMERCIAL,
    radiusMeters: 100,
    priority: 9,
    authorityType: "MUNICIPAL",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Suspected unmanaged commercial refuse.",
  },
  {
    name: "Suspected Dumping In Public Civic Facility",
    contextType: CONTEXT_TYPES.PUBLIC_AREA,
    radiusMeters: 100,
    priority: 10,
    authorityType: "CIVIC",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Suspected public nuisance in civic area.",
  },
  {
    name: "Suspected Dumping On Agricultural Land",
    contextType: CONTEXT_TYPES.AGRICULTURAL,
    radiusMeters: 200,
    priority: 11,
    authorityType: "AGRICULTURE",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected within {{radius}}m of {{contextLabel}} ({{placeName}}, {{distance}} away). Suspected contamination of agricultural/farmland zone.",
  },
  {
    name: "Suspected Dumping In Unclassified / General Area",
    contextType: CONTEXT_TYPES.OTHER_UNKNOWN,
    radiusMeters: 500,
    priority: 12,
    authorityType: "MUNICIPAL",
    incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
    reasonTemplate: "Waste detected in unclassified zone. Routed to municipal authority for manual review and field verification.",
  },
];

/**
 * Evaluates rules and routes to the responsible authority based on the detected environmental context.
 *
 * Sequence:
 *  YOLO detects waste -> context identified -> rule evaluated -> suspected illegal dumping -> authority selected -> incident stored -> notification eligible
 *
 * @param {Array} [nearbyPlaces]  List of nearby POIs from geospatial service
 * @param {string} [detectedContextType]  Primary detected context type (e.g. "HEALTHCARE", "WATER_BODY")
 * @param {object} [geoContext]  Full geospatial context object
 * @returns {Promise<{
 *   allContexts: string[],
 *   primaryContext: string,
 *   primaryContextLabel: string,
 *   incidentType: string,
 *   suspicionReason: string,
 *   nearestPlace: object | null,
 *   authority: { _id, name, type, email, phone, location } | null,
 *   matchedRule: object | null
 * }>}
 */
export async function evaluateRules(nearbyPlaces = [], detectedContextType = null, geoContext = null) {
  // Determine the primary environmental context:
  // 1. Explicitly supplied detectedContextType
  // 2. geoContext?.contextType
  // 3. First nearby place contextType
  // 4. Default to OTHER_UNKNOWN
  const contextType =
    detectedContextType ||
    geoContext?.contextType ||
    (nearbyPlaces.length > 0 ? nearbyPlaces[0].contextType : CONTEXT_TYPES.OTHER_UNKNOWN);

  // Load all enabled rules from MongoDB
  const rules = await Rule.find({ enabled: true }).sort({ priority: 1 }).lean();

  // Find the configured rule matching the detected environmental context
  let matchedRule = rules.find((r) => r.contextType === contextType);

  // If no rule exists in DB for this specific context, fall back to DEFAULT_RULES
  if (!matchedRule) {
    matchedRule =
      DEFAULT_RULES.find((r) => r.contextType === contextType) ||
      rules.find((r) => r.contextType === CONTEXT_TYPES.OTHER_UNKNOWN) ||
      DEFAULT_RULES[DEFAULT_RULES.length - 1];
  }

  // Find the closest POI corresponding to this context (if available)
  const matchingPlaces = (nearbyPlaces || []).filter((p) => p.contextType === contextType);
  const nearestPlace =
    matchingPlaces.length > 0
      ? matchingPlaces[0]
      : (nearbyPlaces || []).length > 0
      ? nearbyPlaces[0]
      : null;

  // Look up configured authority in MongoDB for this rule
  const authority = await getAuthorityForType(matchedRule.authorityType);

  // Format suspicion reason using the configurable rule template (does NOT presume legal violation)
  const placeName =
    nearestPlace?.name ||
    (geoContext?.nearbyPlaceName
      ? geoContext.nearbyPlaceName
      : geoContext?.locationName && !geoContext.locationName.startsWith("Coordinates")
      ? geoContext.locationName.split(",")[0].trim()
      : "vicinity");

  const distanceText =
    nearestPlace?.distance !== undefined && nearestPlace?.distance !== null
      ? `${nearestPlace.distance}m`
      : geoContext?.distance !== undefined && geoContext?.distance !== null
      ? `${geoContext.distance}m`
      : "proximity";

  const contextLabel =
    CONTEXT_LABELS[matchedRule.contextType] || matchedRule.contextType;

  let reason = matchedRule.reasonTemplate || "Waste detected in proximity to {{contextLabel}}.";
  reason = reason
    .replace(/\{\{radius\}\}/g, String(matchedRule.radiusMeters))
    .replace(/\{\{contextLabel\}\}/g, contextLabel)
    .replace(/\{\{placeName\}\}/g, placeName)
    .replace(/\{\{distance\}\}/g, distanceText);

  reason = reason.replace(/\(\s*,\s*/g, "(").replace(/\(\s*\)/g, "").replace(/\s\s+/g, " ");

  const allContexts = [
    ...new Set([
      contextType,
      ...(geoContext?.allMatchedContexts || []),
      ...(nearbyPlaces || []).map((p) => p.contextType),
    ]),
  ].filter(Boolean);

  return {
    allContexts,
    primaryContext: matchedRule.contextType,
    primaryContextLabel: contextLabel,
    incidentType: buildIncidentType(matchedRule),
    suspicionReason: reason,
    nearestPlace,
    authority: authority
      ? {
          _id: authority._id,
          name: authority.name,
          type: authority.type,
          email: authority.email,
          phone: authority.phone,
          location: authority.location,
        }
      : null,
    matchedRule,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildIncidentType(rule) {
  if (!rule || !rule.contextType || rule.contextType === CONTEXT_TYPES.OTHER_UNKNOWN) {
    return "SUSPECTED_ILLEGAL_DUMPING";
  }
  const base = rule.incidentTemplate || "SUSPECTED_ILLEGAL_DUMPING";
  return `${base}_NEAR_${rule.contextType}`;
}

/**
 * Seed or synchronize default rules in MongoDB.
 * Replaces obsolete rules and ensures all 12 contexts exist with proper mappings.
 */
export async function seedDefaultRules() {
  try {
    // 1. Remove obsolete or deprecated context rules
    await Rule.deleteMany({
      $or: [
        { contextType: CONTEXT_TYPES.WATER_BODY, authorityType: "CIVIC" },
        { contextType: "MEDICAL_FACILITY" },
        { contextType: "EDUCATIONAL_INSTITUTION" },
        { contextType: "OTHER" },
        { name: "Roadside dumping" }, // replace old 30m rule with standard rule
        { name: "Dump near medical facility" },
        { name: "Dump near educational institution" },
        { name: "Dump near water body" },
        { name: "Dump in public area" },
        { name: "Dump in residential area" },
      ],
    });

    // 2. Synchronize all 12 standard rules
    for (const def of DEFAULT_RULES) {
      await Rule.findOneAndUpdate(
        { contextType: def.contextType },
        { $set: def },
        { upsert: true, new: true }
      );
    }
    console.log(`[RuleEngine] Synchronized all ${DEFAULT_RULES.length} standard context rules.`);
  } catch (err) {
    console.error("[RuleEngine] Error seeding rules:", err.message);
  }
}

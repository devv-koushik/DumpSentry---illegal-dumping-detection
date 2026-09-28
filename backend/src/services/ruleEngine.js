import Rule from "../models/Rule.js";
import Authority from "../models/Authority.js";
import { CONTEXT_TYPES } from "../config/constants.js";

// ─── Human-readable labels for context types ──────────────────────────────
const CONTEXT_LABELS = {
  [CONTEXT_TYPES.MEDICAL_FACILITY]: "medical facility",
  [CONTEXT_TYPES.EDUCATIONAL_INSTITUTION]: "educational institution",
  [CONTEXT_TYPES.ROADSIDE]: "roadside area",
  [CONTEXT_TYPES.PUBLIC_AREA]: "public area",
  [CONTEXT_TYPES.RESIDENTIAL]: "residential area",
  [CONTEXT_TYPES.WATER_BODY]: "water body",
  [CONTEXT_TYPES.OTHER]: "area",
};

/**
 * Given a list of nearby places (from the geospatial service), apply the
 * configured rules to determine:
 *  - All matching contexts
 *  - The primary (highest-priority) context
 *  - The incident type & suspicion reason
 *  - The responsible authority
 *
 * @param {Array} nearbyPlaces  From geospatial.findNearbyPlaces()
 * @returns {Promise<{
 *   allContexts: string[],
 *   primaryContext: string,
 *   primaryContextLabel: string,
 *   incidentType: string,
 *   suspicionReason: string,
 *   nearestPlace: object | null,
 *   authority: { _id, name, type, email } | null,
 *   matchedRule: object | null
 * }>}
 */
export async function evaluateRules(nearbyPlaces) {
  // Load all enabled rules, sorted by priority (lower number = higher priority)
  const rules = await Rule.find({ enabled: true }).sort({ priority: 1 }).lean();

  if (rules.length === 0) {
    return defaultResult();
  }

  // Group nearby places by context type
  const contextMap = new Map();
  for (const place of nearbyPlaces) {
    if (!contextMap.has(place.contextType)) {
      contextMap.set(place.contextType, []);
    }
    contextMap.get(place.contextType).push(place);
  }

  // Check each rule in priority order against nearby places
  const matchedContexts = [];
  let bestMatch = null;

  for (const rule of rules) {
    const places = contextMap.get(rule.contextType);
    if (!places || places.length === 0) continue;

    // Check if any place is within the rule's radius
    const withinRadius = places.filter((p) => p.distance <= rule.radiusMeters);
    if (withinRadius.length === 0) continue;

    matchedContexts.push(rule.contextType);

    if (!bestMatch) {
      bestMatch = {
        rule,
        nearestPlace: withinRadius[0], // already sorted by distance
      };
    }
  }

  if (!bestMatch) {
    return defaultResult(
      nearbyPlaces.length > 0 ? [nearbyPlaces[0].contextType] : []
    );
  }

  // Look up the authority for the matched rule
  const authority = await Authority.findOne({
    type: bestMatch.rule.authorityType,
    active: true,
  }).lean();

  // Build the suspicion reason from the rule template
  const reason = bestMatch.rule.reasonTemplate
    .replace("{{radius}}", bestMatch.rule.radiusMeters)
    .replace("{{contextLabel}}", CONTEXT_LABELS[bestMatch.rule.contextType] || "facility")
    .replace("{{placeName}}", bestMatch.nearestPlace.name || "facility")
    .replace("{{distance}}", bestMatch.nearestPlace.distance);

  const contextLabel = CONTEXT_LABELS[bestMatch.rule.contextType] || bestMatch.rule.contextType;

  return {
    allContexts: [...new Set(matchedContexts)],
    primaryContext: bestMatch.rule.contextType,
    primaryContextLabel: contextLabel,
    incidentType: buildIncidentType(bestMatch.rule),
    suspicionReason: reason,
    nearestPlace: bestMatch.nearestPlace,
    authority: authority || null,
    matchedRule: bestMatch.rule,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildIncidentType(rule) {
  // e.g. "SUSPECTED_ILLEGAL_DUMPING_NEAR_MEDICAL_FACILITY"
  const suffix = rule.contextType ? `_NEAR_${rule.contextType}` : "";
  return `${rule.incidentTemplate || "SUSPECTED_ILLEGAL_DUMPING"}${suffix}`;
}

function defaultResult(contexts = []) {
  return {
    allContexts: contexts,
    primaryContext: CONTEXT_TYPES.OTHER,
    primaryContextLabel: "unclassified area",
    incidentType: "SUSPECTED_ILLEGAL_DUMPING",
    suspicionReason: "Garbage detected in an area without specific facility rules configured.",
    nearestPlace: null,
    authority: null,
    matchedRule: null,
  };
}

/**
 * Seed default rules if none exist.
 */
export async function seedDefaultRules() {
  const count = await Rule.countDocuments();
  if (count > 0) return;

  const defaults = [
    {
      name: "Dump near medical facility",
      contextType: CONTEXT_TYPES.MEDICAL_FACILITY,
      radiusMeters: 200,
      priority: 1,
      authorityType: "HOSPITAL",
      incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
      reasonTemplate: "Garbage detected within {{radius}}m of a {{contextLabel}} ({{placeName}}, {{distance}}m away).",
    },
    {
      name: "Dump near educational institution",
      contextType: CONTEXT_TYPES.EDUCATIONAL_INSTITUTION,
      radiusMeters: 200,
      priority: 2,
      authorityType: "SCHOOL",
      incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
      reasonTemplate: "Garbage detected within {{radius}}m of an {{contextLabel}} ({{placeName}}, {{distance}}m away).",
    },
    {
      name: "Dump near water body",
      contextType: CONTEXT_TYPES.WATER_BODY,
      radiusMeters: 150,
      priority: 3,
      authorityType: "CIVIC",
      incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
      reasonTemplate: "Garbage detected within {{radius}}m of a {{contextLabel}} ({{placeName}}, {{distance}}m away).",
    },
    {
      name: "Roadside dumping",
      contextType: CONTEXT_TYPES.ROADSIDE,
      radiusMeters: 30,
      priority: 4,
      authorityType: "PWD",
      incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
      reasonTemplate: "Garbage detected within {{radius}}m of a {{contextLabel}}.",
    },
    {
      name: "Dump in public area",
      contextType: CONTEXT_TYPES.PUBLIC_AREA,
      radiusMeters: 100,
      priority: 5,
      authorityType: "MUNICIPAL",
      incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
      reasonTemplate: "Garbage detected within {{radius}}m of a {{contextLabel}} ({{placeName}}, {{distance}}m away).",
    },
    {
      name: "Dump in residential area",
      contextType: CONTEXT_TYPES.RESIDENTIAL,
      radiusMeters: 100,
      priority: 6,
      authorityType: "MUNICIPAL",
      incidentTemplate: "SUSPECTED_ILLEGAL_DUMPING",
      reasonTemplate: "Garbage detected within {{radius}}m of a {{contextLabel}}.",
    },
  ];

  await Rule.insertMany(defaults);
  console.log(`[RuleEngine] Seeded ${defaults.length} default rules`);
}

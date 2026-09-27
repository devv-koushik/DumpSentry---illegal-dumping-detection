// Mock AI command bar service. In production, replace with a call to your
// LLM-backed assistant API. Components call `askDumpSentryAI(query)`
// and receive a structured response.

import { DETECTIONS, OVERVIEW_STATS } from "../data/detections";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const RESPONSES = {
  "today's detections": {
    text: `Today we've recorded **${OVERVIEW_STATS.total}** total detections across the monitored zones. ${OVERVIEW_STATS.suspectedIllegal} are flagged as suspected illegal dumping, and ${OVERVIEW_STATS.pendingReview} are pending human review.`,
    highlights: [],
  },
  "high risk": {
    text: `There are **${DETECTIONS.filter((d) => d.confidence >= 90).length}** high-confidence detections (≥90%) that require immediate attention. Most are concentrated in the New Town and Kasba corridors.`,
    highlights: DETECTIONS.filter((d) => d.confidence >= 90).map((d) => d.id),
  },
  "nearby schools": {
    text: `**${DETECTIONS.filter((d) => d.context === "School").length}** incidents detected near educational institutions. School Administration has been identified as the responsible authority for these zones.`,
    highlights: DETECTIONS.filter((d) => d.context === "School").map((d) => d.id),
  },
  "pending alerts": {
    text: `**${DETECTIONS.filter((d) => d.alertStatus === "Not Sent").length}** detections have alerts pending dispatch. Would you like me to prepare a batch alert for all pending incidents?`,
    highlights: DETECTIONS.filter((d) => d.alertStatus === "Not Sent").map((d) => d.id),
  },
  "unresolved roadside": {
    text: `There are **${DETECTIONS.filter((d) => d.context === "Roadside" && d.status !== "Resolved").length}** unresolved roadside incidents. PWD / Municipal Authority is the primary responsible body for these locations.`,
    highlights: DETECTIONS.filter((d) => d.context === "Roadside" && d.status !== "Resolved").map((d) => d.id),
  },
};

function findBestResponse(query) {
  const q = query.toLowerCase();
  for (const [key, response] of Object.entries(RESPONSES)) {
    if (q.includes(key)) return response;
  }

  // Fuzzy keyword matching
  if (q.includes("school") || q.includes("education")) return RESPONSES["nearby schools"];
  if (q.includes("risk") || q.includes("critical") || q.includes("urgent")) return RESPONSES["high risk"];
  if (q.includes("alert") || q.includes("pending") || q.includes("send")) return RESPONSES["pending alerts"];
  if (q.includes("road") || q.includes("highway")) return RESPONSES["unresolved roadside"];
  if (q.includes("today") || q.includes("detection") || q.includes("how many")) return RESPONSES["today's detections"];

  return {
    text: `Based on current surveillance data: **${OVERVIEW_STATS.total}** detections logged, **${OVERVIEW_STATS.suspectedIllegal}** suspected illegal, **${OVERVIEW_STATS.pendingReview}** pending review, **${OVERVIEW_STATS.resolved}** resolved. Try asking about specific zones, risk levels, or facility types.`,
    highlights: [],
  };
}

/**
 * Ask the DumpSentry AI assistant a question.
 * @param {string} query
 * @returns {Promise<{text: string, highlights: string[]}>}
 */
export async function askDumpSentryAI(query) {
  await delay(800 + Math.random() * 600);
  return findBestResponse(query);
}

// Alias for compatibility
export const askCleanWatchAI = askDumpSentryAI;

export const QUICK_CHIPS = [
  "Today's Detections",
  "High Risk",
  "Nearby Schools",
  "Pending Alerts",
];

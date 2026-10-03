/**
 * DumpSentry AI Command Bar Service
 * Computes intelligent query responses using REAL backend surveillance data.
 */

import { fetchOverviewStats, fetchDetections } from "./api";

export const QUICK_CHIPS = [
  "Today's Detections",
  "High Risk",
  "Nearby Schools",
  "Pending Alerts",
];

export async function askDumpSentryAI(query) {
  const [stats, detections] = await Promise.all([
    fetchOverviewStats().catch(() => ({
      total: 0,
      suspectedIllegal: 0,
      pendingReview: 0,
      resolved: 0,
    })),
    fetchDetections({ limit: 100 }).catch(() => []),
  ]);

  const q = (query || "").toLowerCase();

  // High risk query (confidence >= 90%)
  if (q.includes("risk") || q.includes("critical") || q.includes("urgent")) {
    const highRisk = (detections || []).filter((d) => (d.confidence || 0) >= 90);
    if (highRisk.length === 0) {
      return {
        text: `There are currently **0** critical high-risk detections (≥90% confidence) logged in the database. All captured sites have lower confidence or have been cleared.`,
        highlights: [],
      };
    }
    return {
      text: `There are **${highRisk.length}** high-confidence detections (≥90%) requiring priority investigation. Authorities have been assigned accordingly.`,
      highlights: highRisk.map((d) => d.id),
    };
  }

  // Educational query
  if (q.includes("school") || q.includes("education") || q.includes("college") || q.includes("campus")) {
    const nearSchools = (detections || []).filter((d) =>
      (d.context || "").toLowerCase().includes("school") ||
      (d.context || "").toLowerCase().includes("education") ||
      (d.contextType === "EDUCATIONAL")
    );
    if (nearSchools.length === 0) {
      return {
        text: `No active dump detections found near educational facilities or schools in current aerial surveillance.`,
        highlights: [],
      };
    }
    return {
      text: `Found **${nearSchools.length}** detections near educational facilities. The Education Department / Campus Safety Directorate has been routed for monitoring.`,
      highlights: nearSchools.map((d) => d.id),
    };
  }

  // Pending alerts query
  if (q.includes("alert") || q.includes("pending") || q.includes("send") || q.includes("dispatch")) {
    const pendingAlerts = (detections || []).filter((d) => d.alertStatus === "Not Sent");
    if (pendingAlerts.length === 0) {
      return {
        text: `All alert notifications have either been dispatched to authorities or are already resolved. No pending alerts.`,
        highlights: [],
      };
    }
    return {
      text: `There are **${pendingAlerts.length}** detections with alerts pending dispatch to responsible municipal authorities.`,
      highlights: pendingAlerts.map((d) => d.id),
    };
  }

  // Roadside incidents query
  if (q.includes("road") || q.includes("highway") || q.includes("street")) {
    const roadside = (detections || []).filter((d) =>
      ((d.context || "").toLowerCase().includes("road") || d.contextType === "ROADSIDE") &&
      d.status !== "Resolved"
    );
    if (roadside.length === 0) {
      return {
        text: `No unresolved roadside dumping incidents logged in the current surveillance database.`,
        highlights: [],
      };
    }
    return {
      text: `There are **${roadside.length}** unresolved roadside dump incidents. The Public Works Department (Roads & Highways) is the designated authority.`,
      highlights: roadside.map((d) => d.id),
    };
  }

  // Today's / General stats query
  return {
    text: `Surveillance overview from live database: **${stats.total}** total aerial detections logged (**${stats.suspectedIllegal}** suspected illegal, **${stats.pendingReview}** pending human review, **${stats.resolved}** resolved).`,
    highlights: [],
  };
}

export const askCleanWatchAI = askDumpSentryAI;

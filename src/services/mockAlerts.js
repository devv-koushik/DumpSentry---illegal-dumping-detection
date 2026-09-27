// Mock authority-notification service. In production this file would call
// a real email/SMS/webhook provider (e.g. an internal notifications API).
// Every consumer only ever talks to `sendAlert` / `fetchAlerts`, so the
// swap is isolated to this module.

import { DETECTIONS } from "../data/detections";
import { getAuthorityForContext } from "../data/authorities";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

let alertLog = DETECTIONS.map((d) => {
  const authority = getAuthorityForContext(d.context);
  return {
    id: `A-${d.id.split("-")[1]}`,
    detectionId: d.id,
    incident: `${d.wasteType} — ${d.context}`,
    location: d.location,
    context: d.context,
    authority: authority.authority,
    email: authority.email,
    status:
      d.alertStatus === "Not Sent"
        ? "Pending"
        : d.alertStatus === "Failed"
        ? "Failed"
        : d.alertStatus === "Resolved"
        ? "Resolved"
        : "Sent",
    date: d.timestamp,
  };
});

export async function fetchAlerts() {
  await delay(400);
  return [...alertLog].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Simulates dispatching a notification to the responsible authority.
// Resolves ~92% of the time to "Sent" and occasionally "Failed", the way
// a real email/SMS gateway call would behave.
export async function sendAlert(detectionId) {
  await delay(900);
  const willSucceed = Math.random() > 0.08;
  alertLog = alertLog.map((a) =>
    a.detectionId === detectionId
      ? { ...a, status: willSucceed ? "Sent" : "Failed", date: new Date().toISOString() }
      : a
  );
  const updated = alertLog.find((a) => a.detectionId === detectionId);
  if (!willSucceed) throw Object.assign(new Error("Alert dispatch failed"), { alert: updated });
  return updated;
}

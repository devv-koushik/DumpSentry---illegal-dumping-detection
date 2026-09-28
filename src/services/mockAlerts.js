// DumpSentry Alert Notification Service
// Tries real backend alert API first; falls back to local data if backend is offline.

import * as api from "./api";
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
  try {
    const realAlerts = await api.fetchAlerts();
    if (Array.isArray(realAlerts) && realAlerts.length > 0) {
      return realAlerts;
    }
  } catch {
    // API offline, using fallback
  }

  await delay(250);
  return [...alertLog].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function sendAlert(detectionId, options = {}) {
  try {
    const realResult = await api.sendAlert(detectionId, options);
    if (realResult) {
      return realResult.alert || realResult;
    }
  } catch {
    // API failed/offline, using fallback
  }

  await delay(500);
  alertLog = alertLog.map((a) =>
    a.detectionId === detectionId
      ? { ...a, status: "Sent", date: new Date().toISOString() }
      : a
  );
  return alertLog.find((a) => a.detectionId === detectionId);
}

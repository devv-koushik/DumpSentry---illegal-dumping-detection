// Mock "backend" for detections. Every function returns a Promise and
// simulates network latency, so swapping this file for a real API client
// (fetch/axios calls to your backend) later requires no changes in any
// component that consumes it — only this file changes.

import { DETECTIONS } from "../data/detections";

let store = [...DETECTIONS];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function fetchDetections(filters = {}) {
  await delay(450);
  let results = [...store];

  if (filters.status && filters.status !== "All") {
    results = results.filter((d) => d.status === filters.status);
  }
  if (filters.context && filters.context !== "All") {
    results = results.filter((d) => d.context === filters.context);
  }
  if (filters.wasteType && filters.wasteType !== "All") {
    results = results.filter((d) => d.wasteType === filters.wasteType);
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        d.wasteType.toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return results;
}

export async function fetchDetectionById(id) {
  await delay(350);
  const found = store.find((d) => d.id === id);
  if (!found) throw new Error(`Detection ${id} not found`);
  return found;
}

export async function updateDetectionStatus(id, status) {
  await delay(400);
  store = store.map((d) => (d.id === id ? { ...d, status } : d));
  return store.find((d) => d.id === id);
}

export async function updateAlertStatus(id, alertStatus) {
  await delay(400);
  store = store.map((d) => (d.id === id ? { ...d, alertStatus } : d));
  return store.find((d) => d.id === id);
}

export function resetDetectionsStore() {
  store = [...DETECTIONS];
}

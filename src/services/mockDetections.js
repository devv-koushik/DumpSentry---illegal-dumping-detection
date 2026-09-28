// DumpSentry Detection Service
// Tries real backend API first; falls back to local data if backend is offline.

import * as api from "./api";
import { DETECTIONS } from "../data/detections";

let store = [...DETECTIONS];
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function fetchDetections(filters = {}) {
  try {
    const realData = await api.fetchDetections(filters);
    if (Array.isArray(realData) && realData.length > 0) {
      return realData;
    }
  } catch {
    // Backend offline / not reachable - use local store
  }

  await delay(250);
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
  try {
    const realItem = await api.fetchDetectionById(id);
    if (realItem) return realItem;
  } catch {
    // fallback to local item
  }

  await delay(200);
  const found = store.find((d) => d.id === id);
  if (!found) throw new Error(`Detection ${id} not found`);
  return found;
}

export async function updateDetectionStatus(id, status) {
  try {
    const updated = await api.updateDetectionStatus(id, status);
    if (updated) return updated;
  } catch {
    // fallback
  }

  await delay(250);
  store = store.map((d) => (d.id === id ? { ...d, status } : d));
  return store.find((d) => d.id === id);
}

export async function updateAlertStatus(id, alertStatus) {
  try {
    const updated = await api.updateAlertStatus(id, alertStatus);
    if (updated) return updated;
  } catch {
    // fallback
  }

  await delay(250);
  store = store.map((d) => (d.id === id ? { ...d, alertStatus } : d));
  return store.find((d) => d.id === id);
}

export function resetDetectionsStore() {
  store = [...DETECTIONS];
}

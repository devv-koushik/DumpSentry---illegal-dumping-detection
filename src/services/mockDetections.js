/**
 * DumpSentry Detection Service
 * Re-exports real detections endpoints from api.js.
 * No mock/simulated fallback data.
 */

export {
  fetchDetections,
  fetchDetectionById,
  updateDetectionStatus,
  updateAlertStatus,
  fetchMapDetections,
} from "./api";

export function resetDetectionsStore() {
  // No-op for real backend
}

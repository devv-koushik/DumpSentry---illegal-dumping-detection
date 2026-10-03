/**
 * DumpSentry Alert Service
 * Re-exports real alerts endpoints from api.js.
 * No mock/simulated fallback data.
 */

export { fetchAlerts, sendAlert } from "./api";

/**
 * DumpSentry Central API Client
 * Connects React Frontend to Node.js/Express Backend & FastAPI AI Service.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Token Management ────────────────────────────────────────────────────────

const TOKEN_KEY = "dumpsentry_admin_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

// ─── HTTP Request Helper ─────────────────────────────────────────────────────

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function getMe() {
  return request("/auth/me");
}

export function logout() {
  removeAuthToken();
}

export function getImageUrl(path) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return `${backendBase}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const ANALYSIS_STAGES = [
  "Uploading Drone Image",
  "Running YOLOv11 Computer Vision",
  "Querying Geospatial Context",
  "Evaluating Municipal Rules",
  "Assigning Responsible Authority",
  "Complete",
];

// ─── Detections API ──────────────────────────────────────────────────────────

function sanitizeDetection(d) {
  if (!d) return null;
  return {
    ...d,
    id: d.id || d.detectionId || d._id,
    image: getImageUrl(d.image || d.annotatedImageUrl || d.originalImageUrl),
    originalImageUrl: getImageUrl(d.originalImageUrl),
    annotatedImageUrl: getImageUrl(d.annotatedImageUrl),
    wasteTypes: Array.isArray(d.wasteTypes) ? d.wasteTypes : [],
    wasteType: d.wasteType || (Array.isArray(d.wasteTypes) && d.wasteTypes.length > 0 ? d.wasteTypes.join(", ") : "No Waste Detected"),
    confidence: typeof d.confidence === "number"
      ? d.confidence
      : Math.round((d.overallConfidence || 0) > 1 ? d.overallConfidence : (d.overallConfidence || 0) * 100),
    context: d.context || "Unclassified Area",
    location: d.location || "Location Unavailable",
    authority: d.authority || d.authorityName || "Pending Assignment",
    status: d.status || "Pending Review",
    alertStatus: d.alertStatus || "Not Sent",
    nearbyPlaces: Array.isArray(d.nearbyPlaces) ? d.nearbyPlaces : [],
    detections: Array.isArray(d.detections) ? d.detections : [],
  };
}

export async function fetchDetections(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "All") params.append("status", filters.status);
  if (filters.context && filters.context !== "All") params.append("context", filters.context);
  if (filters.wasteType && filters.wasteType !== "All") params.append("wasteType", filters.wasteType);
  if (filters.query || filters.search) params.append("search", filters.query || filters.search);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await request(`/detections${queryString}`);
  const list = Array.isArray(response) ? response : (response.data || []);
  return list.map(sanitizeDetection);
}

export async function fetchDetectionById(id) {
  const d = await request(`/detections/${id}`);
  return sanitizeDetection(d);
}

export async function fetchMapDetections() {
  const response = await request("/detections/map");
  const list = Array.isArray(response) ? response : (response.data || []);
  return list.map(sanitizeDetection);
}

export async function updateDetectionStatus(id, status) {
  const updated = await request(`/detections/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return sanitizeDetection(updated);
}

export async function updateAlertStatus(id, alertStatus) {
  const updated = await request(`/detections/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ alertStatus }),
  });
  return sanitizeDetection(updated);
}

export async function verifyDetection(id, verified, notes = "") {
  return request(`/detections/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({ verified, notes }),
  });
}

export async function deleteDetection(id) {
  return request(`/detections/${id}`, {
    method: "DELETE",
  });
}

// ─── Image Analysis (AI + Geospatial + Rules) ────────────────────────────────

export async function analyzeImage(file, onProgress = () => {}, coords = null) {
  for (let i = 0; i < 3; i++) {
    onProgress(i, ANALYSIS_STAGES[i]);
    await new Promise((r) => setTimeout(r, 200));
  }

  const formData = new FormData();
  formData.append("image", file);
  if (coords?.latitude != null && coords?.latitude !== "") formData.append("latitude", coords.latitude);
  if (coords?.longitude != null && coords?.longitude !== "") formData.append("longitude", coords.longitude);
  if (coords?.droneId) formData.append("droneId", coords.droneId);

  onProgress(3, ANALYSIS_STAGES[3]);
  const result = await request("/analysis/analyze", {
    method: "POST",
    body: formData,
  });

  onProgress(4, ANALYSIS_STAGES[4]);
  await new Promise((r) => setTimeout(r, 150));
  onProgress(5, ANALYSIS_STAGES[5]);

  const det = result.detection || {};
  const wasteDetected = Boolean(result.ai?.wasteDetected);
  const rawBoxes = det.detections || result.ai?.detections || [];

  return {
    detectionId: det.detectionId || det.id,
    id: det.detectionId || det.id,
    wasteDetected,
    wasteTypes: det.wasteTypes || result.ai?.classes || [],
    wasteType: det.wasteType || (Array.isArray(det.wasteTypes) && det.wasteTypes.length > 0 ? det.wasteTypes.join(", ") : (wasteDetected ? "Detected Waste" : "No Waste Detected")),
    context: det.context || result.geospatial?.contextLabel || "Unclassified Area",
    contextType: det.contextType || result.geospatial?.contextType || "OTHER_UNKNOWN",
    confidence: typeof det.confidence === "number"
      ? det.confidence
      : Math.round((det.overallConfidence || result.ai?.maxConfidence || 0) * 100),
    status: det.status || (wasteDetected ? "Pending Review" : "Clean"),
    boundingBoxes: rawBoxes.map((d) => ({
      class: d.class,
      confidence: Math.round((d.confidence || 0) * 100),
      x: d.bbox?.x ?? 0,
      y: d.bbox?.y ?? 0,
      w: d.bbox?.width ?? 0,
      h: d.bbox?.height ?? 0,
    })),
    authority: det.authority || det.authorityName || result.ruleEngine?.authority?.name || "Pending Assignment",
    authorityEmail: result.ruleEngine?.authority?.email || "",
    location: det.location || result.geospatial?.location || "Location Unavailable",
    latitude: det.latitude ?? result.geospatial?.latitude ?? null,
    longitude: det.longitude ?? result.geospatial?.longitude ?? null,
    nearbyPlaces: det.nearbyPlaces || result.geospatial?.nearbyPlaces || [],
    image: getImageUrl(det.annotatedImageUrl || det.originalImageUrl || det.image),
    originalImageUrl: getImageUrl(det.originalImageUrl),
    annotatedImageUrl: getImageUrl(det.annotatedImageUrl),
    analyzedAt: det.timestamp || new Date().toISOString(),
    rawResult: result,
  };
}

// ─── Alerts API ──────────────────────────────────────────────────────────────

export async function fetchAlerts() {
  return request("/alerts");
}

export async function sendAlert(detectionId, options = {}) {
  return request(`/alerts/${detectionId}/send`, {
    method: "POST",
    body: JSON.stringify(options),
  });
}

// ─── Dashboard Stats & Analytics ─────────────────────────────────────────────

export async function fetchOverviewStats() {
  return request("/dashboard/overview");
}

export async function fetchAnalytics() {
  return request("/dashboard/analytics");
}

// ─── Authorities & Rules ─────────────────────────────────────────────────────

export async function fetchAuthorities() {
  return request("/authorities");
}

export async function createAuthority(data) {
  return request("/authorities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAuthority(id, data) {
  return request(`/authorities/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function fetchRules() {
  return request("/rules");
}

export async function createRule(data) {
  return request("/rules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Drones Telemetry ────────────────────────────────────────────────────────

export async function fetchDrones() {
  return request("/drones");
}

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  login,
  getMe,
  logout,
  fetchDetections,
  fetchDetectionById,
  fetchMapDetections,
  updateDetectionStatus,
  updateAlertStatus,
  verifyDetection,
  deleteDetection,
  analyzeImage,
  fetchAlerts,
  sendAlert,
  fetchOverviewStats,
  fetchAnalytics,
  fetchAuthorities,
  createAuthority,
  fetchRules,
  createRule,
  fetchDrones,
};

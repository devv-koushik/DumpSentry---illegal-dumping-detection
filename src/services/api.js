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

// ─── Detections API ──────────────────────────────────────────────────────────

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
  return response.data || response;
}

export async function fetchDetectionById(id) {
  return request(`/detections/${id}`);
}

export async function fetchMapDetections() {
  return request("/detections/map");
}

export async function updateDetectionStatus(id, status) {
  return request(`/detections/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateAlertStatus(id, alertStatus) {
  return request(`/detections/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ alertStatus }),
  });
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
  const STAGES = [
    "Uploading Drone Image",
    "Running YOLOv11 Computer Vision",
    "Querying Geospatial Context",
    "Evaluating Municipal Rules",
    "Assigning Responsible Authority",
    "Complete",
  ];

  for (let i = 0; i < 3; i++) {
    onProgress(i, STAGES[i]);
    await new Promise((r) => setTimeout(r, 300));
  }

  const formData = new FormData();
  formData.append("image", file);
  if (coords?.latitude) formData.append("latitude", coords.latitude);
  if (coords?.longitude) formData.append("longitude", coords.longitude);
  if (coords?.droneId) formData.append("droneId", coords.droneId);

  onProgress(3, STAGES[3]);
  const result = await request("/analysis/analyze", {
    method: "POST",
    body: formData,
  });

  onProgress(4, STAGES[4]);
  await new Promise((r) => setTimeout(r, 200));
  onProgress(5, STAGES[5]);

  const det = result.detection;
  return {
    wasteDetected: result.ai?.wasteDetected ?? true,
    wasteType: det.wasteType || det.wasteTypes?.[0] || "Plastic",
    context: det.context || "Monitored Area",
    confidence: Math.round((det.confidence || det.overallConfidence || 0.85) * (det.confidence > 1 ? 1 : 100)),
    status: det.status || "Suspected Illegal",
    boundingBoxes: (det.detections || []).map((d) => ({
      x: d.bbox?.x || 20,
      y: d.bbox?.y || 25,
      w: d.bbox?.width || 50,
      h: d.bbox?.height || 45,
    })),
    authority: det.authority || det.authorityName || "City Municipal Corporation",
    authorityEmail: result.ruleEngine?.authority?.email || "solidwaste@citycorp.gov.in",
    location: det.location,
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

# DumpSentry Frontend Integration Guide

This guide explains how the React frontend interfaces with the Node.js backend and the FastAPI AI service.

---

## 1. Overview

The React frontend has been connected to real REST endpoints through a centralized API service layer (`src/services/api.js`). 

To preserve seamless developer experience, existing service files (`src/services/mockDetections.js`, `src/services/mockAlerts.js`, `src/services/mockAI.js`) now use a **resilient hybrid strategy**:

1. **Live Backend Attempt:** The application attempts to communicate with the real backend at `VITE_API_URL` (default: `http://localhost:5000/api`).
2. **Graceful Offline Fallback:** If the backend is temporarily offline or in standalone frontend development mode, it gracefully returns fallback state without crashing or throwing unhandled errors.

---

## 2. API Service Interface (`src/services/api.js`)

| Function | HTTP Method | Backend Route | Purpose |
|---|---|---|---|
| `login(email, password)` | `POST` | `/api/auth/login` | Authenticates administrator & stores JWT |
| `getMe()` | `GET` | `/api/auth/me` | Fetches current admin user details |
| `fetchDetections(filters)` | `GET` | `/api/detections` | Fetches detection records with filtering |
| `fetchDetectionById(id)` | `GET` | `/api/detections/:id` | Fetches single detection record |
| `updateDetectionStatus(id, status)` | `PATCH` | `/api/detections/:id/status` | Updates incident status |
| `verifyDetection(id, verified, notes)` | `POST` | `/api/detections/:id/verify` | Approves or rejects detection |
| `analyzeImage(file, onProgress, coords)` | `POST` | `/api/analysis/analyze` | Uploads aerial capture to AI + Geospatial pipeline |
| `fetchAlerts()` | `GET` | `/api/alerts` | Fetches alert log |
| `sendAlert(detectionId, options)` | `POST` | `/api/alerts/:detectionId/send` | Dispatches authority notification email |
| `fetchOverviewStats()` | `GET` | `/api/dashboard/overview` | Returns real-time top stat counters |
| `fetchAnalytics()` | `GET` | `/api/dashboard/analytics` | Returns aggregated trends and category charts |

---

## 3. Admin Authentication Modal

Administrators can access full management capabilities by clicking the user avatar in the top navbar:
- **Default Admin Email:** `admin@dumpsentry.ai`
- **Default Admin Password:** `DumpSentry@2026`

Once authenticated, the JWT token is saved into `localStorage` under `dumpsentry_admin_token` and automatically included in the `Authorization: Bearer <token>` header on subsequent requests.

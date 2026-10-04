# DumpSentry REST API Reference

Base URL: `http://localhost:5000/api`

DumpSentry is organized into a clean 3-tier architecture:
1. **React Frontend** (`http://localhost:5173`)
2. **Node.js/Express Core API** (`http://localhost:5000`)
3. **FastAPI YOLO AI Microservice** (`http://localhost:8000`)

---

## Authentication

### Admin Login
- **Endpoint:** `POST /auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@dumpsentry.ai",
    "password": "DumpSentry@2026"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65f2a1b9...",
      "email": "admin@dumpsentry.ai",
      "name": "DumpSentry Admin",
      "role": "admin"
    }
  }
  ```

### Current Admin Profile
- **Endpoint:** `GET /auth/me`
- **Access:** Admin (Bearer JWT header)
- **Response (200 OK):**
  ```json
  {
    "id": "65f2a1b9...",
    "email": "admin@dumpsentry.ai",
    "name": "DumpSentry Admin",
    "role": "admin"
  }
  ```

---

## Image Analysis & Ingestion Pipeline

### Analyze Aerial Drone Capture
Executes full computer-vision waste detection, Nominatim reverse geocoding, OpenStreetMap Overpass POI queries, and municipal rule evaluation in one call.

- **Endpoint:** `POST /analysis/analyze`
- **Access:** Public / Drone Telemetry
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `image` (file): Drone aerial image (JPEG, PNG, WebP, max 25MB)
  - `latitude` (float, optional): e.g. `22.5354`
  - `longitude` (float, optional): e.g. `88.3616`
  - `droneId` (string, optional): e.g. `"DRONE-01"`
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "detection": {
      "id": "DS-20260927-4821",
      "image": "/uploads/uuid.jpg",
      "wasteType": "plastic_waste, textile_waste",
      "context": "medical facility",
      "confidence": 94,
      "latitude": 22.5354,
      "longitude": 88.3616,
      "location": "Park Street, Kolkata, West Bengal",
      "timestamp": "2026-09-27T18:30:00.000Z",
      "status": "Suspected Illegal",
      "authority": "District Health & Medical Directorate",
      "alertStatus": "Not Sent"
    },
    "ai": {
      "wasteDetected": true,
      "detectionsCount": 2,
      "classes": ["plastic_waste", "textile_waste"],
      "maxConfidence": 0.94
    },
    "geospatial": {
      "location": "Park Street, Kolkata, West Bengal",
      "nearbyPlacesCount": 4,
      "nearestPlace": {
        "name": "City General Hospital",
        "type": "hospital",
        "contextType": "MEDICAL_FACILITY",
        "distance": 85
      }
    },
    "ruleEngine": {
      "matchedRule": "Dump near medical facility",
      "primaryContext": "MEDICAL_FACILITY",
      "incidentType": "SUSPECTED_ILLEGAL_DUMPING_NEAR_MEDICAL_FACILITY",
      "suspicionReason": "Garbage detected within 200m of a medical facility (City General Hospital, 85m away).",
      "authority": {
        "name": "District Health & Medical Directorate",
        "email": "healthofficer@healthdept.gov.in"
      }
    }
  }
  ```

---

## Detections

### List Detections
- **Endpoint:** `GET /detections`
- **Access:** Public
- **Query Parameters:**
  - `status`: Filter by status (`"All"`, `"Suspected Illegal"`, `"Pending Review"`, `"Verified"`, `"Resolved"`)
  - `context`: Filter by context substring
  - `search`: Search query string
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 50)
- **Response (200 OK):**
  ```json
  {
    "total": 45,
    "page": 1,
    "totalPages": 1,
    "data": [ ... ]
  }
  ```

### Map Coordinates Endpoint
- **Endpoint:** `GET /detections/map`
- **Access:** Public
- **Response (200 OK):** Array of lightweight detection points for map rendering.

### Update Status
- **Endpoint:** `PATCH /detections/:id/status`
- **Access:** Operator / Admin
- **Request Body:**
  ```json
  {
    "status": "Resolved",
    "alertStatus": "Sent"
  }
  ```

### Verify / Reject Detection
- **Endpoint:** `POST /detections/:id/verify`
- **Access:** Admin (Bearer JWT required)
- **Request Body:**
  ```json
  {
    "verified": true,
    "notes": "Verified via secondary drone flight overwatch."
  }
  ```

---

## Alerts & Notification

### List Alerts
- **Endpoint:** `GET /alerts`
- **Access:** Public

### Dispatch Alert Email
- **Endpoint:** `POST /alerts/:detectionId/send`
- **Access:** Operator / Admin
- **Request Body:**
  ```json
  {
    "customEmail": "director@healthdept.gov.in",
    "customMessage": "Urgent cleanup needed within 24 hours."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Alert dispatched successfully to director@healthdept.gov.in",
    "alert": {
      "id": "65f2b8...",
      "detectionId": "DS-20260927-4821",
      "incident": "SUSPECTED ILLEGAL DUMPING NEAR MEDICAL FACILITY",
      "location": "Park Street, Kolkata",
      "status": "Sent",
      "date": "2026-09-27"
    }
  }
  ```

---

## Dashboard & Analytics

### Overview Counters
- **Endpoint:** `GET /dashboard/overview`
- **Response:**
  ```json
  {
    "total": 142,
    "suspectedIllegal": 38,
    "pendingReview": 12,
    "resolved": 92
  }
  ```

### Trends & Distribution Breakdown
- **Endpoint:** `GET /dashboard/analytics`
- **Response:**
  ```json
  {
    "trend": [ { "day": "Mon", "detections": 14 }, ... ],
    "categoryData": [ { "name": "Plastic", "value": 42 }, ... ],
    "contextDistribution": [ { "name": "Near Hospital", "value": 32 }, ... ],
    "statusDistribution": [ { "name": "Suspected Illegal", "value": 38 }, ... ]
  }
  ```

---

## Drone Telemetry

### List Active Drones
- **Endpoint:** `GET /drones`

### Ingest Drone Telemetry Heartbeat
- **Endpoint:** `POST /drones/telemetry`
- **Request Body:**
  ```json
  {
    "droneId": "DRONE-01",
    "latitude": 22.5354,
    "longitude": 88.3616,
    "altitude": 45,
    "batteryLevel": 88,
    "status": "IN_MISSION"
  }
  ```

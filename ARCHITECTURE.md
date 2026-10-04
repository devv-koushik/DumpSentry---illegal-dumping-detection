# DumpSentry System Architecture

DumpSentry is an automated, AI-powered aerial drone surveillance system designed to detect, classify, and report suspected illegal waste dumping in real time.

```
┌───────────────────────────────────────────────────────────────┐
│                      Surveillance Drone                       │
│    Captures: (1) Aerial High-Res Image, (2) GPS Coordinates   │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                      DumpSentry React UI                      │
│              (Vite + React + Tailwind + Recharts)             │
│                 http://localhost:5173                         │
└───────────────────────────────┬───────────────────────────────┘
                                │ HTTP / REST
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    Node.js / Express Core                     │
│                Orchestrator & Business Logic                  │
│                     http://localhost:5000                     │
├───────────────────────────────┼───────────────────────────────┤
│                               │                               │
│  1. Forward image for CV      │  2. Reverse Geocoding & POI   │
│     Inference                 │     Lookup                    │
│                               │                               │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐  │
│  │   FastAPI AI Service    │  │  │  Nominatim & Overpass   │  │
│  │    (YOLOv11 PyTorch)    │  │  │      OpenStreetMap      │  │
│  │  http://localhost:8000  │  │  └─────────────────────────┘  │
│  └─────────────────────────┘  │               │               │
│               │               │               │ Nearby POIs   │
│               ▼ Waste BBoxes  │               ▼               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            Configurable Rule Engine Service             │  │
│  │  - Context Priority Matching (Hospital > School > Road) │  │
│  │  - Distance Thresholds (e.g. within 200m)               │  │
│  │  - Authority Determination (Municipal vs Health vs PWD) │  │
│  └────────────────────────────┬────────────────────────────┘  │
│                               ▼                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           MongoDB Database & Email Dispatch             │  │
│  │  - Collections: Detections, Alerts, Authorities, Rules  │  │
│  │  - Nodemailer Automated Alert Dispatches                │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Principles

### 1. Separation of Responsibilities
* **What the AI does:** Answers **"WHAT GARBAGE IS PRESENT?"**
  - Classifies materials into 13 target classes (Construction, Appliances, E-Waste, Furniture, Metal, Plastic, Wood, Vehicle, Tyre, Paper, Asbestos, Textile, Mixed).
  - Draws exact bounding boxes and confidence scores.
  - Generates annotated visual evidence.
* **What the AI does NOT do:** The AI does **NOT** judge whether dumping is illegal.
* **How illegality is determined:** Illegality is derived deterministically from **geographical context** and **proximity to sensitive infrastructure** (e.g., within 200m of a hospital, school, or protected water catchment).

### 2. Multi-tier Microservices
* **Frontend:** Modern, reactive dashboard (Vite + React) consuming normalized REST endpoints with fallback offline stores.
* **Backend:** Node.js/Express handling telemetry ingestion, multipart uploads, reverse geocoding, rule matching, audit logging, and email dispatches.
* **AI Microservice:** Python FastAPI serving YOLOv11 models over CUDA or CPU, returning structured detection coordinates and base64 visualization.

### 3. OpenStreetMap Geospatial Intelligence
* **Nominatim:** Converts raw drone coordinates `(latitude, longitude)` into clean human-readable postal addresses and neighborhoods.
* **Overpass API:** Queries points of interest (POIs) within a configured radius (typically 500m) around the coordinate. Calculates exact distances to nearby hospitals, schools, clinics, water bodies, and public roads using the Haversine formula.

### 4. Database-Driven Rule Engine
Rules are stored in MongoDB and evaluated in priority order:
1. Medical Facility (Priority 1, 200m radius) $\rightarrow$ District Health Officer
2. Educational Institution (Priority 2, 200m radius) $\rightarrow$ Education Safety Board
3. Water Body / Catchment (Priority 3, 150m radius) $\rightarrow$ State Pollution Control Board
4. Roadside / Highway (Priority 4, 30m radius) $\rightarrow$ Public Works Department (PWD)
5. Public Area / Park (Priority 5, 100m radius) $\rightarrow$ Municipal Corporation Solid Waste Dept
6. Residential Zone (Priority 6, 100m radius) $\rightarrow$ Municipal Corporation Ward Officer

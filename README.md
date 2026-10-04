# DumpSentry — AI-Powered Drone-Based Illegal Dumping Detection System

DumpSentry is a full-stack, enterprise-grade surveillance system for detecting, classifying, and mitigating illegal waste dumping using aerial drones, computer vision, geospatial intelligence, and automated authority routing.

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-blue)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20MongoDB-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/AI%20Microservice-FastAPI%20%7C%20YOLOv11%20%7C%20PyTorch-orange)](https://fastapi.tiangolo.com/)

---

## Architecture Overview

DumpSentry operates as a distributed 3-tier microservice architecture:

```
[ Surveillance Drone ]  ──(Aerial Image + GPS)──▶  [ React Dashboard (Port 5173) ]
                                                            │
                                                            ▼ (REST API)
                                                   [ Node.js Backend (Port 5000) ]
                                                            │
                    ┌───────────────────────────────────────┴───────────────────────────────────────┐
                    ▼                                                                               ▼
     [ FastAPI AI Service (Port 8000) ]                                              [ OpenStreetMap Intelligence ]
       - YOLOv11 Computer Vision                                                       - Nominatim Reverse Geocoding
       - 10 Waste Class Detectors                                                      - Overpass Nearby POI Queries
       - Image Annotation (OpenCV)                                                     - Haversine Distance Engine
                    │                                                                               │
                    └───────────────────────────────────────┬───────────────────────────────────────┘
                                                            ▼
                                              [ Configurable Rule Engine ]
                                                - Context Priority Evaluation
                                                - Violation Reasoning Synthesis
                                                - Dynamic Authority Routing
                                                            │
                                                            ▼
                                              [ MongoDB & Email Dispatch ]
                                                - Automated Authority Alerts
```

### Core Responsibilities
* **AI Computer Vision:** Answers **"WHAT GARBAGE IS PRESENT?"** Detects and classifies 13 waste categories (Construction, Appliances, E-Waste, Furniture, Metal, Plastic, Wood, Vehicle, Tyre, Paper, Asbestos, Textile, Mixed).
* **Geospatial & Rule Engine:** Determines **whether the dumping is illegal** by evaluating proximity to sensitive facilities (hospitals, schools, water bodies, public roads).
* **Authority Dispatcher:** Routes incident evidence and coordinates to the responsible civic body (Municipal Corporation, Health Directorate, Pollution Control Board, PWD).

---

## Directory Structure

```
dumpsentry/
├── backend/                  # Node.js/Express API & MongoDB Orchestrator
│   ├── src/
│   │   ├── config/           # Database, environment, and constants
│   │   ├── controllers/      # Route controllers (Auth, Analysis, Alerts, Detections, etc.)
│   │   ├── middleware/       # JWT auth, Multer upload, error handling
│   │   ├── models/           # Mongoose schemas (Detection, Alert, Authority, Rule, User)
│   │   ├── routes/           # Express API route declarations
│   │   ├── services/         # Geospatial, Rule Engine, Email, AI Client, Seed
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # HTTP server entry point
│   ├── .env.example          # Backend environment variables template
│   └── package.json
│
├── ai-service/               # Python FastAPI YOLO Microservice
│   ├── app/
│   │   ├── main.py           # FastAPI application with /predict and /health
│   │   ├── model.py          # YOLO model loader and OpenCV annotator
│   │   └── schemas.py        # Pydantic schemas
│   ├── dataset/              # Dataset splits (train/val/test) & raw data
│   ├── training/             # YOLOv11 training and validation scripts
│   ├── inference/            # Standalone CLI prediction script
│   ├── scripts/              # Dataset download, COCO-to-YOLO converters
│   ├── data.yaml             # YOLO dataset configuration
│   ├── Dockerfile            # Container definition for AI microservice
│   └── requirements.txt      # Python dependencies
│
├── src/                      # React Frontend (Vite + Tailwind CSS + Recharts)
│   ├── components/           # UI components, cards, tables, maps, modals
│   ├── pages/                # Landing, Dashboard, Detections, Map, Alerts, Analytics
│   └── services/             # api.js and seamless offline fallback services
│
├── API.md                    # Complete REST API Specification
├── ARCHITECTURE.md           # System Architecture & Workflow Deep-Dive
├── DATASET.md                # DroneWaste & TACO Dataset Guide
├── MODEL_TRAINING.md         # YOLOv11 Aerial Waste Training Guide
└── FRONTEND_INTEGRATION.md   # Frontend-to-Backend Connection Guide
```

---

## Quickstart Guide

### 1. Start the React Frontend
```bash
# In the project root:
npm install
npm run dev
# Running at: http://localhost:5173
```

### 2. Start the Backend API
```bash
cd backend
npm install
# Ensure MongoDB is running locally or specify MONGODB_URI in .env
npm run dev
# Running at: http://localhost:5000
# Initial admin: admin@dumpsentry.ai / DumpSentry@2026
```

### 3. Start the AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Running at: http://localhost:8000
# Interactive Swagger docs: http://localhost:8000/docs
```

---

## Model Training & Dataset Preparation

Detailed instructions for training the YOLO model on aerial drone datasets are available in [MODEL_TRAINING.md](MODEL_TRAINING.md) and [DATASET.md](DATASET.md).

```bash
cd ai-service

# Download benchmark annotations
python scripts/download_datasets.py

# Convert annotations to YOLO format
python scripts/convert_annotations.py

# Train YOLOv11 model
python training/train.py --epochs 50 --batch 16 --imgsz 640

# Validate model performance
python training/validate.py --weights models/best.pt
```

---

## Documentation

* [API Reference (API.md)](API.md) — Comprehensive REST API endpoints and payload examples.
* [System Architecture (ARCHITECTURE.md)](ARCHITECTURE.md) — Service flow diagrams, geospatial intelligence, and rule engine.
* [Dataset Documentation (DATASET.md)](DATASET.md) — 10 waste classes, dataset schemas, and remapping rules.
* [Model Training Guide (MODEL_TRAINING.md)](MODEL_TRAINING.md) — YOLOv11 training pipeline and hyperparameters.
* [Frontend Integration Guide (FRONTEND_INTEGRATION.md)](FRONTEND_INTEGRATION.md) — Connecting UI to live endpoints with offline fallback.

---

## License

This project is licensed under the MIT License.

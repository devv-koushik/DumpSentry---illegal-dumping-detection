import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure ai-service root is in sys.path
AI_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(AI_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_ROOT))

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.model import WasteDetector
    from app.schemas import PredictResponse, HealthResponse, DetectionItem, BoundingBox
except ImportError:
    from model import WasteDetector
    from schemas import PredictResponse, HealthResponse, DetectionItem, BoundingBox

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dumpsentry-api")

detector: WasteDetector = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global detector
    model_path = os.getenv("MODEL_PATH", "models/best.pt")
    fallback_model = os.getenv("MODEL_NAME", "yolo11n.pt")
    logger.info(f"Initializing DumpSentry Waste Detector (model={model_path}, fallback={fallback_model})...")
    detector = WasteDetector(model_path=model_path, fallback_model=fallback_model)
    yield
    logger.info("Shutting down AI Service...")

app = FastAPI(
    title="DumpSentry AI Service",
    description="FastAPI Computer Vision microservice powered by YOLO for aerial waste detection",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Info"])
async def root():
    return {
        "service": "DumpSentry AI Microservice",
        "model": detector.loaded_model_name if detector else "uninitialized",
        "device": detector.device if detector else "cpu",
        "docs": "/docs",
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health():
    if detector is None:
        raise HTTPException(status_code=503, detail="Detector not ready")
    return HealthResponse(
        status="healthy",
        model_loaded=detector.model is not None or detector.loaded_model_name == "mock_detector",
        model_name=detector.loaded_model_name,
        device=detector.device,
    )

@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
async def predict(
    file: UploadFile = File(...),
    confidence: float = Query(0.35, ge=0.1, le=1.0, description="Minimum confidence threshold"),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image (JPEG, PNG, WebP)")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received")

    try:
        detections_raw, annotated_b64, elapsed_ms = detector.predict(
            image_bytes=image_bytes,
            conf_threshold=confidence,
        )

        detections = [
            DetectionItem(
                class_name=d["class"],
                confidence=d["confidence"],
                bbox=BoundingBox(
                    x=d["bbox"]["x"],
                    y=d["bbox"]["y"],
                    width=d["bbox"]["width"],
                    height=d["bbox"]["height"],
                ),
            )
            for d in detections_raw
        ]

        return PredictResponse(
            waste_detected=len(detections) > 0,
            detections=detections,
            annotated_image_base64=annotated_b64,
            inference_time_ms=elapsed_ms,
        )
    except Exception as e:
        logger.error(f"Prediction failure: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

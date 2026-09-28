from typing import List, Optional
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x: int = Field(..., description="Top-left X coordinate in pixels")
    y: int = Field(..., description="Top-left Y coordinate in pixels")
    width: int = Field(..., description="Box width in pixels")
    height: int = Field(..., description="Box height in pixels")

class DetectionItem(BaseModel):
    class_name: str = Field(..., alias="class", description="Identified waste class name")
    confidence: float = Field(..., description="Prediction confidence score between 0.0 and 1.0")
    bbox: BoundingBox = Field(..., description="Bounding box coordinates")

    class Config:
        populate_by_name = True

class PredictResponse(BaseModel):
    waste_detected: bool = Field(..., description="True if at least one waste item was detected")
    detections: List[DetectionItem] = Field(default_factory=list, description="List of detected items")
    annotated_image_base64: Optional[str] = Field(None, description="Base64-encoded annotated image with boxes and labels")
    inference_time_ms: float = Field(..., description="Time taken to process in milliseconds")

    class Config:
        populate_by_name = True

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    device: str
    version: str = "1.0.0"

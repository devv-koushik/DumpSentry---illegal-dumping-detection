import io
import time
import base64
import logging
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
import numpy as np
from PIL import Image

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import torch
except ImportError:
    torch = None

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

logger = logging.getLogger("dumpsentry-ai")

AI_SERVICE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_PATH = AI_SERVICE_ROOT / "models" / "best.pt"

# Distinct bounding box colors (BGR format for OpenCV) for the 13 YOLO waste classes
CLASS_COLORS = {
    "construction_waste": (128, 128, 0),    # Olive
    "appliances": (200, 130, 50),           # Steel blue
    "electronic_waste": (0, 165, 255),      # Orange
    "furniture": (180, 105, 255),           # Violet
    "metal_waste": (169, 169, 169),         # Gray
    "plastic_waste": (255, 105, 65),        # Blue
    "wood_waste": (42, 42, 165),            # Brown
    "vehicle_waste": (205, 90, 106),        # Purple
    "tyre_waste": (50, 50, 50),             # Dark Gray
    "paper_waste": (71, 148, 205),          # Cardboard
    "asbestos": (0, 0, 220),                # Red
    "textile_waste": (147, 20, 255),        # Magenta
    "mixed_waste": (0, 0, 139),             # Dark Red
}


class WasteDetector:
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.device = "cuda" if (torch and torch.cuda.is_available()) else "cpu"
        self.class_names: Dict[int, str] = {}
        self.model_path = self._resolve_model_path(model_path)
        self.loaded_model_name = str(self.model_path)
        self._load_model()

    def _resolve_model_path(self, model_path: Optional[str]) -> Path:
        if model_path:
            p = Path(model_path)
            if p.is_file():
                return p.resolve()
            p_rel = (AI_SERVICE_ROOT / model_path).resolve()
            if p_rel.is_file():
                return p_rel
            raise FileNotFoundError(
                f"Specified model path not found: {model_path}. Expected path: {p_rel}"
            )

        if DEFAULT_MODEL_PATH.is_file():
            return DEFAULT_MODEL_PATH.resolve()

        raise FileNotFoundError(
            f"Trained YOLO model not found at {DEFAULT_MODEL_PATH}. "
            "Please ensure ai-service/models/best.pt exists."
        )

    def _load_model(self):
        if YOLO is None:
            raise RuntimeError(
                "The 'ultralytics' library is not installed in the environment."
            )

        logger.info(f"Loading trained YOLO model from {self.model_path}...")
        try:
            self.model = YOLO(str(self.model_path))
            self.class_names = dict(self.model.names)
            logger.info(
                f"Successfully loaded YOLO model with {len(self.class_names)} classes: {self.class_names}"
            )
        except Exception as e:
            self.model = None
            raise RuntimeError(
                f"Failed to load YOLO model from {self.model_path}: {e}"
            ) from e

    def predict(
        self, image_bytes: bytes, conf_threshold: float = 0.25
    ) -> Tuple[List[Dict[str, Any]], Optional[str], float]:
        """
        Runs real YOLO inference on input image bytes using the trained weights.
        Never fabricates detections. Raises an exception if inference fails.
        """
        if self.model is None:
            raise RuntimeError("YOLO model is not initialized. Cannot run inference.")

        start_time = time.time()

        # Decode image to BGR numpy array (standard OpenCV format expected by Ultralytics YOLO)
        img_bgr = None
        if cv2 is not None:
            np_buf = np.frombuffer(image_bytes, np.uint8)
            img_bgr = cv2.imdecode(np_buf, cv2.IMREAD_COLOR)

        if img_bgr is None:
            try:
                pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                img_rgb = np.array(pil_image)
                img_bgr = img_rgb[:, :, ::-1].copy()  # RGB to BGR
            except Exception as e:
                raise ValueError(f"Failed to decode image: {e}") from e

        # Run inference
        try:
            results = self.model.predict(
                source=img_bgr,
                conf=conf_threshold,
                device=self.device,
                verbose=False,
            )
        except Exception as e:
            logger.error(f"Inference error with model {self.model_path}: {e}")
            raise RuntimeError(f"YOLO inference failed: {e}") from e

        detections: List[Dict[str, Any]] = []

        if len(results) > 0:
            r = results[0]
            boxes = r.boxes
            names_dict = r.names if hasattr(r, "names") and r.names else self.class_names

            for box in boxes:
                cls_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())

                # Use actual class name from the model
                class_name = names_dict.get(cls_id, f"class_{cls_id}")

                # Bounding box xyxy to xywh
                xyxy = box.xyxy[0].tolist()
                x1, y1, x2, y2 = map(int, xyxy)
                w = max(1, x2 - x1)
                h = max(1, y2 - y1)

                detections.append({
                    "class": class_name,
                    "confidence": round(confidence, 2),
                    "bbox": {"x": x1, "y": y1, "width": w, "height": h},
                })

        # Draw annotations on image
        annotated_b64 = self._annotate_image(img_bgr, detections)
        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        return detections, annotated_b64, inference_time_ms

    def _annotate_image(
        self, img_bgr: np.ndarray, detections: List[Dict[str, Any]]
    ) -> Optional[str]:
        if cv2 is not None:
            canvas = img_bgr.copy()
            for det in detections:
                bbox = det["bbox"]
                cls_name = det["class"]
                conf = det["confidence"]

                x, y, w, h = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
                color = CLASS_COLORS.get(cls_name, (0, 255, 0))

                # Draw rectangle
                cv2.rectangle(canvas, (x, y), (x + w, y + h), color, 3)

                # Draw label banner
                display_name = cls_name.replace("_", " ").upper()
                label = f"{display_name} {int(conf * 100)}%"
                font = cv2.FONT_HERSHEY_SIMPLEX
                scale = 0.6
                thickness = 2
                (lbl_w, lbl_h), _ = cv2.getTextSize(label, font, scale, thickness)

                cv2.rectangle(
                    canvas,
                    (x, max(0, y - lbl_h - 10)),
                    (x + lbl_w + 10, max(0, y)),
                    color,
                    -1,
                )
                cv2.putText(
                    canvas,
                    label,
                    (x + 5, max(15, y - 5)),
                    font,
                    scale,
                    (255, 255, 255),
                    thickness,
                    cv2.LINE_AA,
                )

            # Encode to JPEG
            success, encoded_img = cv2.imencode(".jpg", canvas)
            if success:
                return base64.b64encode(encoded_img.tobytes()).decode("utf-8")

        # Fallback using PIL
        img_rgb = img_bgr[:, :, ::-1]
        pil_img = Image.fromarray(img_rgb)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="JPEG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

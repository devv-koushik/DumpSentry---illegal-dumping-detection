"""
DumpSentry YOLO Model Validation Script
--------------------------------------
Evaluates trained model weights against the validation split.
Computes mAP@0.5, mAP@0.5:0.95, Precision, Recall, and confusion matrix.
"""

import argparse
from pathlib import Path
try:
    from ultralytics import YOLO
except ImportError as e:
    raise SystemExit(
        "ultralytics is not installed. Install it with:\n"
        "  pip install ultralytics\n"
        f"Original error: {e}"
    )

AI_SERVICE_ROOT = Path(__file__).resolve().parent.parent
DATA_YAML = AI_SERVICE_ROOT / "data.yaml"
DEFAULT_WEIGHTS = AI_SERVICE_ROOT / "models" / "best.pt"

def parse_args():
    parser = argparse.ArgumentParser(description="Validate DumpSentry YOLO Model")
    parser.add_argument("--weights", type=str, default=str(DEFAULT_WEIGHTS), help="Path to weights file")
    parser.add_argument("--split", type=str, default="val", help="Dataset split: 'val' or 'test'")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    return parser.parse_args()

def validate():
    args = parse_args()
    weights_path = Path(args.weights)
    if not weights_path.exists():
        print(f"Weights file not found at {weights_path}. Using fallback yolo11n.pt.")
        weights_path = "yolo11n.pt"

    print("=======================================================")
    print(" DumpSentry Model Validation")
    print("=======================================================")
    print(f" Weights:     {weights_path}")
    print(f" Data Config: {DATA_YAML}")
    print(f" Split:       {args.split}")
    print("=======================================================")

    model = YOLO(str(weights_path))
    metrics = model.val(
        data=str(DATA_YAML),
        split=args.split,
        imgsz=args.imgsz,
        plots=True,
    )

    print("\nValidation Results Summary:")
    print(f" - mAP@0.5:      {metrics.box.map50:.4f}")
    print(f" - mAP@0.5:0.95: {metrics.box.map:.4f}")
    print(f" - Precision:    {metrics.box.mp:.4f}")
    print(f" - Recall:       {metrics.box.mr:.4f}")
    print("=======================================================")

if __name__ == "__main__":
    validate()

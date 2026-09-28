"""
DumpSentry Standalone CLI Inference
-----------------------------------
Runs waste detection on a single image or directory of images.
Outputs detected bounding boxes and saves annotated visualization.
"""

import sys
import argparse
from pathlib import Path
from ultralytics import YOLO

AI_SERVICE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_WEIGHTS = AI_SERVICE_ROOT / "models" / "best.pt"

def parse_args():
    parser = argparse.ArgumentParser(description="DumpSentry Standalone Image Predictor")
    parser.add_argument("--source", type=str, required=True, help="Path to image or directory of images")
    parser.add_argument("--weights", type=str, default=str(DEFAULT_WEIGHTS), help="Path to YOLO weights (.pt)")
    parser.add_argument("--conf", type=float, default=0.35, help="Confidence threshold")
    parser.add_argument("--output", type=str, default="runs/predict", help="Output directory")
    return parser.parse_args()

def run_predict():
    args = parse_args()
    weights = str(args.weights) if Path(args.weights).exists() else "yolo11n.pt"

    print(f"Loading model weights from {weights}...")
    model = YOLO(weights)

    print(f"Running inference on: {args.source}")
    results = model.predict(
        source=args.source,
        conf=args.conf,
        save=True,
        project=args.output,
        name="cli_result",
        exist_ok=True,
    )

    for i, r in enumerate(results):
        print(f"\nImage {i + 1}: {r.path}")
        print(f"Found {len(r.boxes)} waste instances:")
        for box in r.boxes:
            cls_name = r.names[int(box.cls[0])]
            conf = float(box.conf[0])
            xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
            print(f" - [{cls_name.upper()}] Conf: {conf:.2f} | BBox: {xyxy}")

    print(f"\nAnnotated visual result saved to: {args.output}/cli_result")

if __name__ == "__main__":
    run_predict()

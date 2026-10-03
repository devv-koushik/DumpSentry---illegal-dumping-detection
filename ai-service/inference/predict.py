"""
DumpSentry Standalone CLI Inference
-----------------------------------
Runs waste detection on a single image or directory of images using the trained YOLO model (best.pt).
Outputs detected bounding boxes and saves annotated visualization.
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
DEFAULT_WEIGHTS = AI_SERVICE_ROOT / "models" / "best.pt"


def parse_args():
    parser = argparse.ArgumentParser(description="DumpSentry Standalone Image Predictor")
    parser.add_argument(
        "--source",
        type=str,
        required=True,
        help="Path to image or directory of images",
    )
    parser.add_argument(
        "--weights",
        type=str,
        default=str(DEFAULT_WEIGHTS),
        help="Path to YOLO weights (.pt)",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.25,
        help="Confidence threshold (default: 0.25)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="runs/predict",
        help="Output directory",
    )
    return parser.parse_args()


def run_predict():
    args = parse_args()
    weights_path = Path(args.weights)

    if not weights_path.exists():
        raise SystemExit(
            f"\nERROR: Model weights not found at: {weights_path}\n"
            "Please ensure the trained YOLO model best.pt is present."
        )

    print(f"Loading model weights from {weights_path}...")
    model = YOLO(str(weights_path))

    print(f"Model classes ({len(model.names)}): {model.names}")
    print(f"Running inference on: {args.source} (conf={args.conf})")

    results = model.predict(
        source=args.source,
        conf=args.conf,
        save=True,
        project=args.output,
        name="cli_result",
        exist_ok=True,
    )

    total_detections_all = 0
    for i, r in enumerate(results):
        count = len(r.boxes)
        total_detections_all += count
        print(f"\nImage {i + 1}: {r.path}")
        print(f"Total detections: {count}")
        for box in r.boxes:
            cls_id = int(box.cls[0])
            cls_name = r.names.get(cls_id, f"class_{cls_id}")
            conf = float(box.conf[0])
            xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
            print(f" - [{cls_name}] Conf: {conf:.2f} | BBox: {xyxy}")

    print(f"\nCompleted! Total waste items found across images: {total_detections_all}")
    print(f"Annotated visual result saved to: {args.output}/cli_result")


if __name__ == "__main__":
    run_predict()

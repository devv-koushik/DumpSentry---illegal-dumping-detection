"""
DumpSentry YOLOv11 Drone Waste Model Training Script
---------------------------------------------------
Trains YOLOv11 nano/small on aerial drone waste imagery.
Saves best weights to `models/best.pt` for deployment into the FastAPI service.
"""

import os
import sys
import shutil
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
MODELS_DIR = AI_SERVICE_ROOT / "models"

def parse_args():
    parser = argparse.ArgumentParser(description="Train DumpSentry YOLO Waste Detection Model")
    parser.add_argument("--model", type=str, default="yolo11n.pt", help="Base model (yolo11n.pt, yolo11s.pt, etc.)")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size")
    parser.add_argument("--device", type=str, default="", help="Device: '0', 'cpu', etc.")
    parser.add_argument("--project", type=str, default=str(AI_SERVICE_ROOT / "runs" / "train"), help="Runs directory")
    parser.add_argument("--name", type=str, default="dumpsentry_yolo", help="Run experiment name")
    return parser.parse_args()

def train():
    args = parse_args()
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print("=======================================================")
    print(" DumpSentry Drone Waste Detection Training Pipeline")
    print("=======================================================")
    print(f" Base Model:      {args.model}")
    print(f" Data Config:     {DATA_YAML}")
    print(f" Epochs:          {args.epochs}")
    print(f" Batch Size:      {args.batch}")
    print(f" Image Size:      {args.imgsz}")
    print("=======================================================")

    # Initialize model
    model = YOLO(args.model)

    # Train
    results = model.train(
        data=str(DATA_YAML),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device if args.device else None,
        project=args.project,
        name=args.name,
        save=True,
        plots=True,
        # Drone imagery augmentations
        degrees=15.0,
        flipud=0.5,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.1,
    )

    # Copy best weights to models/best.pt
    best_weights_path = Path(results.save_dir) / "weights" / "best.pt"
    if best_weights_path.exists():
        target_path = MODELS_DIR / "best.pt"
        shutil.copy2(best_weights_path, target_path)
        print("\n=======================================================")
        print(" Training Complete!")
        print(f" Best model saved to: {target_path}")
        print("=======================================================")
    else:
        print("\nTraining completed, but best.pt could not be located automatically.")

if __name__ == "__main__":
    train()

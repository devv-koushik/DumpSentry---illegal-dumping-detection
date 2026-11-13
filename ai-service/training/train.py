"""
DumpSentry YOLOv11 Aerial Waste Detection Training Script
-------------------------------------------------------
Trains a YOLO11 model with hyperparameter recommendations:
- AdamW optimizer with Cosine Annealing LR scheduler
- Staged/conservative augmentations for rare-class protection
- Automatic GPU/CPU detection
- Best checkpoint export to models/best.pt
"""

import argparse
import shutil
import sys
from pathlib import Path

try:
    import torch
except ImportError as e:
    raise SystemExit(
        "PyTorch is not installed.\n"
        "Install it with the appropriate PyTorch command for your system.\n"
        f"Original error: {e}"
    )

try:
    from ultralytics import YOLO
except ImportError as e:
    raise SystemExit(
        "Ultralytics is not installed.\n"
        "Install it with:\n"
        "    pip install ultralytics\n"
        f"Original error: {e}"
    )


# ============================================================
# PATHS
# ============================================================

AI_SERVICE_ROOT = Path(__file__).resolve().parent.parent

# Prefer root data.yaml, fallback to dronewaste_yolo/data.yaml
CANDIDATE_DATA_YAMLS = [
    AI_SERVICE_ROOT / "data.yaml",
    AI_SERVICE_ROOT / "dataset" / "processed" / "dronewaste_yolo" / "data.yaml",
]
DATA_YAML = next((p for p in CANDIDATE_DATA_YAMLS if p.exists()), AI_SERVICE_ROOT / "data.yaml")

MODELS_DIR = AI_SERVICE_ROOT / "models"
RUNS_DIR = AI_SERVICE_ROOT / "runs" / "detect"


# ============================================================
# CLI ARGUMENTS
# ============================================================

def parse_args():
    parser = argparse.ArgumentParser(
        description="Train DumpSentry YOLO Waste Detection Model"
    )

    # Core Training Parameters
    parser.add_argument(
        "--model",
        type=str,
        default="yolo11n.pt",
        help="Base YOLO model weights (default: yolo11n.pt)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=50,
        help="Number of training epochs (default: 50)",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=4,
        help="Batch size (default: 4, safe for CPU and low VRAM)",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Input image resolution (default: 640)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="",
        help="Training device: 0, 1, cpu (auto-detected if empty)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=2,
        help="Number of dataloader workers (default: 2)",
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=15,
        help="Early stopping patience (default: 15)",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="dumpsentry_yolo11n_v2",
        help="Experiment run name (default: dumpsentry_yolo11n_v2)",
    )

    # Optimizer & Learning Rate
    parser.add_argument(
        "--optimizer",
        type=str,
        default="AdamW",
        help="Optimizer: AdamW, SGD, Adam (default: AdamW)",
    )
    parser.add_argument(
        "--lr0",
        type=float,
        default=0.001,
        help="Initial learning rate (default: 0.001)",
    )
    parser.add_argument(
        "--lrf",
        type=float,
        default=0.01,
        help="Final learning rate factor (default: 0.01)",
    )

    # Augmentation Controls (Conservative defaults to avoid washing out rare classes)
    parser.add_argument(
        "--degrees",
        type=float,
        default=5.0,
        help="Image rotation (+/- deg, default: 5.0)",
    )
    parser.add_argument(
        "--translate",
        type=float,
        default=0.1,
        help="Image translation (+/- fraction, default: 0.1)",
    )
    parser.add_argument(
        "--scale",
        type=float,
        default=0.5,
        help="Image scale gain (+/- fraction, default: 0.5)",
    )
    parser.add_argument(
        "--fliplr",
        type=float,
        default=0.5,
        help="Horizontal flip probability (default: 0.5)",
    )
    parser.add_argument(
        "--mosaic",
        type=float,
        default=0.5,
        help="Mosaic probability (default: 0.5, conservative for small objects)",
    )
    parser.add_argument(
        "--mixup",
        type=float,
        default=0.0,
        help="Mixup probability (default: 0.0, recommended off initially)",
    )

    return parser.parse_args()


# ============================================================
# DEVICE DETECTION
# ============================================================

def get_device(requested_device: str) -> str:
    if requested_device:
        return requested_device

    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        print(f"CUDA detected: {gpu_name}")
        return "0"

    print("CUDA not available. Training will use CPU.")
    return "cpu"


# ============================================================
# MAIN TRAINING ROUTINE
# ============================================================

def train():
    args = parse_args()

    # Ensure directories exist
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

    # Validate dataset existence
    if not DATA_YAML.exists():
        raise SystemExit(
            f"\nERROR: data.yaml was not found at {DATA_YAML}.\n"
            "Please verify the dataset before training."
        )

    device = get_device(args.device)

    print()
    print("=" * 60)
    print(" DumpSentry YOLOv11 Training Configuration")
    print("=" * 60)
    print(f" Base Model:        {args.model}")
    print(f" Data Config:       {DATA_YAML}")
    print(f" Experiment Name:   {args.name}")
    print(f" Epochs:            {args.epochs}")
    print(f" Batch Size:        {args.batch}")
    print(f" Image Size:        {args.imgsz}")
    print(f" Device:            {device}")
    print(f" Workers:           {args.workers}")
    print(f" Optimizer:         {args.optimizer} (lr0={args.lr0}, lrf={args.lrf}, cos_lr=True)")
    print(f" Early Stopping:    Patience = {args.patience}")
    print(f" Augmentations:")
    print(f"   - degrees:       {args.degrees}")
    print(f"   - translate:     {args.translate}")
    print(f"   - scale:         {args.scale}")
    print(f"   - fliplr:        {args.fliplr}")
    print(f"   - mosaic:        {args.mosaic}")
    print(f"   - mixup:         {args.mixup} {'(disabled - recommended)' if args.mixup == 0.0 else ''}")
    print(f" Output Project:    {RUNS_DIR}")
    print("=" * 60)
    print()

    # Initialize model
    print(f"Loading pretrained weights: {args.model}")
    model = YOLO(args.model)

    # Train model
    results = model.train(
        # Dataset
        data=str(DATA_YAML),

        # Core Training Hyperparameters
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        pretrained=True,

        # Hardware & Optimization
        device=device,
        workers=args.workers,
        optimizer=args.optimizer,
        lr0=args.lr0,
        lrf=args.lrf,
        cos_lr=True,
        patience=args.patience,

        # Conservative Augmentations
        degrees=args.degrees,
        translate=args.translate,
        scale=args.scale,
        fliplr=args.fliplr,
        mosaic=args.mosaic,
        mixup=args.mixup,

        # Output & Checkpoints
        project=str(RUNS_DIR),
        name=args.name,
        save=True,
        plots=True,
        verbose=True,
    )

    # Automatically copy the best model to models/best.pt
    save_dir = Path(results.save_dir)
    best_weights = save_dir / "weights" / "best.pt"

    print()
    print("=" * 60)
    print("TRAINING COMPLETED")
    print("=" * 60)
    print(f"Run Directory: {save_dir}")

    if best_weights.exists():
        target_path = MODELS_DIR / "best.pt"
        shutil.copy2(best_weights, target_path)
        print(f"✅ Successfully exported best weights to: {target_path}")
        print("This checkpoint will now be used by validate.py and the FastAPI backend.")
    else:
        print(f"⚠️ Warning: best.pt not found at expected location: {best_weights}")

    print("=" * 60)


if __name__ == "__main__":
    train()   

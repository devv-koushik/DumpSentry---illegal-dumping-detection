import argparse
import shutil
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

# ai-service/
AI_SERVICE_ROOT = Path(__file__).resolve().parent.parent

# dataset/processed/dronewaste_yolo/data.yaml
DATA_YAML = (
    AI_SERVICE_ROOT
    / "dataset"
    / "processed"
    / "dronewaste_yolo"
    / "data.yaml"
)

# ai-service/models/
MODELS_DIR = AI_SERVICE_ROOT / "models"

# ai-service/runs/train/
RUNS_DIR = AI_SERVICE_ROOT / "runs" / "train"


# ============================================================
# ARGUMENTS
# ============================================================

def parse_args():

    parser = argparse.ArgumentParser(
        description="Train DumpSentry YOLO Waste Detection Model"
    )

    parser.add_argument(
        "--model",
        type=str,
        default="yolo11n.pt",
        help="Base YOLO model"
    )

    parser.add_argument(
        "--epochs",
        type=int,
        default=50,
        help="Number of training epochs"
    )

    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size"
    )

    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Input image size"
    )

    parser.add_argument(
        "--device",
        type=str,
        default="",
        help="Training device: 0, 1, cpu, etc."
    )

    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of dataloader workers"
    )

    parser.add_argument(
        "--patience",
        type=int,
        default=15,
        help="Early stopping patience"
    )

    parser.add_argument(
        "--name",
        type=str,
        default="dumpsentry_yolo",
        help="Experiment name"
    )

    return parser.parse_args()


# ============================================================
# DEVICE
# ============================================================

def get_device(requested_device):

    if requested_device:
        return requested_device

    if torch.cuda.is_available():

        gpu_name = torch.cuda.get_device_name(0)

        print()
        print("CUDA detected.")
        print(f"GPU: {gpu_name}")

        return "0"

    print()
    print("CUDA not available.")
    print("Training will use CPU.")

    return "cpu"


# ============================================================
# MAIN TRAINING
# ============================================================

def train():

    args = parse_args()

    # --------------------------------------------------------
    # Directories
    # --------------------------------------------------------

    MODELS_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    RUNS_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    # --------------------------------------------------------
    # Validate dataset
    # --------------------------------------------------------

    if not DATA_YAML.exists():

        raise SystemExit(
            "\nERROR: data.yaml was not found.\n\n"
            f"Expected location:\n"
            f"{DATA_YAML}\n\n"
            "Check your dataset preparation before training."
        )

    # --------------------------------------------------------
    # Device
    # --------------------------------------------------------

    device = get_device(
        args.device
    )

    # --------------------------------------------------------
    # Print configuration
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print(" DumpSentry Drone Waste Detection Training")
    print("=" * 60)

    print(
        f"Base Model:       {args.model}"
    )

    print(
        f"Data Config:      {DATA_YAML}"
    )

    print(
        f"Epochs:           {args.epochs}"
    )

    print(
        f"Batch Size:       {args.batch}"
    )

    print(
        f"Image Size:       {args.imgsz}"
    )

    print(
        f"Device:           {device}"
    )

    print(
        f"Workers:          {args.workers}"
    )

    print(
        f"Patience:         {args.patience}"
    )

    print(
        f"Run Directory:    {RUNS_DIR}"
    )

    print("=" * 60)
    print()

    # --------------------------------------------------------
    # Load YOLO model
    # --------------------------------------------------------

    print(
        f"Loading model: {args.model}"
    )

    try:

        model = YOLO(
            args.model
        )

    except Exception as e:

        raise SystemExit(
            "\nERROR: Could not load YOLO model.\n"
            f"Model: {args.model}\n"
            f"Error: {e}"
        )

    # --------------------------------------------------------
    # Train
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("STARTING TRAINING")
    print("=" * 60)
    print()

    results = model.train(

        # Dataset
        data=str(DATA_YAML),

        # Training
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,

        # Hardware
        device=device,
        workers=args.workers,

        # Output
        project=str(RUNS_DIR),
        name=args.name,

        # Checkpoints / plots
        save=True,
        plots=True,

        # Early stopping
        patience=args.patience,

        # ----------------------------------------------------
        # Drone-oriented augmentation
        # ----------------------------------------------------

        degrees=15.0,

        translate=0.1,

        scale=0.5,

        fliplr=0.5,

        flipud=0.5,

        mosaic=1.0,

        # Disabled initially because the dataset is small
        # and highly imbalanced.
        mixup=0.0,
    )

    # --------------------------------------------------------
    # Locate best.pt
    # --------------------------------------------------------

    save_dir = Path(
        results.save_dir
    )

    best_weights_path = (
        save_dir
        / "weights"
        / "best.pt"
    )

    print()
    print("=" * 60)
    print("TRAINING FINISHED")
    print("=" * 60)

    print(
        f"Run directory:\n{save_dir}"
    )

    print(
        f"\nSearching for:\n{best_weights_path}"
    )

    # --------------------------------------------------------
    # Copy best model
    # --------------------------------------------------------

    if best_weights_path.exists():

        target_path = (
            MODELS_DIR
            / "best.pt"
        )

        shutil.copy2(
            best_weights_path,
            target_path
        )

        print()
        print("=" * 60)
        print("SUCCESS")
        print("=" * 60)

        print(
            f"Best model copied to:\n"
            f"{target_path}"
        )

        print()
        print(
            "This is the model that should later be "
            "used by the FastAPI detection service."
        )

    else:

        print()
        print("=" * 60)
        print("WARNING")
        print("=" * 60)

        print(
            "Training completed, but best.pt "
            "could not be found automatically."
        )

        print(
            f"Check:\n{save_dir}"
        )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    train()
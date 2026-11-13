from pathlib import Path
from ultralytics import YOLO

MODEL = Path("models/best.pt")
DATA = "data.yaml"

if not MODEL.exists():
    MODEL = Path("ai-service/models/best.pt")
if not Path(DATA).exists():
    DATA = "ai-service/data.yaml"

if not MODEL.exists():
    raise FileNotFoundError(
        f"Trained model not found: {MODEL}\n"
        "Train a model before validation."
    )

model = YOLO(str(MODEL))

metrics = model.val(
    data=DATA,
    split="val",
    imgsz=640,
    batch=4,
    device="cpu",
    plots=True,
)

print("\n========== RESULTS ==========")
print(f"Precision: {metrics.box.mp:.4f}")
print(f"Recall:    {metrics.box.mr:.4f}")
print(f"mAP50:     {metrics.box.map50:.4f}")
print(f"mAP50-95:  {metrics.box.map:.4f}")


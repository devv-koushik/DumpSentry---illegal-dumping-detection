# DumpSentry Computer Vision Model Training Guide

This guide walks through training, fine-tuning, and evaluating the DumpSentry aerial waste detection model using **YOLOv11** (`ultralytics`).

---

## 1. Prerequisites

Ensure your Python environment has the required dependencies installed:

```bash
cd ai-service
pip install -r requirements.txt
```

Recommended Hardware:
- **NVIDIA GPU** with $\ge$ 8GB VRAM (CUDA 11.8 or 12.x) for fast training.
- CPU training is also supported for testing or smaller datasets.

---

## 2. Dataset Configuration (`data.yaml`)

The training script reads `data.yaml`:

```yaml
path: ./dataset
train: train/images
val: val/images
test: test/images

nc: 13
names:
  0: construction_waste
  1: appliances
  2: electronic_waste
  3: furniture
  4: metal_waste
  5: plastic_waste
  6: wood_waste
  7: vehicle_waste
  8: tyre_waste
  9: paper_waste
  10: asbestos
  11: textile_waste
  12: mixed_waste
```

---

## 3. Training the Model

Run the training script:

```bash
python training/train.py --model yolo11n.pt --epochs 50 --batch 16 --imgsz 640
```

### Key Training Options:
- `--model`: Base architecture (`yolo11n.pt` for speed/edge drone deployment, `yolo11s.pt` or `yolo11m.pt` for higher accuracy).
- `--epochs`: Total iterations over the training set (default: 50).
- `--batch`: Batch size (adjust based on GPU VRAM; e.g. 16 for 8GB GPU, 8 for 4GB GPU).
- `--imgsz`: Input image resolution (640 is standard; 1024 or 1280 is recommended for high-altitude small-object drone aerials).
- `--device`: Target device (`0` for first GPU, `cpu` for CPU-only).

### Drone-Specific Data Augmentations
The training script includes aerial-optimized augmentations:
- **Rotation:** $\pm 15^\circ$ (aerial drone captures are orientation-agnostic)
- **Flip Up/Down & Left/Right:** 50% probability
- **Mosaic Augmentation:** 1.0 (combines 4 images into one, enhancing small-object waste detection)
- **Mixup:** 0.1

Upon completion, the best checkpoint is automatically saved to:
`ai-service/models/best.pt`

---

## 4. Validating Model Performance

Evaluate your model on the validation or test split:

```bash
python training/validate.py --weights models/best.pt --split val
```

This calculates:
* **mAP@0.5:** Mean Average Precision at IoU threshold 0.5
* **mAP@0.5:0.95:** Standard COCO metric across IoU thresholds from 0.5 to 0.95
* **Per-class Precision and Recall**
* **Confusion Matrix** (saved to `runs/val/`)

---

## 5. Standalone CLI Prediction

Test inference on any new aerial image:

```bash
python inference/predict.py --source /path/to/drone_image.jpg --conf 0.35
```

Results with visual bounding boxes are saved to `runs/predict/cli_result/`.

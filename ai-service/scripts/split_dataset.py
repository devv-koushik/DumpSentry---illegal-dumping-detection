"""
DumpSentry Dataset Splitter
---------------------------
Splits processed images and YOLO label txt files into:
- train (70%)
- val   (20%)
- test  (10%)
"""

import os
import shutil
import random
from pathlib import Path

DATASET_ROOT = Path(__file__).resolve().parent.parent / "dataset"
PROCESSED_IMAGES = DATASET_ROOT / "processed" / "images"
PROCESSED_LABELS = DATASET_ROOT / "processed" / "labels"

TRAIN_DIR = DATASET_ROOT / "train"
VAL_DIR = DATASET_ROOT / "val"
TEST_DIR = DATASET_ROOT / "test"

def split_data(train_ratio=0.70, val_ratio=0.20, test_ratio=0.10, seed=42):
    random.seed(seed)

    # Gather matching image and label pairs
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    image_files = [f for f in PROCESSED_IMAGES.glob("*") if f.suffix.lower() in image_extensions]

    if not image_files:
        print(f"No images found in {PROCESSED_IMAGES}. Please place drone or benchmark images there first.")
        return

    pairs = []
    for img in image_files:
        label = PROCESSED_LABELS / f"{img.stem}.txt"
        if label.exists():
            pairs.append((img, label))

    print(f"Found {len(pairs)} matched image-label pairs for splitting.")
    random.shuffle(pairs)

    n_total = len(pairs)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    splits = {
        "train": pairs[:n_train],
        "val": pairs[n_train:n_train + n_val],
        "test": pairs[n_train + n_val:],
    }

    # Setup directories
    for split_name, items in splits.items():
        img_dest = DATASET_ROOT / split_name / "images"
        lbl_dest = DATASET_ROOT / split_name / "labels"
        img_dest.mkdir(parents=True, exist_ok=True)
        lbl_dest.mkdir(parents=True, exist_ok=True)

        for img_path, lbl_path in items:
            shutil.copy2(img_path, img_dest / img_path.name)
            shutil.copy2(lbl_path, lbl_dest / lbl_path.name)

        print(f"Split '{split_name}': {len(items)} images -> {img_dest}")

    print("\nDataset successfully organized into YOLO train/val/test splits.")
    print("Ready to run: `python training/train.py`")

if __name__ == "__main__":
    split_data()

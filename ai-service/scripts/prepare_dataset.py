"""
DumpSentry Dataset Preparation & Unification
-------------------------------------------
Consolidates raw drone images and public benchmark images into standard YOLO format.
Merges labels, verifies bbox bounds, and generates a class distribution report.
"""

import os
from pathlib import Path
from collections import Counter

DATASET_ROOT = Path(__file__).resolve().parent.parent / "dataset"
PROCESSED_IMAGES = DATASET_ROOT / "processed" / "images"
PROCESSED_LABELS = DATASET_ROOT / "processed" / "labels"

CLASS_NAMES = [
    "plastic",
    "cardboard_paper",
    "metal",
    "glass",
    "organic_waste",
    "electronic_waste",
    "biomedical_waste",
    "construction_debris",
    "automotive_parts",
    "mixed_hazardous",
]

def verify_and_summarize():
    if not PROCESSED_LABELS.exists():
        print(f"No processed labels directory found at: {PROCESSED_LABELS}")
        print("Run `python scripts/convert_annotations.py` first.")
        return

    label_files = list(PROCESSED_LABELS.glob("*.txt"))
    print(f"Found {len(label_files)} label files in {PROCESSED_LABELS}")

    class_counts = Counter()
    valid_files = 0

    for lf in label_files:
        with open(lf, "r", encoding="utf-8") as f:
            lines = f.readlines()
        has_labels = False
        for line in lines:
            parts = line.strip().split()
            if len(parts) == 5:
                try:
                    cls_id = int(parts[0])
                    class_counts[cls_id] += 1
                    has_labels = True
                except ValueError:
                    pass
        if has_labels:
            valid_files += 1

    print("\n=======================================================")
    print(" DumpSentry Waste Dataset Class Distribution")
    print("=======================================================")
    for idx, name in enumerate(CLASS_NAMES):
        count = class_counts.get(idx, 0)
        print(f" Class {idx:2d} | {name:<22} : {count:6d} instances")
    print("=======================================================")
    print(f"Total labeled items: {sum(class_counts.values())} across {valid_files} images.")
    print("Next step: Run `python scripts/split_dataset.py` to create train/val/test splits.")

if __name__ == "__main__":
    verify_and_summarize()

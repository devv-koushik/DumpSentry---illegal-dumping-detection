"""
Convert COCO annotations (e.g. TACO annotations.json) to YOLO label format (.txt).
YOLO format: <class_id> <x_center> <y_center> <width> <height> (normalized 0.0 - 1.0)
"""

import os
import json
from pathlib import Path
from typing import Dict

DATASET_ROOT = Path(__file__).resolve().parent.parent / "dataset"
RAW_TACO = DATASET_ROOT / "raw" / "taco"
PROCESSED_LABELS = DATASET_ROOT / "processed" / "labels"

# Mapping from TACO supercategories / categories to DumpSentry 10 classes
CLASS_MAPPING: Dict[str, int] = {
    "bottle": 0,          # plastic
    "cup": 0,             # plastic
    "plastic bag": 0,     # plastic
    "film": 0,            # plastic
    "polypropylene": 0,   # plastic
    "plastic": 0,         # plastic
    "carton": 1,          # cardboard_paper
    "paper": 1,           # cardboard_paper
    "cardboard": 1,       # cardboard_paper
    "box": 1,             # cardboard_paper
    "can": 2,             # metal
    "foil": 2,            # metal
    "scrap metal": 2,     # metal
    "glass bottle": 3,    # glass
    "broken glass": 3,    # glass
    "glass": 3,           # glass
    "food waste": 4,      # organic_waste
    "organic": 4,         # organic_waste
    "battery": 5,         # electronic_waste
    "electronic": 5,      # electronic_waste
    "wire": 5,            # electronic_waste
    "syringe": 6,         # biomedical_waste
    "medical": 6,         # biomedical_waste
    "mask": 6,            # biomedical_waste
    "brick": 7,           # construction_debris
    "concrete": 7,        # construction_debris
    "wood": 7,            # construction_debris
    "tire": 8,            # automotive_parts
    "tyre": 8,            # automotive_parts
    "chemical": 9,        # mixed_hazardous
    "paint": 9,           # mixed_hazardous
}

def coco_to_yolo(coco_json_path: Path):
    if not coco_json_path.exists():
        print(f"Annotation file not found at: {coco_json_path}")
        print("Run `python scripts/download_datasets.py` first.")
        return

    with open(coco_json_path, "r", encoding="utf-8") as f:
        coco = json.load(f)

    PROCESSED_LABELS.mkdir(parents=True, exist_ok=True)

    # Map category id to DumpSentry class id
    cat_id_to_class_id = {}
    for cat in coco.get("categories", []):
        cat_name = cat["name"].lower()
        supercategory = cat.get("supercategory", "").lower()
        assigned_class = 0 # default plastic

        for key, cls_idx in CLASS_MAPPING.items():
            if key in cat_name or key in supercategory:
                assigned_class = cls_idx
                break
        cat_id_to_class_id[cat["id"]] = assigned_class

    # Map image id to image metadata
    images = {img["id"]: img for img in coco.get("images", [])}

    # Group annotations by image
    img_annotations = {}
    for ann in coco.get("annotations", []):
        img_id = ann["image_id"]
        if img_id not in img_annotations:
            img_annotations[img_id] = []
        img_annotations[img_id].append(ann)

    print(f"Converting annotations for {len(images)} images...")
    converted_count = 0

    for img_id, anns in img_annotations.items():
        if img_id not in images:
            continue
        img = images[img_id]
        img_w = float(img["width"])
        img_h = float(img["height"])
        if img_w <= 0 or img_h <= 0:
            continue

        file_stem = Path(img["file_name"]).stem
        label_file = PROCESSED_LABELS / f"{file_stem}.txt"

        lines = []
        for ann in anns:
            cat_id = ann["category_id"]
            class_id = cat_id_to_class_id.get(cat_id, 0)

            # COCO bbox: [x_min, y_min, width, height]
            x_min, y_min, w, h = ann["bbox"]
            if w <= 0 or h <= 0:
                continue

            x_center = (x_min + w / 2.0) / img_w
            y_center = (y_min + h / 2.0) / img_h
            w_norm = w / img_w
            h_norm = h / img_h

            # Clip within [0, 1]
            x_center = max(0.0, min(1.0, x_center))
            y_center = max(0.0, min(1.0, y_center))
            w_norm = max(0.0, min(1.0, w_norm))
            h_norm = max(0.0, min(1.0, h_norm))

            lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {w_norm:.6f} {h_norm:.6f}")

        if lines:
            with open(label_file, "w", encoding="utf-8") as out:
                out.write("\n".join(lines) + "\n")
            converted_count += 1

    print(f"Successfully generated {converted_count} YOLO annotation files in: {PROCESSED_LABELS}")

if __name__ == "__main__":
    taco_json = RAW_TACO / "annotations.json"
    coco_to_yolo(taco_json)

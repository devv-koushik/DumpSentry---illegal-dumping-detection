import json
import shutil
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).resolve().parent.parent

TACO_DIR = (
    BASE_DIR
    / "dataset"
    / "raw"
    / "taco"
    / "TACO"
    / "data"
)

TACO_JSON = TACO_DIR / "annotations.json"

YOLO_DIR = (
    BASE_DIR
    / "dataset"
    / "processed"
    / "dronewaste_yolo"
)

TRAIN_IMAGES = YOLO_DIR / "images" / "train"
TRAIN_LABELS = YOLO_DIR / "labels" / "train"

# TACO categories that we will treat as paper_waste
PAPER_CATEGORIES = {
    "Toilet tube",
    "Other carton",
    "Egg carton",
    "Drink carton",
    "Corrugated carton",
    "Meal carton",
    "Pizza box",
    "Paper cup",
    "Magazine paper",
    "Tissues",
    "Wrapping paper",
    "Normal paper",
    "Paper bag",
    "Plastified paper bag",
    "Paper straw",
}

# DumpSentry class ID
PAPER_CLASS_ID = 9


def find_image(file_name):

    # Normal TACO path
    direct_path = TACO_DIR / file_name

    if direct_path.exists():
        return direct_path

    # Case-insensitive filename search fallback
    filename = Path(file_name).name.lower()

    for path in TACO_DIR.glob("**/*"):
        if path.is_file() and path.name.lower() == filename:
            return path

    return None


def coco_to_yolo(bbox, image_width, image_height):

    x, y, width, height = bbox

    if width <= 0 or height <= 0:
        return None

    # Clamp
    x = max(0, x)
    y = max(0, y)

    width = min(width, image_width - x)
    height = min(height, image_height - y)

    if width <= 0 or height <= 0:
        return None

    center_x = x + width / 2
    center_y = y + height / 2

    center_x /= image_width
    center_y /= image_height

    width /= image_width
    height /= image_height

    return (
        center_x,
        center_y,
        width,
        height,
    )


def main():

    print("=" * 60)
    print("ADDING TACO PAPER DATA TO DUMPSENTRY TRAINING")
    print("=" * 60)

    if not TACO_JSON.exists():
        raise FileNotFoundError(
            f"TACO annotations not found:\n{TACO_JSON}"
        )

    with open(
        TACO_JSON,
        "r",
        encoding="utf-8"
    ) as f:
        data = json.load(f)

    categories = {
        category["id"]: category["name"]
        for category in data["categories"]
    }

    # Find category IDs corresponding to paper
    paper_category_ids = {
        category_id
        for category_id, name in categories.items()
        if name in PAPER_CATEGORIES
    }

    print()
    print(
        f"TACO paper categories found: "
        f"{len(paper_category_ids)}"
    )

    # image_id -> image metadata
    images = {
        image["id"]: image
        for image in data["images"]
    }

    # image_id -> paper annotations
    paper_annotations = {}

    for annotation in data["annotations"]:

        category_id = annotation["category_id"]

        if category_id not in paper_category_ids:
            continue

        image_id = annotation["image_id"]

        paper_annotations.setdefault(
            image_id,
            []
        ).append(annotation)

    print(
        f"TACO images containing paper: "
        f"{len(paper_annotations)}"
    )

    processed_images = 0
    processed_annotations = 0
    missing_images = 0

    # Track used filenames to avoid collisions
    existing_names = {
        path.name
        for path in TRAIN_IMAGES.iterdir()
        if path.is_file()
    }

    for image_id, annotations in paper_annotations.items():

        image_info = images[image_id]

        source_image = find_image(
            image_info["file_name"]
        )

        if source_image is None:

            print(
                f"WARNING: Image not found: "
                f"{image_info['file_name']}"
            )

            missing_images += 1
            continue

        # Prefix avoids collisions with DroneWaste filenames
        output_name = (
            "taco_paper_"
            + source_image.name
        )

        # Handle duplicate names
        counter = 1

        while output_name in existing_names:

            output_name = (
                f"taco_paper_{counter}_"
                + source_image.name
            )

            counter += 1

        existing_names.add(output_name)

        yolo_lines = []

        for annotation in annotations:

            converted = coco_to_yolo(
                annotation["bbox"],
                image_info["width"],
                image_info["height"]
            )

            if converted is None:
                continue

            cx, cy, w, h = converted

            yolo_lines.append(
                f"{PAPER_CLASS_ID} "
                f"{cx:.6f} "
                f"{cy:.6f} "
                f"{w:.6f} "
                f"{h:.6f}"
            )

        if not yolo_lines:
            continue

        destination_image = (
            TRAIN_IMAGES / output_name
        )

        destination_label = (
            TRAIN_LABELS
            / Path(output_name).with_suffix(".txt").name
        )

        shutil.copy2(
            source_image,
            destination_image
        )

        with open(
            destination_label,
            "w",
            encoding="utf-8"
        ) as f:
            f.write(
                "\n".join(yolo_lines)
            )

        processed_images += 1
        processed_annotations += len(yolo_lines)

    print()
    print("=" * 60)
    print("TACO PAPER IMPORT COMPLETE")
    print("=" * 60)

    print(
        f"Images added:       {processed_images}"
    )

    print(
        f"Annotations added:  {processed_annotations}"
    )

    print(
        f"Missing images:     {missing_images}"
    )

    print()
    print(
        "TACO data was added ONLY to the training set."
    )

    print(
        "Validation and test sets remain DroneWaste-only."
    )


if __name__ == "__main__":
    main()
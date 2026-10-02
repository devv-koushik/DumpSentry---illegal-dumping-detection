from pathlib import Path
import random
import cv2

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_DIR = (
    BASE_DIR
    / "dataset"
    / "processed"
    / "dronewaste_yolo"
)

IMAGE_DIR = DATASET_DIR / "images" / "train"
LABEL_DIR = DATASET_DIR / "labels" / "train"

CLASS_NAMES = [
    "construction_waste",
    "appliances",
    "electronic_waste",
    "furniture",
    "metal_waste",
    "plastic_waste",
    "wood_waste",
    "vehicle_waste",
    "tyre_waste",
    "paper_waste",
    "asbestos",
    "textile_waste",
    "mixed_waste",
]


def draw_labels(image, label_file):

    height, width = image.shape[:2]

    with open(label_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for line in lines:

        parts = line.strip().split()

        if len(parts) != 5:
            continue

        class_id = int(parts[0])

        cx = float(parts[1])
        cy = float(parts[2])
        w = float(parts[3])
        h = float(parts[4])

        # YOLO normalized → pixel coordinates
        x1 = int((cx - w / 2) * width)
        y1 = int((cy - h / 2) * height)

        x2 = int((cx + w / 2) * width)
        y2 = int((cy + h / 2) * height)

        # Keep inside image
        x1 = max(0, min(x1, width - 1))
        y1 = max(0, min(y1, height - 1))
        x2 = max(0, min(x2, width - 1))
        y2 = max(0, min(y2, height - 1))

        label = CLASS_NAMES[class_id]

        cv2.rectangle(
            image,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        cv2.putText(
            image,
            label,
            (x1, max(y1 - 8, 15)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 255, 0),
            2
        )

    return image


def main():

    images = list(IMAGE_DIR.glob("*"))

    if not images:
        print("No training images found.")
        return

    # Select 12 random images
    random.seed(42)
    selected = random.sample(
        images,
        min(12, len(images))
    )

    output_dir = DATASET_DIR / "preview"
    output_dir.mkdir(exist_ok=True)

    print("Creating preview images...")

    for i, image_path in enumerate(selected):

        label_path = (
            LABEL_DIR /
            f"{image_path.stem}.txt"
        )

        if not label_path.exists():
            continue

        image = cv2.imread(str(image_path))

        if image is None:
            continue

        image = draw_labels(
            image,
            label_path
        )

        output_path = (
            output_dir /
            f"preview_{i + 1}.jpg"
        )

        cv2.imwrite(
            str(output_path),
            image
        )

        print(output_path)

    print()
    print("Preview complete.")
    print(f"Open this folder:")
    print(output_dir)


if __name__ == "__main__":
    main()
import json
import random
import shutil
from pathlib import Path
from collections import defaultdict, Counter

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_DIR = BASE_DIR / "dataset" / "raw" / "dronewaste"
OUTPUT_DIR = BASE_DIR / "dataset" / "processed" / "dronewaste_yolo"

JSON_FILE = RAW_DIR / "dronewaste_v1.0.json"
IMAGE_DIR = RAW_DIR / "images"

RANDOM_SEED = 42

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

CATEGORY_MAPPING = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 1,
    6: 2,
    7: 3,
    8: 4,
    9: 5,
    10: 6,
    11: 6,
    12: 4,
    13: 5,
    14: 7,
    15: 8,
    16: 9,
    17: 4,
    18: 10,
    19: 11,
    20: 12,
}

TRAIN_RATIO = 0.70
VAL_RATIO = 0.20
TEST_RATIO = 0.10


def convert_bbox_to_yolo(bbox, image_width, image_height):

    x, y, width, height = bbox

    if width <= 0 or height <= 0:
        return None

    x = max(0, x)
    y = max(0, y)

    width = min(width, image_width - x)
    height = min(height, image_height - y)

    if width <= 0 or height <= 0:
        return None

    center_x = (x + width / 2) / image_width
    center_y = (y + height / 2) / image_height

    width /= image_width
    height /= image_height

    return (
        max(0, min(center_x, 1)),
        max(0, min(center_y, 1)),
        max(0, min(width, 1)),
        max(0, min(height, 1)),
    )


def reset_output_directory():

    if OUTPUT_DIR.exists():
        print("Removing previous processed dataset...")
        shutil.rmtree(OUTPUT_DIR)

    for split in ["train", "val", "test"]:
        (OUTPUT_DIR / "images" / split).mkdir(
            parents=True,
            exist_ok=True
        )

        (OUTPUT_DIR / "labels" / split).mkdir(
            parents=True,
            exist_ok=True
        )


def load_data():

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Images in JSON: {len(data['images'])}")
    print(f"Annotations in JSON: {len(data['annotations'])}")

    return data


def build_annotations(data):

    annotation_index = defaultdict(list)

    for annotation in data["annotations"]:
        annotation_index[annotation["image_id"]].append(annotation)

    return annotation_index


def get_image_classes(image_id, annotation_index):

    classes = set()

    for annotation in annotation_index[image_id]:

        category_id = annotation["category_id"]

        if category_id in CATEGORY_MAPPING:
            classes.add(
                CATEGORY_MAPPING[category_id]
            )

    return classes


def create_splits(images, annotation_index):

    random.seed(RANDOM_SEED)

    # Only keep images with at least one usable annotation
    usable_images = []

    for image in images:

        image_path = IMAGE_DIR / image["file_name"]

        if not image_path.exists():
            continue

        classes = get_image_classes(
            image["id"],
            annotation_index
        )

        if classes:
            usable_images.append(
                (image, classes)
            )

    print()
    print(f"Usable annotated images: {len(usable_images)}")

    # Shuffle
    random.shuffle(usable_images)

    # Sort rare-class images first.
    # This prevents rare classes from accidentally ending up
    # entirely inside one split.
    class_frequency = Counter()

    for _, classes in usable_images:
        for class_id in classes:
            class_frequency[class_id] += 1

    usable_images.sort(
        key=lambda item: min(
            class_frequency[c]
            for c in item[1]
        )
    )

    total = len(usable_images)

    train_target = int(total * TRAIN_RATIO)
    val_target = int(total * VAL_RATIO)

    splits = {
        "train": [],
        "val": [],
        "test": [],
    }

    # Track class presence in each split
    split_classes = {
        "train": Counter(),
        "val": Counter(),
        "test": Counter(),
    }

    # First pass: distribute rare classes
    for image, classes in usable_images:

        # Determine which split currently needs these classes most
        candidates = []

        for split_name, target in [
            ("train", train_target),
            ("val", val_target),
            ("test", total - train_target - val_target),
        ]:

            if len(splits[split_name]) >= target:
                continue

            missing = sum(
                1
                for class_id in classes
                if split_classes[split_name][class_id] == 0
            )

            candidates.append(
                (missing, random.random(), split_name)
            )

        if not candidates:
            continue

        candidates.sort(
            key=lambda x: (-x[0], x[1])
        )

        selected_split = candidates[0][2]

        splits[selected_split].append(image)

        for class_id in classes:
            split_classes[selected_split][class_id] += 1

    # If anything somehow remains, fill by size
    assigned_ids = {
        image["id"]
        for split in splits.values()
        for image in split
    }

    remaining = [
        image
        for image, _ in usable_images
        if image["id"] not in assigned_ids
    ]

    for image in remaining:

        if len(splits["train"]) < train_target:
            split = "train"
        elif len(splits["val"]) < val_target:
            split = "val"
        else:
            split = "test"

        splits[split].append(image)

    return splits


def process_split(
    split_name,
    images,
    annotation_index
):

    print()
    print("=" * 50)
    print(f"Processing {split_name.upper()}")
    print("=" * 50)

    image_count = 0
    annotation_count = 0

    class_counter = Counter()

    for image_info in images:

        image_id = image_info["id"]
        file_name = image_info["file_name"]

        source_image = IMAGE_DIR / file_name

        if not source_image.exists():
            continue

        yolo_lines = []

        for annotation in annotation_index[image_id]:

            category_id = annotation["category_id"]

            if category_id not in CATEGORY_MAPPING:
                continue

            class_id = CATEGORY_MAPPING[category_id]

            converted = convert_bbox_to_yolo(
                annotation["bbox"],
                image_info["width"],
                image_info["height"]
            )

            if converted is None:
                continue

            cx, cy, w, h = converted

            yolo_lines.append(
                f"{class_id} "
                f"{cx:.6f} "
                f"{cy:.6f} "
                f"{w:.6f} "
                f"{h:.6f}"
            )

            class_counter[class_id] += 1
            annotation_count += 1

        if not yolo_lines:
            continue

        destination_image = (
            OUTPUT_DIR
            / "images"
            / split_name
            / Path(file_name).name
        )

        destination_label = (
            OUTPUT_DIR
            / "labels"
            / split_name
            / Path(file_name).with_suffix(".txt").name
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
            f.write("\n".join(yolo_lines))

        image_count += 1

    print(f"Images: {image_count}")
    print(f"Annotations: {annotation_count}")

    print()
    print("Class distribution:")

    for class_id, class_name in enumerate(CLASS_NAMES):
        print(
            f"{class_id:2d} - "
            f"{class_name:25s} "
            f"{class_counter[class_id]}"
        )


def create_yaml():

    yaml_file = OUTPUT_DIR / "data.yaml"

    with open(
        yaml_file,
        "w",
        encoding="utf-8"
    ) as f:

        f.write(
            f"path: {OUTPUT_DIR.as_posix()}\n"
        )

        f.write("train: images/train\n")
        f.write("val: images/val\n")
        f.write("test: images/test\n\n")

        f.write(
            f"nc: {len(CLASS_NAMES)}\n"
        )

        f.write("names:\n")

        for index, name in enumerate(CLASS_NAMES):
            f.write(
                f"  {index}: {name}\n"
            )

    print()
    print(f"Created: {yaml_file}")


def main():

    print("=" * 60)
    print("DumpSentry Dataset Preparation")
    print("=" * 60)

    reset_output_directory()

    data = load_data()

    annotation_index = build_annotations(data)

    splits = create_splits(
        data["images"],
        annotation_index
    )

    print()
    print("FINAL IMAGE SPLIT")
    print("------------------")

    for split_name in ["train", "val", "test"]:
        print(
            f"{split_name}: "
            f"{len(splits[split_name])}"
        )

    for split_name in ["train", "val", "test"]:

        process_split(
            split_name,
            splits[split_name],
            annotation_index
        )

    create_yaml()

    print()
    print("=" * 60)
    print("DATASET PREPARATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
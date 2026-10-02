import json
from pathlib import Path
import random
import cv2

BASE_DIR = Path(__file__).resolve().parent.parent

TACO_DIR = (
    BASE_DIR
    / "dataset"
    / "raw"
    / "taco"
    / "TACO"
    / "data"
)

ANNOTATION_FILE = TACO_DIR / "annotations.json"

OUTPUT_DIR = (
    BASE_DIR
    / "dataset"
    / "processed"
    / "taco_preview"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


def main():

    print("=" * 60)
    print("TACO DATASET INSPECTION")
    print("=" * 60)

    with open(
        ANNOTATION_FILE,
        "r",
        encoding="utf-8"
    ) as f:
        data = json.load(f)

    images = data["images"]

    print(f"Images in JSON: {len(images)}")
    print(f"Annotations: {len(data['annotations'])}")
    print()

    random.seed(42)

    selected = random.sample(
        images,
        min(12, len(images))
    )

    found = 0
    missing = 0

    for index, image_info in enumerate(selected):

        file_name = image_info["file_name"]

        # TACO paths are normally relative to data/
        image_path = TACO_DIR / file_name

        if not image_path.exists():

            # Try filename recursively
            matches = list(
                TACO_DIR.glob(
                    f"**/{Path(file_name).name}"
                )
            )

            if matches:
                image_path = matches[0]
            else:
                print(
                    f"NOT FOUND: {file_name}"
                )
                missing += 1
                continue

        image = cv2.imread(
            str(image_path)
        )

        if image is None:
            print(
                f"Could not read: {image_path}"
            )
            missing += 1
            continue

        output_file = (
            OUTPUT_DIR
            / f"taco_{index + 1}.jpg"
        )

        cv2.imwrite(
            str(output_file),
            image
        )

        print(
            f"FOUND: {image_path}"
        )

        found += 1

    print()
    print("=" * 60)
    print(f"Images found: {found}")
    print(f"Images missing: {missing}")
    print("=" * 60)

    print()
    print("Preview folder:")
    print(OUTPUT_DIR)


if __name__ == "__main__":
    main()
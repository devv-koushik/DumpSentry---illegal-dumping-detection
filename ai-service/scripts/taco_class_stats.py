import json
from pathlib import Path
from collections import Counter, defaultdict

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


# ============================================================
# TACO CATEGORY -> DUMPSENTRY CLASS
# ============================================================

PLASTIC = {
    "Other plastic bottle",
    "Clear plastic bottle",
    "Plastic bottle cap",
    "Disposable plastic cup",
    "Foam cup",
    "Other plastic cup",
    "Plastic lid",
    "Other plastic",
    "Plastic film",
    "Six pack rings",
    "Garbage bag",
    "Other plastic wrapper",
    "Single-use carrier bag",
    "Polypropylene bag",
    "Crisp packet",
    "Spread tub",
    "Tupperware",
    "Disposable food container",
    "Foam food container",
    "Other plastic container",
    "Plastic glooves",
    "Plastic utensils",
    "Squeezable tube",
    "Plastic straw",
    "Styrofoam piece",
}

PAPER = {
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

METAL = {
    "Aluminium foil",
    "Aluminium blister pack",
    "Metal bottle cap",
    "Food Can",
    "Aerosol",
    "Drink can",
    "Metal lid",
    "Pop tab",
    "Scrap metal",
}


def main():

    print("=" * 65)
    print("TACO → DUMPSENTRY USEFUL DATA ANALYSIS")
    print("=" * 65)

    with open(
        ANNOTATION_FILE,
        "r",
        encoding="utf-8"
    ) as f:
        data = json.load(f)

    categories = {
        category["id"]: category["name"]
        for category in data["categories"]
    }

    annotations = data["annotations"]

    # --------------------------------------------------------
    # Determine mapping
    # --------------------------------------------------------

    mapping = {}

    for category_id, name in categories.items():

        if name in PLASTIC:
            mapping[category_id] = "plastic_waste"

        elif name in PAPER:
            mapping[category_id] = "paper_waste"

        elif name in METAL:
            mapping[category_id] = "metal_waste"

    # --------------------------------------------------------
    # Count annotations
    # --------------------------------------------------------

    annotation_counts = Counter()

    # image_id -> classes present
    image_classes = defaultdict(set)

    # Original TACO category counts
    original_counts = Counter()

    for annotation in annotations:

        category_id = annotation["category_id"]

        original_counts[category_id] += 1

        if category_id not in mapping:
            continue

        dump_class = mapping[category_id]

        annotation_counts[dump_class] += 1

        image_id = annotation["image_id"]

        image_classes[image_id].add(
            dump_class
        )

    # --------------------------------------------------------
    # Print mapping
    # --------------------------------------------------------

    print()
    print("Mapped TACO categories:")
    print("-" * 65)

    for category_id in sorted(mapping):

        print(
            f"{category_id:2d} - "
            f"{categories[category_id]:30s} "
            f"→ {mapping[category_id]}"
        )

    # --------------------------------------------------------
    # Annotation statistics
    # --------------------------------------------------------

    print()
    print("=" * 65)
    print("USEFUL ANNOTATION COUNTS")
    print("=" * 65)

    for class_name in [
        "plastic_waste",
        "paper_waste",
        "metal_waste"
    ]:

        print(
            f"{class_name:20s}: "
            f"{annotation_counts[class_name]}"
        )

    total_useful = sum(
        annotation_counts.values()
    )

    print("-" * 65)
    print(
        f"{'TOTAL':20s}: "
        f"{total_useful}"
    )

    # --------------------------------------------------------
    # Unique image counts
    # --------------------------------------------------------

    image_counts = Counter()

    for classes in image_classes.values():

        for class_name in classes:
            image_counts[class_name] += 1

    print()
    print("=" * 65)
    print("UNIQUE IMAGES CONTAINING EACH USEFUL CLASS")
    print("=" * 65)

    for class_name in [
        "plastic_waste",
        "paper_waste",
        "metal_waste"
    ]:

        print(
            f"{class_name:20s}: "
            f"{image_counts[class_name]}"
        )

    print()
    print(
        f"Images containing at least one useful "
        f"class: {len(image_classes)}"
    )

    # --------------------------------------------------------
    # Original rare DumpSentry classes
    # --------------------------------------------------------

    print()
    print("=" * 65)
    print("CURRENT DRONEWASTE RARE CLASSES")
    print("=" * 65)

    print("electronic_waste : 11 annotations")
    print("paper_waste      : 11 annotations")
    print("appliances       : 35 annotations")

    print()
    print("TACO electronic waste:")
    print("Battery          : 2 annotations")

    print()
    print("=" * 65)
    print("CONCLUSION")
    print("=" * 65)

    print(
        "TACO will be considered only for:"
    )

    print("  - plastic_waste")
    print("  - paper_waste")
    print("  - metal_waste")

    print()
    print(
        "TACO will NOT be used for electronic_waste,"
    )
    print(
        "appliances, construction_waste, furniture,"
    )
    print(
        "wood_waste, vehicle_waste, tyre_waste,"
    )
    print(
        "asbestos, textile_waste or mixed_waste."
    )


if __name__ == "__main__":
    main()
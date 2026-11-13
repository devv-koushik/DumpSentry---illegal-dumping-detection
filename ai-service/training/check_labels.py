from pathlib import Path
import sys

# Locate dataset root whether run from ai-service/ or project root
CANDIDATE_PATHS = [
    Path("dataset/processed/dronewaste_yolo"),
    Path("ai-service/dataset/processed/dronewaste_yolo"),
    Path(__file__).resolve().parent.parent / "dataset" / "processed" / "dronewaste_yolo",
    Path(__file__).resolve().parent.parent / "ai-service" / "dataset" / "processed" / "dronewaste_yolo",
]

DATASET = next((p for p in CANDIDATE_PATHS if p.exists()), Path("dataset/processed/dronewaste_yolo"))

CLASS_COUNT = 13
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

splits = ["train", "val", "test"]
errors = []
class_counts = {i: 0 for i in range(CLASS_COUNT)}
total_files = 0
total_boxes = 0

print("=" * 60)
print("DumpSentry YOLO Label Integrity Check")
print(f"Dataset path: {DATASET.resolve()}")
print("=" * 60)

for split in splits:
    label_dir = DATASET / split / "labels"
    if not label_dir.exists():
        errors.append(f"Missing label directory: {label_dir}")
        continue

    split_files = list(label_dir.glob("*.txt"))
    total_files += len(split_files)
    split_boxes = 0

    for file in split_files:
        try:
            lines = file.read_text(encoding="utf-8").splitlines()
            for line_no, line in enumerate(lines, 1):
                line = line.strip()
                if not line:
                    continue

                parts = line.split()
                if len(parts) != 5:
                    errors.append(
                        f"{file} line {line_no}: expected 5 values, got {len(parts)}"
                    )
                    continue

                try:
                    cls, xc, yc, w, h = map(float, parts)
                except ValueError:
                    errors.append(f"{file} line {line_no}: non-numeric values '{line}'")
                    continue

                if not cls.is_integer():
                    errors.append(f"{file} line {line_no}: invalid class {cls}")
                    continue

                cls = int(cls)
                if cls < 0 or cls >= CLASS_COUNT:
                    errors.append(
                        f"{file} line {line_no}: class {cls} out of range (0-{CLASS_COUNT - 1})"
                    )
                    continue

                # Bounding box bounds check: xc, yc, w, h must be in (0, 1]
                if not (0.0 <= xc <= 1.0 and 0.0 <= yc <= 1.0 and 0.0 < w <= 1.0 and 0.0 < h <= 1.0):
                    errors.append(
                        f"{file} line {line_no}: bbox values out of range: xc={xc}, yc={yc}, w={w}, h={h}"
                    )
                    continue

                class_counts[cls] += 1
                split_boxes += 1
                total_boxes += 1

        except Exception as e:
            errors.append(f"{file}: error reading file - {e}")

    print(f"Split '{split:5s}': {len(split_files):5d} label files, {split_boxes:6d} bounding boxes")

print("-" * 60)
print(f"Total files checked: {total_files}")
print(f"Total bounding boxes: {total_boxes}")
print("\nClass Distribution:")
for cls_id in range(CLASS_COUNT):
    name = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else f"class_{cls_id}"
    print(f"  Class {cls_id:2d} ({name:20s}): {class_counts[cls_id]:6d} instances")

print("=" * 60)
if errors:
    print(f"\n❌ FOUND {len(errors)} ERROR(S):")
    for err in errors[:20]:
        print(f"  - {err}")
    if len(errors) > 20:
        print(f"  ... and {len(errors) - 20} more errors.")
    sys.exit(1)
else:
    print("\n✅ All labels are valid and properly formatted for YOLO training!")
    print("=" * 60)

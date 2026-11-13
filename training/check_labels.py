from pathlib import Path

DATASET = Path("dataset/processed/dronewaste_yolo")
if not DATASET.exists():
    DATASET = Path("ai-service/dataset/processed/dronewaste_yolo")

CLASS_COUNT = 13

splits = ["train", "val", "test"]

errors = []
class_counts = {i: 0 for i in range(CLASS_COUNT)}

for split in splits:
    label_dir = DATASET / split / "labels"

    for file in label_dir.glob("*.txt"):
        try:
            lines = file.read_text().splitlines()

            for line_no, line in enumerate(lines, 1):
                parts = line.split()

                if len(parts) != 5:
                    errors.append(
                        f"{file} line {line_no}: expected 5 values, got {len(parts)}"
                    )
                    continue

                cls, xc, yc, w, h = map(float, parts)

                if not cls.is_integer():
                    errors.append(f"{file} line {line_no}: invalid class {cls}")
                    continue

                cls = int(cls)

                if cls < 0 or cls >= CLASS_COUNT:
                    errors.append(
                        f"{file} line {line_no}: class {cls} outside 0-{CLASS_COUNT-1}"
                    )

                for name, value in [
                    ("x_center", xc),
                    ("y_center", yc),
                    ("width", w),
                    ("height", h),
                ]:
                    if not 0 <= value <= 1:
                        errors.append(
                            f"{file} line {line_no}: {name}={value} outside 0-1"
                        )

                class_counts[cls] += 1

        except Exception as e:
            errors.append(f"{file}: {e}")

print("\n========== CLASS COUNTS ==========")

names = [
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

for i, count in class_counts.items():
    print(f"{i:2} {names[i]:25} {count}")

print("\n========== ERRORS ==========")

if errors:
    for error in errors[:100]:
        print(error)

    print(f"\nTotal errors: {len(errors)}")
else:
    print("NO LABEL ERRORS FOUND")

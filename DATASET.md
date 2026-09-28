# DumpSentry Dataset Documentation

This document describes the datasets used to train the DumpSentry computer vision model for aerial waste detection, class remapping schemas, and data preparation workflows.

---

## 1. Target Waste Classes

The model classifies waste into **10 standard classes**:

| ID | Class Name | Description | Common Aerial Visual Signatures |
|---|---|---|---|
| **0** | `plastic` | Bottles, single-use bags, tarps, packaging film | High specular reflectivity, wrinkled textures, varied bright colors |
| **1** | `cardboard_paper` | Corrugated boxes, packaging cartons, newspapers | Flat planar shapes, matte brown/tan or printed paper sheets |
| **2** | `metal` | Scrap metal, tin cans, drums, sheet metal | Metallic sheen, rust oxidation, cylindrical or corrugated patterns |
| **3** | `glass` | Bottles, broken glass shards, panes | Transparency, sharp edges, distinct sunlight refractions |
| **4** | `organic_waste` | Decomposing organic matter, yard clippings, agricultural dump | Dark brown/green coloration, irregular clumping |
| **5** | `electronic_waste` | Circuit boards, monitors, appliances, wiring bundles | Geometric circuit board edges, entangled cabling, dark plastic casings |
| **6** | `biomedical_waste` | Syringes, red bags, PPE masks, discarded medical kits | Yellow/red biohazard bags, recognizable mask shapes |
| **7** | `construction_debris` | Broken concrete, masonry rubble, bricks, wood pallets | Fragmented rectangular/irregular blocks, dust haloes |
| **8** | `automotive_parts` | Discarded vehicle tires, bumpers, engine blocks | Toroidal tire shapes, black rubber rims, grease stains |
| **9** | `mixed_hazardous` | Chemical cans, paint buckets, unidentified toxic drums | Warning labeling, bright chemical stains on soil |

---

## 2. Benchmark Datasets

### A. DroneWaste (Aerial Drone Dataset)
* **Description:** Aerial imagery captured by UAVs at varying altitudes (10m to 50m) with top-down nadir and oblique camera angles.
* **Features:** Realistic drone perspective, small object sizes, background clutter (vegetation, bare soil, tarmac).
* **Source:** DroneWaste benchmark repository.

### B. TACO (Trash Annotations in Context)
* **Description:** Open-source COCO-format dataset containing over 1,500 diverse trash images with segmentation masks and bounding boxes.
* **License:** Creative Commons Attribution 4.0 International (CC BY 4.0).
* **URL:** [https://github.com/pedropro/TACO](https://github.com/pedropro/TACO)

---

## 3. Preparation & Annotation Pipeline

Automated scripts are located in `ai-service/scripts/`:

```bash
cd ai-service

# 1. Download benchmark datasets and annotations
python scripts/download_datasets.py

# 2. Convert COCO/VOC format to normalized YOLO txt annotations
python scripts/convert_annotations.py

# 3. Verify class distribution and validate bbox ranges
python scripts/prepare_dataset.py

# 4. Partition dataset into 70% Train, 20% Val, 10% Test
python scripts/split_dataset.py
```

### YOLO Annotation Format
Each image has a matching `.txt` file with identical basename:
```
<class_id> <x_center> <y_center> <width> <height>
```
* Coordinates are normalized floats between `0.0` and `1.0`.

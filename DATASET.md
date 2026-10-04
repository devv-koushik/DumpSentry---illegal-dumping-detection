# DumpSentry Dataset Documentation

This document describes the datasets used to train the DumpSentry computer vision model for aerial waste detection, class remapping schemas, and data preparation workflows.

---

## 1. Target Waste Classes

The model classifies waste into **13 standard classes**:

| ID | Class Name | Description | Common Aerial Visual Signatures |
|---|---|---|---|
| **0** | `construction_waste` | Broken concrete, masonry rubble, bricks | Fragmented blocks, dust haloes, pale gray/red tones |
| **1** | `appliances` | Discarded white goods, refrigerators, washing machines | Large rectangular metallic or white boxes |
| **2** | `electronic_waste` | Circuit boards, monitors, wiring bundles | Geometric edges, dark plastic casings, cables |
| **3** | `furniture` | Broken chairs, sofas, mattresses | Large irregular fabric/wood shapes, distinctive springing |
| **4** | `metal_waste` | Scrap metal, tin cans, sheet metal | Metallic sheen, rust oxidation, cylindrical shapes |
| **5** | `plastic_waste` | Bottles, single-use bags, tarps, packaging | High specular reflectivity, varied bright colors |
| **6** | `wood_waste` | Discarded lumber, broken pallets, timber | Brown linear planks, splintered edges |
| **7** | `vehicle_waste` | Discarded car parts, bumpers, chassis | Curved metal, reflective auto paint |
| **8** | `tyre_waste` | Discarded vehicle tires | Toroidal black rubber shapes, circular rims |
| **9** | `paper_waste` | Corrugated boxes, cartons, newspapers | Flat planar shapes, matte brown/tan or printed |
| **10** | `asbestos` | Hazardous roofing sheets, insulation | Corrugated gray profiles, dull matte surface |
| **11** | `textile_waste` | Clothing, fabric scraps, rags | Clumped colored fabrics, matte folded textures |
| **12** | `mixed_waste` | Unidentified or heavily intermingled garbage | Chaotic textures, overlapping materials |

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

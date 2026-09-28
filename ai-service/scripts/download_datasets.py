"""
DumpSentry Dataset Downloader
-----------------------------
Downloads and unpacks benchmark datasets for aerial garbage and waste detection:
1. DroneWaste Dataset (Aerial drone-based waste imagery)
2. TACO (Trash Annotations in Context)
3. OpenLitterMap / TrashNet sample data

Note: Raw datasets are saved into `dataset/raw/` which is git-ignored.
"""

import os
import sys
import zipfile
import tarfile
import urllib.request
from pathlib import Path

DATASET_ROOT = Path(__file__).resolve().parent.parent / "dataset"
RAW_DIR = DATASET_ROOT / "raw"

DATASET_SOURCES = {
    "taco": {
        "name": "TACO (Trash Annotations in Context)",
        "url": "https://github.com/pedropro/TACO/raw/master/data/annotations.json",
        "description": "COCO-style annotated trash dataset for waste material classification.",
        "type": "file",
    },
    "drone_waste_sample": {
        "name": "DroneWaste Sample Benchmark",
        "url": "https://github.com/devv-koushik/DumpSentry---illegal-dumping-detection/releases/download/v1.0.0/sample_drone_data.zip",
        "description": "Sample aerial images captured from quadcopter UAVs over waste dumping sites.",
        "type": "zip",
    }
}

def report_progress(block_num, block_size, total_size):
    downloaded = block_num * block_size
    if total_size > 0:
        percent = min(100, (downloaded / total_size) * 100)
        sys.stdout.write(f"\rDownloading... {percent:.1f}% ({downloaded / (1024*1024):.2f} MB / {total_size / (1024*1024):.2f} MB)")
    else:
        sys.stdout.write(f"\rDownloading... {downloaded / (1024*1024):.2f} MB")
    sys.stdout.flush()

def download_and_extract(key: str, info: dict):
    target_dir = RAW_DIR / key
    target_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n=======================================================")
    print(f"Dataset: {info['name']}")
    print(f"Info: {info['description']}")
    print(f"Destination: {target_dir}")
    print(f"=======================================================")

    filename = info["url"].split("/")[-1]
    archive_path = target_dir / filename

    if archive_path.exists():
        print(f"File already downloaded: {archive_path}")
    else:
        print(f"Fetching from {info['url']}...")
        try:
            urllib.request.urlretrieve(info["url"], archive_path, report_progress)
            print("\nDownload complete.")
        except Exception as e:
            print(f"\n[Notice] Direct download link unavailable: {e}")
            print(f"Please follow manual download instructions in DATASET.md.")
            return

    if info["type"] == "zip" and archive_path.suffix == ".zip":
        print("Extracting archive...")
        try:
            with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                zip_ref.extractall(target_dir)
            print("Extraction finished.")
        except Exception as e:
            print(f"Could not extract zip: {e}")

def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    print("DumpSentry Dataset Download Utility")
    print(f"Datasets will be stored in: {RAW_DIR}")

    for key, info in DATASET_SOURCES.items():
        download_and_extract(key, info)

    print("\nDataset download process completed.")
    print("Next step: Run `python scripts/convert_annotations.py` to prepare YOLO labels.")

if __name__ == "__main__":
    main()

"""
Dataset Analysis Script for Kabadiwala Connect AI.
Analyzes e-waste image datasets for class distribution, corruption, duplicates, and imbalance.

Usage:
    python dataset_analysis.py --dataset_path path/to/dataset --dataset_name etadweer
"""

import os
import sys
import json
import argparse
import hashlib
import time
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple, Optional

import numpy as np
from PIL import Image, UnidentifiedImageError
import imagehash
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
PHASH_THRESHOLD = 10  # Hamming distance threshold for near-duplicate detection

EVAL_DIR = Path(__file__).resolve().parent.parent / "evaluation"


# ---------------------------------------------------------------------------
# Core analysis
# ---------------------------------------------------------------------------

def _collect_image_paths(dataset_path: Path) -> Dict[str, List[Path]]:
    """
    Walk dataset_path recursively.
    Expects structure: dataset_path/<class_name>/<image_files>
    Returns {class_name: [path, ...]}
    """
    class_images: Dict[str, List[Path]] = defaultdict(list)

    for entry in sorted(dataset_path.iterdir()):
        if not entry.is_dir():
            continue
        class_name = entry.name
        for root, _, files in os.walk(entry):
            for f in files:
                if Path(f).suffix.lower() in VALID_EXTENSIONS:
                    class_images[class_name].append(Path(root) / f)

    return dict(class_images)


def _check_image(path: Path) -> Tuple[bool, Optional[Tuple[int, int]]]:
    """
    Returns (is_valid, (width, height)).
    is_valid=False means corrupted or unreadable.
    """
    try:
        with Image.open(path) as img:
            img.verify()          # catches truncated / corrupted files
        # Re-open after verify (verify closes the file)
        with Image.open(path) as img:
            img.load()            # fully decode
            return True, img.size
    except (UnidentifiedImageError, OSError, Exception):
        return False, None


def _compute_phash(path: Path) -> Optional[imagehash.ImageHash]:
    """Return perceptual hash of image, or None on failure."""
    try:
        with Image.open(path) as img:
            img.load()
            return imagehash.phash(img)
    except Exception:
        return None


def _find_duplicates(
    all_paths: List[Path],
    threshold: int = PHASH_THRESHOLD,
) -> List[List[str]]:
    """
    Detect near-duplicate groups via pHash.
    Returns list of groups (each group is a list of file path strings).
    Uses O(n²) comparison — suitable for datasets up to ~10 k images.
    For larger datasets consider LSH.
    """
    hashes: List[Tuple[Path, imagehash.ImageHash]] = []
    for p in all_paths:
        h = _compute_phash(p)
        if h is not None:
            hashes.append((p, h))

    visited = [False] * len(hashes)
    groups: List[List[str]] = []

    for i in range(len(hashes)):
        if visited[i]:
            continue
        group = [str(hashes[i][0])]
        for j in range(i + 1, len(hashes)):
            if visited[j]:
                continue
            dist = hashes[i][1] - hashes[j][1]
            if dist <= threshold:
                group.append(str(hashes[j][0]))
                visited[j] = True
        if len(group) > 1:
            visited[i] = True
            groups.append(group)

    return groups


def _compute_recommended_weights(class_counts: Dict[str, int]) -> Dict[str, float]:
    """Inverse-frequency class weights, normalised so mean == 1."""
    total = sum(class_counts.values())
    n_classes = len(class_counts)
    weights = {}
    for cls, cnt in class_counts.items():
        # weight = total / (n_classes * count)  — standard sklearn formula
        weights[cls] = total / (n_classes * cnt) if cnt > 0 else 1.0
    return weights


def _plot_class_distribution(
    class_counts: Dict[str, int],
    dataset_name: str,
    save_path: Path,
) -> None:
    """Generate and save a bar chart of class distribution."""
    classes = list(class_counts.keys())
    counts = [class_counts[c] for c in classes]

    fig, ax = plt.subplots(figsize=(max(8, len(classes) * 0.9), 6))
    bars = ax.bar(range(len(classes)), counts, color="steelblue", edgecolor="white")
    ax.set_xticks(range(len(classes)))
    ax.set_xticklabels(classes, rotation=45, ha="right", fontsize=9)
    ax.set_xlabel("Class", fontsize=11)
    ax.set_ylabel("Image Count", fontsize=11)
    ax.set_title(f"Class Distribution — {dataset_name}", fontsize=13)

    for bar, cnt in zip(bars, counts):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + max(counts) * 0.01,
            str(cnt),
            ha="center",
            va="bottom",
            fontsize=8,
        )

    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.close(fig)
    print(f"[INFO] Class distribution chart saved → {save_path}")


def _print_summary_table(report: dict) -> None:
    """Pretty-print analysis results to stdout."""
    sep = "=" * 72
    print(f"\n{sep}")
    print(f"  DATASET: {report['dataset_name']}")
    print(sep)
    print(f"  Total images      : {report['total_images']}")
    print(f"  Total classes     : {len(report['classes'])}")
    print(f"  Corrupted images  : {len(report['corrupted_images'])}")
    print(f"  Duplicate groups  : {len(report['duplicate_groups'])}")
    print(f"  Imbalance ratio   : {report['class_imbalance_ratio']:.2f}x")
    print(f"\n{'Class':<30} {'Count':>8} {'Avg W':>8} {'Avg H':>8}")
    print("-" * 60)
    for cls, info in sorted(report["classes"].items(), key=lambda x: -x[1]["count"]):
        print(
            f"  {cls:<28} {info['count']:>8} "
            f"{info['avg_width']:>8.1f} {info['avg_height']:>8.1f}"
        )
    if report["corrupted_images"]:
        print(f"\n[WARNING] Corrupted files:")
        for p in report["corrupted_images"][:10]:
            print(f"  {p}")
        if len(report["corrupted_images"]) > 10:
            print(f"  ... and {len(report['corrupted_images']) - 10} more")
    print(sep + "\n")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_dataset(dataset_path: str, dataset_name: str) -> dict:
    """
    Analyze an e-waste image dataset.

    Parameters
    ----------
    dataset_path : str
        Root directory of the dataset (must contain class sub-folders).
    dataset_name : str
        Human-readable name used in reports / charts.

    Returns
    -------
    dict with keys:
        dataset_name         : str
        total_images         : int
        classes              : {class_name: {count, avg_width, avg_height}}
        corrupted_images     : [str]
        duplicate_groups     : [[str, ...], ...]
        class_imbalance_ratio: float  (max_count / min_count)
        recommended_class_weights : {class_name: float}
    """
    root = Path(dataset_path)
    if not root.exists():
        raise FileNotFoundError(f"Dataset path does not exist: {root}")

    print(f"\n[INFO] Analyzing dataset: '{dataset_name}' at {root}")
    t0 = time.time()

    class_images = _collect_image_paths(root)
    if not class_images:
        raise ValueError(
            f"No class subdirectories with images found under: {root}\n"
            "Expected structure: <dataset_path>/<class_name>/<images>"
        )

    classes_info: Dict[str, dict] = {}
    corrupted: List[str] = []
    all_valid_paths: List[Path] = []

    for class_name, paths in class_images.items():
        widths, heights = [], []
        valid_paths_for_class: List[Path] = []

        for p in paths:
            is_valid, size = _check_image(p)
            if is_valid and size is not None:
                widths.append(size[0])
                heights.append(size[1])
                valid_paths_for_class.append(p)
            else:
                corrupted.append(str(p))

        all_valid_paths.extend(valid_paths_for_class)
        classes_info[class_name] = {
            "count": len(valid_paths_for_class),
            "avg_width": float(np.mean(widths)) if widths else 0.0,
            "avg_height": float(np.mean(heights)) if heights else 0.0,
        }

    # --- Duplicate detection ---
    print(f"[INFO] Running pHash duplicate detection on {len(all_valid_paths)} images…")
    duplicate_groups = _find_duplicates(all_valid_paths, threshold=PHASH_THRESHOLD)

    # --- Imbalance ---
    counts = [v["count"] for v in classes_info.values() if v["count"] > 0]
    imbalance_ratio = max(counts) / min(counts) if counts and min(counts) > 0 else float("inf")

    # --- Class weights ---
    class_counts = {cls: info["count"] for cls, info in classes_info.items()}
    recommended_weights = _compute_recommended_weights(class_counts)

    report = {
        "dataset_name": dataset_name,
        "total_images": len(all_valid_paths),
        "classes": classes_info,
        "corrupted_images": corrupted,
        "duplicate_groups": duplicate_groups,
        "class_imbalance_ratio": float(imbalance_ratio),
        "recommended_class_weights": recommended_weights,
    }

    # --- Save JSON report ---
    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    report_path = EVAL_DIR / "dataset_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"[INFO] JSON report saved → {report_path}")

    # --- Save chart ---
    chart_path = EVAL_DIR / "class_distribution.png"
    _plot_class_distribution(class_counts, dataset_name, chart_path)

    # --- Print summary ---
    _print_summary_table(report)

    elapsed = time.time() - t0
    print(f"[INFO] Analysis complete in {elapsed:.1f}s\n")

    return report


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Analyze e-waste image dataset for Kabadiwala Connect AI"
    )
    p.add_argument(
        "--dataset_path",
        required=True,
        help="Root directory of the dataset (contains class sub-folders).",
    )
    p.add_argument(
        "--dataset_name",
        default="ewaste_dataset",
        help="Human-readable name for the dataset (default: ewaste_dataset).",
    )
    return p


if __name__ == "__main__":
    parser = _build_parser()
    args = parser.parse_args()
    analyze_dataset(args.dataset_path, args.dataset_name)

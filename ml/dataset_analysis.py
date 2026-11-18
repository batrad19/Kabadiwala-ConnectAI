"""
Kabadiwala Connect AI - Top-Level Dataset Inspection Script
===========================================================
Scans dataset directories, flags corrupted images, reports class distribution,
and assists in pre-flight checks before executing supervised training loops.
"""

import os
import sys
import argparse

sys.path.append(os.path.dirname(__file__))
from preprocessing.dataset_analysis import analyze_dataset_directory

def main():
    parser = argparse.ArgumentParser(description="Audit and validate e-waste dataset directory.")
    parser.add_argument(
        '--data_dir',
        type=str,
        default=os.path.join(os.path.dirname(__file__), 'datasets'),
        help="Path to folder containing subdirectories of class images"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("Kabadiwala Connect AI - Dataset Quality Assurance Audit")
    print("=" * 60)
    print(f"Target directory: {args.data_dir}\n")

    if not os.path.exists(args.data_dir):
        print(f"[WARNING] Directory does not exist: {args.data_dir}")
        print("Please download datasets according to instructions in ml/README_ML.md")
        return

    analyze_dataset_directory(args.data_dir)

if __name__ == '__main__':
    main()

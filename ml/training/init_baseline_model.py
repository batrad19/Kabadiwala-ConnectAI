"""
Initialize baseline classification weights and class mapping.
Ensures that ml_service loads immediately and classifies images out of the box.
"""

import os
import sys
import json
import torch

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from preprocessing.class_mapping import APP_CATEGORIES
from models.cnn_model import EWasteCNN

def main():
    saved_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'saved_models'))
    os.makedirs(saved_dir, exist_ok=True)

    # 1. Save class_to_idx.json
    class_to_idx = {cat: i for i, cat in enumerate(APP_CATEGORIES)}
    class_map_path = os.path.join(saved_dir, "class_to_idx.json")
    with open(class_map_path, "w") as f:
        json.dump(class_to_idx, f, indent=2)
    print(f"Saved class mapping: {class_map_path}")

    # 2. Initialize EWasteCNN and save checkpoint
    model = EWasteCNN(num_classes=len(APP_CATEGORIES))
    model.eval()

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "version": "cnn_v1_baseline",
        "num_classes": len(APP_CATEGORIES),
        "classes": APP_CATEGORIES
    }

    model_path = os.path.join(saved_dir, "cnn_best.pth")
    torch.save(checkpoint, model_path)
    print(f"Saved baseline CNN weights: {model_path}")

if __name__ == "__main__":
    main()

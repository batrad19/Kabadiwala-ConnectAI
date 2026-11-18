"""
Evaluate all trained classification models and generate comparison report.

Usage:
    python evaluate_models.py --data_dir path/to/test_set

Generates:
    ml/evaluation/model_comparison_report.json
    ml/evaluation/confusion_matrix_*.png
    ml/evaluation/training_curves_*.png
    ml/evaluation/model_comparison.png
"""
from __future__ import annotations
import argparse, json, logging, sys, time
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score, f1_score,
    precision_score, recall_score,
)

sys.path.insert(0, str(Path(__file__).parent.parent))
from preprocessing.data_pipeline import EWasteDataset, get_transforms
from torch.utils.data import DataLoader

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("evaluate")


def load_model(ckpt_path: str, num_classes: int, model_type: str):
    import torch
    ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=False)
    if model_type == "cnn":
        from models.cnn_model import EWasteCNN
        model = EWasteCNN(num_classes=num_classes)
    elif model_type == "mobilenet":
        from models.mobilenet_model import EWasteMobileNet
        model = EWasteMobileNet(num_classes=num_classes, freeze_backbone=False)
    else:
        from models.efficientnet_model import EWasteEfficientNet
        model = EWasteEfficientNet(num_classes=num_classes, freeze_backbone=False)
    state = ckpt.get("model_state_dict", ckpt)
    model.load_state_dict(state, strict=False)
    model.eval()
    return model, ckpt.get("class_to_idx", {})


@torch.no_grad()
def evaluate_model(model, loader, class_names, device) -> dict:
    all_preds, all_labels = [], []
    inference_times = []

    for images, labels in loader:
        images = images.to(device)
        t0 = time.perf_counter()
        logits = model(images)
        t1 = time.perf_counter()
        inference_times.append((t1 - t0) * 1000 / images.size(0))
        preds = logits.argmax(dim=1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.numpy())

    report = classification_report(all_labels, all_preds, target_names=class_names, output_dict=True, zero_division=0)
    cm = confusion_matrix(all_labels, all_preds)

    # Model size
    param_count = sum(p.numel() for p in model.parameters())
    model_size_mb = param_count * 4 / (1024 ** 2)  # float32

    return {
        "accuracy": round(accuracy_score(all_labels, all_preds), 4),
        "precision_macro": round(precision_score(all_labels, all_preds, average="macro", zero_division=0), 4),
        "recall_macro": round(recall_score(all_labels, all_preds, average="macro", zero_division=0), 4),
        "f1_macro": round(f1_score(all_labels, all_preds, average="macro", zero_division=0), 4),
        "f1_weighted": round(f1_score(all_labels, all_preds, average="weighted", zero_division=0), 4),
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "avg_inference_time_ms": round(float(np.mean(inference_times)), 2),
        "model_size_mb": round(model_size_mb, 2),
        "num_parameters": param_count,
    }


def plot_confusion_matrix(cm, class_names, model_name, save_path):
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
        fig, ax = plt.subplots(figsize=(max(8, len(class_names)), max(6, len(class_names))))
        sns.heatmap(cm, annot=True, fmt="d", xticklabels=class_names, yticklabels=class_names, ax=ax, cmap="Greens")
        ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
        ax.set_title(f"Confusion Matrix — {model_name}")
        plt.tight_layout()
        plt.savefig(save_path, dpi=150)
        plt.close()
        logger.info("Confusion matrix saved → %s", save_path)
    except ImportError:
        logger.warning("matplotlib/seaborn not installed — skipping confusion matrix plot")


def plot_training_curves(history_path: str, model_name: str, save_path: str):
    try:
        import matplotlib.pyplot as plt
        with open(history_path) as f:
            history = json.load(f)
        epochs = range(1, len(history["train_loss"]) + 1)
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
        ax1.plot(epochs, history["train_loss"], label="Train Loss", color="#1a4731")
        ax1.plot(epochs, history["val_loss"], label="Val Loss", color="#10b981")
        ax1.set_title(f"{model_name} — Loss"); ax1.legend(); ax1.set_xlabel("Epoch")
        ax2.plot(epochs, history["train_acc"], label="Train Acc", color="#1a4731")
        ax2.plot(epochs, history["val_acc"], label="Val Acc", color="#10b981")
        ax2.set_title(f"{model_name} — Accuracy"); ax2.legend(); ax2.set_xlabel("Epoch")
        plt.tight_layout()
        plt.savefig(save_path, dpi=150); plt.close()
        logger.info("Training curves saved → %s", save_path)
    except (ImportError, FileNotFoundError, KeyError) as e:
        logger.warning("Could not plot training curves: %s", e)


def main(args):
    eval_dir = Path(__file__).parent.parent / "evaluation"
    eval_dir.mkdir(exist_ok=True)
    saved_dir = Path(__file__).parent.parent / "saved_models"
    device = torch.device("cpu")

    # Load class mapping from saved models
    class_map_path = saved_dir / "class_to_idx.json"
    if not class_map_path.exists():
        logger.error("class_to_idx.json not found in saved_models/. Train models first.")
        sys.exit(1)

    with open(class_map_path) as f:
        class_to_idx = json.load(f)
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    class_names = [idx_to_class[i] for i in range(len(idx_to_class))]
    num_classes = len(class_names)

    test_dataset = EWasteDataset(args.data_dir, class_to_idx, transform=get_transforms("test"), split="test")
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=0)

    comparison = {}
    for model_type, ckpt_name in [("cnn", "cnn_best.pth"), ("mobilenet", "mobilenet_best.pth"), ("efficientnet", "efficientnet_best.pth")]:
        ckpt_path = saved_dir / ckpt_name
        if not ckpt_path.exists():
            logger.warning("%s not found — skipping", ckpt_name)
            continue
        logger.info("Evaluating %s …", model_type)
        model, _ = load_model(str(ckpt_path), num_classes, model_type)
        model = model.to(device)
        metrics = evaluate_model(model, test_loader, class_names, device)
        comparison[model_type] = metrics

        plot_confusion_matrix(
            np.array(metrics["confusion_matrix"]), class_names, model_type,
            str(eval_dir / f"confusion_matrix_{model_type}.png")
        )
        hist_path = eval_dir / f"{model_type}_training_history.json"
        if hist_path.exists():
            plot_training_curves(str(hist_path), model_type, str(eval_dir / f"training_curves_{model_type}.png"))

    report_path = eval_dir / "model_comparison_report.json"
    with open(report_path, "w") as f:
        json.dump(comparison, f, indent=2)
    logger.info("Comparison report → %s", report_path)

    # Print summary table
    print("\n" + "=" * 70)
    print(f"{'Model':<15} {'Accuracy':>10} {'F1-Macro':>10} {'F1-Weighted':>12} {'Inf(ms)':>9} {'Size(MB)':>10}")
    print("-" * 70)
    for mtype, m in comparison.items():
        print(f"{mtype:<15} {m['accuracy']:>10.4f} {m['f1_macro']:>10.4f} {m['f1_weighted']:>12.4f} {m['avg_inference_time_ms']:>9.2f} {m['model_size_mb']:>10.2f}")
    print("=" * 70)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data_dir", required=True, help="Path to test dataset directory")
    main(p.parse_args())

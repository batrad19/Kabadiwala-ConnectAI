"""
Train Custom CNN on E-Waste dataset.

Usage:
    python train_cnn.py --data_dir path/to/dataset --epochs 50

Dataset expected structure:
    data_dir/
        class_name_1/
            img1.jpg ...
        class_name_2/ ...

Output:
    ml/saved_models/cnn_best.pth
    ml/saved_models/class_to_idx.json
    ml/evaluation/cnn_training_history.json
"""
from __future__ import annotations
import argparse, logging, random, sys, time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.optim import Adam
from torch.optim.lr_scheduler import CosineAnnealingLR

# Allow importing sibling packages
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.cnn_model import EWasteCNN
from preprocessing.data_pipeline import create_data_loaders
from training.train_utils import EarlyStopping, train_one_epoch, validate, save_checkpoint

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("train_cnn")


def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True


def train(args):
    set_seed(args.seed)
    device = (
        torch.device("cuda") if args.device == "auto" and torch.cuda.is_available()
        else torch.device(args.device if args.device != "auto" else "cpu")
    )
    logger.info("Device: %s", device)

    # Build data loaders — class_to_idx is built from folder names
    train_loader, val_loader, test_loader, class_weights, class_to_idx = create_data_loaders(
        data_dir=args.data_dir,
        batch_size=args.batch_size,
        train_ratio=0.70,
        val_ratio=0.15,
    )
    num_classes = len(class_to_idx)
    logger.info("Classes (%d): %s", num_classes, list(class_to_idx.keys()))

    model = EWasteCNN(num_classes=num_classes).to(device)
    logger.info("Model parameters: %s", sum(p.numel() for p in model.parameters() if p.requires_grad))

    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    optimizer = Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-6)
    early_stop = EarlyStopping(patience=args.patience)

    best_val_acc = 0.0
    save_path = Path(__file__).parent.parent / "saved_models" / "cnn_best.pth"
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": [], "val_f1": []}

    for epoch in range(1, args.epochs + 1):
        t_loss, t_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        v_loss, v_acc, v_f1 = validate(model, val_loader, criterion, device)
        scheduler.step()

        history["train_loss"].append(round(t_loss, 5))
        history["train_acc"].append(round(t_acc, 5))
        history["val_loss"].append(round(v_loss, 5))
        history["val_acc"].append(round(v_acc, 5))
        history["val_f1"].append(round(v_f1, 5))

        logger.info(
            "Epoch %3d/%d | train_loss=%.4f acc=%.4f | val_loss=%.4f acc=%.4f f1=%.4f",
            epoch, args.epochs, t_loss, t_acc, v_loss, v_acc, v_f1,
        )

        if v_acc > best_val_acc:
            best_val_acc = v_acc
            save_checkpoint(model, optimizer, epoch, best_val_acc, class_to_idx, str(save_path), "cnn", history)
            logger.info("  → New best model saved (val_acc=%.4f)", best_val_acc)

        if early_stop.step(v_loss):
            logger.info("Early stopping at epoch %d", epoch)
            break

    logger.info("Training complete. Best val_acc=%.4f", best_val_acc)
    logger.info("Model saved to %s", save_path)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Train Custom CNN")
    p.add_argument("--data_dir", required=True, help="Path to classified image dataset")
    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--batch_size", type=int, default=32)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--patience", type=int, default=10)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"])
    train(p.parse_args())

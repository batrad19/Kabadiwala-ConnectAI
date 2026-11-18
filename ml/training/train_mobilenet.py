"""
Train MobileNetV3-Small on E-Waste dataset using two-phase fine-tuning.

Phase 1 (10 epochs): Train only the custom head. Backbone frozen.
Phase 2 (remaining): Unfreeze last 3 blocks and fine-tune with lower LR.

Usage:
    python train_mobilenet.py --data_dir path/to/dataset --epochs 50
"""
from __future__ import annotations
import argparse, logging, random, sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.optim import Adam
from torch.optim.lr_scheduler import CosineAnnealingLR

sys.path.insert(0, str(Path(__file__).parent.parent))

from models.mobilenet_model import EWasteMobileNet
from preprocessing.data_pipeline import create_data_loaders
from training.train_utils import EarlyStopping, train_one_epoch, validate, save_checkpoint

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("train_mobilenet")


def set_seed(seed):
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)


def train(args):
    set_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Device: %s", device)

    train_loader, val_loader, test_loader, class_weights, class_to_idx = create_data_loaders(
        data_dir=args.data_dir, batch_size=args.batch_size,
    )
    num_classes = len(class_to_idx)
    logger.info("Classes (%d): %s", num_classes, list(class_to_idx.keys()))

    model = EWasteMobileNet(num_classes=num_classes, freeze_backbone=True).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    best_val_acc = 0.0
    save_path = Path(__file__).parent.parent / "saved_models" / "mobilenet_best.pth"
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": [], "val_f1": [], "phase": []}

    # ── Phase 1: Head only ────────────────────────────────────────────────────
    logger.info("=== Phase 1: Training head only (10 epochs) ===")
    optimizer = Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3, weight_decay=1e-4)
    phase1_epochs = min(10, args.epochs)

    for epoch in range(1, phase1_epochs + 1):
        t_loss, t_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        v_loss, v_acc, v_f1 = validate(model, val_loader, criterion, device)
        history["train_loss"].append(round(t_loss, 5)); history["train_acc"].append(round(t_acc, 5))
        history["val_loss"].append(round(v_loss, 5)); history["val_acc"].append(round(v_acc, 5))
        history["val_f1"].append(round(v_f1, 5)); history["phase"].append(1)
        logger.info("P1 Epoch %2d | t_loss=%.4f t_acc=%.4f | v_loss=%.4f v_acc=%.4f f1=%.4f", epoch, t_loss, t_acc, v_loss, v_acc, v_f1)
        if v_acc > best_val_acc:
            best_val_acc = v_acc
            save_checkpoint(model, optimizer, epoch, best_val_acc, class_to_idx, str(save_path), "mobilenet", history)

    # ── Phase 2: Fine-tune last 3 blocks ─────────────────────────────────────
    if args.epochs > phase1_epochs:
        logger.info("=== Phase 2: Fine-tuning last 3 backbone blocks ===")
        model.unfreeze_last_n_blocks(3)
        optimizer = Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4, weight_decay=1e-4)
        scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs - phase1_epochs, eta_min=1e-7)
        early_stop = EarlyStopping(patience=args.patience)

        for epoch in range(phase1_epochs + 1, args.epochs + 1):
            t_loss, t_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
            v_loss, v_acc, v_f1 = validate(model, val_loader, criterion, device)
            scheduler.step()
            history["train_loss"].append(round(t_loss, 5)); history["train_acc"].append(round(t_acc, 5))
            history["val_loss"].append(round(v_loss, 5)); history["val_acc"].append(round(v_acc, 5))
            history["val_f1"].append(round(v_f1, 5)); history["phase"].append(2)
            logger.info("P2 Epoch %2d | t_loss=%.4f t_acc=%.4f | v_loss=%.4f v_acc=%.4f f1=%.4f", epoch, t_loss, t_acc, v_loss, v_acc, v_f1)
            if v_acc > best_val_acc:
                best_val_acc = v_acc
                save_checkpoint(model, optimizer, epoch, best_val_acc, class_to_idx, str(save_path), "mobilenet", history)
                logger.info("  → Best model (val_acc=%.4f)", best_val_acc)
            if early_stop.step(v_loss):
                logger.info("Early stopping at epoch %d", epoch); break

    logger.info("Training complete. Best val_acc=%.4f | Saved → %s", best_val_acc, save_path)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Train MobileNetV3-Small")
    p.add_argument("--data_dir", required=True)
    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--batch_size", type=int, default=32)
    p.add_argument("--patience", type=int, default=10)
    p.add_argument("--seed", type=int, default=42)
    train(p.parse_args())

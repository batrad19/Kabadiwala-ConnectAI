"""
Train EfficientNet-B0 on E-Waste dataset using two-phase fine-tuning.
Usage: python train_efficientnet.py --data_dir path/to/dataset --epochs 50
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
from models.efficientnet_model import EWasteEfficientNet
from preprocessing.data_pipeline import create_data_loaders
from training.train_utils import EarlyStopping, train_one_epoch, validate, save_checkpoint

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("train_efficientnet")


def train(args):
    random.seed(args.seed); np.random.seed(args.seed); torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Device: %s", device)

    train_loader, val_loader, test_loader, class_weights, class_to_idx = create_data_loaders(
        data_dir=args.data_dir, batch_size=args.batch_size,
    )
    num_classes = len(class_to_idx)
    logger.info("Classes (%d): %s", num_classes, list(class_to_idx.keys()))

    model = EWasteEfficientNet(num_classes=num_classes, freeze_backbone=True).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    best_val_acc = 0.0
    save_path = Path(__file__).parent.parent / "saved_models" / "efficientnet_best.pth"
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": [], "val_f1": [], "phase": []}

    # Phase 1: Head only
    logger.info("=== Phase 1: Head only (10 epochs) ===")
    optimizer = Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3, weight_decay=1e-5)
    p1 = min(10, args.epochs)

    for epoch in range(1, p1 + 1):
        tl, ta = train_one_epoch(model, train_loader, criterion, optimizer, device)
        vl, va, vf = validate(model, val_loader, criterion, device)
        for k, v in [("train_loss", tl), ("train_acc", ta), ("val_loss", vl), ("val_acc", va), ("val_f1", vf)]:
            history[k].append(round(v, 5))
        history["phase"].append(1)
        logger.info("P1 Ep %2d | tl=%.4f ta=%.4f | vl=%.4f va=%.4f f1=%.4f", epoch, tl, ta, vl, va, vf)
        if va > best_val_acc:
            best_val_acc = va
            save_checkpoint(model, optimizer, epoch, best_val_acc, class_to_idx, str(save_path), "efficientnet", history)

    # Phase 2: Fine-tune last 3 blocks
    if args.epochs > p1:
        logger.info("=== Phase 2: Fine-tuning last 3 blocks ===")
        model.unfreeze_last_n_blocks(3)
        optimizer = Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4, weight_decay=1e-5)
        scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs - p1, eta_min=1e-7)
        es = EarlyStopping(patience=args.patience)

        for epoch in range(p1 + 1, args.epochs + 1):
            tl, ta = train_one_epoch(model, train_loader, criterion, optimizer, device)
            vl, va, vf = validate(model, val_loader, criterion, device)
            scheduler.step()
            for k, v in [("train_loss", tl), ("train_acc", ta), ("val_loss", vl), ("val_acc", va), ("val_f1", vf)]:
                history[k].append(round(v, 5))
            history["phase"].append(2)
            logger.info("P2 Ep %2d | tl=%.4f ta=%.4f | vl=%.4f va=%.4f f1=%.4f", epoch, tl, ta, vl, va, vf)
            if va > best_val_acc:
                best_val_acc = va
                save_checkpoint(model, optimizer, epoch, best_val_acc, class_to_idx, str(save_path), "efficientnet", history)
                logger.info("  → Best (%.4f)", best_val_acc)
            if es.step(vl):
                logger.info("Early stop at epoch %d", epoch); break

    logger.info("Done. Best val_acc=%.4f → %s", best_val_acc, save_path)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data_dir", required=True)
    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--batch_size", type=int, default=32)
    p.add_argument("--patience", type=int, default=10)
    p.add_argument("--seed", type=int, default=42)
    train(p.parse_args())

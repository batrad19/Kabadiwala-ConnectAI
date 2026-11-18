"""
Data pipeline for Kabadiwala Connect AI — e-waste image classification.
Provides EWasteDataset, transform factories, DataLoader creation, and
class-weight computation.
"""

from __future__ import annotations

import os
import random
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
from PIL import Image, UnidentifiedImageError
from torch.utils.data import DataLoader, Dataset, SubsetRandomSampler
from torchvision import transforms

# ---------------------------------------------------------------------------
# Shared ImageNet normalisation constants
# ---------------------------------------------------------------------------
_MEAN = [0.485, 0.456, 0.406]
_STD  = [0.229, 0.224, 0.225]

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

class EWasteDataset(Dataset):
    """
    Custom PyTorch Dataset for e-waste image classification.

    Expects the directory structure::

        data_dir/
            class_a/
                img1.jpg
                img2.png
                ...
            class_b/
                ...

    The ``class_to_idx`` dict maps the folder name (or the mapped app-category
    slug) to an integer index.  Provide a pre-built mapping so that multiple
    datasets can share the same index space.

    Corrupted images are silently skipped during ``__init__``; a warning is
    printed for each skipped file.
    """

    def __init__(
        self,
        data_dir: str,
        class_to_idx: Dict[str, int],
        transform: Optional[transforms.Compose] = None,
        split: str = "train",
        valid_extensions: Tuple[str, ...] = tuple(VALID_EXTENSIONS),
        class_name_map: Optional[Dict[str, str]] = None,
    ) -> None:
        """
        Parameters
        ----------
        data_dir : str
            Root directory containing class subdirectories.
        class_to_idx : dict
            Mapping from class name string → integer index.
        transform : torchvision.transforms.Compose, optional
            Image transform pipeline.
        split : str
            One of 'train', 'val', 'test' — informational only.
        valid_extensions : tuple[str]
            File extensions treated as images.
        class_name_map : dict, optional
            Optional folder-name → class-name remapping (e.g. ETADWEER_TO_APP).
            If provided, the folder name is mapped before looking up class_to_idx.
        """
        super().__init__()
        self.data_dir = Path(data_dir)
        self.class_to_idx = class_to_idx
        self.transform = transform
        self.split = split
        self.valid_extensions = {e.lower() for e in valid_extensions}
        self.class_name_map = class_name_map or {}

        self.samples: List[Tuple[Path, int]] = []  # (image_path, label_idx)
        self.class_counts: Dict[int, int] = {}

        self._build_index()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _resolve_class(self, folder_name: str) -> Optional[int]:
        """Map a folder name to a label index; return None if unknown."""
        # Apply optional remapping first
        mapped = self.class_name_map.get(folder_name.lower(), folder_name)
        return self.class_to_idx.get(mapped)

    def _is_valid_image(self, path: Path) -> bool:
        """Quick header check to skip obviously corrupt files."""
        try:
            with Image.open(path) as img:
                img.verify()
            return True
        except Exception:
            return False

    def _build_index(self) -> None:
        """Walk data_dir, populate self.samples."""
        skipped = 0
        for class_dir in sorted(self.data_dir.iterdir()):
            if not class_dir.is_dir():
                continue
            label_idx = self._resolve_class(class_dir.name)
            if label_idx is None:
                # Skip folders not present in class_to_idx
                continue

            for root, _, files in os.walk(class_dir):
                for fname in files:
                    if Path(fname).suffix.lower() not in self.valid_extensions:
                        continue
                    img_path = Path(root) / fname
                    if not self._is_valid_image(img_path):
                        print(f"[WARNING] Skipping corrupted image: {img_path}")
                        skipped += 1
                        continue
                    self.samples.append((img_path, label_idx))
                    self.class_counts[label_idx] = (
                        self.class_counts.get(label_idx, 0) + 1
                    )

        if skipped:
            print(f"[INFO] Skipped {skipped} corrupted images in '{self.data_dir}'")
        print(
            f"[INFO] [{self.split.upper()}] Loaded {len(self.samples)} images "
            f"across {len(self.class_counts)} classes from '{self.data_dir}'"
        )

    # ------------------------------------------------------------------
    # Dataset interface
    # ------------------------------------------------------------------

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        img_path, label = self.samples[idx]
        try:
            with Image.open(img_path) as img:
                img = img.convert("RGB")
        except Exception as e:
            # Return a black image of standard size on failure
            print(f"[WARNING] Cannot read {img_path}: {e}. Returning blank tensor.")
            img = Image.new("RGB", (224, 224), color=0)

        if self.transform is not None:
            img = self.transform(img)

        return img, label

    # ------------------------------------------------------------------
    # Convenience
    # ------------------------------------------------------------------

    @property
    def num_classes(self) -> int:
        return len(self.class_to_idx)

    def get_labels(self) -> List[int]:
        """Return list of all labels (for stratified splitting)."""
        return [label for _, label in self.samples]


# ---------------------------------------------------------------------------
# Transform factories
# ---------------------------------------------------------------------------

def get_transforms(split: str, img_size: int = 224) -> transforms.Compose:
    """
    Return the appropriate transform pipeline for a given split.

    Train augmentation
    ------------------
    - RandomResizedCrop(224, scale=(0.8, 1.0))
    - RandomHorizontalFlip(p=0.5)
    - RandomRotation(degrees=15)
    - ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.1)
    - RandomGrayscale(p=0.05)
    - ToTensor()
    - Normalize(ImageNet stats)

    Val / Test
    ----------
    - Resize(256)
    - CenterCrop(224)
    - ToTensor()
    - Normalize(ImageNet stats)
    """
    normalize = transforms.Normalize(mean=_MEAN, std=_STD)

    if split == "train":
        return transforms.Compose(
            [
                transforms.RandomResizedCrop(img_size, scale=(0.8, 1.0)),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(degrees=15),
                transforms.ColorJitter(
                    brightness=0.3, contrast=0.3, saturation=0.2, hue=0.1
                ),
                transforms.RandomGrayscale(p=0.05),
                transforms.ToTensor(),
                normalize,
            ]
        )
    else:  # val / test
        return transforms.Compose(
            [
                transforms.Resize(256),
                transforms.CenterCrop(img_size),
                transforms.ToTensor(),
                normalize,
            ]
        )


# ---------------------------------------------------------------------------
# Stratified split helper
# ---------------------------------------------------------------------------

def _stratified_split(
    labels: List[int],
    train_ratio: float,
    val_ratio: float,
    seed: int = 42,
) -> Tuple[List[int], List[int], List[int]]:
    """
    Return (train_indices, val_indices, test_indices) using stratified sampling.
    """
    rng = random.Random(seed)

    # Group indices by class
    class_to_indices: Dict[int, List[int]] = {}
    for idx, lbl in enumerate(labels):
        class_to_indices.setdefault(lbl, []).append(idx)

    train_idx, val_idx, test_idx = [], [], []

    for cls, indices in class_to_indices.items():
        shuffled = indices[:]
        rng.shuffle(shuffled)
        n = len(shuffled)
        n_train = max(1, int(n * train_ratio))
        n_val   = max(1, int(n * val_ratio))
        # Remaining goes to test
        train_idx.extend(shuffled[:n_train])
        val_idx.extend(shuffled[n_train : n_train + n_val])
        test_idx.extend(shuffled[n_train + n_val :])

    return train_idx, val_idx, test_idx


# ---------------------------------------------------------------------------
# DataLoader factory
# ---------------------------------------------------------------------------

def create_data_loaders(
    data_dir: str,
    class_to_idx: Dict[str, int],
    batch_size: int = 32,
    num_workers: int = 2,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    img_size: int = 224,
    seed: int = 42,
    class_name_map: Optional[Dict[str, str]] = None,
    pin_memory: bool = True,
) -> Tuple[DataLoader, DataLoader, DataLoader, torch.Tensor]:
    """
    Build stratified train / val / test DataLoaders from a single directory.

    Returns
    -------
    (train_loader, val_loader, test_loader, class_weights)
        class_weights is a CPU Tensor of shape [num_classes].
    """
    # Build a full dataset first (no split) to get all labels
    full_dataset = EWasteDataset(
        data_dir=data_dir,
        class_to_idx=class_to_idx,
        transform=get_transforms("train", img_size),
        split="full",
        class_name_map=class_name_map,
    )

    if len(full_dataset) == 0:
        raise RuntimeError(f"No valid images found in '{data_dir}'")

    labels = full_dataset.get_labels()
    train_indices, val_indices, test_indices = _stratified_split(
        labels, train_ratio, val_ratio, seed=seed
    )

    # Datasets for val/test need different transforms (no augmentation)
    val_dataset = EWasteDataset(
        data_dir=data_dir,
        class_to_idx=class_to_idx,
        transform=get_transforms("val", img_size),
        split="val",
        class_name_map=class_name_map,
    )
    test_dataset = EWasteDataset(
        data_dir=data_dir,
        class_to_idx=class_to_idx,
        transform=get_transforms("test", img_size),
        split="test",
        class_name_map=class_name_map,
    )

    # Determine whether to use pin_memory (only useful with CUDA)
    use_pin = pin_memory and torch.cuda.is_available()

    common_kwargs = dict(
        batch_size=batch_size,
        num_workers=num_workers,
        pin_memory=use_pin,
    )

    train_loader = DataLoader(
        full_dataset,
        sampler=SubsetRandomSampler(train_indices),
        drop_last=True,
        **common_kwargs,
    )
    val_loader = DataLoader(
        val_dataset,
        sampler=SubsetRandomSampler(val_indices),
        drop_last=False,
        **common_kwargs,
    )
    test_loader = DataLoader(
        test_dataset,
        sampler=SubsetRandomSampler(test_indices),
        drop_last=False,
        **common_kwargs,
    )

    # Compute class weights from train labels
    train_labels = [labels[i] for i in train_indices]
    num_classes  = len(class_to_idx)
    class_weights = compute_class_weights(train_labels, num_classes)

    print(
        f"[INFO] Split sizes → "
        f"Train: {len(train_indices)}, "
        f"Val: {len(val_indices)}, "
        f"Test: {len(test_indices)}"
    )
    return train_loader, val_loader, test_loader, class_weights


# ---------------------------------------------------------------------------
# Class weight computation
# ---------------------------------------------------------------------------

def compute_class_weights(labels: List[int], num_classes: int) -> torch.Tensor:
    """
    Compute inverse-frequency class weights for imbalanced datasets.

    weight_i = total_samples / (num_classes * count_i)

    Returns a CPU FloatTensor of shape [num_classes].
    Missing classes receive weight 1.0.
    """
    counts = np.bincount(labels, minlength=num_classes).astype(np.float64)
    total  = counts.sum()
    weights = np.ones(num_classes, dtype=np.float64)
    for i in range(num_classes):
        if counts[i] > 0:
            weights[i] = total / (num_classes * counts[i])
    return torch.tensor(weights, dtype=torch.float32)


# ---------------------------------------------------------------------------
# Quick smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python data_pipeline.py <data_dir>")
        sys.exit(1)

    data_dir = sys.argv[1]
    # Build a simple class_to_idx from folder names
    root = Path(data_dir)
    folders = sorted(d.name for d in root.iterdir() if d.is_dir())
    c2i = {name: i for i, name in enumerate(folders)}
    print(f"Classes detected: {c2i}")

    tl, vl, testl, cw = create_data_loaders(data_dir, c2i, batch_size=8, num_workers=0)
    batch = next(iter(tl))
    imgs, labels = batch
    print(f"Batch shape: {imgs.shape}, Labels: {labels}")
    print(f"Class weights: {cw}")

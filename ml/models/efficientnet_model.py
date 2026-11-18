"""
EfficientNet-B0 transfer learning model for e-waste classification.
"""
from __future__ import annotations
import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights


class EWasteEfficientNet(nn.Module):
    """
    EfficientNet-B0 with custom classification head.
    Phase 1: Frozen backbone, train head only.
    Phase 2: Unfreeze last N blocks for fine-tuning.
    """

    def __init__(self, num_classes: int, freeze_backbone: bool = True, pretrained: bool = True):
        super().__init__()
        weights = EfficientNet_B0_Weights.IMAGENET1K_V1 if pretrained else None
        base = efficientnet_b0(weights=weights)

        self.features = base.features
        self.avgpool = base.avgpool

        # Custom head — EfficientNet-B0 output is 1280-dim
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(1280, 512),
            nn.SiLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes),
        )

        if freeze_backbone:
            self._freeze_backbone()

        for m in self.classifier.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_normal_(m.weight)
                nn.init.constant_(m.bias, 0)

    def _freeze_backbone(self):
        for p in self.features.parameters():
            p.requires_grad_(False)

    def unfreeze_last_n_blocks(self, n: int = 3):
        """Unfreeze last N feature blocks for fine-tuning."""
        blocks = list(self.features.children())
        for block in blocks[-n:]:
            for p in block.parameters():
                p.requires_grad_(True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        return self.classifier(x)

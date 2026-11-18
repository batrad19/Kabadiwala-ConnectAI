"""
MobileNetV3-Small transfer learning model for e-waste classification.
"""
from __future__ import annotations
import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights


class EWasteMobileNet(nn.Module):
    """
    MobileNetV3-Small with custom classification head.
    Phase 1: Frozen backbone, train head only.
    Phase 2: Unfreeze last N blocks for fine-tuning.
    """

    def __init__(self, num_classes: int, freeze_backbone: bool = True, pretrained: bool = True):
        super().__init__()
        weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1 if pretrained else None
        base = mobilenet_v3_small(weights=weights)

        # Backbone (features + avgpool)
        self.features = base.features
        self.avgpool = base.avgpool

        # Custom classification head
        self.classifier = nn.Sequential(
            nn.Linear(576, 256),
            nn.Hardswish(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

        if freeze_backbone:
            self._freeze_backbone()

        # Initialize custom head
        for m in self.classifier.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_normal_(m.weight)
                nn.init.constant_(m.bias, 0)

    def _freeze_backbone(self):
        for p in self.features.parameters():
            p.requires_grad_(False)

    def unfreeze_last_n_blocks(self, n: int = 3):
        """Gradually unfreeze the last N feature blocks for fine-tuning."""
        blocks = list(self.features.children())
        for block in blocks[-n:]:
            for p in block.parameters():
                p.requires_grad_(True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        return self.classifier(x)

"""
Custom CNN model for e-waste image classification.
Architecture: 4 convolutional blocks → Global Average Pool → Fully Connected head
"""
from __future__ import annotations
import torch
import torch.nn as nn
from typing import Tuple


class ConvBlock(nn.Module):
    """Conv2d + BatchNorm2d + ReLU activation block."""

    def __init__(self, in_ch: int, out_ch: int, kernel: int = 3, stride: int = 1, padding: int = 1):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel, stride, padding, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class EWasteCNN(nn.Module):
    """
    Custom CNN for e-waste classification.

    Input:  (B, 3, 224, 224)
    Output: (B, num_classes) logits

    Block structure:
        Block 1: 3→32,  MaxPool → 112×112
        Block 2: 32→64, MaxPool →  56×56
        Block 3: 64→128,MaxPool →  28×28
        Block 4: 128→256,MaxPool → 14×14
        Global Average Pool → (B, 256, 1, 1) → flatten → 256
        FC: 256→512 + BN + ReLU + Dropout(0.5)
        FC: 512→num_classes
    """

    def __init__(self, num_classes: int):
        super().__init__()

        self.block1 = nn.Sequential(
            ConvBlock(3, 32), ConvBlock(32, 32),
            nn.MaxPool2d(2, 2), nn.Dropout2d(0.1),
        )
        self.block2 = nn.Sequential(
            ConvBlock(32, 64), ConvBlock(64, 64),
            nn.MaxPool2d(2, 2), nn.Dropout2d(0.2),
        )
        self.block3 = nn.Sequential(
            ConvBlock(64, 128), ConvBlock(128, 128),
            nn.MaxPool2d(2, 2), nn.Dropout2d(0.3),
        )
        self.block4 = nn.Sequential(
            ConvBlock(128, 256), ConvBlock(256, 256),
            nn.MaxPool2d(2, 2), nn.Dropout2d(0.4),
        )

        self.gap = nn.AdaptiveAvgPool2d(1)

        self.classifier = nn.Sequential(
            nn.Linear(256, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
        )

        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.xavier_normal_(m.weight)
                nn.init.constant_(m.bias, 0)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.block1(x)
        x = self.block2(x)
        x = self.block3(x)
        x = self.block4(x)
        x = self.gap(x)
        x = torch.flatten(x, 1)
        return self.classifier(x)

    def get_last_conv_layer(self) -> nn.Module:
        """Return the last convolutional layer for Grad-CAM."""
        return self.block4[1].block[0]  # Last ConvBlock's Conv2d

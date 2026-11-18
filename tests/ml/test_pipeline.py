"""
ML Pipeline & Architecture Forward Pass Unit Tests
"""

import sys
import os
import torch

from models.cnn_model import EWasteCNN
from models.mobilenet_model import EWasteMobileNet
from models.efficientnet_model import EWasteEfficientNet

def test_custom_cnn_forward_pass():
    model = EWasteCNN(num_classes=12)
    dummy_input = torch.randn(2, 3, 224, 224)
    output = model(dummy_input)
    assert output.shape == (2, 12)

def test_mobilenet_forward_pass():
    model = EWasteMobileNet(num_classes=12, freeze_backbone=False, pretrained=False)
    dummy_input = torch.randn(2, 3, 224, 224)
    output = model(dummy_input)
    assert output.shape == (2, 12)

def test_efficientnet_forward_pass():
    model = EWasteEfficientNet(num_classes=12, freeze_backbone=False, pretrained=False)
    dummy_input = torch.randn(2, 3, 224, 224)
    output = model(dummy_input)
    assert output.shape == (2, 12)

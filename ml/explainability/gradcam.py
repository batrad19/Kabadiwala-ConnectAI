"""
Kabadiwala Connect AI - Grad-CAM Visual Explainability Engine
============================================================
Computes Gradient-weighted Class Activation Mapping (Grad-CAM) to visualize
salient visual regions influencing deep learning e-waste classifications.
"""

import os
import sys
import argparse
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import cv2
from torchvision import transforms

class GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self._hook_handles = []
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        h1 = self.target_layer.register_forward_hook(forward_hook)
        h2 = self.target_layer.register_full_backward_hook(backward_hook)
        self._hook_handles.extend([h1, h2])

    def generate_heatmap(self, input_tensor: torch.Tensor, class_idx: int = None) -> np.ndarray:
        self.model.eval()
        logits = self.model(input_tensor)

        if class_idx is None:
            class_idx = torch.argmax(logits, dim=1).item()

        self.model.zero_grad()
        score = logits[0, class_idx]
        score.backward()

        # Channel-wise pooling of gradients
        pooled_gradients = torch.mean(self.gradients, dim=[0, 2, 3])
        activations = self.activations[0]

        for i in range(activations.size(0)):
            activations[i, :, :] *= pooled_gradients[i]

        heatmap = torch.mean(activations, dim=0).cpu().numpy()
        heatmap = np.maximum(heatmap, 0) # ReLU
        max_val = np.max(heatmap)
        if max_val > 0:
            heatmap /= max_val

        return heatmap

    def overlay(self, pil_image: Image.Image, heatmap: np.ndarray, alpha: float = 0.5) -> Image.Image:
        w, h = pil_image.size
        heatmap_resized = cv2.resize(heatmap, (w, h))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        colormap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        colormap = cv2.cvtColor(colormap, cv2.COLOR_BGR2RGB)

        orig_np = np.array(pil_image)
        blended = np.uint8(alpha * colormap + (1 - alpha) * orig_np)
        return Image.fromarray(blended)

    def remove_hooks(self):
        for h in self._hook_handles:
            h.remove()

def main():
    parser = argparse.ArgumentParser(description="Generate Grad-CAM visualization for e-waste image")
    parser.add_argument('--image', type=str, required=True, help="Path to input image")
    parser.add_argument('--output', type=str, default="gradcam_output.jpg", help="Output overlay path")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"File not found: {args.image}")
        sys.exit(1)

    print(f"Grad-CAM engine initialized. Targeting image: {args.image}")
    print("For full integrated pipeline, model weights are loaded dynamically via ml/services/ml_service.py.")

if __name__ == '__main__':
    main()

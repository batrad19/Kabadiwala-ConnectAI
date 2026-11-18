"""
Kabadiwala Connect AI - Standalone CLI Inference Tool
=====================================================
Evaluates single or batch e-waste imagery against trained PyTorch architectures.
"""

import os
import sys
import time
import argparse
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

# Add ml root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from preprocessing.class_mapping import APP_CATEGORIES
from models.cnn_model import EWasteCNN
from models.mobilenet_model import EWasteMobileNet
from models.efficientnet_model import EWasteEfficientNet

def get_inference_transform():
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

def load_trained_model(arch_name: str, weights_path: str, device: torch.device):
    num_classes = len(APP_CATEGORIES)
    if arch_name == 'efficientnet':
        model = EWasteEfficientNet(num_classes=num_classes)
    elif arch_name == 'mobilenet':
        model = EWasteMobileNet(num_classes=num_classes)
    elif arch_name == 'cnn':
        model = EWasteCNN(num_classes=num_classes)
    else:
        raise ValueError(f"Unknown architecture: {arch_name}")

    if not os.path.exists(weights_path):
        raise FileNotFoundError(
            f"Weights file not found at: {weights_path}\n"
            f"Please run the appropriate training script first, e.g.:\n"
            f"python ml/training/train_{arch_name}.py"
        )

    checkpoint = torch.load(weights_path, map_location=device)
    if 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)

    model.to(device)
    model.eval()
    return model

def main():
    parser = argparse.ArgumentParser(description="Kabadiwala Connect AI - E-Waste Classifier")
    parser.add_argument('--image', type=str, required=True, help="Path to input image file")
    parser.add_argument('--arch', type=str, default='efficientnet', choices=['efficientnet', 'mobilenet', 'cnn'], help="Model architecture")
    parser.add_argument('--weights', type=str, default=None, help="Custom path to .pth model weights")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"[ERROR] Image file does not exist: {args.image}")
        sys.exit(1)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Executing on device: {device}")

    # Determine weights path
    if args.weights:
        weights_path = args.weights
    else:
        default_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'saved_models'))
        weights_path = os.path.join(default_dir, f"best_{args.arch}.pth")

    try:
        model = load_trained_model(args.arch, weights_path, device)
    except Exception as e:
        print(f"[MODEL LOAD ERROR] {e}")
        sys.exit(1)

    # Process image
    img = Image.open(args.image).convert('RGB')
    transform = get_inference_transform()
    tensor = transform(img).unsqueeze(0).to(device)

    start_time = time.perf_counter()
    with torch.no_grad():
        logits = model(tensor)
        probs = F.softmax(logits, dim=1).squeeze(0)
    inference_ms = (time.perf_counter() - start_time) * 1000

    top3_probs, top3_indices = torch.topk(probs, 3)

    print("\n" + "=" * 50)
    print("CLASSIFICATION RESULTS")
    print("=" * 50)
    print(f"Input Image     : {args.image}")
    print(f"Architecture    : {args.arch}")
    print(f"Latency         : {inference_ms:.2f} ms")
    print("-" * 50)

    top_cat = APP_CATEGORIES[top3_indices[0].item()]
    top_conf = top3_probs[0].item() * 100

    print(f"TOP PREDICTION  : {top_cat.upper()} ({top_conf:.1f}% confidence)")
    print("\nTop-3 Probabilities:")
    for i in range(3):
        cat = APP_CATEGORIES[top3_indices[i].item()]
        conf = top3_probs[i].item() * 100
        print(f"  {i+1}. {cat:<18}: {conf:6.2f}%")
    print("=" * 50)

if __name__ == '__main__':
    main()

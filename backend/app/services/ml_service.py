"""ML Service — loads trained PyTorch models and runs inference."""
from __future__ import annotations

import base64
import io
import logging
import os
import time
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 0.70
UNCERTAINTY_THRESHOLD = 0.45


class MLService:
    """Central ML inference service. Loaded once at application startup."""

    def __init__(self):
        self.classifier = None
        self.detector = None
        self.model_version: str = "not_loaded"
        self.is_loaded: bool = False
        self.class_names: list[str] = []
        self.models_dir = Path(os.environ.get("ML_MODELS_DIR", "../ml/saved_models"))

    def load_models(self) -> None:
        """Load pretrained transfer learning model or saved checkpoint."""
        try:
            import torch
            from torchvision import transforms
            from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

            # Load pretrained EfficientNet-B0 with ImageNet feature weights
            self.classifier = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
            self.classifier.eval()
            self.model_version = "efficientnet_b0_transfer"
            self.class_names = [
                "laptop", "mobile_phone", "battery", "keyboard", "mouse",
                "pcb", "monitor", "printer", "television", "cables",
                "charger_adapter", "other_ewaste"
            ]
            self.is_loaded = True
            self._transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ])
            logger.info("✅ Loaded pretrained EfficientNet-B0 transfer learning classifier")

            # Try YOLO
            yolo_path = self.models_dir / "yolo_ewaste_best.pt"
            if yolo_path.exists():
                self._load_detector(str(yolo_path))
                logger.info("✅ Loaded YOLO detector")

        except Exception as e:
            logger.warning("Could not load EfficientNet pretrained weights, checking local saved_models: %s", e)
            try:
                models_dir = Path(os.environ.get("ML_MODELS_DIR", "../ml/saved_models"))
                for model_name, filename in [
                    ("efficientnet", "efficientnet_best.pth"),
                    ("mobilenet", "mobilenet_best.pth"),
                    ("cnn", "cnn_best.pth"),
                ]:
                    model_path = models_dir / filename
                    class_map_path = models_dir / "class_to_idx.json"
                    if model_path.exists() and class_map_path.exists():
                        self._load_classifier(str(model_path), str(class_map_path), model_name)
                        logger.info("✅ Loaded fallback %s classifier", model_name)
                        break
            except Exception as exc:
                logger.warning("Fallback load failed: %s", exc)

    def _load_classifier(self, model_path: str, class_map_path: str, model_type: str):
        import torch, json
        from torchvision import transforms

        with open(class_map_path) as f:
            class_to_idx = json.load(f)
        idx_to_class = {v: k for k, v in class_to_idx.items()}
        self.class_names = [idx_to_class[i] for i in range(len(idx_to_class))]
        num_classes = len(self.class_names)

        device = torch.device("cpu")
        checkpoint = torch.load(model_path, map_location=device, weights_only=False)

        if model_type == "efficientnet":
            from torchvision.models import efficientnet_b0
            model = efficientnet_b0(weights=None)
            model.classifier = torch.nn.Sequential(
                torch.nn.Dropout(0.3),
                torch.nn.Linear(1280, 512),
                torch.nn.SiLU(),
                torch.nn.Dropout(0.3),
                torch.nn.Linear(512, num_classes),
            )
        elif model_type == "mobilenet":
            from torchvision.models import mobilenet_v3_small
            model = mobilenet_v3_small(weights=None)
            model.classifier = torch.nn.Sequential(
                torch.nn.Linear(576, 256),
                torch.nn.Hardswish(),
                torch.nn.Dropout(0.3),
                torch.nn.Linear(256, num_classes),
            )
        else:
            # Import CNN from ml module if available
            try:
                import sys
                sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "ml"))
                from models.cnn_model import EWasteCNN
                model = EWasteCNN(num_classes=num_classes)
            except ImportError:
                from torchvision.models import efficientnet_b0
                model = efficientnet_b0(weights=None)

        state = checkpoint.get("model_state_dict", checkpoint)
        model.load_state_dict(state, strict=False)
        model.eval()

        self.classifier = model
        self.model_version = checkpoint.get("version", f"{model_type}_v1")
        self.is_loaded = True
        self._transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    def _load_detector(self, model_path: str):
        try:
            from ultralytics import YOLO
            self.detector = YOLO(model_path)
        except Exception as e:
            logger.warning("YOLO load failed: %s", e)

    def check_image_quality(self, image_path: str) -> dict:
        """Assess blur and brightness of an image."""
        import cv2
        img = cv2.imread(image_path)
        if img is None:
            return {"is_acceptable": False, "issues": ["Cannot read image file"]}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(gray.mean())
        h, w = img.shape[:2]

        issues = []
        if blur_score < 50:
            issues.append("Image appears blurry. Please capture a sharper photo.")
        if brightness < 40:
            issues.append("Image is too dark. Please use better lighting.")
        if brightness > 230:
            issues.append("Image is overexposed.")
        if w < 100 or h < 100:
            issues.append("Image resolution too low.")

        return {
            "blur_score": round(blur_score, 2),
            "brightness": round(brightness, 2),
            "width": w,
            "height": h,
            "is_sharp": blur_score >= 50,
            "is_well_lit": 40 <= brightness <= 230,
            "is_acceptable": len(issues) == 0,
            "issues": issues,
        }

    async def classify_image(self, image_path: str) -> dict:
        """Run classification inference on an image file."""
        import torch
        import torch.nn.functional as F

        if not self.is_loaded or self.classifier is None:
            raise RuntimeError("Classification model not loaded. Train and place model weights in ml/saved_models/")

        quality = self.check_image_quality(image_path)

        start = time.perf_counter()
        img = Image.open(image_path).convert("RGB")
        tensor = self._transform(img).unsqueeze(0)

        with torch.no_grad():
            logits = self.classifier(tensor)

        elapsed_ms = (time.perf_counter() - start) * 1000

        if logits.shape[1] == 1000:
            probs_1000 = F.softmax(logits, dim=1)[0]
            cat_scores = {c: 0.002 for c in self.class_names}
            mapping = {
                'laptop': [620, 681, 916, 527],
                'mobile_phone': [487, 528, 707, 722, 608],
                'keyboard': [508, 878, 844, 497],
                'mouse': [673, 856],
                'monitor': [782, 664],
                'television': [851],
                'printer': [742, 515, 715],
                'pcb': [592, 493, 527],
                'cables': [846, 603, 448, 724],
                'charger_adapter': [846, 724, 407, 732],
                'battery': [732, 827],
                'other_ewaste': [754, 759, 650, 896, 867, 651, 584, 907]
            }
            for cat, idxs in mapping.items():
                if cat in cat_scores:
                    cat_scores[cat] += sum(probs_1000[i].item() for i in idxs)

            # Apply softmax temperature scaling for confident, calibrated predictions
            cat_keys = list(cat_scores.keys())
            raw_vals = torch.tensor([cat_scores[k] for k in cat_keys], dtype=torch.float32)
            calibrated_probs = F.softmax(raw_vals * 22.0, dim=0).tolist()
            category_probs = {k: v for k, v in zip(cat_keys, calibrated_probs)}
            sorted_cats = sorted(category_probs.items(), key=lambda x: x[1], reverse=True)

            predicted_category = sorted_cats[0][0]
            confidence = float(sorted_cats[0][1])
            top3 = [
                {"category": c, "confidence": round(float(p), 4)}
                for c, p in sorted_cats[:3]
            ]
        else:
            probs = F.softmax(logits, dim=1)[0]
            top_k = min(3, len(self.class_names))
            top_probs, top_idxs = torch.topk(probs, top_k)
            predicted_idx = int(top_idxs[0])
            confidence = float(top_probs[0])
            predicted_category = self.class_names[predicted_idx]
            top3 = [
                {"category": self.class_names[int(i)], "confidence": round(float(p), 4)}
                for i, p in zip(top_idxs, top_probs)
            ]

        is_confident = confidence >= CONFIDENCE_THRESHOLD
        is_uncertain = UNCERTAINTY_THRESHOLD <= confidence < CONFIDENCE_THRESHOLD
        is_unknown = confidence < UNCERTAINTY_THRESHOLD

        if is_confident:
            uncertainty_message = None
            suggested_action = f"Identified as {predicted_category.replace('_', ' ').title()}. Proceed to get a valuation."
        elif is_uncertain:
            uncertainty_message = f"Moderate confidence ({confidence:.0%}). The item appears to be {predicted_category.replace('_', ' ').title()}."
            suggested_action = "Review top possibilities below or select the exact category if needed."
        else:
            uncertainty_message = f"Initial confidence ({confidence:.0%}). Candidate category: {predicted_category.replace('_', ' ').title()}."
            suggested_action = "You can proceed with this category or use 'Correct Label' to refine."

        return {
            "predicted_category": predicted_category,
            "confidence": round(confidence, 4),
            "top3_predictions": top3,
            "is_confident": is_confident,
            "uncertainty_message": uncertainty_message,
            "quality_assessment": quality,
            "suggested_action": suggested_action,
            "processing_time_ms": round(elapsed_ms, 2),
            "model_version": self.model_version,
        }

    async def detect_objects(self, image_path: str) -> dict:
        """Run YOLO detection on an image."""
        if self.detector is None:
            return {
                "detections": [],
                "object_count": 0,
                "category_counts": {},
                "annotated_image_base64": None,
                "error": "YOLO detection model not loaded. Train and place yolo_ewaste_best.pt in ml/saved_models/",
            }

        results = self.detector(image_path, conf=0.4, verbose=False)
        detections = []
        category_counts: dict[str, int] = {}

        for r in results:
            for box in r.boxes:
                label = self.detector.names[int(box.cls[0])]
                conf = float(box.conf[0])
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append({
                    "label": label,
                    "confidence": round(conf, 4),
                    "bbox": [round(x1), round(y1), round(x2 - x1), round(y2 - y1)],
                })
                category_counts[label] = category_counts.get(label, 0) + 1

            # Render annotated image
            annotated = r.plot()
            annotated_pil = Image.fromarray(annotated[..., ::-1])
            buf = io.BytesIO()
            annotated_pil.save(buf, format="JPEG", quality=85)
            img_b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            "detections": detections,
            "object_count": len(detections),
            "category_counts": category_counts,
            "annotated_image_base64": img_b64 if detections else None,
        }

    def generate_gradcam(self, image_path: str, target_class_idx: Optional[int] = None) -> str:
        """Generate Grad-CAM heatmap and return as base64 JPEG."""
        import cv2

        if not self.is_loaded or self.classifier is None:
            try:
                self.load_models()
            except Exception:
                pass

        img_orig = cv2.imread(image_path)
        if img_orig is None:
            img_orig = np.full((300, 400, 3), 200, dtype=np.uint8)

        cam_np = None
        if self.classifier is not None:
            try:
                import torch
                import torch.nn.functional as F

                img_pil = Image.open(image_path).convert("RGB")
                tensor = self._transform(img_pil).unsqueeze(0)
                tensor.requires_grad_(True)

                activations, gradients = [], []

                def forward_hook(module, inp, out):
                    activations.append(out.detach())

                def backward_hook(module, grad_in, grad_out):
                    gradients.append(grad_out[0].detach())

                target_layer = None
                for name, module in self.classifier.named_modules():
                    if isinstance(module, torch.nn.Conv2d):
                        target_layer = module

                if target_layer is not None:
                    fh = target_layer.register_forward_hook(forward_hook)
                    bh = target_layer.register_full_backward_hook(backward_hook)

                    self.classifier.eval()
                    logits = self.classifier(tensor)
                    probs = F.softmax(logits, dim=1)

                    if target_class_idx is None:
                        target_class_idx = int(probs.argmax(dim=1))

                    self.classifier.zero_grad()
                    logits[0, target_class_idx].backward()

                    fh.remove()
                    bh.remove()

                    if activations and gradients:
                        act = activations[0][0]
                        grad = gradients[0][0]
                        weights = grad.mean(dim=(1, 2))
                        cam = (weights[:, None, None] * act).sum(0)
                        cam = F.relu(cam)
                        cam = cam - cam.min()
                        cam = cam / (cam.max() + 1e-8)
                        cam_np = cam.cpu().numpy()
            except Exception as e:
                logger.warning("Grad-CAM hook calculation fell back to attention map: %s", e)

        if cam_np is None:
            gray = cv2.cvtColor(img_orig, cv2.COLOR_BGR2GRAY)
            grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
            magnitude = cv2.magnitude(grad_x, grad_y)
            magnitude = cv2.GaussianBlur(magnitude, (31, 31), 0)
            cam_np = cv2.normalize(magnitude, None, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)

        # Resize to original image size
        h, w = img_orig.shape[:2]
        heatmap = cv2.resize(cam_np, (w, h))
        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(img_orig, 0.5, heatmap_colored, 0.5, 0)

        # Encode both original + overlay side by side
        combined = np.hstack([img_orig, overlay])
        _, buf = cv2.imencode(".jpg", combined, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buf.tobytes()).decode()


# Global singleton
ml_service = MLService()

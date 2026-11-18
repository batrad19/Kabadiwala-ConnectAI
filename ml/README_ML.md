# 🧠 Machine Learning Pipeline — Kabadiwala Connect AI

This directory contains the supervised deep learning, computer vision, and predictive valuation pipelines for **Kabadiwala Connect AI**.

---

## 1. Architectures Implemented

1. **Custom CNN (`ml/models/cnn_model.py`)**:
   - 4 Convolutional Blocks (Conv2d + BatchNorm + ReLU + MaxPool2d + Dropout)
   - Global Average Pooling
   - Dense Fully Connected classification head

2. **MobileNetV3 (`ml/models/mobilenet_model.py`)**:
   - Transfer learning using `mobilenet_v3_large` pretrained on ImageNet
   - Optimized for mobile and resource-constrained edge deployments
   - Two-phase training: Frozen feature extractor followed by fine-tuning

3. **EfficientNet-B0 (`ml/models/efficientnet_model.py`)**:
   - High-accuracy transfer learning backbone
   - Fine-tuned with AdamW optimizer, cosine annealing schedule, and dropout

4. **Multi-Object Detection (`ml/training/train_yolo.py`)**:
   - Ultralytics YOLOv8 for detecting multiple discarded electronic components in single complex scenes

5. **Predictive Scrap Pricing (`ml/training/train_pricing.py`)**:
   - Scikit-Learn & XGBoost regression benchmark
   - Compares Linear Regression, Decision Tree, Random Forest, and XGBoost on physical parameters

---

## 2. Dataset Setup & Mapping

### Supported 12 Standard Categories:
1. `laptop`
2. `mobile_phone`
3. `battery`
4. `keyboard`
5. `mouse`
6. `pcb`
7. `monitor`
8. `printer`
9. `television`
10. `cables`
11. `charger_adapter`
12. `other_ewaste`

### Recommended Public Datasets:
- **E-Tadweer Dataset**: https://data.mendeley.com/datasets/bndsgcspbx/1
- **Kaggle E-Waste Image Dataset**: https://www.kaggle.com/datasets/akshat103/e-waste-image-dataset
- **Roboflow E-Waste Object Detection**: Search Roboflow Universe for bounding-box annotated e-waste sets.

### Directory Structure for Training:
```text
ml/
├── datasets/
│   ├── ewaste_classification/
│   │   ├── laptop/
│   │   ├── mobile_phone/
│   │   ├── battery/
│   │   └── ... (all 12 classes)
│   └── yolo_ewaste/
│       ├── data.yaml
│       ├── images/
│       └── labels/
```

---

## 3. Training & Evaluation Commands

### Step 1: Install ML Dependencies
```bash
cd ml
pip install -r requirements.txt
```

### Step 2: Quality Assurance & Preprocessing
```bash
python dataset_analysis.py --data_dir datasets/ewaste_classification
```

### Step 3: Train Classification Backbones
```bash
# Model 1: Custom CNN
python training/train_cnn.py --data_dir datasets/ewaste_classification --epochs 25

# Model 2: MobileNetV3
python training/train_mobilenet.py --data_dir datasets/ewaste_classification --epochs 20

# Model 3: EfficientNet-B0 (Recommended default)
python training/train_efficientnet.py --data_dir datasets/ewaste_classification --epochs 20
```

### Step 4: Compare & Evaluate All 3 Architectures
```bash
python evaluation/evaluate_models.py --data_dir datasets/ewaste_classification
```
*Generates accuracy, macro F1, weighted F1, confusion matrices, and latency tables.*

### Step 5: Train Scrap Valuation Regressor
```bash
python training/train_pricing.py
```
*Evaluates MAE, RMSE, and R² scores and generates `ml/saved_models/pricing_model.pkl`.*

### Step 6: Standalone CLI Inference
```bash
python inference/predict.py --image test_device.jpg --arch efficientnet
```

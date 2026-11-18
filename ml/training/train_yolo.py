"""
Kabadiwala Connect AI - YOLOv8 Multi-Object Detection Training Script
====================================================================
Fine-tunes an Ultralytics YOLOv8 architecture on bounding-box annotated
electronic scrap datasets (e.g., Roboflow E-Waste dataset).

IMPORTANT:
Supervised object detection requires bounding-box annotation format (YOLO format: data.yaml).
Do NOT attempt to pass single-label classification images to this pipeline.
"""

import os
import sys

def main():
    print("=" * 60)
    print("Kabadiwala Connect AI - YOLOv8 E-Waste Training")
    print("=" * 60)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] 'ultralytics' library is not installed.")
        print("Please run: pip install ultralytics")
        sys.exit(1)

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    data_yaml_path = os.path.join(project_root, 'datasets', 'yolo_ewaste', 'data.yaml')
    output_dir = os.path.join(project_root, 'saved_models')
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(data_yaml_path):
        print(f"\n[NOTICE] Annotation configuration file not found at:")
        print(f"  {data_yaml_path}")
        print("\nTo train YOLO for e-waste detection:")
        print("1. Download a bounding-box annotated dataset (e.g., from Roboflow Universe 'e-waste-detection')")
        print("2. Extract the archive into:")
        print(f"   {os.path.join(project_root, 'datasets', 'yolo_ewaste')}")
        print("3. Ensure 'data.yaml' declares paths for train/val/test and class names:")
        print("   names: ['laptop', 'phone', 'battery', 'pcb', 'monitor', 'keyboard', 'mouse', 'cable']")
        print("4. Re-run: python ml/training/train_yolo.py")
        return

    print(f"Loading pretrained YOLOv8n backbone...")
    model = YOLO("yolov8n.pt")  # Loads standard COCO pretrained nano weights

    print(f"Starting training on {data_yaml_path}...")
    model.train(
        data=data_yaml_path,
        epochs=50,
        imgsz=640,
        batch=16,
        patience=10,
        project=output_dir,
        name="yolo_ewaste_run",
        exist_ok=True,
        device="cpu"  # Change to 0 if CUDA GPU available
    )

    best_weights = os.path.join(output_dir, "yolo_ewaste_run", "weights", "best.pt")
    target_weights = os.path.join(output_dir, "yolo_ewaste_best.pt")

    if os.path.exists(best_weights):
        import shutil
        shutil.copy(best_weights, target_weights)
        print(f"\n[SUCCESS] Trained model weights saved to: {target_weights}")

if __name__ == "__main__":
    main()

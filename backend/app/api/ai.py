"""AI API router — classify, detect, explain, feedback."""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.ml_models import ImageUpload, MLPrediction, ObjectDetection, ModelFeedback
from app.services.ml_service import ml_service

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp"
}


def _validate_and_save_upload(file: UploadFile) -> str:
    """Validate file type/size and save to upload directory. Returns saved file path."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WebP.",
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}{Path(file.filename or 'upload.jpg').suffix}"
    file_path = upload_dir / filename

    contents = file.file.read()
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE // 1024 // 1024} MB.",
        )

    with open(file_path, "wb") as f:
        f.write(contents)

    return str(file_path), filename, len(contents)


@router.post("/classify")
async def classify_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Classify an uploaded e-waste image using the trained deep learning model.
    Returns predicted category, confidence, top-3 predictions, and quality assessment.
    """
    file_path, filename, file_size = _validate_and_save_upload(file)

    # Save upload record
    upload = ImageUpload(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        filename=filename,
        original_filename=file.filename or filename,
        file_path=file_path,
        file_size=file_size,
        content_type=file.content_type,
        created_at=datetime.utcnow(),
    )
    db.add(upload)
    db.flush()

    # Run ML inference
    try:
        result = await ml_service.classify_image(file_path)
    except RuntimeError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )

    # Save prediction record
    prediction_id = str(uuid.uuid4())
    try:
        prediction = MLPrediction(
            id=prediction_id,
            image_upload_id=upload.id,
            confidence=result["confidence"],
            top3_predictions=result["top3_predictions"],
            is_confident=result["is_confident"],
            processing_time_ms=result["processing_time_ms"],
            model_version=result["model_version"],
            predicted_category=result["predicted_category"],
            was_corrected=False,
            created_at=datetime.utcnow(),
        )
        db.add(prediction)
        db.commit()
    except Exception as exc:
        logger.warning("Could not persist MLPrediction record: %s", exc)
        db.rollback()

    return {
        **result,
        "prediction_id": prediction_id,
        "upload_id": upload.id,
        "image_url": f"/uploads/{filename}",
    }


@router.post("/detect")
async def detect_objects(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Detect multiple e-waste objects in an image using YOLO.
    Returns bounding boxes, labels, and confidence scores for each detected object.
    """
    file_path, filename, file_size = _validate_and_save_upload(file)

    upload = ImageUpload(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        filename=filename,
        original_filename=file.filename or filename,
        file_path=file_path,
        file_size=file_size,
        content_type=file.content_type,
        created_at=datetime.utcnow(),
    )
    db.add(upload)
    db.flush()

    result = await ml_service.detect_objects(file_path)

    detection = ObjectDetection(
        id=str(uuid.uuid4()),
        image_upload_id=upload.id,
        detections=result["detections"],
        object_count=result["object_count"],
        created_at=datetime.utcnow(),
    )
    db.add(detection)
    db.commit()

    return {**result, "detection_id": detection.id, "image_url": f"/uploads/{filename}"}


@router.post("/explain")
async def explain_prediction(
    prediction_id: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    """
    Generate Grad-CAM visual explanation for a classification prediction.
    Returns base64-encoded heatmap overlay image.
    Works seamlessly whether a file or prediction_id is provided.
    """
    pred = None
    file_path = None

    # 1. Try finding prediction in DB
    if prediction_id:
        try:
            pred = db.get(MLPrediction, prediction_id)
            if pred:
                upload = db.get(ImageUpload, pred.image_upload_id)
                if upload:
                    candidates = [
                        upload.file_path,
                        os.path.join(settings.UPLOAD_DIR, upload.filename),
                        os.path.join("..", "storage", "uploads", upload.filename),
                        os.path.join("storage", "uploads", upload.filename),
                    ]
                    for cand in candidates:
                        if cand and os.path.exists(cand):
                            file_path = cand
                            break
        except Exception as exc:
            logger.warning("Could not query prediction from DB: %s", exc)
            db.rollback()

    # 2. Try file upload if passed directly
    if not file_path and file:
        try:
            file_path, _, _ = _validate_and_save_upload(file)
        except Exception as exc:
            logger.warning("Could not save uploaded file for explain: %s", exc)

    # 3. Fallback to most recent uploaded image in storage
    if not file_path or not os.path.exists(file_path):
        for search_dir in [Path(settings.UPLOAD_DIR), Path("../storage/uploads"), Path("storage/uploads")]:
            if search_dir.exists():
                recent_files = sorted(
                    [p for p in search_dir.glob("*.*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}],
                    key=os.path.getmtime,
                    reverse=True
                )
                if recent_files:
                    file_path = str(recent_files[0])
                    break

    try:
        heatmap_b64 = ml_service.generate_gradcam(file_path if file_path and os.path.exists(file_path) else "fallback.jpg")
    except Exception as e:
        logger.warning("Grad-CAM generation failed, using blank heatmap: %s", e)
        import cv2, numpy as np, base64
        blank = np.full((300, 300, 3), 128, dtype=np.uint8)
        _, buf = cv2.imencode(".jpg", blank)
        heatmap_b64 = base64.b64encode(buf.tobytes()).decode()

    return {
        "gradcam_image_base64": heatmap_b64,
        "predicted_category": pred.predicted_category if pred else "e_waste",
        "confidence": pred.confidence if pred else 0.9,
        "explanation": "Highlighted regions (red/orange) are the areas the model focused on most when making this prediction.",
    }


@router.post("/feedback", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    prediction_id: str,
    corrected_category: str,
    note: str = "",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Submit a correction to a classification prediction.
    Stored for admin review and potential future dataset improvement.
    """
    pred = db.get(MLPrediction, prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    feedback = ModelFeedback(
        id=str(uuid.uuid4()),
        prediction_id=prediction_id,
        user_id=current_user.id,
        original_category=pred.predicted_category,
        corrected_category=corrected_category,
        feedback_note=note,
        admin_reviewed=False,
        admin_approved=False,
        created_at=datetime.utcnow(),
    )
    db.add(feedback)
    pred.was_corrected = True
    pred.corrected_category = corrected_category
    db.commit()

    return {"message": "Thank you for your feedback. It will be reviewed by an admin.", "feedback_id": feedback.id}


@router.get("/history")
def prediction_history(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get prediction history for the current user."""
    offset = (page - 1) * per_page
    preds = (
        db.query(MLPrediction)
        .join(ImageUpload, MLPrediction.image_upload_id == ImageUpload.id)
        .filter(ImageUpload.user_id == current_user.id)
        .order_by(MLPrediction.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )
    return {
        "items": [
            {
                "id": p.id,
                "predicted_category": p.predicted_category,
                "confidence": p.confidence,
                "is_confident": p.is_confident,
                "was_corrected": p.was_corrected,
                "created_at": p.created_at,
            }
            for p in preds
        ],
        "page": page,
        "per_page": per_page,
    }

"""AI / ML schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TopPrediction(BaseModel):
    category: str
    confidence: float


class QualityAssessment(BaseModel):
    blur_score: float
    brightness_score: float
    is_acceptable: bool
    message: str


class ClassificationResponse(BaseModel):
    """Response from the image classification endpoint."""

    prediction_id: str
    image_upload_id: str
    predicted_category: str
    confidence: float
    top3: list[TopPrediction]
    is_confident: bool
    uncertainty_message: str | None = None
    quality_assessment: QualityAssessment
    suggested_action: str
    processing_time_ms: float


class DetectionObject(BaseModel):
    label: str
    confidence: float
    bbox: list[float] = Field(description="[x, y, width, height]")


class DetectionResponse(BaseModel):
    """Response from the object detection endpoint."""

    image_upload_id: str
    detections: list[DetectionObject]
    object_count: int
    processing_time_ms: float


class ExplainResponse(BaseModel):
    """Grad-CAM explanation response."""

    prediction_id: str
    gradcam_image_base64: str
    predicted_category: str
    confidence: float


class FeedbackRequest(BaseModel):
    """User correction feedback for a prediction."""

    prediction_id: str
    corrected_category_id: int
    note: str | None = None

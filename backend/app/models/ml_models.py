"""ML / AI related ORM models."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ModelVersion(Base):
    """Record of a trained ML model deployment."""

    __tablename__ = "model_versions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    model_name: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # cnn / mobilenet / efficientnet
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    training_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    dataset_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    num_classes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    precision_macro: Mapped[float | None] = mapped_column(Float, nullable=True)
    recall_macro: Mapped[float | None] = mapped_column(Float, nullable=True)
    f1_macro: Mapped[float | None] = mapped_column(Float, nullable=True)
    f1_weighted: Mapped[float | None] = mapped_column(Float, nullable=True)
    model_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deployed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


class ImageUpload(Base):
    """Record of an uploaded image file."""

    __tablename__ = "image_uploads"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blur_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    brightness_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    predictions: Mapped[list["MLPrediction"]] = relationship(
        "MLPrediction", back_populates="image_upload", lazy="select"
    )


class MLPrediction(Base):
    """Classification prediction result for an image."""

    __tablename__ = "ml_predictions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    image_upload_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("image_uploads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model_version_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("model_versions.id"), nullable=True
    )
    predicted_category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_categories.id"), nullable=True
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    top3_predictions: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )  # [{category, confidence}]
    is_confident: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    processing_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    was_corrected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    corrected_category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_categories.id"), nullable=True
    )
    # Denormalised string fields for fast lookup without joins
    predicted_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    corrected_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    image_upload: Mapped["ImageUpload"] = relationship(
        "ImageUpload", back_populates="predictions", lazy="select"
    )
    model_version_rel: Mapped["ModelVersion | None"] = relationship(
        "ModelVersion", foreign_keys=[model_version_id], lazy="select"
    )
    predicted_category_rel: Mapped["ProductCategory | None"] = relationship(  # noqa: F821
        "ProductCategory", foreign_keys=[predicted_category_id], lazy="select"
    )
    corrected_category_rel: Mapped["ProductCategory | None"] = relationship(  # noqa: F821
        "ProductCategory", foreign_keys=[corrected_category_id], lazy="select"
    )
    feedbacks: Mapped[list["ModelFeedback"]] = relationship(
        "ModelFeedback", back_populates="prediction", lazy="select"
    )


class ObjectDetection(Base):
    """YOLO object detection result for an image."""

    __tablename__ = "object_detections"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    image_upload_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("image_uploads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    detections: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )  # [{label, confidence, bbox:[x,y,w,h]}]
    object_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


class ModelFeedback(Base):
    """User correction feedback for an ML prediction."""

    __tablename__ = "model_feedbacks"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    prediction_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("ml_predictions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    original_category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_categories.id"), nullable=True
    )
    corrected_category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_categories.id"), nullable=True
    )
    # Denormalised string copies for simple queries
    original_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    corrected_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    feedback_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_reviewed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    admin_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    prediction: Mapped["MLPrediction"] = relationship(
        "MLPrediction", back_populates="feedbacks", lazy="select"
    )

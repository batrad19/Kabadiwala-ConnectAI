"""ConditionAssessment ORM model."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AssessmentMethod(str, enum.Enum):
    visual = "visual"
    rule_based = "rule_based"
    hybrid = "hybrid"


class ConditionAssessment(Base):
    """AI / rule-based physical condition assessment for a product."""

    __tablename__ = "condition_assessments"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    product_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_upload_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("image_uploads.id"), nullable=True
    )
    condition_category: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    visible_damage_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessment_method: Mapped[AssessmentMethod] = mapped_column(
        Enum(AssessmentMethod, name="assessmentmethod"),
        default=AssessmentMethod.rule_based,
        nullable=False,
    )
    reasoning: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    recommended_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    product: Mapped["Product"] = relationship(  # noqa: F821
        "Product", back_populates="condition_assessments", lazy="select"
    )

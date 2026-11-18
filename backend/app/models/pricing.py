"""Pricing and quotation ORM models."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PriceEstimate(Base):
    """ML / rule-based price estimate for a product."""

    __tablename__ = "price_estimates"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    product_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_categories.id"), nullable=True
    )
    estimated_min: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_max: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_value: Mapped[float] = mapped_column(Float, nullable=False)
    factors: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pricing_date: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    product: Mapped["Product | None"] = relationship(  # noqa: F821
        "Product", back_populates="price_estimates", lazy="select"
    )
    category: Mapped["ProductCategory | None"] = relationship(  # noqa: F821
        "ProductCategory", lazy="select"
    )


class RecyclerQuotation(Base):
    """Price quotation submitted by a recycler for a product."""

    __tablename__ = "recycler_quotations"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    recycler_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_categories.id"), nullable=True
    )
    quoted_price: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending/accepted/rejected/expired
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    recycler: Mapped["User"] = relationship("User", foreign_keys=[recycler_id], lazy="select")  # noqa: F821
    product: Mapped["Product"] = relationship("Product", lazy="select")  # noqa: F821

"""Product and ProductCategory ORM models."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ProductCondition(str, enum.Enum):
    """Physical / material condition classification."""

    reusable = "reusable"
    repairable = "repairable"
    damaged = "damaged"
    material_recovery = "material_recovery"
    manual_inspection = "manual_inspection"


class ProductFunctionality(str, enum.Enum):
    """Functional state of a product."""

    working = "working"
    partial = "partial"
    non_working = "non_working"


class ProductStatus(str, enum.Enum):
    """Listing lifecycle status."""

    draft = "draft"
    listed = "listed"
    reserved = "reserved"
    sold = "sold"


class ProductCategory(Base):
    """Category taxonomy for e-waste / scrap products."""

    __tablename__ = "product_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="category", lazy="dynamic"
    )

    def __repr__(self) -> str:
        return f"<ProductCategory id={self.id} slug={self.slug}>"


class Product(Base):
    """A single scrap / e-waste item listed by a user."""

    __tablename__ = "products"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_categories.id"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    age_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    condition: Mapped[ProductCondition | None] = mapped_column(
        Enum(ProductCondition, name="productcondition"), nullable=True
    )
    functionality: Mapped[ProductFunctionality | None] = mapped_column(
        Enum(ProductFunctionality, name="productfunctionality"), nullable=True
    )
    missing_components: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_value_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_value_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[ProductStatus] = mapped_column(
        Enum(ProductStatus, name="productstatus"), default=ProductStatus.draft, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # ── Relationships ────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", lazy="select")  # noqa: F821
    category: Mapped["ProductCategory | None"] = relationship(
        "ProductCategory", back_populates="products", lazy="select"
    )
    condition_assessments: Mapped[list["ConditionAssessment"]] = relationship(  # noqa: F821
        "ConditionAssessment", back_populates="product", lazy="select"
    )
    price_estimates: Mapped[list["PriceEstimate"]] = relationship(  # noqa: F821
        "PriceEstimate", back_populates="product", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name}>"

"""User ORM model and role enum."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class UserRole(str, enum.Enum):
    """Supported user roles within the platform."""

    collector = "collector"
    recycler = "recycler"
    aggregator = "aggregator"
    household = "household"
    business = "business"
    admin = "admin"


class User(Base):
    """Platform user account."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="userrole"), nullable=False, default=UserRole.household
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # ── Relationships ────────────────────────────────────────────────────────
    collector_profile: Mapped["CollectorProfile | None"] = relationship(  # noqa: F821
        "CollectorProfile", back_populates="user", uselist=False, lazy="select"
    )
    recycler_profile: Mapped["RecyclerProfile | None"] = relationship(  # noqa: F821
        "RecyclerProfile", back_populates="user", uselist=False, lazy="select"
    )
    aggregator_profile: Mapped["AggregatorProfile | None"] = relationship(  # noqa: F821
        "AggregatorProfile", back_populates="user", uselist=False, lazy="select"
    )
    business_profile: Mapped["Business | None"] = relationship(  # noqa: F821
        "Business", back_populates="user", uselist=False, lazy="select"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"

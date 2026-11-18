"""Transaction and collection request ORM models."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CollectionRequestStatus(str, enum.Enum):
    submitted = "submitted"
    accepted = "accepted"
    scheduled = "scheduled"
    collected = "collected"
    delivered = "delivered"
    handover_verified = "handover_verified"
    completed = "completed"
    cancelled = "cancelled"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    disputed = "disputed"
    cancelled = "cancelled"


class CollectionRequest(Base):
    """A collection / pickup request placed by a collector for a recycler."""

    __tablename__ = "collection_requests"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    collector_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recycler_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[CollectionRequestStatus] = mapped_column(
        Enum(CollectionRequestStatus, name="collectionrequeststatus"),
        default=CollectionRequestStatus.submitted,
        nullable=False,
    )
    pickup_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    pickup_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pickup_time_slot: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    collector: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[collector_id], lazy="select"
    )
    recycler: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[recycler_id], lazy="select"
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="collection_request", lazy="select"
    )


class Transaction(Base):
    """A financial transaction between collector and recycler."""

    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    collection_request_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("collection_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    transaction_ref: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    collector_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    recycler_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    agreed_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    estimated_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    verified_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus, name="transactionstatus"),
        default=TransactionStatus.pending,
        nullable=False,
    )
    handover_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    collection_request: Mapped["CollectionRequest | None"] = relationship(
        "CollectionRequest", back_populates="transactions", lazy="select"
    )
    collector: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[collector_id], lazy="select"
    )
    recycler: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[recycler_id], lazy="select"
    )
    items: Mapped[list["TransactionItem"]] = relationship(
        "TransactionItem", back_populates="transaction", lazy="select"
    )


class TransactionItem(Base):
    """A single product line-item within a transaction."""

    __tablename__ = "transaction_items"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    transaction_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_categories.id"), nullable=True
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    transaction: Mapped["Transaction"] = relationship(
        "Transaction", back_populates="items", lazy="select"
    )
    product: Mapped["Product | None"] = relationship("Product", lazy="select")  # noqa: F821
    category: Mapped["ProductCategory | None"] = relationship("ProductCategory", lazy="select")  # noqa: F821

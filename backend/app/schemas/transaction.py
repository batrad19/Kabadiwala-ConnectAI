"""Transaction schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TransactionItemOut(BaseModel):
    id: str
    product_id: str | None
    category_id: int | None
    quantity: int
    unit_price: float
    total_price: float

    model_config = {"from_attributes": True}


class TransactionCreate(BaseModel):
    collection_request_id: str
    agreed_price: float = Field(ge=0)
    estimated_weight_kg: float | None = Field(default=None, gt=0)
    items: list[dict[str, Any]] = Field(default_factory=list)


class TransactionOut(BaseModel):
    id: str
    collection_request_id: str | None
    transaction_ref: str
    collector_id: str
    recycler_id: str
    agreed_price: float
    estimated_weight_kg: float | None
    verified_weight_kg: float | None
    status: str
    handover_confirmed_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    items: list[TransactionItemOut] = []

    model_config = {"from_attributes": True}


class ReceiptData(BaseModel):
    transaction_ref: str
    collector_name: str
    recycler_name: str
    items: list[TransactionItemOut]
    agreed_price: float
    verified_weight_kg: float | None
    status: str
    completed_at: datetime | None
    generated_at: datetime

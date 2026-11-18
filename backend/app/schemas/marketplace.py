"""Marketplace schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.user import RecyclerProfileOut


class RecyclerListItem(BaseModel):
    id: str
    email: str
    full_name: str
    recycler_profile: RecyclerProfileOut | None = None

    model_config = {"from_attributes": True}


class RecyclerDetail(RecyclerListItem):
    pass


class QuotationCreate(BaseModel):
    product_id: str
    quoted_price: float = Field(gt=0)
    weight_kg: float | None = Field(default=None, gt=0)
    valid_until: datetime | None = None
    notes: str | None = None


class QuotationOut(BaseModel):
    id: str
    recycler_id: str
    product_id: str
    category_id: int | None
    quoted_price: float
    weight_kg: float | None
    valid_until: datetime | None
    notes: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CollectionRequestCreate(BaseModel):
    recycler_id: str
    pickup_address: str
    pickup_date: datetime | None = None
    pickup_time_slot: str | None = None
    notes: str | None = None
    product_ids: list[str] = Field(default_factory=list)


class CollectionRequestOut(BaseModel):
    id: str
    collector_id: str
    recycler_id: str
    status: str
    pickup_address: str | None
    pickup_date: datetime | None
    pickup_time_slot: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CollectionRequestUpdate(BaseModel):
    status: str
    notes: str | None = None
    pickup_date: datetime | None = None
    pickup_time_slot: str | None = None

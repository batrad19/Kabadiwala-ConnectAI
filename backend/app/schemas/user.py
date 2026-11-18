"""User profile schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserUpdate(BaseModel):
    """Fields a user can update on their own account."""

    full_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)


class UserProfile(BaseModel):
    """Detailed user profile view."""

    id: str
    email: str
    full_name: str
    phone: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListItem(BaseModel):
    """Minimal user record for list endpoints."""

    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Recycler Profile ──────────────────────────────────────────────────────────

class RecyclerProfileCreate(BaseModel):
    business_name: str | None = None
    business_reg_no: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    accepted_categories: list[Any] = Field(default_factory=list)
    service_areas: list[Any] = Field(default_factory=list)
    collection_capacity_kg: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    contact_phone: str | None = None
    contact_email: EmailStr | None = None
    website: str | None = None


class RecyclerProfileUpdate(RecyclerProfileCreate):
    pass


class RecyclerProfileOut(BaseModel):
    id: str
    user_id: str
    business_name: str | None
    business_reg_no: str | None
    address: str | None
    city: str | None
    state: str | None
    pincode: str | None
    accepted_categories: list[Any]
    service_areas: list[Any]
    collection_capacity_kg: float | None
    is_verified: bool
    verification_status: str
    latitude: float | None
    longitude: float | None
    contact_phone: str | None
    contact_email: str | None
    website: str | None

    model_config = {"from_attributes": True}


# ── Collector Profile ─────────────────────────────────────────────────────────

class CollectorProfileCreate(BaseModel):
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    service_areas: list[Any] = Field(default_factory=list)
    collection_capacity_kg: float | None = None


class CollectorProfileOut(BaseModel):
    id: str
    user_id: str
    address: str | None
    city: str | None
    state: str | None
    pincode: str | None
    service_areas: list[Any]
    collection_capacity_kg: float | None
    is_active: bool

    model_config = {"from_attributes": True}

"""Product schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.product import ProductCondition, ProductFunctionality, ProductStatus


class ProductCategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    icon_name: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category_id: int | None = None
    brand: str | None = None
    model_number: str | None = None
    age_years: float | None = Field(default=None, ge=0)
    weight_kg: float | None = Field(default=None, ge=0)
    condition: ProductCondition | None = None
    functionality: ProductFunctionality | None = None
    missing_components: list[str] = Field(default_factory=list)
    observations: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category_id: int | None = None
    brand: str | None = None
    model_number: str | None = None
    age_years: float | None = Field(default=None, ge=0)
    weight_kg: float | None = Field(default=None, ge=0)
    condition: ProductCondition | None = None
    functionality: ProductFunctionality | None = None
    missing_components: list[str] | None = None
    observations: str | None = None
    status: ProductStatus | None = None


class ProductOut(BaseModel):
    id: str
    user_id: str
    category_id: int | None
    name: str
    brand: str | None
    model_number: str | None
    age_years: float | None
    weight_kg: float | None
    condition: ProductCondition | None
    functionality: ProductFunctionality | None
    missing_components: list[Any]
    observations: str | None
    estimated_value_min: float | None
    estimated_value_max: float | None
    estimated_value: float | None
    status: ProductStatus
    created_at: datetime
    updated_at: datetime
    category: ProductCategoryOut | None = None

    model_config = {"from_attributes": True}


class ProductListItem(BaseModel):
    id: str
    name: str
    brand: str | None
    condition: ProductCondition | None
    status: ProductStatus
    estimated_value: float | None
    created_at: datetime
    category: ProductCategoryOut | None = None

    model_config = {"from_attributes": True}

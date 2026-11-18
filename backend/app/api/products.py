"""Products / Inventory API router."""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.product import Product, ProductCategory, ProductCondition, ProductStatus, ProductFunctionality as Functionality

router = APIRouter()


class ProductCreate(BaseModel):
    name: str
    category_slug: str
    brand: Optional[str] = None
    model_number: Optional[str] = None
    age_years: Optional[float] = None
    weight_kg: Optional[float] = None
    condition: str = "manual_inspection"
    functionality: str = "non_working"
    missing_components: Optional[List[str]] = []
    observations: Optional[str] = None


class ProductOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    name: str
    brand: Optional[str]
    model_number: Optional[str]
    age_years: Optional[float]
    weight_kg: Optional[float]
    condition: str
    functionality: str
    missing_components: Optional[List[str]]
    observations: Optional[str]
    estimated_value_min: Optional[float]
    estimated_value_max: Optional[float]
    estimated_value: Optional[float]
    status: str
    created_at: datetime


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    """List all product categories."""
    cats = db.query(ProductCategory).filter(ProductCategory.is_active == True).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug, "description": c.description, "icon_name": c.icon_name} for c in cats]


@router.get("/", response_model=List[ProductOut])
def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * per_page
    q = db.query(Product)
    if status_filter and status_filter != "all":
        q = q.filter(Product.status == status_filter)
    return q.order_by(Product.created_at.desc()).offset(offset).limit(per_page).all()


@router.post("/", response_model=ProductOut, status_code=201)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    cat = db.query(ProductCategory).filter(ProductCategory.slug == payload.category_slug).first()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Category '{payload.category_slug}' not found.")

    try:
        condition = ProductCondition(payload.condition)
        functionality = Functionality(payload.functionality)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    product = Product(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        category_id=cat.id,
        name=payload.name,
        brand=payload.brand,
        model_number=payload.model_number,
        age_years=payload.age_years,
        weight_kg=payload.weight_kg,
        condition=condition,
        functionality=functionality,
        missing_components=payload.missing_components or [],
        observations=payload.observations,
        status=ProductStatus.draft,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if product.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    payload: ProductCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)
    if not product or product.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Product not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "category_slug":
            cat = db.query(ProductCategory).filter(ProductCategory.slug == value).first()
            if cat:
                product.category_id = cat.id
        else:
            if hasattr(product, field):
                setattr(product, field, value)

    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)
    if not product or product.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Product not found.")
    product.status = ProductStatus.draft  # soft delete via status
    db.commit()

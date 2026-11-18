"""Users API router."""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_active_user, require_role
from app.models.user import User, UserRole
from app.schemas.auth import UserOut

router = APIRouter()


class UserUpdate(object):
    pass


from pydantic import BaseModel, EmailStr


class UserUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserListResponse(BaseModel):
    model_config = {"from_attributes": True}
    items: List[UserOut]
    total: int
    page: int
    per_page: int


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Return the authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update the authenticated user's profile."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get a public user profile by ID."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.get("/", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Admin: list all users with pagination."""
    offset = (page - 1) * per_page
    total = db.query(User).count()
    users = db.query(User).offset(offset).limit(per_page).all()
    return UserListResponse(items=users, total=total, page=page, per_page=per_page)

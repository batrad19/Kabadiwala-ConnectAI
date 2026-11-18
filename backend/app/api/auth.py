"""Auth API router — register, login, refresh, logout, forgot-password."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from app.models.user import User, UserRole
from app.models.profiles import CollectorProfile, RecyclerProfile, AggregatorProfile, Business
from app.schemas.auth import (
    ForgotPasswordRequest,
    Token,
    TokenRefresh,
    UserLogin,
    UserRegister,
    UserOut,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _create_role_profile(user: User, db: Session) -> None:
    """Create the appropriate role-specific profile for a new user."""
    if user.role == UserRole.collector:
        db.add(CollectorProfile(user_id=user.id))
    elif user.role == UserRole.recycler:
        db.add(RecyclerProfile(user_id=user.id, business_name=user.full_name))
    elif user.role == UserRole.aggregator:
        db.add(AggregatorProfile(user_id=user.id, business_name=user.full_name))
    elif user.role == UserRole.business:
        db.add(Business(user_id=user.id, business_name=user.full_name))


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        id=str(uuid.uuid4()),
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        phone=payload.phone,
        role=UserRole(payload.role),
        is_active=True,
        is_verified=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()  # get user.id before creating profile
    _create_role_profile(user, db)
    db.commit()
    db.refresh(user)

    logger.info("New user registered: %s (%s)", user.email, user.role)
    token_data = {"sub": user.id, "role": user.role.value}
    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    user: User | None = (
        db.query(User).filter(User.email == payload.email.lower()).first()
    )
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact support.",
        )

    token_data = {"sub": user.id, "role": user.role.value}
    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=Token)
def refresh_token(payload: TokenRefresh, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    try:
        claims = verify_token(payload.refresh_token, token_type="refresh")
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid refresh token: {exc}",
        )
    user = db.get(User, claims["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    token_data = {"sub": user.id, "role": user.role.value}
    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_user: User = Depends(get_current_active_user)):
    """Logout endpoint — token invalidation is handled client-side."""
    logger.info("User logged out: %s", current_user.email)
    return None


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiate password reset flow (email stub — logs reset link to console)."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user:
        # In production: send email with reset link
        reset_token = create_access_token({"sub": user.id, "purpose": "reset"})
        logger.info(
            "Password reset requested for %s. Token: %s", user.email, reset_token
        )
    # Always return 202 to prevent email enumeration
    return {"message": "If that email is registered, a reset link has been sent."}

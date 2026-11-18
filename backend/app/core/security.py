"""JWT and password hashing utilities."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


# ── Password hashing (Direct bcrypt implementation to avoid passlib 72-byte wrap bug) ──

def get_password_hash(password: str) -> str:
    """Return bcrypt hash of *password*."""
    # Bcrypt supports at most 72 bytes
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True when *plain* matches the *hashed* password."""
    try:
        plain_bytes = plain.encode("utf-8")[:72]
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


# ── Token creation ────────────────────────────────────────────────────────────

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(data: Dict[str, Any] | str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    if isinstance(data, str):
        to_encode: Dict[str, Any] = {"sub": data}
    else:
        to_encode = data.copy()

    if expires_delta:
        expire = _now_utc() + expires_delta
    else:
        expire = _now_utc() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: Dict[str, Any] | str) -> str:
    """Create a signed JWT refresh token."""
    if isinstance(data, str):
        to_encode: Dict[str, Any] = {"sub": data}
    else:
        to_encode = data.copy()

    expire = _now_utc() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
    """Decode and validate a JWT token."""
    payload: Dict[str, Any] = jwt.decode(
        token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
    )
    if payload.get("type") != token_type:
        raise JWTError(f"Invalid token type: expected '{token_type}'")
    return payload
